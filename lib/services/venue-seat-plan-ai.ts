import { Prisma } from '@prisma/client';
import { ensureDbConnection, prisma } from '@/lib/db/prisma';
import { getProviderConfig, isProviderReady } from '@/lib/ai/config';
import type { SeatPlan, SeatPlanZone } from '@/lib/services/organizer-panel';
import { seatPlanSchema } from '@/lib/api/seat-plan-schema';

export type SeatPlanDraftMeta = {
  source: 'ai' | 'manual';
  provider?: string;
  model?: string;
  mapImageUrl?: string;
  generatedAt: string;
  note?: string;
};

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

async function fetchImageAsBase64(url: string): Promise<{ mime: string; data: string }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Harita görseli indirilemedi');
  const buf = Buffer.from(await res.arrayBuffer());
  const mime = res.headers.get('content-type')?.split(';')[0]?.trim() || 'image/jpeg';
  if (!mime.startsWith('image/')) {
    throw new Error('AI için görsel (JPG/PNG/WebP) gerekli — PDF desteklenmez');
  }
  return { mime, data: buf.toString('base64') };
}

async function geminiVisionJson(params: {
  apiKey: string;
  model: string;
  system: string;
  prompt: string;
  mime: string;
  imageBase64: string;
}): Promise<string> {
  const base = (
    process.env.GEMINI_BASE_URL ||
    'https://generativelanguage.googleapis.com/v1beta'
  ).replace(/\/$/, '');
  const url = `${base}/models/${params.model}:generateContent?key=${params.apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: params.system }] },
      contents: [
        {
          role: 'user',
          parts: [
            { text: params.prompt },
            {
              inlineData: {
                mimeType: params.mime,
                data: params.imageBase64
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json'
      }
    })
  });
  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    error?: { message?: string };
  };
  if (!res.ok) {
    throw new Error(data.error?.message || `Gemini HTTP ${res.status}`);
  }
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('AI yanıtı boş');
  return text;
}

function normalizeAiSeatPlan(raw: unknown, mapImageUrl: string): SeatPlan {
  const obj = asRecord(raw);
  const zonesRaw = Array.isArray(obj.zones) ? obj.zones : [];
  const zones: SeatPlanZone[] = zonesRaw.map((z, zi) => {
    const zone = asRecord(z);
    const code =
      String(zone.code ?? zone.label ?? `Z${zi + 1}`)
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9_-]/g, '')
        .slice(0, 24) || `Z${zi + 1}`;
    const unitsRaw = Array.isArray(zone.units) ? zone.units : [];
    const units = unitsRaw.map((u, ui) => {
      const unit = asRecord(u);
      const id = String(unit.id ?? unit.label ?? `${code}-${ui + 1}`)
        .trim()
        .toUpperCase()
        .replace(/\s+/g, '');
      return {
        id,
        label: String(unit.label ?? id),
        ticketTypeHint: unit.ticketTypeHint
          ? String(unit.ticketTypeHint)
          : code
      };
    });
    return {
      code,
      label: String(zone.label ?? code),
      seatsPerUnit: Math.max(1, Number(zone.seatsPerUnit) || 1),
      color: zone.color ? String(zone.color) : undefined,
      units
    };
  });

  const layout =
    obj.layout === 'tables' || obj.layout === 'general' || obj.layout === 'sections'
      ? obj.layout
      : 'sections';

  const plan: SeatPlan = {
    layout,
    zones,
    sections: zones.map((z) => ({ name: z.label, capacity: z.units.length })),
    mapImageUrl,
    notes: typeof obj.notes === 'string' ? obj.notes : 'AI taslağı — onay bekliyor'
  };

  const parsed = seatPlanSchema.safeParse(plan);
  if (!parsed.success) {
    throw new Error('AI oturma planı şeması geçersiz — görseli kontrol edin');
  }
  return parsed.data as SeatPlan;
}

/**
 * Harita görselinden AI ile seatPlan taslağı üretir; onaylanana kadar seatPlanDraft'ta tutulur.
 */
export async function generateVenueSeatPlanDraft(params: {
  venueId: string;
  organizerId?: string;
  mapImageUrl?: string;
}): Promise<{ draft: SeatPlan; meta: SeatPlanDraftMeta }> {
  await ensureDbConnection();

  if (!isProviderReady('gemini')) {
    throw new Error('AI kapalı veya GEMINI_API_KEY yok (AI_ENABLED + GEMINI_API_KEY)');
  }

  const venue = await prisma.venue.findFirst({
    where: {
      id: params.venueId,
      deletedAt: null,
      ...(params.organizerId
        ? {
            OR: [
              { organizerId: params.organizerId },
              { events: { some: { organizerId: params.organizerId, deletedAt: null } } }
            ]
          }
        : {})
    }
  });
  if (!venue) throw new Error('Mekan bulunamadı');

  const existingPlan = asRecord(venue.seatPlan);
  const mapImageUrl =
    params.mapImageUrl?.trim() ||
    (typeof existingPlan.mapImageUrl === 'string' ? existingPlan.mapImageUrl : '') ||
    venue.image ||
    '';
  if (!mapImageUrl) {
    throw new Error('Önce oturma planı görseli yükleyin');
  }

  const { mime, data } = await fetchImageAsBase64(mapImageUrl);

  const system = `Sen BiletFeed oturma planı ajanısın. Görseldeki koltuk/masa düzenini seçilebilir unit id'lere çevir.
Yanıt yalnızca JSON. Şema:
{
  "layout": "sections" | "tables",
  "zones": [{
    "code": "K1",
    "label": "Kategori 1",
    "seatsPerUnit": 1,
    "color": "#hex",
    "units": [{ "id": "A12", "label": "A12", "ticketTypeHint": "K1" }]
  }],
  "notes": "kısa not"
}
Kurallar: id'ler benzersiz ve kısa (örn. A12, VIP-3). Okunamayan bölgeleri uydurma; emin değilsen daha az unit üret.`;

  const prompt = `Mekan: ${venue.name}. Bu oturma haritasındaki satılabilir birimleri zone + unit olarak çıkar.`;

  const gemini = getProviderConfig('gemini');
  if (!gemini.apiKey) throw new Error('GEMINI_API_KEY gerekli');

  const text = await geminiVisionJson({
    apiKey: gemini.apiKey,
    model: gemini.model.includes('flash') ? gemini.model : 'gemini-2.0-flash',
    system,
    prompt,
    mime,
    imageBase64: data
  });

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(text);
  } catch {
    throw new Error('AI JSON parse edilemedi');
  }

  const draft = normalizeAiSeatPlan(parsedJson, mapImageUrl);
  const meta: SeatPlanDraftMeta = {
    source: 'ai',
    provider: 'gemini',
    model: gemini.model,
    mapImageUrl,
    generatedAt: new Date().toISOString(),
    note: 'Organizatör/admin onayı bekleniyor'
  };

  await prisma.venue.update({
    where: { id: venue.id },
    data: {
      seatPlanDraft: draft as unknown as Prisma.InputJsonValue,
      seatPlanDraftMeta: meta as unknown as Prisma.InputJsonValue
    }
  });

  return { draft, meta };
}

