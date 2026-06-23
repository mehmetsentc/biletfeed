import { EventJoyTasksPage } from '@/components/eventjoy/event-sub-pages';

export default function TasksPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  return <EventJoyTasksPage params={params} />;
}
