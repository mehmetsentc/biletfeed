import { NextResponse } from 'next/server';
import { mobileAppConfig } from '@/lib/config/mobile-app';

export const dynamic = 'force-dynamic';

/** Android App Links — /.well-known/assetlinks.json */
export async function GET() {
  const fingerprint = mobileAppConfig.androidSha256Fingerprint;

  const body = [
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: mobileAppConfig.androidPackageName,
        sha256_cert_fingerprints: fingerprint
          ? [fingerprint]
          : ['REPLACE_WITH_ANDROID_SHA256_FINGERPRINT']
      }
    }
  ];

  return NextResponse.json(body, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}
