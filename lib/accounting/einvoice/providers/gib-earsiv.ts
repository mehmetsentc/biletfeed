import { randomUUID } from 'crypto';
import type { EInvoiceConfig } from '@/lib/accounting/einvoice/config';
import type {
  EInvoicePayload,
  EInvoiceProvider,
  EInvoiceSubmitResult
} from '@/lib/accounting/einvoice/types';

const PROD_BASE = 'https://earsivportal.efatura.gov.tr';
const TEST_BASE = 'https://earsivportaltest.efatura.gov.tr';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

function money(n: number): string {
  return (Math.round(Math.abs(n) * 100) / 100).toFixed(2);
}

function formatTrDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function formatTrTime(d: Date): string {
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hh}:${mi}:${ss}`;
}

function splitPersonName(full: string): { adi: string; soyadi: string } {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { adi: 'Musteri', soyadi: 'Bireysel' };
  if (parts.length === 1) return { adi: parts[0], soyadi: '.' };
  return {
    adi: parts.slice(0, -1).join(' '),
    soyadi: parts[parts.length - 1] ?? '.'
  };
}

function asRecord(v: unknown): Record<string, unknown> {
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    return v as Record<string, unknown>;
  }
  return {};
}

/**
 * GİB e-Arşiv Portal (earsivportal.efatura.gov.tr) — doğrudan kendi fatura kesimi.
 * Taslak oluşturur; SMS/imza onayı portal üzerinden tamamlanır (metadata.needsSmsSign).
 */
export function createGibEarsivProvider(config: EInvoiceConfig): EInvoiceProvider {
  const base = config.sandbox ? TEST_BASE : PROD_BASE;
  let cachedToken: string | null = null;

  async function postForm(
    path: string,
    fields: Record<string, string>
  ): Promise<Record<string, unknown>> {
    const body = new URLSearchParams(fields);
    const res = await fetch(`${base}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        Accept: '*/*',
        'User-Agent': UA,
        Referer: `${base}/intragiris.html`
      },
      body
    });
    const text = await res.text();
    try {
      return JSON.parse(text) as Record<string, unknown>;
    } catch {
      return { rawText: text, httpStatus: res.status };
    }
  }

  async function login(): Promise<string> {
    if (!config.username || !config.password) {
      throw new Error('EINVOICE_USERNAME / EINVOICE_PASSWORD eksik');
    }
    const data = await postForm('/earsiv-services/assos-login', {
      assoscmd: config.sandbox ? 'login' : 'anologin',
      rtype: 'json',
      userid: config.username,
      sifre: config.password,
      sifre2: config.password,
      parola: '1'
    });

    const token = typeof data.token === 'string' ? data.token : '';
    if (!token) {
      const msgs = Array.isArray(data.messages)
        ? data.messages
            .map((m) => {
              if (m && typeof m === 'object' && 'text' in m) {
                return String((m as { text: unknown }).text);
              }
              return typeof m === 'string' ? m : '';
            })
            .filter(Boolean)
            .join(' ')
        : '';
      const msg =
        msgs ||
        (typeof data.error === 'string' && data.error !== '1'
          ? data.error
          : '') ||
        'GİB giriş başarısız (oturum çakışması olabilir — portalda Güvenli Çıkış yapın)';
      throw new Error(msg);
    }
    cachedToken = token;
    return token;
  }

  async function logout(token: string): Promise<void> {
    try {
      await postForm('/earsiv-services/assos-login', {
        assoscmd: 'logout',
        rtype: 'json',
        token
      });
    } catch {
      // ignore
    } finally {
      if (cachedToken === token) cachedToken = null;
    }
  }

  async function withToken<T>(fn: (token: string) => Promise<T>): Promise<T> {
    let token = await login();
    try {
      try {
        return await fn(token);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const authRelated =
          /giriş|oturum|token|unauthorized|401|aynı anda/i.test(msg);
        if (!authRelated) throw err;
        await logout(token);
        token = await login();
        return await fn(token);
      }
    } finally {
      await logout(token);
    }
  }

  async function dispatch(
    token: string,
    cmd: string,
    pageName: string,
    payload: Record<string, unknown> | object
  ): Promise<Record<string, unknown>> {
    return postForm('/earsiv-services/dispatch', {
      cmd,
      callid: randomUUID(),
      pageName,
      token,
      jp: JSON.stringify(payload)
    });
  }

  function buildInvoiceBody(payload: EInvoicePayload): Record<string, unknown> {
    const taxDigits = (payload.buyer.taxNumber ?? '').replace(/\D/g, '');
    const isCorporate = payload.buyer.isCorporate || taxDigits.length === 10;
    const { adi, soyadi } = splitPersonName(payload.buyer.name);

    // Bireysel / yabancı: GİB sıkça 11111111111 kabul eder
    const vknTckn =
      taxDigits.length === 10 || taxDigits.length === 11
        ? taxDigits
        : '11111111111';

    const lines = payload.lines.map((line) => {
      const qty = Math.max(1, Math.abs(line.quantity));
      const lineNet = Math.round(Math.abs(line.unitPriceNet) * qty * 100) / 100;
      const lineVat = Math.abs(line.vatAmount);
      return {
        malHizmet: line.description.slice(0, 200),
        miktar: qty,
        birim: 'ADET',
        birimFiyat: money(Math.abs(line.unitPriceNet)),
        fiyat: money(lineNet),
        iskontoOrani: 0,
        iskontoTutari: '0',
        iskontoNedeni: '',
        malHizmetTutari: money(lineNet),
        kdvOrani: line.vatRate,
        vergiOrani: 0,
        kdvTutari: money(lineVat),
        vergininKdvTutari: '0',
        ozelMatrahTutari: '0'
      };
    });

    const matrah = Math.abs(payload.subtotalNet);
    const kdv = Math.abs(payload.vatAmount);
    const brut = Math.abs(payload.totalGross);
    const issued = payload.issuedAt;

    return {
      // GİB (2026): yeni taslakta faturaUuid DOLU gönderilirse
      // "Ettn ya eksik ya boş ya da 36 uzunluk sınırına uymuyor" hatası veriyor.
      // Boş bırakılır; UUID portal tarafından atanır, sonra listeden okunur.
      faturaUuid: '',
      belgeNumarasi: '',
      faturaTarihi: formatTrDate(issued),
      saat: formatTrTime(issued),
      paraBirimi: payload.currency || 'TRY',
      dovzTLkur: '0',
      faturaTipi: payload.kind === 'credit_note' ? 'IADE' : 'SATIS',
      hangiTip: '5000/30000',
      vknTckn,
      aliciUnvan: isCorporate ? payload.buyer.name : '',
      aliciAdi: isCorporate ? '' : adi,
      aliciSoyadi: isCorporate ? '' : soyadi,
      binaAdi: '',
      binaNo: '',
      kapiNo: '',
      kasabaKoy: '',
      vergiDairesi: payload.buyer.taxOffice ?? '',
      ulke: 'Türkiye',
      bulvarcaddesokak: payload.buyer.address ?? 'Türkiye',
      mahalleSemtIlce: '',
      sehir: '',
      postaKodu: '',
      tel: '',
      fax: '',
      eposta: payload.buyer.email ?? '',
      websitesi: '',
      iadeTable: [],
      ozelMatrahTutari: '0',
      ozelMatrahOrani: 0,
      ozelMatrahVergiTutari: '0',
      vergiCesidi: ' ',
      malHizmetTable: lines,
      tip: 'İskonto',
      matrah,
      malhizmetToplamTutari: matrah,
      toplamIskonto: '0',
      hesaplanankdv: kdv,
      vergilerToplami: kdv,
      vergilerDahilToplamTutar: brut,
      odenecekTutar: brut,
      not: `BiletFeed fatura ${payload.invoiceNumber}`,
      siparisNumarasi: payload.invoiceNumber,
      siparisTarihi: formatTrDate(issued),
      irsaliyeNumarasi: '',
      irsaliyeTarihi: '',
      fisNo: '',
      fisTarihi: '',
      fisSaati: ' ',
      fisTipi: ' ',
      zRaporNo: '',
      okcSeriNo: ''
    };
  }

  async function resolveCreatedEttn(
    token: string,
    buyerTaxOrId: string,
    issued: Date
  ): Promise<string | null> {
    const day = formatTrDate(issued);
    const listRes = await dispatch(
      token,
      'EARSIV_PORTAL_TASLAKLARI_GETIR',
      'RG_TASLAKLAR',
      {
        baslangic: day,
        bitis: day,
        hangiTip: '5000/30000',
        table: []
      }
    );
    const rows = Array.isArray(listRes.data) ? listRes.data : [];
    const tax = buyerTaxOrId.replace(/\D/g, '');

    const matches = rows
      .map((row) => asRecord(row))
      .filter((row) => {
        const alici =
          typeof row.aliciVknTckn === 'string'
            ? row.aliciVknTckn.replace(/\D/g, '')
            : '';
        const onay =
          typeof row.onayDurumu === 'string' ? row.onayDurumu : '';
        if (onay === 'Silinmiş') return false;
        if (tax && alici && alici !== tax) return false;
        return true;
      });

    const first = matches[0] ?? asRecord(rows[0]);
    const ettn =
      (typeof first.ettn === 'string' && first.ettn) ||
      (typeof first.faturaUuid === 'string' && first.faturaUuid) ||
      (typeof first.ettnId === 'string' && first.ettnId) ||
      null;
    return ettn && ettn.length === 36 ? ettn : ettn;
  }

  return {
    name: 'gib',

    async submit(payload: EInvoicePayload): Promise<EInvoiceSubmitResult> {
      try {
        return await withToken(async (token) => {
          const body = buildInvoiceBody(payload);
          const res = await dispatch(
            token,
            'EARSIV_PORTAL_FATURA_OLUSTUR',
            'RG_BASITFATURA',
            body
          );

          const dataStr =
            typeof res.data === 'string'
              ? res.data
              : typeof res.data === 'object'
                ? JSON.stringify(res.data)
                : '';
          const ok =
            dataStr.toLowerCase().includes('başarı') ||
            dataStr.toLowerCase().includes('basari') ||
            res.status === 'success';

          if (!ok) {
            const err =
              (typeof res.error === 'string' && res.error) ||
              dataStr ||
              'GİB fatura oluşturma başarısız';
            return {
              ok: false,
              status: 'rejected',
              error: err,
              raw: res
            };
          }

          const taxDigits = (payload.buyer.taxNumber ?? '').replace(/\D/g, '');
          const resolved =
            (await resolveCreatedEttn(
              token,
              taxDigits || '11111111111',
              payload.issuedAt
            )) ?? payload.ettn;

          const pdfUrl =
            `${base}/earsiv-services/download?` +
            new URLSearchParams({
              token,
              ettn: resolved,
              belgeTip: 'FATURA',
              onayDurumu: 'Onaylanmadı',
              cmd: 'EARSIV_PORTAL_BELGE_INDIR'
            }).toString();

          return {
            ok: true,
            status: 'submitted',
            uuid: resolved,
            ettn: resolved,
            pdfUrl,
            providerRef: payload.invoiceNumber,
            raw: {
              ...res,
              needsSmsSign: true,
              note: 'Taslak GİB portalda oluşturuldu. Resmi geçerlilik için SMS/imza onayı gerekir.'
            }
          };
        });
      } catch (err) {
        return {
          ok: false,
          status: 'failed',
          error: err instanceof Error ? err.message : String(err)
        };
      }
    },

    async getStatus(uuid: string): Promise<EInvoiceSubmitResult> {
      try {
        return await withToken(async (token) => {
          const res = await dispatch(token, 'EARSIV_PORTAL_FATURA_GETIR', 'RG_TASLAKLAR', {
            ettn: uuid
          });
          const data = asRecord(res.data);
          const onay =
            typeof data.onayDurumu === 'string' ? data.onayDurumu : '';
          const status =
            onay === 'Onaylandı'
              ? 'accepted'
              : onay === 'Silinmiş'
                ? 'rejected'
                : 'submitted';
          return {
            ok: true,
            status,
            uuid,
            ettn: uuid,
            raw: res
          };
        });
      } catch (err) {
        return {
          ok: false,
          status: 'failed',
          uuid,
          error: err instanceof Error ? err.message : String(err)
        };
      }
    },

    async getPdf(uuid: string, opts?: { signed?: boolean }) {
      try {
        return await withToken(async (token) => {
          const pdfUrl =
            `${base}/earsiv-services/download?` +
            new URLSearchParams({
              token,
              ettn: uuid,
              belgeTip: 'FATURA',
              onayDurumu: opts?.signed ? 'Onaylandı' : 'Onaylanmadı',
              cmd: 'EARSIV_PORTAL_BELGE_INDIR'
            }).toString();
          return { ok: true, pdfUrl };
        });
      } catch (err) {
        return {
          ok: false,
          error: err instanceof Error ? err.message : String(err)
        };
      }
    },

    async startSmsSign(ettns: string[]) {
      try {
        return await withToken(async (token) => {
          const phoneRes = await dispatch(
            token,
            'EARSIV_PORTAL_TELEFONNO_SORGULA',
            'RG_BASITTASLAKLAR',
            {}
          );
          const phoneData = asRecord(phoneRes.data);
          const phone =
            typeof phoneData.telefon === 'string' ? phoneData.telefon : '';
          if (!phone) {
            return {
              ok: false,
              error: 'GİB portalda kayıtlı telefon bulunamadı'
            };
          }

          const smsRes = await dispatch(
            token,
            'EARSIV_PORTAL_SMSSIFRE_GONDER',
            'RG_SMSONAY',
            { CEPTEL: phone, KCEPTEL: false, TIP: '' }
          );
          const smsData = asRecord(smsRes.data);
          const oid = typeof smsData.oid === 'string' ? smsData.oid : '';
          if (!oid) {
            return {
              ok: false,
              error:
                (typeof smsRes.error === 'string' && smsRes.error) ||
                'SMS gönderilemedi',
              phoneMasked: maskPhone(phone)
            };
          }

          void ettns;
          return {
            ok: true,
            oid,
            phoneMasked: maskPhone(phone)
          };
        });
      } catch (err) {
        return {
          ok: false,
          error: err instanceof Error ? err.message : String(err)
        };
      }
    },

    async completeSmsSign(params: {
      oid: string;
      code: string;
      ettns: string[];
    }) {
      try {
        return await withToken(async (token) => {
          const data = params.ettns.map((ettn) => ({
            belgeTuru: 'FATURA',
            ettn
          }));
          const res = await dispatch(token, '0lhozfib5410mp', 'RG_SMSONAY', {
            DATA: data,
            SIFRE: params.code,
            OID: params.oid,
            OPR: 1
          });
          const payload = asRecord(res.data);
          const sonuc =
            payload.sonuc === '1' ||
            payload.sonuc === 1 ||
            (typeof res.data === 'string' &&
              res.data.toLowerCase().includes('başarı'));

          if (!sonuc) {
            return {
              ok: false,
              error:
                (typeof res.error === 'string' && res.error) ||
                (typeof payload.mesaj === 'string' && payload.mesaj) ||
                'SMS doğrulama başarısız — kodu kontrol edin'
            };
          }
          return { ok: true };
        });
      } catch (err) {
        return {
          ok: false,
          error: err instanceof Error ? err.message : String(err)
        };
      }
    }
  };
}

