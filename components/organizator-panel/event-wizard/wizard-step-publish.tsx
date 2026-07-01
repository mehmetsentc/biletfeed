'use client';

import Image from 'next/image';
import { Sparkles } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { WizardFormSection } from '@/components/organizator-panel/wizard-form';
import { ORGANIZER_AGREEMENT_VERSION } from '@/lib/organizator/event-wizard-constants';
import { getSiteUrl } from '@/lib/config/domain';
import type { AttendeeQuestionRow, PerformerRow } from '@/components/organizator-panel/event-wizard/types';

const AGREEMENT_URL = getSiteUrl('/organizator-sozlesmesi');

function openOrganizerAgreement(e: { preventDefault(): void; stopPropagation(): void }) {
  e.preventDefault();
  e.stopPropagation();
  window.open(AGREEMENT_URL, '_blank', 'noopener,noreferrer');
}

interface WizardStepPublishProps {
  isEdit: boolean;
  showTerms: boolean;
  previewImage: string | null;
  title: string;
  categoryName: string;
  cityName: string;
  venueName: string;
  description: string;
  tags: string[];
  performers: PerformerRow[];
  attendeeQuestions: AttendeeQuestionRow[];
  ticketSummary: { name: string; priceLabel: string; capacity: string }[];
  termsAccepted: boolean;
  onTermsAcceptedChange: (value: boolean) => void;
}

export function WizardStepPublish({
  isEdit,
  showTerms,
  previewImage,
  title,
  categoryName,
  cityName,
  venueName,
  description,
  tags,
  performers,
  attendeeQuestions,
  ticketSummary,
  termsAccepted,
  onTermsAcceptedChange
}: WizardStepPublishProps) {
  return (
    <div className="space-y-6">
      <WizardFormSection
        title="Önizleme"
        description="Yayınlamadan önce son kontrolü yapın."
        icon={Sparkles}
      >
        <div className="space-y-5 py-2">
          {previewImage && (
            <div className="relative aspect-video overflow-hidden rounded-xl border border-border">
              <Image src={previewImage} alt="Kapak" fill className="object-cover" />
            </div>
          )}
          <div className="rounded-xl border border-border bg-muted/20 p-5">
            <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              {categoryName}
            </span>
            {tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground ring-1 ring-border"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <h3 className="mt-3 text-xl font-bold text-foreground">
              {title || 'Etkinlik Başlığı'}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {cityName}
              {venueName ? ` · ${venueName}` : ''}
            </p>
            {performers.length > 0 && (
              <p className="mt-2 text-sm text-muted-foreground">
                Katılımcılar: {performers.map((p) => p.name).join(', ')}
              </p>
            )}
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {description || 'Açıklama eklenmedi.'}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {ticketSummary.map((c) => (
                <span
                  key={c.name}
                  className="rounded-lg bg-background px-3 py-1.5 text-sm font-medium ring-1 ring-border"
                >
                  {c.name}
                  {c.priceLabel ? ` · ${c.priceLabel}` : ''}
                  {c.capacity ? ` · ${c.capacity}` : ''}
                </span>
              ))}
            </div>
            {attendeeQuestions.length > 0 && (
              <p className="mt-4 text-xs text-muted-foreground">
                {attendeeQuestions.length} katılımcı sorusu tanımlandı
              </p>
            )}
          </div>
        </div>
      </WizardFormSection>

      {showTerms && (
        <WizardFormSection
          title="Yayınlama Seçenekleri"
          description="Etkinliğinizi taslak olarak kaydedebilir veya onaya gönderebilirsiniz."
          icon={Sparkles}
        >
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
            <div className="flex items-start gap-3">
              <input
                id="organizer-terms-accepted"
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => onTermsAcceptedChange(e.target.checked)}
                className="mt-1 size-4 shrink-0 rounded border-border"
              />
              <div className="min-w-0 text-sm text-muted-foreground">
                <Label htmlFor="organizer-terms-accepted" className="cursor-pointer text-foreground">
                  Organizatör Kullanıcı Sözleşmesi&apos;ni okudum ve kabul ediyorum
                </Label>
                <p className="mt-1.5">
                  Etkinliği onaya göndermek,{' '}
                  <button
                    type="button"
                    onClick={openOrganizerAgreement}
                    className="font-medium text-primary underline-offset-2 hover:underline"
                  >
                    Organizatör Kullanıcı Sözleşmesi
                  </button>
                  &apos;ni (sürüm {ORGANIZER_AGREEMENT_VERSION}) kabul ettiğiniz anlamına gelir.
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Taslak olarak kaydederseniz etkinlik henüz yayınlanmaz. Onaya gönderdiğinizde
            BiletFeed ekibi inceleyecektir.
          </p>
        </WizardFormSection>
      )}
    </div>
  );
}
