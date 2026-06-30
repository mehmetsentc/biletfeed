import { AcceptTransferClient } from '@/components/tickets/accept-transfer-client';
import { createPageMetadata } from '@/lib/seo/metadata';

export const metadata = createPageMetadata({
  title: 'Bilet Devri',
  path: '/bilet/devir'
});

type Props = { params: Promise<{ transferId: string }> };

export default async function AcceptTransferPage({ params }: Props) {
  const { transferId } = await params;
  return (
    <div className="container mx-auto px-4 py-16">
      <AcceptTransferClient transferId={transferId} />
    </div>
  );
}
