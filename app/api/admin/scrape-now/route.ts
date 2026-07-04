import { after, NextRequest, NextResponse } from 'next/server';
import { runEventScrapeJob } from '@/lib/scraper/sync';
import {
  guardAdminAutomationOrMutation,
  guardAdminRead,
  isAdminAutomationAuthorized
} from '@/lib/auth/guard-admin-api';
import { ensureDbConnection, prisma } from '@/lib/db/prisma';
import { isScraperEnabled } from '@/lib/config/features';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

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
  if (!isAdminAutomationAuthorized(request)) {
    const guard = await guardAdminRead('events.scrape');
    if ('error' in guard) return guard.error;
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
 * Admin session cookie veya ADMIN_SECRET Bearer token ile korunur.
 * Varsayılan: arka planda başlatır (timeout önleme). ?wait=1 ile senkron (cron).
 */
export async function POST(request: NextRequest) {
  const guard = await guardAdminAutomationOrMutation(request, 'events.scrape');
  if ('error' in guard) return guard.error;

  if (!isScraperEnabled) {
    return NextResponse.json(
      { ok: false, error: 'Scraper devre dışı (SCRAPER_ENABLED=false).' },
      { status: 403 }
    );
  }

  const wait =
    'automation' in guard ||
    request.nextUrl.searchParams.get('wait') === '1';

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
