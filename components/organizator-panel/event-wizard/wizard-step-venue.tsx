'use client';

import { Globe, MapPin, Monitor } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  WizardFormRow,
  WizardFormSection,
  WizardOptionCards,
  WizardTextarea
} from '@/components/organizator-panel/wizard-form';
import { EVENT_WIZARD_TAGS } from '@/lib/organizator/event-wizard-constants';
import { cn } from '@/lib/utils';

type LocationMode = '' | 'venue' | 'online' | 'hybrid';

interface WizardStepVenueProps {
  location: LocationMode;
  onLocationChange: (value: LocationMode) => void;
  venueName: string;
  onVenueNameChange: (value: string) => void;
  venueAddress: string;
  onVenueAddressChange: (value: string) => void;
  venueDetail: string;
  onVenueDetailChange: (value: string) => void;
  onlineUrl: string;
  onOnlineUrlChange: (value: string) => void;
  tags: string[];
  onTagsChange: (tags: string[]) => void;
}

export function WizardStepVenue({
  location,
  onLocationChange,
  venueName,
  onVenueNameChange,
  venueAddress,
  onVenueAddressChange,
  venueDetail,
  onVenueDetailChange,
  onlineUrl,
  onOnlineUrlChange,
  tags,
  onTagsChange
}: WizardStepVenueProps) {
  function toggleTag(tag: string) {
    if (tags.includes(tag)) {
      onTagsChange(tags.filter((t) => t !== tag));
    } else {
      onTagsChange([...tags, tag]);
    }
  }

  return (
    <div className="space-y-6">
      <WizardFormSection
        title="Mekan & Konum"
        description="Etkinliğin gerçekleşeceği mekanı ve adres bilgilerini girin."
        icon={MapPin}
      >
        <WizardFormRow label="Mekan tipi" required>
          <WizardOptionCards
            value={location}
            onChange={(v) => onLocationChange(v as LocationMode)}
            options={[
              {
                id: 'venue',
                title: 'Fiziksel Mekan',
                description: 'Salon, açık hava, stadyum',
                icon: MapPin
              },
              {
                id: 'online',
                title: 'Online',
                description: 'Canlı yayın veya webinar',
                icon: Monitor
              },
              {
                id: 'hybrid',
                title: 'Hibrit',
                description: 'Hem fiziksel hem online',
                icon: Globe
              }
            ]}
          />
        </WizardFormRow>

        {location !== 'online' && (
          <>
            <WizardFormRow label="Mekan adı" required={location === 'venue'}>
              <Input
                value={venueName}
                onChange={(e) => onVenueNameChange(e.target.value)}
                placeholder="Örn: Volkswagen Arena"
                className="h-11 rounded-lg"
              />
            </WizardFormRow>
            <WizardFormRow label="Adres">
              <Input
                value={venueAddress}
                onChange={(e) => onVenueAddressChange(e.target.value)}
                placeholder="Sokak, mahalle, ilçe"
                className="h-11 rounded-lg"
              />
            </WizardFormRow>
            <WizardFormRow label="Mekan detayı" alignTop>
              <WizardTextarea
                value={venueDetail}
                onChange={(e) => onVenueDetailChange(e.target.value)}
                placeholder="Adres tarifi, otopark durumu vb."
                rows={3}
              />
            </WizardFormRow>
          </>
        )}

        {(location === 'online' || location === 'hybrid') && (
          <WizardFormRow label="Online erişim bağlantısı">
            <Input
              value={onlineUrl}
              onChange={(e) => onOnlineUrlChange(e.target.value)}
              placeholder="https://..."
              className="h-11 rounded-lg"
            />
          </WizardFormRow>
        )}
      </WizardFormSection>

      <WizardFormSection
        title="Etiket Seçiniz"
        description="Etkinliğinizi keşfedilebilir kılmak için bir veya daha fazla etiket seçin."
        icon={MapPin}
      >
        <div className="flex flex-wrap gap-2 py-2">
          {EVENT_WIZARD_TAGS.map((tag) => {
            const selected = tags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                  selected
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background text-muted-foreground hover:border-primary/40'
                )}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </WizardFormSection>
    </div>
  );
}
