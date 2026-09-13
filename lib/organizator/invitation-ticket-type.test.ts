import { describe, expect, it } from 'vitest';
import { resolveSelectedTicketTypeId } from '@/lib/organizator/invitation-ticket-type';

describe('resolveSelectedTicketTypeId', () => {
  const oct3 = { id: 'type-3ekim' };
  const oct4 = { id: 'type-4ekim' };

  it('yeni etkinlikte eski tür ID kalırsa ilk geçerli türe geçer', () => {
    expect(resolveSelectedTicketTypeId('type-4ekim', [oct3])).toBe('type-3ekim');
  });

  it('aynı etkinlikte seçili tür duruyorsa korur', () => {
    expect(resolveSelectedTicketTypeId('type-3ekim', [oct3, oct4])).toBe(
      'type-3ekim'
    );
  });

  it('tür yoksa boş string', () => {
    expect(resolveSelectedTicketTypeId('type-3ekim', [])).toBe('');
  });
});
