import { NextRequest, NextResponse } from 'next/server';
import { runEditorialPipeline } from '@/lib/services/feed-editorial';

export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization');
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const batch = Number(request.nextUrl.searchParams.get('batch') ?? '3');
  const result = await runEditorialPipeline(batch);
  return NextResponse.json({ success: true, ...result });
}
