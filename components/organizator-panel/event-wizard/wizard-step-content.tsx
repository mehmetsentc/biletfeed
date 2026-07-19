'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, FileText, ImageIcon, Loader2, Plus, Search, Trash2, Users } from 'lucide-react';
import Image from 'next/image';
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

// ─── Artist search result shape (from GET /api/artists?q=...) ────────────────

interface ArtistResult {
  id: string;
  name: string;
  image: string | null;
  type: string;
  followerCount: number;
}

// ─── Artist picker input ──────────────────────────────────────────────────────

function ArtistPickerInput({
  onAdd
}: {
  onAdd: (row: PerformerRow) => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ArtistResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [draftType, setDraftType] = useState<'person' | 'group'>('person');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim() || query.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/artists?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.artists ?? []);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function selectArtist(artist: ArtistResult) {
    onAdd({
      id: `perf-${artist.id}`,
      artistId: artist.id,
      name: artist.name,
      type: artist.type === 'group' ? 'group' : 'person',
      image: artist.image ?? undefined,
      role: ''
    });
    setQuery('');
    setResults([]);
    setOpen(false);
  }

  async function createAndAdd() {
    if (!query.trim()) return;
    try {
      const res = await fetch('/api/artists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: query.trim(), type: draftType })
      });
      if (!res.ok) throw new Error('Oluşturulamadı');
      const { artist } = await res.json();
      onAdd({
        id: `perf-${artist.id}`,
        artistId: artist.id,
        name: artist.name,
        type: artist.type === 'group' ? 'group' : 'person',
        image: artist.image ?? undefined,
        role: ''
      });
      setQuery('');
      setResults([]);
      setOpen(false);
    } catch {
      // Fallback: add without artistId
      onAdd({
        id: `perf-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: query.trim(),
        type: draftType,
        role: ''
      });
      setQuery('');
      setOpen(false);
    }
  }

  return (
    <div ref={boxRef} className="relative">
      <div className="grid gap-3 sm:grid-cols-[160px_1fr_auto]">
        <WizardSelect
          value={draftType}
          onChange={(e) => setDraftType(e.target.value as 'person' | 'group')}
        >
          <option value="person">Kişi (Şahıs)</option>
          <option value="group">Grup / Organizasyon</option>
        </WizardSelect>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="İsim ara veya yeni ekle..."
            className="h-11 rounded-lg pl-9"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (results.length > 0) selectArtist(results[0]);
                else createAndAdd();
              }
              if (e.key === 'Escape') setOpen(false);
            }}
            onFocus={() => results.length > 0 && setOpen(true)}
          />
          {loading && (
            <Loader2 className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-4 animate-spin text-muted-foreground" />
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          className="h-11"
          onClick={() => {
            if (results.length > 0) selectArtist(results[0]);
            else createAndAdd();
          }}
        >
          <Plus className="size-4" />
        </Button>
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 right-0 z-50 mt-1 overflow-hidden rounded-xl border border-border bg-popover shadow-lg sm:left-[172px]">
          {results.map((artist) => (
            <button
              key={artist.id}
              type="button"
              onClick={() => selectArtist(artist)}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-muted transition-colors"
            >
              {artist.image ? (
                <Image
                  src={artist.image}
                  alt={artist.name}
                  width={32}
                  height={32}
                  className="size-8 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="size-8 rounded-full bg-muted shrink-0 flex items-center justify-center text-xs font-bold text-muted-foreground">
                  {artist.name[0]?.toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{artist.name}</p>
                <p className="text-xs text-muted-foreground">
                  {artist.type === 'group' ? 'Grup' : 'Kişi'} · {artist.followerCount} takipçi
                </p>
              </div>
            </button>
          ))}
          {results.length === 0 && query.trim().length >= 2 && !loading && (
            <button
              type="button"
              onClick={createAndAdd}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-muted transition-colors"
            >
              <div className="size-8 rounded-full bg-primary/10 shrink-0 flex items-center justify-center">
                <Plus className="size-4 text-[var(--bf-accent-ink)]" />
              </div>
              <div>
                <p className="text-sm font-medium">"{query.trim()}" — Yeni sanatçı ekle</p>
                <p className="text-xs text-muted-foreground">Sisteme yeni kayıt oluşturulacak</p>
              </div>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Individual performer row ─────────────────────────────────────────────────

function PerformerItem({
  performer,
  index,
  total,
  onMove,
  onRemove,
  onUpdate
}: {
  performer: PerformerRow;
  index: number;
  total: number;
  onMove: (id: string, dir: 'up' | 'down') => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, patch: Partial<PerformerRow>) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  // Tracks a just-created artistId before state propagates
  const pendingArtistIdRef = useRef<string | null>(null);

  async function handleImageUpload(file: File) {
    const artistId = performer.artistId ?? pendingArtistIdRef.current;
    if (!artistId) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`/api/artists/${artistId}/image`, {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error('Yükleme başarısız');
      const { url } = await res.json();
      onUpdate(performer.id, { image: url, artistId });
      pendingArtistIdRef.current = null;
    } catch {
      alert('Görsel yüklenemedi.');
    } finally {
      setUploading(false);
    }
  }

  async function handleAvatarClick() {
    if (uploading) return;
    // Already linked to an artist — open file picker directly
    if (performer.artistId) {
      fileRef.current?.click();
      return;
    }
    // No artist record yet — create one first, then open file picker
    setUploading(true);
    try {
      const res = await fetch('/api/artists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: performer.name, type: performer.type })
      });
      if (!res.ok) throw new Error();
      const { artist } = await res.json();
      onUpdate(performer.id, { artistId: artist.id });
      pendingArtistIdRef.current = artist.id;
      fileRef.current?.click();
    } catch {
      alert('Sanatçı kaydı oluşturulamadı.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <li className="flex items-start gap-3 rounded-lg bg-background px-3 py-3 ring-1 ring-border">
      {/* Avatar / upload */}
      <div className="relative shrink-0">
        <button
          type="button"
          title="Görsel yükle"
          disabled={uploading}
          onClick={handleAvatarClick}
          className="size-10 rounded-full overflow-hidden bg-muted flex items-center justify-center cursor-pointer hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {performer.image ? (
            <Image
              src={performer.image}
              alt={performer.name}
              width={40}
              height={40}
              className="size-10 object-cover"
            />
          ) : uploading ? (
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          ) : (
            <ImageIcon className="size-4 text-muted-foreground" />
          )}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleImageUpload(f);
            e.target.value = '';
          }}
        />
      </div>

      {/* Name + role */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <p className="text-sm font-medium leading-tight">{performer.name}</p>
        <p className="text-xs text-muted-foreground">
          {performer.type === 'group' ? 'Grup' : 'Kişi'}
          {performer.artistId && (
            <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[var(--bf-accent-ink)] text-[10px] font-medium">
              Kayıtlı
            </span>
          )}
        </p>
        <Input
          value={performer.role ?? ''}
          onChange={(e) => onUpdate(performer.id, { role: e.target.value })}
          placeholder="Rol (örn: Başrolde, DJ, Konuşmacı...)"
          className="h-8 text-xs rounded-md"
        />
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center gap-1 shrink-0">
        <button
          type="button"
          disabled={index === 0}
          onClick={() => onMove(performer.id, 'up')}
          className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"
          aria-label="Yukarı taşı"
        >
          <ArrowUp className="size-4" />
        </button>
        <button
          type="button"
          disabled={index === total - 1}
          onClick={() => onMove(performer.id, 'down')}
          className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"
          aria-label="Aşağı taşı"
        >
          <ArrowDown className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => onRemove(performer.id)}
          className="rounded p-1 text-destructive hover:bg-destructive/10"
          aria-label="Sil"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </li>
  );
}

// ─── Main step component ──────────────────────────────────────────────────────

export function WizardStepContent({
  description,
  onDescriptionChange,
  performers,
  onPerformersChange
}: WizardStepContentProps) {
  const addPerformer = useCallback(
    (row: PerformerRow) => {
      // Prevent duplicates by artistId
      if (row.artistId && performers.some((p) => p.artistId === row.artistId)) return;
      onPerformersChange([...performers, row]);
    },
    [performers, onPerformersChange]
  );

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

  function updatePerformer(id: string, patch: Partial<PerformerRow>) {
    onPerformersChange(performers.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  return (
    <div className="space-y-6">
      <WizardFormSection
        title="Katılımcılar / Sanatçılar"
        description="Sanatçı veya katılımcı arayın; bulunamazsa otomatik profil oluşturulur. Görsel için satırdaki avatara tıklayın."
        icon={Users}
      >
        <ArtistPickerInput onAdd={addPerformer} />

        {performers.length > 0 && (
          <ul className="mt-4 space-y-2">
            {performers.map((performer, index) => (
              <PerformerItem
                key={performer.id}
                performer={performer}
                index={index}
                total={performers.length}
                onMove={movePerformer}
                onRemove={removePerformer}
                onUpdate={updatePerformer}
              />
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
