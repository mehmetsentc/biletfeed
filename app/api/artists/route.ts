import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { requireOrganizerSession } from '@/lib/auth/organizer-api';
import { searchArtists, createArtist } from '@/lib/services/artist';

/** GET /api/artists?q=... — Search artists by name */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') ?? '';
  if (!q || q.length < 1) {
    return NextResponse.json({ artists: [] });
  }
  const artists = await searchArtists(q, 10);
  return NextResponse.json({ artists });
}

const createSchema = z.object({
  name: z.string().min(1).max(200),
  bio: z.string().max(2000).optional(),
  image: z.string().url().optional(),
  type: z.enum(['person', 'group']).optional()
});

/** POST /api/artists — Create a new artist (organizer required) */
export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
  }
  const ctx = await requireOrganizerSession();
  if (!ctx) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const json = await request.json();
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Geçersiz veri', details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const artist = await createArtist(parsed.data);
    return NextResponse.json({ artist }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/artists]', err);
    return NextResponse.json({ error: 'Oluşturma başarısız' }, { status: 500 });
  }
}
