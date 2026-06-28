import { notFound } from 'next/navigation';
import QRCode from 'qrcode';
import { PrintPageActions } from '@/components/tickets/print-page-actions';
import {
  formatEventJoyDateTime,
  getEventJoyInvitation,
  getEventJoyInviteUrl
} from '@/lib/eventjoy/invitations';

interface Props {
  params: Promise<{ token: string }>;
}

export default async function EventJoyInvitationPrintPage({ params }: Props) {
  const { token } = await params;
  const invitation = await getEventJoyInvitation(token);
  if (!invitation) notFound();

  const inviteUrl = getEventJoyInviteUrl(token);
  const qrDataUrl = await QRCode.toDataURL(inviteUrl, {
    width: 280,
    margin: 1,
    color: { dark: '#000000', light: '#ffffff' }
  });

  const { dateLabel, timeLabel } = formatEventJoyDateTime(
    invitation.date,
    invitation.time
  );

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: var(--ticket-page-bg) !important; font-family: -apple-system, 'Segoe UI', sans-serif; }
        @page { size: A4 portrait; margin: 12mm; }
        @media print {
          html, body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          #invite-root { page-break-after: avoid; page-break-inside: avoid; }
        }
        @media screen {
          body { display: flex; justify-content: center; align-items: flex-start; padding: 72px 20px 40px; min-height: 100vh; }
        }
      `}</style>

      <PrintPageActions backHref={`/eventjoy/i/${token}`} backLabel="Davetiyeye Dön" />

      <div
        id="invite-root"
        style={{
          width: 595,
          maxWidth: '100%',
          background: '#13191f',
          color: '#fff',
          fontFamily: '-apple-system, "Segoe UI", sans-serif',
          margin: '0 auto',
          border: '1px solid rgba(245,166,35,0.15)',
          borderRadius: 16,
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            background: 'linear-gradient(135deg, var(--bf-orange) 0%, var(--bf-orange-hover) 100%)',
            padding: '14px 28px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span style={{ fontSize: 18, fontWeight: 800, color: '#000', letterSpacing: '-0.5px' }}>
            Event<span style={{ color: '#4a2f00' }}>Joy</span>
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 2.5,
              color: '#000',
              textTransform: 'uppercase'
            }}
          >
            ✦ Davetiye
          </span>
        </div>

        {invitation.coverImage && (
          <div style={{ position: 'relative', height: 200, overflow: 'hidden' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={invitation.coverImage}
              alt={invitation.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to bottom, rgba(19,25,31,0) 40%, rgba(19,25,31,1) 100%)'
              }}
            />
          </div>
        )}

        <div style={{ padding: '28px 32px' }}>
          <p
            style={{
              fontSize: 12,
              color: 'var(--bf-orange)',
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: 'uppercase',
              marginBottom: 10
            }}
          >
            {invitation.type}
          </p>
          <h1 style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.2, color: '#fff', marginBottom: 8 }}>
            {invitation.title}
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>
            <strong style={{ color: '#fff' }}>{invitation.hostName}</strong> tarafından düzenlenmiştir.
          </p>

          {invitation.personalMessage && (
            <div
              style={{
                margin: '18px 0',
                padding: '12px 16px',
                background: 'rgba(245,166,35,0.06)',
                borderLeft: '3px solid var(--bf-orange)',
                borderRadius: '0 8px 8px 0'
              }}
            >
              <p style={{ fontSize: 13, fontStyle: 'italic', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
                &ldquo;{invitation.personalMessage}&rdquo;
              </p>
            </div>
          )}

          <div
            style={{
              marginTop: 20,
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 10
            }}
          >
            {[
              { label: 'Tarih', value: dateLabel },
              { label: 'Saat', value: timeLabel },
              { label: 'Konum', value: invitation.location || 'Belirtilecek' },
              { label: 'Organizatör', value: invitation.hostName }
            ].map(({ label, value }) => (
              <div
                key={label}
                style={{
                  padding: '10px 14px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.07)'
                }}
              >
                <p
                  style={{
                    fontSize: 10,
                    color: 'var(--bf-orange)',
                    fontWeight: 700,
                    letterSpacing: 1.2,
                    textTransform: 'uppercase',
                    marginBottom: 3
                  }}
                >
                  {label}
                </p>
                <p style={{ fontSize: 12, color: '#fff', fontWeight: 600 }}>{value}</p>
              </div>
            ))}
          </div>

          {invitation.description && (
            <p style={{ marginTop: 18, fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>
              {invitation.description}
            </p>
          )}

          <div style={{ position: 'relative', margin: '28px -32px' }}>
            <div
              style={{
                borderTop: '2px dashed rgba(245,166,35,0.2)',
                marginLeft: 9,
                marginRight: 9
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
            <div
              style={{
                padding: 14,
                background: '#fff',
                borderRadius: 14,
                boxShadow: '0 0 50px rgba(245,166,35,0.18)',
                flexShrink: 0
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrDataUrl} alt="QR Kod" width={150} height={150} />
            </div>

            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7 }}>
                Davetiyeyi görüntülemek için QR kodu okutun veya bağlantıyı ziyaret edin.
              </p>
              <p
                style={{
                  marginTop: 10,
                  fontSize: 10,
                  color: 'rgba(255,255,255,0.35)',
                  wordBreak: 'break-all'
                }}
              >
                {inviteUrl}
              </p>
            </div>
          </div>

          <div
            style={{
              marginTop: 28,
              paddingTop: 16,
              borderTop: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12
            }}
          >
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>
              EventJoy · biletfeed.com
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
