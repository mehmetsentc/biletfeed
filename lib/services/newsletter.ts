import { ensureDbConnection, prisma } from '@/lib/db/prisma';
import { buildNewsletterWelcomeEmail } from '@/lib/email/newsletter-welcome-template';
import { sendEmail } from '@/lib/email/resend';

export interface SubscribeNewsletterResult {
  created: boolean;
  emailSent: boolean;
}

export async function subscribeToNewsletter(
  email: string,
  source = 'homepage'
): Promise<SubscribeNewsletterResult> {
  await ensureDbConnection();

  const normalized = email.trim().toLowerCase();
  const existing = await prisma.newsletterSubscriber.findUnique({
    where: { email: normalized },
  });

  let created = false;

  if (existing) {
    if (existing.deletedAt) {
      await prisma.newsletterSubscriber.update({
        where: { id: existing.id },
        data: {
          deletedAt: null,
          confirmedAt: new Date(),
          source,
        },
      });
      created = true;
    } else {
      return { created: false, emailSent: false };
    }
  } else {
    await prisma.newsletterSubscriber.create({
      data: {
        email: normalized,
        source,
      },
    });
    created = true;
  }

  const emailResult = await sendEmail({
    to: normalized,
    subject: 'BiletFeed bültenine hoş geldiniz',
    html: buildNewsletterWelcomeEmail(),
    sender: 'noreply',
  });

  return {
    created,
    emailSent: emailResult.ok,
  };
}
