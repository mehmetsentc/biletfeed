import { ensureDbConnection, prisma } from '@/lib/db/prisma';
import { buildNewsletterWelcomeEmail } from '@/lib/email/newsletter-welcome-template';
import { fetchUpcomingHighlightEvents } from '@/lib/services/newsletter-digest';
import { sendEmail } from '@/lib/email/resend';

export interface SubscribeNewsletterResult {
  created: boolean;
  emailSent: boolean;
  citySlug?: string | null;
  cityName?: string | null;
}

export async function subscribeToNewsletter(
  email: string,
  options?: {
    source?: string;
    citySlug?: string | null;
    cityName?: string | null;
  }
): Promise<SubscribeNewsletterResult> {
  await ensureDbConnection();

  const source = options?.source ?? 'homepage';
  const citySlug = options?.citySlug ?? null;
  const cityName = options?.cityName ?? null;
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
          citySlug,
          cityName,
        },
      });
      created = true;
    } else {
      if (citySlug || cityName) {
        await prisma.newsletterSubscriber.update({
          where: { id: existing.id },
          data: {
            citySlug: citySlug ?? existing.citySlug,
            cityName: cityName ?? existing.cityName,
          },
        });
      }
      return {
        created: false,
        emailSent: false,
        citySlug: citySlug ?? existing.citySlug,
        cityName: cityName ?? existing.cityName,
      };
    }
  } else {
    await prisma.newsletterSubscriber.create({
      data: {
        email: normalized,
        source,
        citySlug,
        cityName,
      },
    });
    created = true;
  }

  const { nationalEvents, cityEvents } = await fetchUpcomingHighlightEvents({
    citySlug,
    nationalLimit: 5,
    cityLimit: 4
  });

  const emailResult = await sendEmail({
    to: normalized,
    subject: cityName
      ? `BiletFeed bültenine hoş geldiniz — ${cityName} etkinlikleri`
      : 'BiletFeed bültenine hoş geldiniz',
    html: buildNewsletterWelcomeEmail({
      cityName,
      citySlug,
      nationalEvents,
      cityEvents
    }),
    sender: 'noreply',
  });

  return {
    created,
    emailSent: emailResult.ok,
    citySlug,
    cityName,
  };
}
