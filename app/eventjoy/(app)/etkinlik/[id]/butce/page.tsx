import { notFound } from 'next/navigation';
import { BudgetClient } from '@/components/eventjoy/budget-client';
import { getEventJoyEvent } from '@/lib/data/mock-eventjoy';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function BudgetPage({ params }: Props) {
  const { id } = await params;
  const event = getEventJoyEvent(id);
  if (!event) notFound();

  return (
    <BudgetClient
      eventId={id}
      items={event.budgetItems}
      budget={event.budget}
      spent={event.spent}
    />
  );
}
