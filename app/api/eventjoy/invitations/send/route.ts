import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import {
  formatEventJoyDateTime,
  getEventJoyInvitation,
  getEventJoyInviteUrl
} from '@/lib/eventjoy/invitations';
import {
  buildEventJoyInvitationEmail
} from '@/lib/email/eventjoy-invitation-template';
import { sendEmail } from '@/lib/email/resend';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { verifySessionCookie } from '@/lib/auth/session';
import { rateLimitOrNullAsync } from '@/lib/security/rate-limit';
import { eventJoyApiDisabledResponse } from '@/lib/eventjoy/guard';

const sendSchema = z.object({
  token: z.string().min(8).max(64),
  to: z.string().email(),
  guestName: z.string().min(1).max(120).optional()
});

export async function POST(request: NextRequest) {
  const disabled = eventJoyApiDisabledResponse();
  if (disabled) return disabled;

  const session = await verifySessionCookie();
  if (!session) {
    return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 });
  }

  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
  }

  const limited = await rateLimitOrNullAsync(
    request,
    'eventjoy-invite-email',
    10,
    60_000
  );
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 });
  }

  const parsed = sendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Geçersiz e-posta verisi' }, { status: 400 });
  }

  const invitation = await getEventJoyInvitation(parsed.data.token);
  if (!invitation) {
    return NextResponse.json({ error: 'Davetiye bulunamadı' }, { status: 404 });
  }

  const inviteUrl = getEventJoyInviteUrl(invitation.token);
  const { dateLabel, timeLabel } = formatEventJoyDateTime(
    invitation.date,
    invitation.time
  );

  const html = buildEventJoyInvitationEmail({
    guestName: parsed.data.guestName,
    eventTitle: invitation.title,
    eventDate: dateLabel,
    eventTime: timeLabel,
    location: invitation.location,
    coverImage: invitation.coverImage,
    personalMessage: invitation.personalMessage,
    inviteUrl,
    hostName: invitation.hostName
  });

  const result = await sendEmail({
    to: parsed.data.to,
    subject: `Davetiye: ${invitation.title}`,
    html,
    sender: 'invitation'
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error || 'E-posta gönderilemedi' },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, messageId: result.messageId });
}
