import Link from 'next/link';
import { notFound } from 'next/navigation';
import { EventEditorForm } from '@/components/admin/event-editor-form';
import { Button } from '@/components/ui/button';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { eventInclude, toMockEvent } from '@/lib/mappers/event';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminEventEditPage({ params }: PageProps) {
  const { id } = await params;
  await ensureDbConnection();

  const event = await prisma.event.findFirst({
    where: { id, deletedAt: null },
    include: eventInclude
  });

  if (!event) notFound();

  const mock = toMockEvent(event);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Etkinlik Düzenle</h1>
          <p className="text-sm text-muted-foreground">
            {mock.externalPlatform} · {mock.externalUrl}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/etkinlikler">← Listeye dön</Link>
        </Button>
      </div>

      <EventEditorForm event={mock} />
    </div>
  );
}