function maskPhone(phone: string): string {
  const d = phone.replace(/\D/g, '');
  if (d.length < 4) return '****';
  return `${d.slice(0, 3)}****${d.slice(-2)}`;
}

/** Credential smoke test — token alıp kullanıcı bilgisi çeker */
export async function verifyGibEarsivLogin(
  config: EInvoiceConfig
): Promise<{ ok: boolean; unvan?: string; vkn?: string; error?: string }> {
  const provider = createGibEarsivProvider(config);
  // login via private path: submit empty would fail; use getStatus with fake after forcing login
  // Better: duplicate thin login here
  const base = config.sandbox ? TEST_BASE : PROD_BASE;
  try {
    const body = new URLSearchParams({
      assoscmd: config.sandbox ? 'login' : 'anologin',
      rtype: 'json',
      userid: config.username,
      sifre: config.password,
      sifre2: config.password,
      parola: '1'
    });
    const loginRes = await fetch(`${base}/earsiv-services/assos-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'User-Agent': UA,
        Referer: `${base}/intragiris.html`
      },
      body
    });
    const loginJson = (await loginRes.json()) as Record<string, unknown>;
    const token = typeof loginJson.token === 'string' ? loginJson.token : '';
    if (!token) {
      return {
        ok: false,
        error:
          (typeof loginJson.error === 'string' && loginJson.error) ||
          'Token alınamadı — kullanıcı kodu/şifre hatalı olabilir'
      };
    }

    const jp = JSON.stringify({});
    const infoBody = new URLSearchParams({
      cmd: 'EARSIV_PORTAL_KULLANICI_BILGILERI_GETIR',
      callid: randomUUID(),
      pageName: 'RG_KULLANICI',
      token,
      jp
    });
    const infoRes = await fetch(`${base}/earsiv-services/dispatch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'User-Agent': UA,
        Referer: `${base}/intragiris.html`
      },
      body: infoBody
    });
    const infoJson = (await infoRes.json()) as Record<string, unknown>;
    const data = asRecord(infoJson.data);

    // logout best-effort
    await fetch(`${base}/earsiv-services/assos-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'User-Agent': UA
      },
      body: new URLSearchParams({
        assoscmd: 'logout',
        rtype: 'json',
        token
      })
    }).catch(() => undefined);

    void provider;
    return {
      ok: true,
      unvan:
        (typeof data.unvan === 'string' && data.unvan) ||
        (typeof data.adiSoyadiUnvan === 'string' && data.adiSoyadiUnvan) ||
        undefined,
      vkn:
        (typeof data.vkn === 'string' && data.vkn) ||
        (typeof data.vknTckn === 'string' && data.vknTckn) ||
        undefined
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err)
    };
  }
}
