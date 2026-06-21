import { notFound } from 'next/navigation';
import { TaskListClient } from '@/components/eventjoy/task-list-client';
import { getEventJoyEvent } from '@/lib/data/mock-eventjoy';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TasksPage({ params }: Props) {
  const { id } = await params;
  const event = getEventJoyEvent(id);
  if (!event) notFound();

  return <TaskListClient eventId={id} tasks={event.tasks} />;
}
