'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bookmark,
  FileText,
  Loader2,
  Megaphone,
  Plus,
  Search,
  Sparkles,
  Trash2
} from 'lucide-react';
import { RichTextEditor } from '@/components/organizator-panel/rich-text-editor';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  WizardFormRow,
  WizardFormSection
} from '@/components/organizator-panel/wizard-form';
import {
  AGE_LIMIT_OPTIONS,
  CATEGORY_TO_EVENT_TYPE,
  CHILD_POLICY_OPTIONS,
  DRESS_CODE_OPTIONS,
  REFUND_POLICY_OPTIONS
} from '@/lib/event-rules/constants';
import { getLocalizedField } from '@/lib/event-rules/i18n';
import type {
  EventAnnouncementInput,
  OrganizerRuleTemplateData,
  RuleCatalogCategory,
  RuleCatalogRule,
  SelectedRuleEntry
} from '@/lib/event-rules/types';
import { cn } from '@/lib/utils';
import type { RuleParameterType } from '@prisma/client';
import { SelectedRulesPreview } from '@/components/organizator-panel/event-wizard/selected-rules-preview';

export interface EventRuleSetState {
  selectedRules: SelectedRuleEntry[];
  customRules: string[];
  announcements: EventAnnouncementInput[];
  appliedTemplateId?: string | null;
}

interface WizardStepRulesProps {
  categorySlug: string;
  eventType?: string;
  tags: string[];
  title: string;
  description: string;
  isOnline: boolean;
  isFree: boolean;
  ruleSet: EventRuleSetState;
  onRuleSetChange: (value: EventRuleSetState) => void;
}

function ParameterInput({
  parameterType,
  value,
  onChange
}: {
  parameterType: RuleParameterType;
  value?: string;
  onChange: (v: string) => void;
}) {
  if (parameterType === 'age_limit') {
    return (
      <select
        className="mt-1 w-full rounded-md border bg-background px-2 py-1.5 text-sm"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Seçin</option>
        {AGE_LIMIT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.labelTr}
          </option>
        ))}
      </select>
    );
  }

  if (parameterType === 'dress_code') {
    return (
      <select
        className="mt-1 w-full rounded-md border bg-background px-2 py-1.5 text-sm"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Seçin</option>
        {DRESS_CODE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.labelTr}
          </option>
        ))}
      </select>
    );
  }

  if (parameterType === 'refund_policy') {
    return (
      <select
        className="mt-1 w-full rounded-md border bg-background px-2 py-1.5 text-sm"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Seçin</option>
        {REFUND_POLICY_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.labelTr}
          </option>
        ))}
      </select>
    );
  }

  if (parameterType === 'child_policy') {
    return (
      <select
        className="mt-1 w-full rounded-md border bg-background px-2 py-1.5 text-sm"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Seçin</option>
        {CHILD_POLICY_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.labelTr}
          </option>
        ))}
      </select>
    );
  }

  return (
    <Input
      className="mt-1 h-9"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Değer girin"
    />
  );
}

