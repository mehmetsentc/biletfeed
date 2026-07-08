/**
 * Minimal Resend email sender — uses the REST API directly, no npm package needed.
 * Configuration: lib/config/email.ts
 * Setup guide: docs/EMAIL.md
 */

import {
  emailConfig,
  formatEmailFrom,
  getSenderAddress,
  isEmailConfigured,
  type EmailSenderKind
} from '@/lib/config/email';

const RESEND_API_URL = 'https://api.resend.com/emails';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  /** Düz metin — belirtilmezse HTML'den otomatik üretilir (teslimat için önerilir) */
  text?: string;
  replyTo?: string;
  /** Tam "Ad <adres>" veya yalnızca adres — belirtilmezse sender kullanılır */
  from?: string;
  /** Gönderen türü — from belirtilmediğinde kullanılır */
  sender?: EmailSenderKind;
  /**
   * transactional = bireysel bildirim (davetiye/bilet) — bulk başlık yok
   * bulk = pazarlama / bülten — opsiyonel X-Entity-Ref-ID
   */
  category?: 'transactional' | 'bulk';
  /** Resend etiketleri — raporlama / filtreleme */
  tags?: Array<{ name: string; value: string }>;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
  }>;
}

export interface SendEmailResult {
  ok: boolean;
  messageId?: string;
  error?: string;
}

interface ResendSuccessBody {
  id?: string;
}

interface ResendErrorBody {
  message?: string;
  name?: string;
}

function maskRecipient(to: string | string[]): string {
  const list = Array.isArray(to) ? to : [to];
  return list
    .map((addr) => {
      const at = addr.indexOf('@');
      if (at <= 1) return '***';
      return `${addr.slice(0, 2)}***${addr.slice(at)}`;
    })
    .join(',');
}

function sanitizeErrorBody(body: string): string {
  return body
    .replace(/re_[a-zA-Z0-9_-]+/g, '[redacted-key]')
    .slice(0, 300);
}

/** Basit HTML → düz metin — multipart/alternative için */
function htmlToPlainText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<a[^>]+href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href, label) => {
      const text = label.replace(/<[^>]+>/g, '').trim();
      return text ? `${text} (${href})` : href;
    })
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export async function sendEmail(opts: SendEmailOptions): Promise<SendEmailResult> {
  if (!isEmailConfigured()) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(
        '[email] RESEND_API_KEY not set — skipping email to',
        maskRecipient(opts.to)
      );
    }
    return { ok: false, error: 'email_not_configured' };
  }

  const apiKey = process.env.RESEND_API_KEY!.trim();
  const sender = opts.sender ?? 'default';
  const from =
    opts.from ??
    (sender === 'default'
      ? formatEmailFrom('default')
      : formatEmailFrom(sender));
  const replyTo = opts.replyTo ?? emailConfig.replyTo;
  const text = opts.text ?? htmlToPlainText(opts.html);
  const category = opts.category ?? (opts.sender === 'invitation' ? 'transactional' : 'transactional');

  // Gmail "Güncellemeler"e iten bulk sinyallerini (Precedence / List-*) gönderme.
  // Precedence: auto / bulk özellikle Updates klasörüne kaydırır.
  const headers: Record<string, string> | undefined =
    category === 'bulk'
      ? { 'X-Entity-Ref-ID': `bf-${Date.now()}` }
      : undefined;

  try {
    const res = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
        text,
        reply_to: replyTo,
        ...(headers ? { headers } : {}),
        ...(opts.tags?.length ? { tags: opts.tags } : {}),
        ...(opts.attachments?.length
          ? {
              attachments: opts.attachments.map((a) => ({
                filename: a.filename,
                content:
                  typeof a.content === 'string'
                    ? a.content
                    : a.content.toString('base64')
              }))
            }
          : {})
      })
    });

    if (!res.ok) {
      const bodyText = await res.text();
      let parsed: ResendErrorBody | null = null;
      try {
        parsed = JSON.parse(bodyText) as ResendErrorBody;
      } catch {
        /* plain text */
      }
      const errorSummary =
        parsed?.message ?? sanitizeErrorBody(bodyText) ?? `HTTP ${res.status}`;

      console.error('[email] Resend send failed', {
        status: res.status,
        error: errorSummary,
        from: getSenderAddress(sender),
        to: maskRecipient(opts.to),
        subject: opts.subject.slice(0, 80)
      });

      return { ok: false, error: errorSummary };
    }

    let messageId: string | undefined;
    try {
      const data = (await res.json()) as ResendSuccessBody;
      messageId = data.id;
    } catch {
      /* yanıt gövdesi boş olabilir */
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('[email] sent', {
        messageId,
        from: getSenderAddress(sender),
        to: maskRecipient(opts.to)
      });
    }

    return { ok: true, messageId };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[email] sendEmail network error', {
      error: message,
      from: getSenderAddress(sender),
      to: maskRecipient(opts.to)
    });
    return { ok: false, error: message };
  }
}
