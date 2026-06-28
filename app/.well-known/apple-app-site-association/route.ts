import { NextResponse } from 'next/server';
import { getAppleAppId } from '@/lib/config/mobile-app';

export const dynamic = 'force-dynamic';

/** Apple Universal Links — /.well-known/apple-app-site-association */
export async function GET() {
  const appId = getAppleAppId();

  const body = {
    applinks: {
      apps: [] as string[],
      details: [
        {
          appID: appId,
          paths: ['*', '/bilet/*', '/davetiye/*', '/etkinlik/*']
        }
      ]
    },
    webcredentials: {
      apps: [appId]
    }
  };

  return NextResponse.json(body, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}
