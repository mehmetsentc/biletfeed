'use client';

import { useState } from 'react';
import { EyeOff, HelpCircle, Lock, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { WizardFormRow, WizardFormSection } from '@/components/organizator-panel/wizard-form';
import type { AttendeeQuestionRow } from '@/components/organizator-panel/event-wizard/types';

interface WizardStepParticipationProps {
  attendeeQuestions: AttendeeQuestionRow[];
  onAttendeeQuestionsChange: (rows: AttendeeQuestionRow[]) => void;
  preventQuestionCopy: boolean;
  onPreventQuestionCopyChange: (value: boolean) => void;
  accessPassword: string;
  onAccessPasswordChange: (value: string) => void;
  hiddenFromSearch: boolean;
  onHiddenFromSearchChange: (value: boolean) => void;
}

function newQuestion(): AttendeeQuestionRow {
  return {
    id: String(Date.now()) + Math.random().toString(36).slice(2, 7),
    question: '',
    required: true
  };
}

export function WizardStepParticipation({
  attendeeQuestions,
  onAttendeeQuestionsChange,
  preventQuestionCopy,
  onPreventQuestionCopyChange,
  accessPassword,
  onAccessPasswordChange,
  hiddenFromSearch,
  onHiddenFromSearchChange
}: WizardStepParticipationProps) {
  const [draftQuestion, setDraftQuestion] = useState('');

  function addQuestion() {
    if (!draftQuestion.trim()) return;
    onAttendeeQuestionsChange([
      ...attendeeQuestions,
      { ...newQuestion(), question: draftQuestion.trim() }
    ]);
    setDraftQuestion('');
  }

  return (
    <div className="space-y-6">
      <WizardFormSection
        title="Katılımcılara Sorular"
        description="Bilet alırken katılımcılardan toplamak istediğiniz bilgileri ekleyin."
        icon={HelpCircle}
      >
        <div className="flex gap-2">
          <Input
            value={draftQuestion}
            onChange={(e) => setDraftQuestion(e.target.value)}
            placeholder="Örn: Diyet tercihiniz?"
            className="h-11 rounded-lg"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addQuestion();
              }
            }}
          />
          <Button type="button" variant="outline" onClick={addQuestion} className="h-11 shrink-0 gap-1">
            <Plus className="size-4" />
            Soru Ekle
          </Button>
        </div>

        {attendeeQuestions.length > 0 && (
          <ul className="mt-4 space-y-2">
            {attendeeQuestions.map((q) => (
              <li
                key={q.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2"
              >
                <span className="text-sm text-foreground">{q.question}</span>
                <button
                  type="button"
                  onClick={() =>
                    onAttendeeQuestionsChange(attendeeQuestions.filter((row) => row.id !== q.id))
                  }
                  className="text-destructive hover:opacity-80"
                  aria-label="Soruyu sil"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <label className="mt-4 flex items-start gap-3 rounded-xl border border-border bg-muted/10 p-4">
          <input
            type="checkbox"
            checked={preventQuestionCopy}
            onChange={(e) => onPreventQuestionCopyChange(e.target.checked)}
            className="mt-1 size-4 rounded border-border"
          />
          <span className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Soru kopyalamayı kapat</span>
            <br />
            Birden fazla bilet alırken tüm biletler için soruların ayrı ayrı cevaplanmasını zorunlu
            kılar. Yalnızca gerekli durumlarda seçin.
          </span>
        </label>
      </WizardFormSection>

      <WizardFormSection
        title="Gizlilik"
        description="Etkinliğinizin görünürlüğünü ve erişimini kontrol edin."
        icon={Lock}
      >
        <WizardFormRow label="Etkinlik şifresi">
          <Input
            value={accessPassword}
            onChange={(e) => onAccessPasswordChange(e.target.value)}
            placeholder="İsteğe bağlı"
            className="h-11 rounded-lg"
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            Etkinliği görüntülemek ve bilet almak için şifre gerektirir. Şifreyi ilgili kişilerle
            paylaşmanız gerekir.
          </p>
        </WizardFormRow>

        <label className="flex items-start gap-3 rounded-xl border border-border bg-muted/10 p-4">
          <input
            type="checkbox"
            checked={hiddenFromSearch}
            onChange={(e) => onHiddenFromSearchChange(e.target.checked)}
            className="mt-1 size-4 rounded border-border"
          />
          <span className="text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
              <EyeOff className="size-4" />
              Aramalardan kaldır
            </span>
            <br />
            Etkinliğiniz site içi aramalarda gizlenir. Yalnızca doğrudan bağlantı ile erişilebilir.
          </span>
        </label>
      </WizardFormSection>
    </div>
  );
}
