import { NextRequest, NextResponse } from 'next/server';
import { verifySessionCookie } from '@/lib/auth/session';
import { canAccessAdmin } from '@/lib/auth/permissions';
import { rejectAdminCsrf } from '@/lib/auth/admin-csrf';
import { prisma, ensureDbConnection } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

const CITY_SLUG_TO_NAME: Record<string, string> = {
  istanbul: 'İstanbul', ankara: 'Ankara', izmir: 'İzmir', antalya: 'Antalya',
  bursa: 'Bursa', eskisehir: 'Eskişehir', gaziantep: 'Gaziantep', kayseri: 'Kayseri',
  samsun: 'Samsun', trabzon: 'Trabzon', kocaeli: 'Kocaeli', mersin: 'Mersin',
  konya: 'Konya', diyarbakir: 'Diyarbakır', mugla: 'Muğla', adana: 'Adana',
  balikesir: 'Balıkesir', manisa: 'Manisa', aydin: 'Aydın', tekirdag: 'Tekirdağ',
  sakarya: 'Sakarya', denizli: 'Denizli', malatya: 'Malatya', edirne: 'Edirne',
  canakkale: 'Çanakkale', hatay: 'Hatay', kahramanmaras: 'Kahramanmaraş',
  sanliurfa: 'Şanlıurfa', mardin: 'Mardin', van: 'Van', afyon: 'Afyonkarahisar',
  nevsehir: 'Nevşehir', sinop: 'Sinop', karabuk: 'Karabük', ordu: 'Ordu',
  sivas: 'Sivas', erzurum: 'Erzurum', rize: 'Rize', giresun: 'Giresun',
  yalova: 'Yalova', bolu: 'Bolu', isparta: 'Isparta', burdur: 'Burdur',
  usak: 'Uşak', kutahya: 'Kütahya', afyonkarahisar: 'Afyonkarahisar',
  kibris: 'Kıbrıs', baku: 'Bakü', londra: 'Londra', berlin: 'Berlin',
  stuttgart: 'Stuttgart', muenchen: 'Münih', paris: 'Paris', dubai: 'Dubai',
  online: 'Online',
};

export async function POST(request: NextRequest) {
  const csrf = rejectAdminCsrf(request);
  if (csrf) return csrf;

  const session = await verifySessionCookie();
  if (!session || !canAccessAdmin(session.role as never)) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 });
  }

  await ensureDbConnection();

  const cities = await prisma.city.findMany();
  const fixed: string[] = [];

  for (const city of cities) {
    const correctName = CITY_SLUG_TO_NAME[city.slug];
    if (correctName && city.name !== correctName) {
      await prisma.city.update({
        where: { id: city.id },
        data: { name: correctName }
      });
      fixed.push(`${city.slug}: "${city.name}" → "${correctName}"`);
    }
  }

  return NextResponse.json({ ok: true, fixed, count: fixed.length });
}
