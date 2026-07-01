'use client';

import { platformContact } from '@/lib/config/contact';
import { ticketPrintTokens as p } from '@/lib/tickets/design/print-tokens';
import {
  admissionRulesTr,
  bilingualFieldLabels,
  ticketKindLabels
} from '@/lib/tickets/design/ticket-receipt-shared';
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
          fontSize: 8,
          color: p.textMuted,
          fontWeight: 700,
          letterSpacing: 0.8,
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

function BrandLogo({
  brand,
  logoSrc
}: {
  brand: TicketDocumentData['brand'];
  logoSrc?: string | null;
}) {
  if (brand === 'eventjoy') {
    return (
      <span style={{ fontSize: 18, fontWeight: 800, color: p.text, letterSpacing: '-0.5px' }}>
        Event<span style={{ color: p.accent }}>Joy</span>
      </span>
    );
  }

  if (logoSrc) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoSrc}
        alt="BiletFeed"
        width={150}
        height={38}
        style={{ display: 'block', height: 32, width: 'auto' }}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/logo-dark.png?v=16"
      alt="BiletFeed"
      width={150}
      height={38}
      style={{ display: 'block', height: 32, width: 'auto' }}
    />
  );
}

function PerforatedLine() {
  return (
    <div style={{ position: 'relative', margin: '18px 0' }}>
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

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td
        style={{
          padding: '6px 10px',
          border: `1px solid ${p.border}`,
          fontSize: 9,
          fontWeight: 700,
          color: p.textMuted,
          textTransform: 'uppercase',
          background: p.accentSoft,
          width: '40%'
        }}
      >
        {label}
      </td>
      <td
        style={{
          padding: '6px 10px',
          border: `1px solid ${p.border}`,
          fontSize: 11,
          fontWeight: 600,
          color: p.text
        }}
      >
        {value}
      </td>
    </tr>
  );
}

