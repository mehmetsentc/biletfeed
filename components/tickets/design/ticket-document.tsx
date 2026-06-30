'use client';

import { brandAssetUrl, brandLogos } from '@/lib/config/brand-theme';
import { ticketDesignTokens as t } from '@/lib/tickets/design/tokens';
import {
  ticketCompanyAddressLine,
  ticketCompanyContactLine,
  ticketCompanyLegalLine,
  ticketTermsEn,
  ticketTermsTr
} from '@/lib/tickets/design/terms';
import type { TicketDocumentData } from '@/lib/tickets/design/types';
import { barcodeToDataUrl } from '@/lib/tickets/design/barcode';

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        padding: '10px 14px',
        background: t.surfaceMuted,
        borderRadius: t.radius.box,
        border: `1px solid ${t.surfaceBorder}`
      }}
    >
      <p
        style={{
          fontSize: 10,
          color: t.orange,
          fontWeight: 700,
          letterSpacing: 1.2,
          textTransform: 'uppercase',
          marginBottom: 4
        }}
      >
        {label}
      </p>
      <p style={{ fontSize: 13, color: t.textPrimary, fontWeight: 600, lineHeight: 1.35 }}>
        {value}
      </p>
    </div>
  );
}

function BrandLogo({ brand }: { brand: TicketDocumentData['brand'] }) {
  if (brand === 'eventjoy') {
    return (
      <span style={{ fontSize: 18, fontWeight: 800, color: '#000', letterSpacing: '-0.5px' }}>
        Event<span style={{ color: '#4a2f00' }}>Joy</span>
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={brandAssetUrl(brandLogos.forDarkSurface)}
      alt="BiletFeed"
      width={140}
      height={36}
      style={{ display: 'block', height: 32, width: 'auto' }}
    />
  );
}

function StatusBadge({ isValid, kind }: { isValid: boolean; kind: TicketDocumentData['kind'] }) {
  const label =
    kind === 'invitation'
      ? isValid
        ? '✓ Davetiye Geçerli'
        : 'Geçersiz'
      : isValid
        ? '✓ Geçerli'
        : 'Geçersiz';

  return (
    <span
      style={{
        flexShrink: 0,
        padding: '4px 12px',
        borderRadius: 99,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 0.5,
        background: isValid ? t.successSoft : t.dangerSoft,
        color: isValid ? t.success : t.danger,
        border: `1px solid ${isValid ? 'rgba(52,211,153,0.3)' : 'rgba(239,68,68,0.3)'}`
      }}
    >
      {label}
    </span>
  );
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
    coverImageUrl,
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
  const kindLabel = isInvitation ? 'Davetiye' : 'Etkinlik Bileti';
  const codeLabel = isInvitation ? 'Davetiye Kodu' : 'Bilet Kodu';
  const barcodeUrl = barcodeToDataUrl(ticketCode, { width: 220, height: 44, barColor: '#ffffff' });

  const gridItems: Array<{ label: string; value: string }> = [
    { label: 'Tarih', value: eventDate },
    { label: 'Saat', value: eventTime },
    { label: 'Mekan', value: `${venue}, ${city}` },
    { label: isInvitation ? 'Davetiye Türü' : 'Bilet Türü', value: ticketTypeName },
    { label: 'Katılımcı', value: holderName }
  ];

  if (categoryLabel) {
    gridItems.splice(3, 0, { label: 'Kategori', value: categoryLabel });
  }
  if (sectorGate) {
    gridItems.push({ label: 'Sektör / Kapı', value: sectorGate });
  }

  return (
    <div
      id={rootId}
      style={{
        width: 595,
        maxWidth: '100%',
        background: t.cardBg,
        color: t.textPrimary,
        fontFamily: t.fontFamily,
        margin: '0 auto',
        border: `1px solid ${t.cardBorder}`,
        borderRadius: t.radius.card,
        overflow: 'hidden'
      }}
    >
      {/* Header strip */}
      <div
        style={{
          background: `linear-gradient(135deg, ${t.orange} 0%, ${t.orangeHover} 100%)`,
          padding: '14px 28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12
        }}
      >
        <BrandLogo brand={brand} />
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 2.5,
            color: '#000',
            textTransform: 'uppercase'
          }}
        >
          {isInvitation ? '✦ ' : ''}
          {kindLabel}
        </span>
      </div>

      {/* Cover */}
      {coverImageUrl && (
        <div style={{ position: 'relative', height: 200, overflow: 'hidden' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverImageUrl}
            alt={eventTitle}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(to bottom, rgba(12,16,23,0) 35%, ${t.cardBg} 100%)`
            }}
          />
        </div>
      )}

      <div style={{ padding: '28px 32px' }}>
        {/* Title row */}
        {isInvitation && (
          <p
            style={{
              fontSize: 11,
              color: t.orange,
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: 'uppercase',
              marginBottom: 8
            }}
          >
            Sayın Davetli
          </p>
        )}

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 12,
            marginBottom: 6
          }}
        >
          <h1 style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.25, color: t.textPrimary, flex: 1, margin: 0 }}>
            {eventTitle}
          </h1>
          <StatusBadge isValid={isValid} kind={kind} />
        </div>

        <p style={{ fontSize: 13, color: t.textSecondary, marginBottom: 4 }}>
          {isInvitation ? (
            <>
              <strong style={{ color: t.textPrimary }}>{holderName}</strong> adına düzenlenmiştir.
            </>
          ) : (
            <>
              Sayın <strong style={{ color: t.textPrimary }}>{holderName}</strong>
            </>
          )}
        </p>

        {personalMessage && (
          <div
            style={{
              margin: '16px 0',
              padding: '12px 16px',
              background: t.orangeSoft,
              borderLeft: `3px solid ${t.orange}`,
              borderRadius: '0 8px 8px 0'
            }}
          >
            <p style={{ fontSize: 13, fontStyle: 'italic', color: t.textSecondary, lineHeight: 1.6, margin: 0 }}>
              &ldquo;{personalMessage}&rdquo;
            </p>
          </div>
        )}

        {/* Info grid — receipt-style sections */}
        <div
          style={{
            marginTop: 20,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 10
          }}
        >
          {gridItems.map(({ label, value }) => (
            <InfoCell key={label} label={label} value={value} />
          ))}
        </div>

        {description && (
          <p style={{ marginTop: 16, fontSize: 13, color: t.textSecondary, lineHeight: 1.6 }}>
            {description}
          </p>
        )}

        {/* Tear line */}
        <div style={{ position: 'relative', margin: '28px -32px' }}>
          <div
            style={{
              borderTop: `2px dashed ${t.divider}`,
              marginLeft: 12,
              marginRight: 12
            }}
          />
        </div>

        {/* QR + reference */}
        <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start' }}>
          <div
            style={{
              padding: 14,
              background: t.qrBg,
              borderRadius: t.radius.qr,
              boxShadow: `0 0 40px ${t.orangeSoft}`,
              flexShrink: 0
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt="QR Kod" width={160} height={160} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontSize: 10,
                color: t.textMuted,
                letterSpacing: 1.2,
                textTransform: 'uppercase',
                marginBottom: 6
              }}
            >
              {codeLabel}
            </p>
            <p
              style={{
                fontSize: 20,
                fontWeight: 800,
                letterSpacing: 3,
                color: t.textPrimary,
                fontFamily: t.fontMono,
                marginBottom: 12
              }}
            >
              {ticketCode}
            </p>

            {/* Barcode */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={barcodeUrl}
              alt=""
              width={220}
              height={44}
              style={{ display: 'block', marginBottom: 14, maxWidth: '100%' }}
            />

            <p style={{ fontSize: 12, color: t.textMuted, lineHeight: 1.65, margin: 0 }}>
              {inviteUrl
                ? 'Davetiyeyi görüntülemek için QR kodu okutun veya bağlantıyı ziyaret edin.'
                : isInvitation
                  ? 'Girişte bu QR kodu veya davetiye kodunu gösterin.'
                  : 'Girişte bu QR kodu veya bilet kodunu gösterin. Bilet yalnızca bir kez kullanılabilir.'}
            </p>
            {inviteUrl && (
              <p
                style={{
                  marginTop: 8,
                  fontSize: 10,
                  color: t.textDim,
                  wordBreak: 'break-all'
                }}
              >
                {inviteUrl}
              </p>
            )}
            <div
              style={{
                marginTop: 16,
                height: 3,
                borderRadius: 99,
                background: `linear-gradient(90deg, ${t.orange}, transparent)`
              }}
            />
          </div>
        </div>

        {/* Terms + legal footer */}
        <div
          style={{
            marginTop: 28,
            paddingTop: 18,
            borderTop: `1px solid ${t.surfaceBorder}`
          }}
        >
          <p style={{ fontSize: 10, color: t.textMuted, lineHeight: 1.65, margin: '0 0 8px' }}>
            {ticketTermsTr(kind)}
          </p>
          <p style={{ fontSize: 9, color: t.textDim, lineHeight: 1.55, margin: '0 0 12px', fontStyle: 'italic' }}>
            {ticketTermsEn(kind)}
          </p>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              gap: 16,
              flexWrap: 'wrap'
            }}
          >
            <div>
              <p style={{ fontSize: 9, color: t.textDim, margin: '0 0 2px', lineHeight: 1.5 }}>
                {ticketCompanyLegalLine()}
              </p>
              <p style={{ fontSize: 9, color: t.textDim, margin: 0 }}>
                {ticketCompanyAddressLine()}
              </p>
              <p style={{ fontSize: 9, color: t.textDim, margin: '2px 0 0' }}>
                {ticketCompanyContactLine()}
              </p>
            </div>
            <span style={{ fontSize: 10, color: t.textDim }}>
              {brand === 'eventjoy' ? 'EventJoy · ' : ''}biletfeed.com
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
