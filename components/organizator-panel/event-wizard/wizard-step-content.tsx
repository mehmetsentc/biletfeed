'use client';

import { useState } from 'react';
import { ArrowDown, ArrowUp, FileText, Plus, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  WizardFormRow,
  WizardFormSection,
  WizardSelect,
  WizardTextarea
} from '@/components/organizator-panel/wizard-form';
import type { PerformerRow } from '@/components/organizator-panel/event-wizard/types';

interface WizardStepContentProps {
  description: string;
  onDescriptionChange: (value: string) => void;
  performers: PerformerRow[];
  onPerformersChange: (performers: PerformerRow[]) => void;
}

function newPerformer(): PerformerRow {
  return {
    id: String(Date.now()) + Math.random().toString(36).slice(2, 7),
    name: '',
    type: 'person'
  };
}

export function WizardStepContent({
  description,
  onDescriptionChange,
  performers,
  onPerformersChange
}: WizardStepContentProps) {
  const [draftName, setDraftName] = useState('');
  const [draftType, setDraftType] = useState<'person' | 'group'>('person');

  function addPerformer() {
    if (!draftName.trim()) return;
    onPerformersChange([
      ...performers,
      { id: newPerformer().id, name: draftName.trim(), type: draftType }
    ]);
    setDraftName('');
  }

  function removePerformer(id: string) {
    onPerformersChange(performers.filter((p) => p.id !== id));
  }

  function movePerformer(id: string, direction: 'up' | 'down') {
    const index = performers.findIndex((p) => p.id === id);
    if (index < 0) return;
    const next = direction === 'up' ? index - 1 : index + 1;
    if (next < 0 || next >= performers.length) return;
    const copy = [...performers];
    [copy[index], copy[next]] = [copy[next], copy[index]];
    onPerformersChange(copy);
  }

  return (
    <div className="space-y-6">
      <WizardFormSection
        title="Katılımcılar / Sanatçılar"
        description="Festival, konser veya spor etkinliklerinde katılımcıları ekleyin. Sıralamayı yukarı/aşağı oklarla değiştirebilirsiniz."
        icon={Users}
      >
        <div className="grid gap-3 sm:grid-cols-[160px_1fr_auto]">
          <WizardSelect
            value={draftType}
            onChange={(e) => setDraftType(e.target.value as 'person' | 'group')}
          >
            <option value="person">Kişi (Şahıs)</option>
            <option value="group">Grup / Organizasyon</option>
          </WizardSelect>
          <Input
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            placeholder="İsim girin"
            className="h-11 rounded-lg"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addPerformer();
              }
            }}
          />
          <Button type="button" variant="outline" onClick={addPerformer} className="h-11">
            <Plus className="size-4" />
          </Button>
        </div>

        {performers.length > 0 && (
          <ul className="mt-4 space-y-2 rounded-xl border border-border bg-muted/20 p-3">
            {performers.map((performer, index) => (
              <li
                key={performer.id}
                className="flex items-center justify-between gap-2 rounded-lg bg-background px-3 py-2 ring-1 ring-border"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{performer.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {performer.type === 'person' ? 'Kişi' : 'Grup'}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => movePerformer(performer.id, 'up')}
                    className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"
                    aria-label="Yukarı taşı"
                  >
                    <ArrowUp className="size-4" />
                  </button>
                  <button
                    type="button"
                    disabled={index === performers.length - 1}
                    onClick={() => movePerformer(performer.id, 'down')}
                    className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"
                    aria-label="Aşağı taşı"
                  >
                    <ArrowDown className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removePerformer(performer.id)}
                    className="rounded p-1 text-destructive hover:bg-destructive/10"
                    aria-label="Sil"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </WizardFormSection>

      <WizardFormSection
        title="Etkinlik Açıklaması"
        description="Katılımcılara etkinliğinizi tanıtın. Metni doğrudan yapıştırabilir veya burada yazabilirsiniz."
        icon={FileText}
      >
        <WizardFormRow label="Açıklama" required alignTop>
          <WizardTextarea
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Etkinliğinizin özel yanlarını ve önemli detayları açıklayın."
            rows={8}
          />
        </WizardFormRow>
      </WizardFormSection>
    </div>
  );
}
