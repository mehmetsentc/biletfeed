import Link from 'next/link';
import { eventJoyCrossLinks } from '@/lib/eventjoy/navigation';

/** Sayfa altı iç bağlantılar — SEO ve gezinme */
export function EventJoyCrossLinks({ className }: { className?: string }) {
  return (
    <nav
      aria-label="EventJoy sayfaları"
      className={className}
    >
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        EventJoy
      </p>
      <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
        {eventJoyCrossLinks.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-muted-foreground transition-colors hover:text-[var(--bf-accent-ink)]"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
