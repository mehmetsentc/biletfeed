import { after, NextRequest, NextResponse } from 'next/server';
import { runEventScrapeJob } from '@/lib/scraper/sync';
import { verifySessionCookie } from '@/lib/auth/session';
import { canAccessAdmin } from '@/lib/auth/permissions';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { ensureDbConnection, prisma } from '@/lib/db/prisma';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

async function authorize(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get('authorization');
  const adminSecret = process.env.ADMIN_SECRET || process.env.CRON_SECRET;
  if (adminSecret && authHeader === `Bearer ${adminSecret}`) {
    return true;
  }

  const session = await verifySessionCookie();
  return Boolean(session && canAccessAdmin(session.role as never));
}

function scrapeRunToStats(run: {
  totalFetched: number;
  totalCreated: number;
  totalUpdated: number;
  totalSkipped: number;
  errors: unknown;
}) {
  const errors = Array.isArray(run.errors)
    ? run.errors.filter((e): e is string => typeof e === 'string')
    : [];
  return {
    totalFetched: run.totalFetched,
    totalCreated: run.totalCreated,
    totalUpdated: run.totalUpdated,
    totalSkipped: run.totalSkipped,
    errors,
  };
}

/**
 * GET /api/admin/scrape-now?runId=...
 * Arka planda çalışan scrape durumunu döner.
 */
export async function GET(request: NextRequest) {
  if (!(await authorize(request))) {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
  }

  const runId = request.nextUrl.searchParams.get('runId');
  if (!runId) {
    return NextResponse.json({ error: 'runId gerekli' }, { status: 400 });
  }

  await ensureDbConnection();
  const run = await prisma.scrapeRun.findUnique({ where: { id: runId } });
  if (!run) {
    return NextResponse.json({ error: 'Scrape kaydı bulunamadı' }, { status: 404 });
  }

  const stats = scrapeRunToStats(run);
  const ok = run.status === 'success' || run.status === 'partial';

  return NextResponse.json({
    ok,
    runId: run.id,
    status: run.status,
    stats,
    finished: run.status !== 'running',
  });
}

/**
 * POST /api/admin/scrape-now
 * Admin session cookie veya ADMIN_SECRET/CRON_SECRET Bearer token ile korunur.
 * Varsayılan: arka planda başlatır (timeout önleme). ?wait=1 ile senkron (cron).
 */
export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek kaynağı' }, { status: 403 });
  }

  const authHeader = request.headers.get('authorization');
  const adminSecret = process.env.ADMIN_SECRET || process.env.CRON_SECRET;
  const isCron = adminSecret && authHeader === `Bearer ${adminSecret}`;

  if (!isCron) {
    const session = await verifySessionCookie();
    if (!session || !canAccessAdmin(session.role as never)) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }
  }

  const wait =
    isCron || request.nextUrl.searchParams.get('wait') === '1';

  try {
    if (wait) {
      const { runId, status, stats } = await runEventScrapeJob();
      return NextResponse.json({ ok: status !== 'failed', runId, status, stats, finished: true });
    }

    await ensureDbConnection();
    const run = await prisma.scrapeRun.create({ data: { status: 'running' } });

    after(async () => {
      try {
        await runEventScrapeJob(run.id);
      } catch (e) {
        await prisma.scrapeRun.update({
          where: { id: run.id },
          data: {
            status: 'failed',
            finishedAt: new Date(),
            errors: [e instanceof Error ? e.message : String(e)],
          },
        });
      }
    });

    return NextResponse.json({
      ok: true,
      runId: run.id,
      status: 'running',
      finished: false,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
