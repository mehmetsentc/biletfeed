import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import {
  getEventJoyInviteUrl,
  publishEventJoyInvitation
} from '@/lib/eventjoy/invitations';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { rateLimitOrNull } from '@/lib/security/rate-limit';
import { eventJoyApiDisabledResponse } from '@/lib/eventjoy/guard';

const publishSchema = z.object({
  eventId: z.string().min(1),
  title: z.string().min(1).max(200),
  type: z.string().min(1).max(80),
  date: z.string().min(1),
  time: z.string().min(1).max(20),
  location: z.string().max(300).optional().default(''),
  description: z.string().max(2000).optional().default(''),
  coverColor: z.string().min(1).max(120),
  coverImage: z.string().max(500).optional(),
  hostName: z.string().min(1).max(120),
  personalMessage: z.string().max(1000).optional(),
  existingToken: z.string().min(8).max(64).optional()
});

export async function POST(request: NextRequest) {
  const disabled = eventJoyApiDisabledResponse();
  if (disabled) return disabled;
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
  }

  const limited = rateLimitOrNull(request, 'eventjoy-invite-publish', 30, 60_000);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 });
  }

  const parsed = publishSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Geçersiz davetiye verisi' }, { status: 400 });
  }

  try {
    const invitation = await publishEventJoyInvitation(parsed.data);
    return NextResponse.json({
      invitation: {
        token: invitation.token,
        inviteUrl: getEventJoyInviteUrl(invitation.token)
      }
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Davetiye kaydedilemedi';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
