import Link from 'next/link';
import { createPageMetadata } from '@/lib/seo/metadata';
import {
  organizerAgreementFooter,
  organizerAgreementIntro,
  organizerAgreementSections
} from '@/lib/legal/organizer-user-agreement';

export const metadata = createPageMetadata({
  title: 'Organizatör Kullanıcı Sözleşmesi — BiletFeed',
  description:
    'BiletFeed organizatör paneli kullanıcı sözleşmesi ve etkinlik yayınlama şartları.',
  path: '/organizator-sozlesmesi'
});

export default function OrganizerAgreementPage() {
  return (
    <article className="min-w-0 flex-1 max-w-none prose prose-neutral dark:prose-invert">
      <h1>Organizatör Kullanıcı Sözleşmesi</h1>

      <p className="lead">{organizerAgreementIntro}</p>

      {organizerAgreementSections.map((section) => (
        <section key={section.id} id={section.id}>
          <h2>{section.title}</h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 40)}>{paragraph}</p>
          ))}
          {section.list && (
            <ul>
              {section.list.map((item) => (
                <li key={item.slice(0, 50)}>{item}</li>
              ))}
            </ul>
          )}
          {section.subsections?.map((sub) => (
            <div key={sub.title}>
              <h3>{sub.title}</h3>
              <ul>
                {sub.items.map((item) => (
                  <li key={item.slice(0, 50)}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      ))}

      <hr />
      <p className="text-sm text-muted-foreground">{organizerAgreementFooter}</p>
      <p>
        <Link href="/kullanici-sozlesmesi">Bilet alıcı kullanıcı sözleşmesi</Link>
        {' · '}
        <Link href="/gizlilik">Gizlilik politikası</Link>
      </p>
    </article>
  );
}
