import { NextResponse } from 'next/server';
import { guardAdminRead } from '@/lib/auth/guard-admin-api';
import { getProviderConfig, isProviderReady } from '@/lib/ai/config';

/** Admin: AI sağlayıcı hazır mı? (anahtar değeri dönmez) */
export async function GET() {
  const guard = await guardAdminRead('events.manage');
  if ('error' in guard) return guard.error;

  const gemini = getProviderConfig('gemini');
  const deepseek = getProviderConfig('deepseek');

  return NextResponse.json({
    aiEnabled:
      process.env.AI_ENABLED === 'true' ||
      process.env.AI_ENABLED === '1' ||
      process.env.SCRAPER_AI_ENABLED === 'true' ||
      process.env.SCRAPER_AI_ENABLED === '1',
    gemini: {
      ready: isProviderReady('gemini'),
      model: gemini.model,
      hasKey: Boolean(gemini.apiKey)
    },
    deepseek: {
      ready: isProviderReady('deepseek'),
      model: deepseek.model,
      hasKey: Boolean(deepseek.apiKey)
    },
    seatPlanAiReady: isProviderReady('gemini')
  });
}
