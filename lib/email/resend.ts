/**
 * Minimal Resend email sender — uses the REST API directly, no npm package needed.
 * Set RESEND_API_KEY in your environment variables to enable email sending.
 * Get your key at: https://resend.com
 */

const RESEND_API_URL = 'https://api.resend.com/emails';
const FROM_ADDRESS =
  process.env.RESEND_FROM_EMAIL ?? 'davetiye@biletfeed.com';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendEmail(opts: SendEmailOptions): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // Not configured — silently skip (log in dev)
    if (process.env.NODE_ENV !== 'production') {
      console.log('[email] RESEND_API_KEY not set — skipping email to', opts.to);
    }
    return false;
  }

  try {
    const res = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
        ...(opts.replyTo ? { reply_to: opts.replyTo } : {})
      })
    });

    if (!res.ok) {
      const body = await res.text();
      console.error('[email] Resend error', res.status, body);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[email] sendEmail failed', err);
    return false;
  }
}