export function WizardStepRules({
  categorySlug,
  tags,
  title,
  description,
  isOnline,
  isFree,
  ruleSet,
  onRuleSetChange
}: WizardStepRulesProps) {
  const [categories, setCategories] = useState<RuleCatalogCategory[]>([]);
  const [rules, setRules] = useState<RuleCatalogRule[]>([]);
  const [templates, setTemplates] = useState<OrganizerRuleTemplateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [categorySearch, setCategorySearch] = useState<Record<string, string>>({});
  const [templateName, setTemplateName] = useState('');
  const [autoLoaded, setAutoLoaded] = useState(false);
  const [customDraft, setCustomDraft] = useState('');

  const eventType = CATEGORY_TO_EVENT_TYPE[categorySlug] ?? 'other';
  const selectedIds = useMemo(
    () => new Set(ruleSet.selectedRules.map((r) => r.ruleId)),
    [ruleSet.selectedRules]
  );

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [catalogRes, templatesRes] = await Promise.all([
        fetch('/api/organizer/event-rules/catalog', { credentials: 'include' }),
        fetch('/api/organizer/rule-templates', { credentials: 'include' })
      ]);

      if (!catalogRes.ok) {
        const data = (await catalogRes.json().catch(() => ({}))) as { error?: string };
        setCategories([]);
        setRules([]);
        setLoadError(
          data.error ??
            'Kural kataloğu yüklenemedi. Oturumunuzu kontrol edip sayfayı yenileyin.'
        );
      } else {
        const data = (await catalogRes.json()) as {
          categories: RuleCatalogCategory[];
          rules: RuleCatalogRule[];
        };
        setCategories(data.categories ?? []);
        setRules(data.rules ?? []);
        if ((data.rules ?? []).length === 0) {
          setLoadError(
            'Kural kataloğu henüz tanımlanmamış. Lütfen yönetici ile iletişime geçin.'
          );
        }
      }

      if (templatesRes.ok) {
        const data = (await templatesRes.json()) as {
          templates: OrganizerRuleTemplateData[];
        };
        setTemplates(data.templates);
      }
    } catch {
      setCategories([]);
      setRules([]);
      setLoadError('Kural kataloğu yüklenemedi. Lütfen sayfayı yenileyin.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    if (autoLoaded || loading || ruleSet.selectedRules.length > 0) return;

    void (async () => {
      const res = await fetch('/api/organizer/event-rules/suggest', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categorySlug,
          eventType,
          tags,
          title,
          description,
          isOnline,
          isFree
        })
      });
      if (!res.ok) {
        setAutoLoaded(true);
        return;
      }
      const data = (await res.json()) as { ruleIds: string[] };
      onRuleSetChange({
        ...ruleSet,
        selectedRules: data.ruleIds.map((ruleId) => ({ ruleId }))
      });
      setAutoLoaded(true);
    })();
  }, [
    autoLoaded,
    loading,
    ruleSet,
    categorySlug,
    eventType,
    tags,
    title,
    description,
    isOnline,
    isFree,
    onRuleSetChange
  ]);

  function toggleRule(rule: RuleCatalogRule) {
    const exists = selectedIds.has(rule.id);
    let next: SelectedRuleEntry[];
    if (exists) {
      next = ruleSet.selectedRules.filter((r) => r.ruleId !== rule.id);
    } else {
      next = [...ruleSet.selectedRules, { ruleId: rule.id }];
    }
    onRuleSetChange({ ...ruleSet, selectedRules: next });
  }

  function updateParameter(ruleId: string, parameterValue: string) {
    onRuleSetChange({
      ...ruleSet,
      selectedRules: ruleSet.selectedRules.map((r) =>
        r.ruleId === ruleId ? { ...r, parameterValue } : r
      )
    });
  }

  async function handleAiSuggest() {
    setSuggesting(true);
    try {
      const res = await fetch('/api/organizer/event-rules/suggest', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categorySlug,
          eventType,
          tags,
          title,
          description,
          isOnline,
          isFree
        })
      });
      if (!res.ok) return;
      const data = (await res.json()) as { ruleIds: string[] };
      const merged = new Map(ruleSet.selectedRules.map((r) => [r.ruleId, r]));
      for (const ruleId of data.ruleIds) {
        if (!merged.has(ruleId)) merged.set(ruleId, { ruleId });
      }
      onRuleSetChange({
        ...ruleSet,
        selectedRules: Array.from(merged.values())
      });
    } finally {
      setSuggesting(false);
    }
  }

  async function saveTemplate() {
    if (!templateName.trim()) return;
    const res = await fetch('/api/organizer/rule-templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: templateName.trim(),
        selectedRules: ruleSet.selectedRules,
        customRules: ruleSet.customRules
      })
    });
    if (res.ok) {
      setTemplateName('');
      void loadCatalog();
      const data = (await res.json()) as { template: OrganizerRuleTemplateData };
      setTemplates((prev) => [...prev, data.template]);
    }
  }

  function applyTemplate(templateId: string) {
    const tpl = templates.find((t) => t.id === templateId);
    if (!tpl) return;
    onRuleSetChange({
      selectedRules: tpl.selectedRules,
      customRules: tpl.customRules,
      announcements: ruleSet.announcements,
      appliedTemplateId: tpl.id
    });
  }

  function filterRulesForCategory(categoryId: string): RuleCatalogRule[] {
    const q = (categorySearch[categoryId] ?? globalSearch).trim().toLowerCase();
    return rules.filter((r) => {
      if (r.categoryId !== categoryId) return false;
      if (!q) return true;
      return (
        r.titleTr.toLowerCase().includes(q) ||
        r.titleEn.toLowerCase().includes(q) ||
        r.descriptionTr.toLowerCase().includes(q)
      );
    });
  }

  const wizardCategories = categories.filter(
    (c) => c.slug !== 'biletfeed-tavsiyeleri' && c.slug !== 'etkinlik-gorgu'
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="mr-2 size-5 animate-spin" />
        Kurallar yükleniyor…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <WizardFormSection
        title="Etkinlik Kuralları"
        description="Katılımcıların bilet alırken ve etkinlik sayfasında göreceği kuralları seçin. Her kuralın açıklaması aşağıda listelenir."
        icon={FileText}
      >
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <p className="text-sm font-medium text-foreground">
            Seçilen kurallar ({ruleSet.selectedRules.length + ruleSet.customRules.length})
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Bilet satın alma ve etkinlik detay sayfasında bu metinler gösterilir.
          </p>
          <div className="mt-3 max-h-64 overflow-y-auto">
            <SelectedRulesPreview
              selectedRules={ruleSet.selectedRules}
              customRules={ruleSet.customRules}
              rules={rules}
              categories={categories}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void handleAiSuggest()}
            disabled={suggesting}
            className="gap-1.5"
          >
            {suggesting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            AI ile Kuralları Öner
          </Button>
          {templates.length > 0 && (
            <select
              className="h-9 rounded-md border bg-background px-3 text-sm"
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) applyTemplate(e.target.value);
                e.target.value = '';
              }}
            >
              <option value="">Şablon uygula…</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="relative mt-4">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder="Tüm kurallarda ara…"
            className="h-10 pl-9"
          />
        </div>

        {loadError ? (
          <div className="mt-4 space-y-3">
            <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
              {loadError}
            </p>
            <Button type="button" variant="outline" size="sm" onClick={() => void loadCatalog()}>
              Yeniden dene
            </Button>
          </div>
        ) : (
        <Accordion type="multiple" className="mt-4 w-full">
          {wizardCategories.map((cat) => {
            const catRules = filterRulesForCategory(cat.id);
            const selectedCount = catRules.filter((r) => selectedIds.has(r.id)).length;
            return (
              <AccordionItem key={cat.id} value={cat.id}>
                <AccordionTrigger>
                  <span className="flex items-center gap-2">
                    {getLocalizedField(cat, 'title', 'tr')}
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {selectedCount}/{catRules.length}
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <Input
                    value={categorySearch[cat.id] ?? ''}
                    onChange={(e) =>
                      setCategorySearch((prev) => ({
                        ...prev,
                        [cat.id]: e.target.value
                      }))
                    }
                    placeholder="Bu kategoride ara…"
                    className="mb-3 h-9"
                  />
                  <ul className="space-y-3">
                    {catRules.map((rule) => {
                      const selected = ruleSet.selectedRules.find(
                        (r) => r.ruleId === rule.id
                      );
                      return (
                        <li
                          key={rule.id}
                          className={cn(
                            'rounded-lg border p-3 transition-colors',
                            selectedIds.has(rule.id)
                              ? 'border-primary/40 bg-primary/5'
                              : 'border-border bg-muted/10'
                          )}
                        >
                          <label className="flex cursor-pointer items-start gap-3">
                            <Checkbox
                              checked={selectedIds.has(rule.id)}
                              onCheckedChange={() => toggleRule(rule)}
                              className="mt-0.5"
                            />
                            <span className="flex-1 min-w-0">
                              <span className="text-sm font-medium text-foreground">
                                {getLocalizedField(rule, 'title', 'tr')}
                              </span>
                              {getLocalizedField(rule, 'description', 'tr') ? (
                                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                                  {getLocalizedField(rule, 'description', 'tr')}
                                </p>
                              ) : (
                                <p className="mt-1.5 text-sm italic text-muted-foreground/70">
                                  Açıklama bulunmuyor.
                                </p>
                              )}
                            </span>
                          </label>
                          {selectedIds.has(rule.id) && rule.requiresParameter && (
                            <div className="mt-2 ml-7">
                              <ParameterInput
                                parameterType={rule.parameterType}
                                value={selected?.parameterValue}
                                onChange={(v) => updateParameter(rule.id, v)}
                              />
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
        )}
      </WizardFormSection>

      <WizardFormSection
        title="Özel Kurallar"
        description="Katalogda olmayan kuralları satır satır ekleyin."
        icon={Bookmark}
      >
        <div className="flex gap-2">
          <Input
            value={customDraft}
            onChange={(e) => setCustomDraft(e.target.value)}
            placeholder="Özel kural yazın…"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && customDraft.trim()) {
                e.preventDefault();
                onRuleSetChange({
                  ...ruleSet,
                  customRules: [...ruleSet.customRules, customDraft.trim()]
                });
                setCustomDraft('');
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (!customDraft.trim()) return;
              onRuleSetChange({
                ...ruleSet,
                customRules: [...ruleSet.customRules, customDraft.trim()]
              });
              setCustomDraft('');
            }}
          >
            <Plus className="size-4" />
          </Button>
        </div>
        {ruleSet.customRules.length > 0 && (
          <ul className="mt-3 space-y-2">
            {ruleSet.customRules.map((rule, idx) => (
              <li
                key={`${rule}-${idx}`}
                className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
              >
                {rule}
                <button
                  type="button"
                  onClick={() =>
                    onRuleSetChange({
                      ...ruleSet,
                      customRules: ruleSet.customRules.filter((_, i) => i !== idx)
                    })
                  }
                  className="text-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </WizardFormSection>

      <WizardFormSection
        title="Organizatör Bilgilendirmeleri"
        description="Katılımcılara gösterilecek duyurular (zengin metin)."
        icon={Megaphone}
      >
        {ruleSet.announcements.map((ann, idx) => (
          <div key={ann.id ?? idx} className="mb-4 space-y-2 rounded-lg border p-4">
            <WizardFormRow label="Başlık">
              <Input
                value={ann.titleTr}
                placeholder="Duyuru başlığı (zorunlu)"
                className={ann.titleTr.trim() === '' ? 'border-destructive/60 focus-visible:ring-destructive/30' : ''}
                onChange={(e) => {
                  const next = [...ruleSet.announcements];
                  next[idx] = { ...ann, titleTr: e.target.value };
                  onRuleSetChange({ ...ruleSet, announcements: next });
                }}
              />
              {ann.titleTr.trim() === '' && (
                <p className="mt-1 text-xs text-destructive">Başlık zorunludur — boş bırakılan duyurular kaydedilmez.</p>
              )}
            </WizardFormRow>
            <RichTextEditor
              value={ann.contentTr}
              onChange={(html) => {
                const next = [...ruleSet.announcements];
                next[idx] = { ...ann, contentTr: html };
                onRuleSetChange({ ...ruleSet, announcements: next });
              }}
              placeholder="Duyuru içeriği…"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive"
              onClick={() =>
                onRuleSetChange({
                  ...ruleSet,
                  announcements: ruleSet.announcements.filter((_, i) => i !== idx)
                })
              }
            >
              <Trash2 className="mr-1 size-4" />
              Duyuruyu sil
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            onRuleSetChange({
              ...ruleSet,
              announcements: [
                ...ruleSet.announcements,
                { titleTr: '', contentTr: '<p></p>' }
              ]
            })
          }
        >
          <Plus className="mr-1 size-4" />
          Duyuru Ekle
        </Button>
      </WizardFormSection>

      <WizardFormSection
        title="Şablon Kaydet"
        description="Seçili kuralları tekrar kullanmak için şablon olarak kaydedin."
        icon={Bookmark}
      >
        <div className="flex gap-2">
          <Input
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="Şablon adı"
          />
          <Button type="button" variant="outline" onClick={() => void saveTemplate()}>
            Kendi Şablonumu Kaydet
          </Button>
        </div>
      </WizardFormSection>
    </div>
  );
}
