import { MapPin } from 'lucide-react';

interface EventMapProps {
  venue: string;
  address: string;
  city: string;
}

export function EventMap({ venue, address, city }: EventMapProps) {
  const query = encodeURIComponent(`${venue}, ${address}, ${city}`);
  const embedUrl = `https://maps.google.com/maps?q=${query}&output=embed`;

  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <MapPin className="size-4 text-[var(--bf-accent-ink)]" strokeWidth={1.75} />
        <span className="text-sm font-medium">Konum</span>
      </div>
      <div className="relative aspect-[16/9] w-full bg-muted">
        <iframe
          title={`${venue} harita`}
          src={embedUrl}
          className="absolute inset-0 size-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      <p className="px-4 py-3 text-sm text-muted-foreground">
        {venue} · {address}, {city}
      </p>
    </div>
  );
}
