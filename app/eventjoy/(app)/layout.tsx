import { EventJoyShell } from '@/components/eventjoy/mobile-shell';

export default function EventJoyLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return <EventJoyShell>{children}</EventJoyShell>;
}