export async function confirmVenueSeatPlanDraft(params: {
  venueId: string;
  organizerId?: string;
  draft?: SeatPlan;
}): Promise<SeatPlan> {
  await ensureDbConnection();

  const venue = await prisma.venue.findFirst({
    where: {
      id: params.venueId,
      deletedAt: null,
      ...(params.organizerId
        ? {
            OR: [
              { organizerId: params.organizerId },
              { events: { some: { organizerId: params.organizerId, deletedAt: null } } }
            ]
          }
        : {})
    }
  });
  if (!venue) throw new Error('Mekan bulunamadı');

  const raw = params.draft ?? venue.seatPlanDraft;
  if (!raw) throw new Error('Onaylanacak taslak yok — önce AI üretimi çalıştırın');

  const parsed = seatPlanSchema.safeParse(raw);
  if (!parsed.success) throw new Error('Taslak geçersiz');

  const plan = parsed.data as SeatPlan;
  await prisma.venue.update({
    where: { id: venue.id },
    data: {
      seatPlan: plan as unknown as Prisma.InputJsonValue,
      seatPlanDraft: Prisma.DbNull,
      seatPlanDraftMeta: {
        source: 'ai',
        generatedAt: new Date().toISOString(),
        note: 'Onaylandı ve canlıya alındı'
      } as unknown as Prisma.InputJsonValue
    }
  });

  return plan;
}
