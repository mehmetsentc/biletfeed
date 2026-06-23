'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ClipboardList } from 'lucide-react';
import { EventJoyHeader } from '@/components/eventjoy/mobile-shell';
import type { EventJoyTask } from '@/lib/data/mock-eventjoy';

export function TaskListClient({
  eventId,
  tasks: initial
}: {
  eventId: string;
  tasks: EventJoyTask[];
}) {
  const [tasks, setTasks] = useState(initial);

  return (
    <div className="min-h-[calc(100vh-7rem)] bg-white">
      <EventJoyHeader title="Görev Listesi" backHref={`/eventjoy/etkinlik/${eventId}`} />

      <div className="px-4 py-4">
        <Link
          href={`/eventjoy/etkinlik/${eventId}/gorevler/yeni`}
          className="text-sm font-semibold text-primary"
        >
          + Görev Ekle
        </Link>
      </div>

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-8 py-20 text-center">
          <ClipboardList className="size-16 text-primary/60" />
          <p className="mt-4 font-bold">Görev bulunamadı</p>
          <p className="mt-1 text-sm text-muted-foreground">Lütfen görevlerinizi ekleyin</p>
        </div>
      ) : (
        <ul className="divide-y px-4">
          {tasks.map((task) => (
            <li key={task.id} className="flex items-center gap-3 py-4">
              <input
                type="checkbox"
                checked={task.done}
                onChange={() =>
                  setTasks((prev) =>
                    prev.map((t) => (t.id === task.id ? { ...t, done: !t.done } : t))
                  )
                }
                className="size-5 accent-primary"
              />
              <div>
                <p className={task.done ? 'text-muted-foreground line-through' : 'font-medium'}>
                  {task.title}
                </p>
                {task.dueDate && (
                  <p className="text-xs text-muted-foreground">
                    {new Date(task.dueDate).toLocaleDateString('tr-TR')}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
