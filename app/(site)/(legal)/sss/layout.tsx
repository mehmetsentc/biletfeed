import { mockFaqs } from '@/lib/data/mock-user';
import { JsonLd } from '@/lib/seo/json-ld';
import { createPageMetadata } from '@/lib/seo/metadata';
import { buildFaqPageSchema } from '@/lib/seo/schemas';

export const metadata = createPageMetadata({
  title: 'Sık Sorulan Sorular',
  description:
    'Bilet alma, ödeme, iptal ve etkinlik günü hakkında sık sorulan soruların cevapları.',
  path: '/sss',
  keywords: ['sss', 'sık sorulan sorular', 'bilet iptal', 'ödeme', 'yardım']
});

const faqEntries = mockFaqs.flatMap((section) =>
  section.items.map((item) => ({
    question: item.q,
    answer: item.a
  }))
);

export default function FaqLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JsonLd data={buildFaqPageSchema(faqEntries)} />
      {children}
    </>
  );
}
