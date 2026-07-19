'use client';

import { use } from 'react';
import Link from 'next/link';
import { useEventJoy } from '@/components/providers/eventjoy-provider';
import { TaskListClient } from '@/components/eventjoy/task-list-client';
import { BudgetClient } from '@/components/eventjoy/budget-client';
import { MessageChatClient } from '@/components/eventjoy/message-chat-client';
import { AddGuestsClient } from '@/components/eventjoy/add-guests-client';

function EventLoader({
  id,
  children
}: {
  id: string;
  children: (event: NonNullable<ReturnType<ReturnType<typeof useEventJoy>['getEvent']>>) => React.ReactNode;
}) {
  const { ready, getEvent } = useEventJoy();
  const event = getEvent(id);

  if (!ready) return <div className="h-64 animate-pulse rounded-xl bg-muted" />;
  if (!event) {
    return (
      <div className="px-4 py-12 text-center">
        <p className="font-semibold">Etkinlik bulunamadı</p>
        <Link href="/eventjoy/etkinlikler" className="mt-2 text-sm text-[var(--bf-accent-ink)]">
          Geri dön
        </Link>
      </div>
    );
  }

  return <>{children(event)}</>;
}

export function EventJoyTasksPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <EventLoader id={id}>
      {(event) => <TaskListClient eventId={id} tasks={event.tasks} />}
    </EventLoader>
  );
}

export function EventJoyBudgetPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <EventLoader id={id}>
      {(event) => (
        <BudgetClient
          eventId={id}
          budget={event.budget}
          spent={event.spent}
          items={event.budgetItems}
        />
      )}
    </EventLoader>
  );
}

export function EventJoyChatPage({
  params
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  return (
    <EventLoader id={eventId}>
      {(event) => <MessageChatClient event={event} />}
    </EventLoader>
  );
}

export function EventJoyAddGuestsPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <EventLoader id={id}>
      {() => <AddGuestsClient eventId={id} />}
    </EventLoader>
  );
}
