import type { EventStatus } from '@prisma/client';

export function eventStatusLabel(
  status: EventStatus,
  endDate: Date
): string {
  if (status === 'cancelled') return 'İptal';
  if (status === 'draft') return 'Taslak';
  if (status === 'pending') return 'Onay Bekliyor';
  if (endDate < new Date()) return 'Eski Etkinlik';
  if (status === 'published') return 'Yayında';
  if (status === 'completed') return 'Tamamlandı';
  return status;
}
