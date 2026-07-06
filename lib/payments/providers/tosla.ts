import crypto from 'crypto';
import { isToslaConfigured } from '@/lib/payments/config';
import {
  PaymentNotConfiguredError,
  type PaymentInitInput,
  type PaymentInitResult,
  type PaymentProvider,
  type PaymentVerifyResult
} from '@/lib/payments/types';

// Production: https://entegrasyon.tosla.com/api/Payment
// Test:       https://prepentegrasyon.tosla.com/api/Payment
function getApiBase(): string {
  return (
    process.env.TOSLA_API_BASE_URL ?? 'https://entegrasyon.tosla.com/api/Payment'
  ).replace(/\/$/, '');
}

function get3DHostBase(): string {
  return (
    process.env.TOSLA_3D_HOST_URL ??
    `${getApiBase()}/threeDSecure`
  ).replace(/\/$/, '');
}

/** 24-karakter rastgele hex — Tosla rnd alanı */
function generateRnd(): string {
  return crypto.randomBytes(12).toString('hex').toUpperCase();
}

/** YmdHis formatında İstanbul saati (Tosla timeSpan) */
function generateTimeSpan(): string {
  const now = new Date();
  const ist = new Date(now.getTime() + 3 * 60 * 60 * 1000); // UTC+3
  return ist.toISOString().replace(/[-T:.Z]/g, '').slice(0, 14);
}

/**
 * İstek hash'i: base64(sha512_binary(storeKey + clientId + apiUser + rnd + timeSpan))
 * Kaynak: ToslaPosCrypt.createHash (PHP)
 */
function createRequestHash(
  storeKey: string,
  clientId: string,
  apiUser: string,
  rnd: string,
  timeSpan: string
): string {
  const raw = storeKey + clientId + apiUser + rnd + timeSpan;
  return crypto.createHash('sha512').update(raw, 'utf8').digest('base64');
}

/**
 * Callback hash doğrulaması.
 * Kaynak: ToslaPosCrypt.check3DHash + AbstractCrypt.hashFromParams
 *
 * 1. Callback'e ClientId ve ApiUser ekle
 * 2. HashParameters'ı ","den ayır → parametre isimlerini al
 * 3. Değerleri birleştir, başına storeKey ekle
 * 4. sha512_binary → base64
 */
function verifyCallbackHash(
  storeKey: string,
  clientId: string,
  apiUser: string,
  data: Record<string, string>
): boolean {
  const hashParameters = data['HashParameters'];
  if (!hashParameters) return false;

  const fullData: Record<string, string> = {
    ...data,
    ClientId: clientId,
    ApiUser: apiUser,
  };

  const paramNames = hashParameters.split(',');
  const paramValues = paramNames.map((name) => fullData[name] ?? '').join('');
  const hashInput = storeKey + paramValues;

  const expected = crypto
    .createHash('sha512')
    .update(hashInput, 'utf8')
    .digest('base64');

  return expected === data['Hash'];
}

interface ToslaRegisterResponse {
  Code: number;
  Message: string;
  ThreeDSessionId?: string;
}

export const toslaPaymentProvider: PaymentProvider = {
  name: 'tosla',

  isConfigured() {
    return isToslaConfigured();
  },

  /** 3D Host akışı: Tosla'ya session aç → kullanıcıyı yönlendir */
  async createCheckoutSession(input: PaymentInitInput): Promise<PaymentInitResult> {
    if (!this.isConfigured()) throw new PaymentNotConfiguredError('tosla');

    const clientId = process.env.TOSLA_CLIENT_ID!;
    const apiUser  = process.env.TOSLA_API_USER!;
    const storeKey = process.env.TOSLA_STORE_KEY!;

    const rnd      = generateRnd();
    const timeSpan = generateTimeSpan();
    const hash     = createRequestHash(storeKey, clientId, apiUser, rnd, timeSpan);

    // Tutar kuruşa çevrilir: 10.50 TRY → 1050
    const amountKurus = Math.round(input.amount * 100);

    const body = {
      clientId:         Number(clientId), // API long (number) bekler
      apiUser,
      rnd,
      timeSpan,
      hash,
      callbackUrl:      input.callbackUrl,
      orderId:          input.orderId,
      amount:           amountKurus,
      currency:         949,  // TRY ISO 4217 sayısal kod
      installmentCount: 0,
    };

    const res = await fetch(`${getApiBase()}/threeDPayment`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });

    const responseText = await res.text();
    console.log('[tosla] threeDPayment status:', res.status, 'body:', responseText.slice(0, 300));

    if (!res.ok) {
      throw new Error(`Tosla API hatası: HTTP ${res.status} — ${responseText.slice(0, 200)}`);
    }

    if (!responseText.trim()) {
      throw new Error(
        `Tosla API boş yanıt döndürdü (HTTP ${res.status}). ClientId/ApiUser/StoreKey bilgilerini kontrol edin.`
      );
    }

    let data: ToslaRegisterResponse;
    try {
      data = JSON.parse(responseText) as ToslaRegisterResponse;
    } catch {
      throw new Error(`Tosla API geçersiz yanıt: ${responseText.slice(0, 200)}`);
    }

    if (data.Code !== 0 || !data.ThreeDSessionId) {
      throw new Error(
        `Tosla ödeme başlatılamadı: ${data.Message} (Kod: ${data.Code})`
      );
    }

    return {
      provider:    'tosla',
      sessionId:   data.ThreeDSessionId,
      checkoutUrl: `${get3DHostBase()}/${data.ThreeDSessionId}`,
    };
  },

  /** Tosla 3D Host callback'ini doğrula (POST form-data) */
  async verifyCallback(request: Request): Promise<PaymentVerifyResult> {
    if (!this.isConfigured()) throw new PaymentNotConfiguredError('tosla');

    const clientId = process.env.TOSLA_CLIENT_ID!;
    const apiUser  = process.env.TOSLA_API_USER!;
    const storeKey = process.env.TOSLA_STORE_KEY!;

    // Tosla POST form verisi gönderir
    const formData = await request.formData();
    const data: Record<string, string> = {};
    for (const [key, val] of formData.entries()) {
      data[key] = String(val);
    }

    // Hash doğrulaması
    const hashOk = verifyCallbackHash(storeKey, clientId, apiUser, data);
    if (!hashOk) {
      return {
        valid:              false,
        orderId:            data['OrderId'] ?? '',
        providerPaymentId:  data['TransactionId'] ?? '',
        status:             'failed',
      };
    }

    // Başarı kriterleri (ToslaPosResponseDataMapper'dan):
    // BankResponseCode === '00' && RequestStatus === '1' && MdStatus === '1'
    const bankResponseCode = data['BankResponseCode'];
    const requestStatus    = data['RequestStatus'];  // '1' = PAYMENT_COMPLETED
    const mdStatus         = data['MdStatus'];       // '1' = full 3D auth

    const isPaid =
      bankResponseCode === '00' &&
      requestStatus    === '1'  &&
      mdStatus         === '1';

    // Tutar: Tosla kuruş gönderir, TRY'ye çevir
    const amountRaw = data['Amount'];
    const amount    = amountRaw ? parseInt(amountRaw, 10) / 100 : undefined;

    return {
      valid:             true,
      orderId:           data['OrderId'] ?? '',
      providerPaymentId: data['TransactionId'] ?? data['ThreeDSessionId'] ?? '',
      status:            isPaid ? 'paid' : 'failed',
      amount,
      currency:          'TRY',
    };
  },
};
