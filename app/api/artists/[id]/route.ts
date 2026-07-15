import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { requireOrganizerSession } from '@/lib/auth/organizer-api';
import { getArtistById, updateArtist } from '@/lib/services/artist';

/** GET /api/artists/[id] */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const artist = await getArtistById(id);
  if (!artist) return NextResponse.json({ error: 'Sanatçı bulunamadı' }, { status: 404 });
  return NextResponse.json({ artist });
}

const patchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  bio: z.string().max(2000).optional(),
  image: z.string().url().optional().nullable(),
  type: z.enum(['person', 'group']).optional(),
  socialLinks: z
    .object({
      instagram: z.string().optional(),
      twitter: z.string().optional(),
      spotify: z.string().optional(),
      youtube: z.string().optional(),
      soundcloud: z.string().optional(),
      website: z.string().optional()
    })
    .optional()
});

/** PATCH /api/artists/[id] — Update artist (organizer required) */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
  }
  const ctx = await requireOrganizerSession();
  if (!ctx) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

  const { id } = await params;
  const json = await request.json();
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Geçersiz veri' }, { status: 400 });
  }

  try {
    const artist = await updateArtist(id, {
      ...parsed.data,
      image: parsed.data.image ?? undefined
    });
    return NextResponse.json({ artist });
  } catch (err) {
    console.error('[PATCH /api/artists/[id]]', err);
    return NextResponse.json({ error: 'Güncelleme başarısız' }, { status: 500 });
  }
}
