import { notFound } from 'next/navigation';
import QRCode from 'qrcode';
import { AutoPrint } from '@/components/tickets/auto-print';
import { getPublicInvitation } from '@/lib/services/event-invitations';

interface Props {
  params: Promise<{ token: string }>;
}

export default async function InvitationPrintPage({ params }: Props) {
  const { token } = await params;
  const invitation = await getPublicInvitation(token);
  if (!invitation) notFound();

  const qrDataUrl = await QRCode.toDataURL(invitation.qrData, {
    width: 280,
    margin: 1,
    color: { dark: '#000000', light: '#ffffff' }
  });

  const eventDate = new Date(invitation.event.startDate).toLocaleDateString('tr-TR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const eventTime = new Date(invitation.event.startDate).toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const isValid = invitation.ticketStatus === 'VALID';

  return (
    <>
      <AutoPrint />

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #0c1017 !important; font-family: -apple-system, 'Segoe UI', sans-serif; }
        @page { size: A4 portrait; margin: 0; }
        @media print {
          html, body { -webkit-print-color-adjust: exact; print-color-adjust: exact; width: 210mm; }
          .no-print { display: none !important; }
          #invite-root { width: 210mm !important; page-break-after: avoid; page-break-inside: avoid; }
        }
        @media screen {
          body { display: flex; justify-content: center; align-items: flex-start; padding: 40px 20px; min-height: 100vh; background: #1a1a2e; }
        }
      `}</style>

      {/* Back link — screen only */}
      <div className="no-print" style={{ position: 'fixed', top: 20, left: 20, zIndex: 10 }}>
        <a
          href={`/davetiye/${token}`}
          style={{ color: '#f5a623', fontSize: 14, textDecoration: 'none' }}
        >
          ← Davetiyeye Dön
        </a>
      </div>

      {/* Invitation card — A4 width */}
      <div id="invite-root" style={{
        width: 595,
        background: '#13191f',
        color: '#fff',
        fontFamily: '-apple-system, "Segoe UI", sans-serif',
        margin: '0 auto',
        border: '1px solid rgba(245,166,35,0.15)',
        borderRadius: 4,
        overflow: 'hidden'
      }}>

        {/* Gold top strip */}
        <div style={{
          background: 'linear-gradient(135deg, #f5a623 0%, #e09510 100%)',
          padding: '14px 28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#000', letterSpacing: '-0.5px' }}>
            bilet<span style={{ color: '#4a2f00' }}>feed</span>
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2.5, color: '#000', textTransform: 'uppercase' }}>
            ✦ Davetiye
          </span>
        </div>

        {/* Cover image */}
        {invitation.event.coverImage && (
          <div style={{ position: 'relative', height: 200, overflow: 'hidden' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={invitation.event.coverImage}
              alt={invitation.event.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to bottom, rgba(19,25,31,0) 40%, rgba(19,25,31,1) 100%)'
            }} />
          </div>
        )}

        {/* Main content */}
        <div style={{ padding: '28px 32px' }}>

          {/* Greeting */}
          <p style={{ fontSize: 12, color: '#f5a623', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>
            Sayın Davetli
          </p>
          <h1 style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.2, color: '#fff', marginBottom: 8 }}>
            {invitation.event.title}
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>
            <strong style={{ color: '#fff' }}>{invitation.guestName}</strong> adına düzenlenmiştir.
          </p>

          {/* Personal message */}
          {invitation.personalMessage && (
            <div style={{
              margin: '18px 0',
              padding: '12px 16px',
              background: 'rgba(245,166,35,0.06)',
              borderLeft: '3px solid #f5a623',
              borderRadius: '0 8px 8px 0'
            }}>
              <p style={{ fontSize: 13, fontStyle: 'italic', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
                &ldquo;{invitation.personalMessage}&rdquo;
              </p>
            </div>
          )}

          {/* Event details */}
          <div style={{
            marginTop: 20,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 10
          }}>
            {[
              { label: 'Tarih', value: eventDate },
              { label: 'Saat', value: eventTime },
              { label: 'Mekan', value: `${invitation.event.venue}, ${invitation.event.city}` },
              { label: 'Davetiye Türü', value: invitation.ticketTypeName }
            ].map(({ label, value }) => (
              <div key={label} style={{
                padding: '10px 14px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.07)'
              }}>
                <p style={{ fontSize: 10, color: '#f5a623', fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 3 }}>
                  {label}
                </p>
                <p style={{ fontSize: 12, color: '#fff', fontWeight: 600 }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Tear-off line */}
          <div style={{ position: 'relative', margin: '28px -32px' }}>
            <div style={{
              position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
              width: 18, height: 18, borderRadius: '50%',
              background: '#0c1017'
            }} />
            <div style={{
              borderTop: '2px dashed rgba(245,166,35,0.2)',
              marginLeft: 9, marginRight: 9
            }} />
            <div style={{
              position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)',
              width: 18, height: 18, borderRadius: '50%',
              background: '#0c1017'
            }} />
          </div>

          {/* QR section */}
          <div style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
            {/* QR code */}
            <div style={{
              padding: 14,
              background: '#fff',
              borderRadius: 14,
              boxShadow: '0 0 50px rgba(245,166,35,0.18)',
              flexShrink: 0
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrDataUrl} alt="QR Kod" width={150} height={150} />
            </div>

            {/* Right side */}
            <div style={{ flex: 1 }}>
              <div style={{
                display: 'inline-block',
                padding: '4px 12px',
                borderRadius: 99,
                fontSize: 11,
                fontWeight: 700,
                background: isValid ? 'rgba(52,211,153,0.1)' : 'rgba(239,68,68,0.1)',
                color: isValid ? '#34d399' : '#ef4444',
                border: `1px solid ${isValid ? 'rgba(52,211,153,0.25)' : 'rgba(239,68,68,0.25)'}`,
                marginBottom: 12
              }}>
                {isValid ? '✓ Davetiye Geçerli' : 'Geçersiz'}
              </div>

              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 5 }}>
                Davetiye Kodu
              </p>
              <p style={{ fontSize: 18, fontWeight: 800, letterSpacing: 3.5, color: '#fff', fontFamily: 'monospace', marginBottom: 14 }}>
                {invitation.ticketCode}
              </p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.7 }}>
                Girişte bu QR kodu veya davetiye kodunu gösterin.
              </p>

              <div style={{
                marginTop: 14,
                height: 2,
                borderRadius: 99,
                background: 'linear-gradient(90deg, #f5a623, rgba(245,166,35,0.05))'
              }} />
            </div>
          </div>

          {/* Footer */}
          <div style={{
            marginTop: 28,
            paddingTop: 16,
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>
              biletfeed.com · Güvenli etkinlik platformu
            </span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>
              Bu davetiye kişiye özeldir.
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
