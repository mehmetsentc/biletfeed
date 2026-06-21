import { MapPin } from 'lucide-react';

interface EventLocationSectionProps {
  venue: string;
  address: string;
  city: string;
  isOnline?: boolean;
}

export function EventLocationSection({
  venue,
  address,
  city,
  isOnline
}: EventLocationSectionProps) {
  if (isOnline) {
    return (
      <section>
        <h2 className="text-xl font-bold">Konum</h2>
        <p className="mt-4 flex items-start gap-2 text-muted-foreground">
          <MapPin className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} />
          Online etkinlik — katılım linki biletinizde yer alacaktır.
        </p>
      </section>
    );
  }

  const query = encodeURIComponent(`${venue}, ${address}, ${city}`);
  const embedUrl = `https://maps.google.com/maps?q=${query}&output=embed`;

  return (
    <section>
      <h2 className="text-xl font-bold">Konum</h2>
      <p className="mt-4 flex items-start gap-2 text-muted-foreground">
        <MapPin className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} />
        <span>
          {venue}
          <br />
          {address}, {city}
        </span>
      </p>
      <div className="relative mt-4 aspect-[16/9] w-full overflow-hidden rounded-lg border bg-muted">
        <iframe
          title={`${venue} harita`}
          src={embedUrl}
          className="absolute inset-0 size-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </section>
  );
}
