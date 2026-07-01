'use client';

import { brandAssetUrl, brandLogos } from '@/lib/config/brand-theme';
import { ticketPrintTokens as p } from '@/lib/tickets/design/print-tokens';
import {
  ticketCompanyAddressLine,
  ticketCompanyContactLine,
  ticketCompanyLegalLine,
  ticketTermsEn,
  ticketTermsTr
} from '@/lib/tickets/design/terms';
import type { TicketDocumentData } from '@/lib/tickets/design/types';
import { barcodeToDataUrl } from '@/lib/tickets/design/barcode';

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ minWidth: 0 }}>
      <p
        style={{
          fontSize: 9,
          color: p.textMuted,
          fontWeight: 700,
          letterSpacing: 1,
          textTransform: 'uppercase',
          margin: '0 0 4px'
        }}
      >
        {label}
      </p>
      <p style={{ fontSize: 12, color: p.text, fontWeight: 600, lineHeight: 1.35, margin: 0 }}>{value}</p>
    </div>
  );
}

function BrandLogo({ brand }: { brand: TicketDocumentData['brand'] }) {
  if (brand === 'eventjoy') {
    return (
      <span style={{ fontSize: 18, fontWeight: 800, color: p.headerText, letterSpacing: '-0.5px' }}>
        Event<span style={{ color: '#4a2f00' }}>Joy</span>
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={brandAssetUrl(brandLogos.forLightSurface)}
      alt="BiletFeed"
      width={140}
      height={36}
      style={{ display: 'block', height: 28, width: 'auto' }}
    />
  );
}

function PerforatedLine() {
  return (
    <div style={{ position: 'relative', margin: '20px 0' }}>
      <div
        style={{
          position: 'absolute',
          left: -8,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 14,
          height: 14,
          borderRadius: '50%',
          background: p.pageBg
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: -8,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 14,
          height: 14,
          borderRadius: '50%',
          background: p.pageBg
        }}
      />
      <div style={{ borderTop: `2px dashed ${p.dash}`, margin: '0 4px' }} />
    </div>
  );
}

function admissionRulesTr(isInvitation: boolean): string[] {
  if (isInvitation) {
    return [
      '• Dışarıdan yiyecek ve içecek getirilemez.',
      '• Profesyonel kamera, kayıt ve ses cihazı alınmaz.',
      '• Davetiye kişiye özeldir; devredilemez ve iade edilemez.',
      '• Girişte QR kod veya davetiye kodu gösterilmelidir.'
    ];
  }
  return [
    '• Dışarıdan yiyecek ve içecek getirilemez.',
    '• Profesyonel kamera, kayıt ve ses cihazı alınmaz.',
    '• Bilet kişiye özeldir; devredilemez ve iade edilemez.',
    '• Bilet yalnızca bir kez kullanılabilir.'
  ];
}

export function TicketDocument({
  data,
  rootId = 'ticket-document'
}: {
  data: TicketDocumentData;
  rootId?: string;
}) {
  const {
    kind,
    brand = 'biletfeed',
    eventTitle,
    eventDate,
    eventTime,
    venue,
    city,
    ticketTypeName,
    holderName,
    ticketCode,
    qrDataUrl,
    status,
    personalMessage,
    categoryLabel,
    sectorGate,
    description,
    inviteUrl
  } = data;

  const isValid = status === 'VALID';
  const isInvitation = kind === 'invitation';
  const kindLabel = isInvitation ? 'DAVETİYE' : 'ETKİNLİK BİLETİ';
  const kindLabelEn = isInvitation ? 'INVITATION' : 'EVENT TICKET';
  const codeLabel = isInvitation ? 'Davetiye Kodu' : 'Bilet Kodu';
  const barcodeUrl = barcodeToDataUrl(ticketCode, { width: 200, height: 36, barColor: p.text });
  const verticalBarcodeUrl = barcodeToDataUrl(ticketCode, { width: 110, height: 32, barColor: p.text });

  return (
    <div
      id={rootId}
      style={{
        width: 595,
        maxWidth: '100%',
        background: p.pageBg,
        color: p.text,
        fontFamily: "-apple-system, 'Segoe UI', sans-serif",
        margin: '0 auto',
        border: `1px solid ${p.border}`,
        borderRadius: 6,
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div
        style={{
          background: p.headerBg,
          padding: '12px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12
        }}
      >
        <BrandLogo brand={brand} />
        <div style={{ textAlign: 'right' }}>
          <span
            style={{
              display: 'block',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 2,
              color: p.headerText,
              textTransform: 'uppercase'
            }}
          >
            {kindLabel}
          </span>
          <span style={{ fontSize: 9, color: `${p.headerText}99` }}>biletfeed.com</span>
        </div>
      </div>

      <div style={{ padding: '16px 20px' }}>
        {/* Admission strip */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <div
            style={{
              padding: 8,
              border: `1px solid ${p.border}`,
              borderRadius: 4,
              flexShrink: 0
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt="QR Kod" width={96} height={96} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 9, fontWeight: 700, color: p.text, margin: '0 0 8px', letterSpacing: 0.5 }}>
              GİRİŞ KURALLARI
            </p>
            {admissionRulesTr(isInvitation).map((line) => (
              <p key={line} style={{ fontSize: 10, color: p.textSecondary, margin: '0 0 4px', lineHeight: 1.4 }}>
                {line}
              </p>
            ))}
          </div>

          <div style={{ flexShrink: 0, textAlign: 'center', width: 44 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={verticalBarcodeUrl}
              alt=""
              width={32}
              height={110}
              style={{ display: 'block', transform: 'rotate(-90deg)', transformOrigin: 'center', margin: '40px auto 4px' }}
            />
            <p style={{ fontSize: 8, color: p.textMuted, margin: 0, wordBreak: 'break-all' }}>{ticketCode}</p>
          </div>
        </div>

        <PerforatedLine />

        {/* Main body */}
        <div style={{ position: 'relative', paddingLeft: 20 }}>
          <div style={{ position: 'absolute', left: 0, top: 8 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={verticalBarcodeUrl}
              alt=""
              width={24}
              height={90}
              style={{ display: 'block', transform: 'rotate(-90deg)', transformOrigin: 'center' }}
            />
          </div>

          <p
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              fontSize: 22,
              fontWeight: 800,
              color: p.watermark,
              letterSpacing: 2,
              margin: 0,
              textTransform: 'uppercase'
            }}
          >
            {kindLabelEn}
          </p>

          <h1
            style={{
              fontSize: 20,
              fontWeight: 800,
              lineHeight: 1.25,
              color: p.text,
              margin: '0 0 6px',
              textTransform: 'uppercase',
              paddingRight: 100
            }}
          >
            {eventTitle}
          </h1>

          <p style={{ fontSize: 11, color: p.textSecondary, margin: '0 0 14px' }}>
            {isInvitation ? (
              <>
                <strong style={{ color: p.text }}>{holderName}</strong> adına düzenlenmiştir
              </>
            ) : (
              <>
                Sayın <strong style={{ color: p.text }}>{holderName}</strong>
              </>
            )}
          </p>

          {personalMessage && (
            <div
              style={{
                marginBottom: 14,
                padding: '8px 12px',
                background: p.accentSoft,
                borderRadius: 4
              }}
            >
              <p style={{ fontSize: 10, fontStyle: 'italic', color: p.textSecondary, lineHeight: 1.5, margin: 0 }}>
                &ldquo;{personalMessage}&rdquo;
              </p>
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '14px 24px',
              marginBottom: 16
            }}
          >
            <DetailRow label="Mekan" value={`${venue}, ${city}`} />
            <DetailRow label="Tarih" value={eventDate} />
            <DetailRow label="Saat" value={eventTime} />
            <DetailRow label={isInvitation ? 'Davetiye Türü' : 'Bilet Türü'} value={ticketTypeName} />
            <DetailRow label="Katılımcı" value={holderName} />
            <DetailRow label={codeLabel} value={ticketCode} />
            {categoryLabel && <DetailRow label="Kategori" value={categoryLabel} />}
            {sectorGate && <DetailRow label="Sektör / Kapı" value={sectorGate} />}
          </div>

          {description && (
            <p style={{ fontSize: 11, color: p.textSecondary, lineHeight: 1.55, margin: '0 0 12px' }}>{description}</p>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 4 }}>
            <span
              style={{
                padding: '3px 10px',
                borderRadius: 3,
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: 0.5,
                background: isValid ? `${p.success}22` : `${p.danger}22`,
                color: isValid ? p.success : p.danger
              }}
            >
              {isValid ? 'GEÇERLİ' : 'GEÇERSİZ'}
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={barcodeUrl} alt="" width={200} height={36} style={{ display: 'block' }} />
          </div>

          <p style={{ fontSize: 10, color: p.textMuted, lineHeight: 1.5, margin: '8px 0 0' }}>
            {inviteUrl
              ? 'Davetiyeyi görüntülemek için QR kodu okutun veya bağlantıyı ziyaret edin.'
              : isInvitation
                ? 'Girişte bu QR kodu veya davetiye kodunu gösterin.'
                : 'Girişte bu QR kodu veya bilet kodunu gösterin. Bilet yalnızca bir kez kullanılabilir.'}
          </p>
          {inviteUrl && (
            <p style={{ marginTop: 6, fontSize: 9, color: p.textDim, wordBreak: 'break-all' }}>{inviteUrl}</p>
          )}
        </div>

        <PerforatedLine />

        {/* Footer */}
        <div>
          <p style={{ fontSize: 9, fontWeight: 700, color: p.textMuted, margin: '0 0 8px', letterSpacing: 0.5 }}>
            ŞARTLAR / TERMS
          </p>
          <p style={{ fontSize: 9, color: p.textSecondary, lineHeight: 1.55, margin: '0 0 6px' }}>
            {ticketTermsTr(kind)}
          </p>
          <p style={{ fontSize: 8, color: p.textMuted, lineHeight: 1.5, margin: '0 0 12px', fontStyle: 'italic' }}>
            {ticketTermsEn(kind)}
          </p>
          <div style={{ borderTop: `1px solid ${p.border}`, paddingTop: 10 }}>
            <p style={{ fontSize: 8, color: p.textDim, margin: '0 0 3px', lineHeight: 1.5 }}>
              {ticketCompanyLegalLine()}
            </p>
            <p style={{ fontSize: 8, color: p.textDim, margin: '0 0 3px' }}>{ticketCompanyAddressLine()}</p>
            <p style={{ fontSize: 8, color: p.textDim, margin: 0 }}>{ticketCompanyContactLine()}</p>
            <p style={{ fontSize: 9, color: p.accent, fontWeight: 700, margin: '8px 0 0', textAlign: 'right' }}>
              {brand === 'eventjoy' ? 'EventJoy · ' : ''}biletfeed.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
