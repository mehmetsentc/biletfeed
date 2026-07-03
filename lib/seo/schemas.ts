import { siteConfig } from '@/lib/config/site';
import type { MockEvent } from '@/lib/data/mock-events';
import type { MockOrganizer } from '@/lib/data/mock-organizers';
import { getExternalPlatformLabel, isExternalListing } from '@/lib/events/ticket-url';
import { getDefaultOgImage } from '@/lib/seo/constants';

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface ItemListEntry {
  name: string;
  url: string;
  description?: string;
  image?: string;
  position?: number;
}

export interface FaqEntry {
  question: string;
  answer: string;
}

export function buildOrganizationSchema() {
  const sameAs = [
    siteConfig.links.twitter,
    siteConfig.links.instagram,
    siteConfig.links.facebook
  ].filter((url): url is string => Boolean(url));

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.name,
    url: siteConfig.url,
    logo: getDefaultOgImage(),
    description: siteConfig.description,
    ...(sameAs.length > 0 ? { sameAs } : {})
  };
}

export function buildWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    inLanguage: 'tr-TR',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteConfig.url}/ara?q={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }
  };
}

export function buildEventSchema(
  event: MockEvent,
  options?: { eventRules?: string[] }
) {
  const isOnline = event.isOnline || event.citySlug === 'online';
  const eventUrl = `${siteConfig.url}/etkinlik/${event.slug}`;
  const external = isExternalListing(event);
  const platformLabel = getExternalPlatformLabel(event.externalPlatform);
  const organizerSchema = external
    ? {
        '@type': 'Organization' as const,
        name: platformLabel ?? event.organizer,
        ...(event.externalUrl ? { url: event.externalUrl } : {})
      }
    : {
        '@type': 'Organization' as const,
        name: event.organizer,
        url: `${siteConfig.url}/organizator/${event.organizerSlug}`
      };

  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: event.shortDescription || event.description,
    startDate: event.startDate,
    endDate: event.endDate,
    image: event.coverImage,
    url: eventUrl,
    eventAttendanceMode: isOnline
      ? 'https://schema.org/OnlineEventAttendanceMode'
      : 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
    location: isOnline
      ? {
          '@type': 'VirtualLocation',
          url: eventUrl
        }
      : {
          '@type': 'Place',
          name: event.venue,
          address: {
            '@type': 'PostalAddress',
            streetAddress: event.address,
            addressLocality: event.city,
            addressCountry: 'TR'
          }
        },
    organizer: organizerSchema,
    offers: {
      '@type': 'Offer',
      url: eventUrl,
      price: event.isFree ? 0 : event.price,
      priceCurrency: event.currency || 'TRY',
      availability: 'https://schema.org/InStock',
      validFrom: new Date().toISOString()
    },
    ...(options?.eventRules?.length
      ? {
          additionalProperty: options.eventRules.map((rule) => ({
            '@type': 'PropertyValue',
            name: 'eventRule',
            value: rule
          }))
        }
      : {})
  };
}

export function buildBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };
}

export function buildItemListSchema({
  name,
  description,
  items
}: {
  name: string;
  description?: string;
  items: ItemListEntry[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    ...(description ? { description } : {}),
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: item.position ?? index + 1,
      item: {
        '@type': 'Event',
        name: item.name,
        ...(item.description ? { description: item.description } : {}),
        ...(item.image ? { image: item.image } : {}),
        url: item.url
      }
    }))
  };
}

export function buildFaqPageSchema(faqs: FaqEntry[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  };
}

export function buildOrganizerSchema(organizer: MockOrganizer) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: organizer.name,
    description: organizer.description,
    url: `${siteConfig.url}/organizator/${organizer.slug}`,
    image: organizer.coverImage,
    ...(organizer.logo ? { logo: organizer.logo } : {})
  };
}