export function TicketDocument({
  data,
  rootId = 'ticket-document',
  logoSrc
}: {
  data: TicketDocumentData;
  rootId?: string;
  /** Sunucu/önizleme — gömülü base64 logo */
  logoSrc?: string;
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
    inviteUrl,
    orderNumber
  } = data;

  const isValid = status === 'VALID';
  const labels = ticketKindLabels(kind);
  const barcodeUrl = barcodeToDataUrl(ticketCode, { width: 200, height: 36, barColor: p.text });
  const verticalBarcodeUrl = barcodeToDataUrl(ticketCode, { width: 110, height: 32, barColor: p.text });
  const rules = admissionRulesTr(kind);

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
      <div
        style={{
          background: p.pageBg,
          padding: '14px 20px 0',
          borderBottom: `3px solid ${p.accent}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12
        }}
      >
        <BrandLogo brand={brand} logoSrc={logoSrc} />
        <div style={{ textAlign: 'right' }}>
          <span
            style={{
              display: 'block',
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: 1.5,
              color: p.text,
              textTransform: 'uppercase'
            }}
          >
            {labels.tr}
          </span>
          <span style={{ fontSize: 8, color: p.textMuted, fontWeight: 600 }}>biletfeed.com</span>
        </div>
      </div>

      <div style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <div
            style={{
              padding: 6,
              border: `1px solid ${p.border}`,
              borderRadius: 4,
              flexShrink: 0
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt="QR Kod" width={96} height={96} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 9, fontWeight: 700, color: p.text, margin: '0 0 6px', letterSpacing: 0.5 }}>
              GİRİŞ KURALLARI
            </p>
            {rules.map((line) => (
              <p key={line} style={{ fontSize: 9, color: p.textSecondary, margin: '0 0 3px', lineHeight: 1.4 }}>
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
            <p style={{ fontSize: 7, color: p.textMuted, margin: 0, wordBreak: 'break-all' }}>{ticketCode}</p>
          </div>
        </div>

        <PerforatedLine />

        <div style={{ position: 'relative' }}>
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
            {labels.en}
          </p>

          <h1
            style={{
              fontSize: 20,
              fontWeight: 800,
              lineHeight: 1.25,
              color: p.text,
              margin: '0 0 8px',
              textTransform: 'uppercase',
              paddingRight: 90
            }}
          >
            {eventTitle}
          </h1>

          <p style={{ fontSize: 11, color: p.textSecondary, margin: '0 0 10px' }}>
            {kind === 'invitation' ? (
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
                marginBottom: 12,
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

          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: p.accent,
              textTransform: 'uppercase',
              margin: '0 0 12px'
            }}
          >
            {labels.typeLabel}
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px 20px',
              marginBottom: 12
            }}
          >
            <DetailRow label={bilingualFieldLabels.venue} value={`${venue}, ${city}`} />
            <DetailRow label={bilingualFieldLabels.date} value={eventDate} />
            <DetailRow label={bilingualFieldLabels.time} value={eventTime} />
            <DetailRow
              label={kind === 'invitation' ? 'DAVETİYE TÜRÜ / TYPE' : bilingualFieldLabels.type}
              value={ticketTypeName}
            />
            <DetailRow label={bilingualFieldLabels.holder} value={holderName} />
            <DetailRow label={labels.codeLabelEn} value={ticketCode} />
            {categoryLabel && <DetailRow label={bilingualFieldLabels.category} value={categoryLabel} />}
            {sectorGate && <DetailRow label={bilingualFieldLabels.sector} value={sectorGate} />}
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
            <tbody>
              <SummaryRow label="Kod / Code" value={ticketCode} />
              <SummaryRow label="Kategori / Category" value={categoryLabel ?? ticketTypeName} />
              {orderNumber && <SummaryRow label="Sipariş / Order" value={orderNumber} />}
            </tbody>
          </table>

          {description && (
            <p style={{ fontSize: 11, color: p.textSecondary, lineHeight: 1.55, margin: '0 0 12px' }}>{description}</p>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 4 }}>
            <span
              style={{
                padding: '3px 10px',
                borderRadius: 3,
                fontSize: 8,
                fontWeight: 700,
                letterSpacing: 0.5,
                background: isValid ? `${p.success}22` : `${p.danger}22`,
                color: isValid ? p.success : p.danger
              }}
            >
              {isValid ? 'GEÇERLİ / VALID' : 'GEÇERSİZ / INVALID'}
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={barcodeUrl} alt="" width={200} height={36} style={{ display: 'block', marginLeft: 'auto' }} />
          </div>

          <p style={{ fontSize: 9, color: p.textMuted, lineHeight: 1.5, margin: '8px 0 0' }}>
            {inviteUrl
              ? 'Davetiyeyi görüntülemek için QR kodu okutun veya bağlantıyı ziyaret edin.'
              : kind === 'invitation'
                ? 'Girişte bu QR kodu veya davetiye kodunu gösterin.'
                : 'Girişte bu QR kodu veya bilet kodunu gösterin. Bilet yalnızca bir kez kullanılabilir.'}
          </p>
          {inviteUrl && (
            <p style={{ marginTop: 6, fontSize: 8, color: p.textDim, wordBreak: 'break-all' }}>{inviteUrl}</p>
          )}
        </div>

        <PerforatedLine />

        <div style={{ display: 'flex', gap: 16, justifyContent: 'space-between' }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 8, fontWeight: 700, color: p.textMuted, margin: '0 0 6px', letterSpacing: 0.5 }}>
              ŞARTLAR / TERMS
            </p>
            <p style={{ fontSize: 8, color: p.textSecondary, lineHeight: 1.55, margin: '0 0 4px' }}>
              {ticketTermsTr(kind)}
            </p>
            <p style={{ fontSize: 7, color: p.textMuted, lineHeight: 1.5, margin: '0 0 10px', fontStyle: 'italic' }}>
              {ticketTermsEn(kind)}
            </p>
            <div style={{ borderTop: `1px solid ${p.border}`, paddingTop: 8 }}>
              <p style={{ fontSize: 7, color: p.textDim, margin: '0 0 2px', lineHeight: 1.5 }}>
                {ticketCompanyLegalLine()}
              </p>
              <p style={{ fontSize: 7, color: p.textDim, margin: '0 0 2px' }}>{ticketCompanyAddressLine()}</p>
              <p style={{ fontSize: 7, color: p.textDim, margin: 0 }}>{ticketCompanyContactLine()}</p>
            </div>
          </div>
          <div style={{ textAlign: 'right', alignSelf: 'flex-end', minWidth: 120 }}>
            <p style={{ fontSize: 8, fontWeight: 700, color: p.textMuted, margin: '0 0 2px' }}>Yardım / Support</p>
            <p style={{ fontSize: 8, color: p.accent, fontWeight: 600, margin: 0 }}>{platformContact.email}</p>
            <p style={{ fontSize: 9, color: p.accent, fontWeight: 700, margin: '6px 0 0' }}>
              {brand === 'eventjoy' ? 'EventJoy · ' : ''}biletfeed.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
