import { EventJoyBudgetPage } from '@/components/eventjoy/event-sub-pages';

export default function BudgetPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  return <EventJoyBudgetPage params={params} />;
}
