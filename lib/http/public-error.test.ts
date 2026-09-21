import { describe, expect, it, vi } from 'vitest';
import {
  CHECKOUT_CONNECTION_ERROR,
  isTransientNetworkError,
  publicApiErrorMessage,
  withTransientRetry
} from '@/lib/http/public-error';

describe('isTransientNetworkError', () => {
  it('detects Node read ECONNRESET', () => {
    const err = Object.assign(new Error('read ECONNRESET'), {
      code: 'ECONNRESET',
      syscall: 'read'
    });
    expect(isTransientNetworkError(err)).toBe(true);
  });

  it('detects fetch failed with ECONNRESET cause', () => {
    const err = new Error('fetch failed');
    Object.assign(err, {
      cause: Object.assign(new Error('read ECONNRESET'), { code: 'ECONNRESET' })
    });
    expect(isTransientNetworkError(err)).toBe(true);
  });

  it('detects Prisma closed-connection text', () => {
    expect(
      isTransientNetworkError(
        new Error(
          'Error in PostgreSQL connection: Error { kind: Closed, cause: Some(...) }'
        )
      )
    ).toBe(true);
  });

  it('ignores business errors', () => {
    expect(
      isTransientNetworkError(new Error('Yeterli bilet kalmadı'))
    ).toBe(false);
  });
});

describe('publicApiErrorMessage', () => {
  it('hides raw ECONNRESET from users', () => {
    expect(publicApiErrorMessage(new Error('read ECONNRESET'), 'Sipariş oluşturulamadı')).toBe(
      CHECKOUT_CONNECTION_ERROR
    );
  });

  it('keeps Turkish business errors', () => {
    expect(
      publicApiErrorMessage(
        new Error('Ücretli siparişler için fatura bilgileri zorunludur'),
        'Sipariş oluşturulamadı'
      )
    ).toBe('Ücretli siparişler için fatura bilgileri zorunludur');
  });

  it('falls back for empty or internal messages', () => {
    expect(publicApiErrorMessage(new Error(''), 'Sipariş oluşturulamadı')).toBe(
      'Sipariş oluşturulamadı'
    );
    expect(
      publicApiErrorMessage(new Error('PrismaClientKnownRequestError'), 'x')
    ).toBe('x');
    expect(
      publicApiErrorMessage(
        new Error("Unexpected token '<'"),
        'Sipariş oluşturulamadı'
      )
    ).toBe('Sipariş oluşturulamadı');
  });
});

describe('withTransientRetry', () => {
  it('retries transient failures then succeeds', async () => {
    const op = vi
      .fn()
      .mockRejectedValueOnce(Object.assign(new Error('read ECONNRESET'), { code: 'ECONNRESET' }))
      .mockResolvedValueOnce('ok');

    await expect(
      withTransientRetry(op, { retries: 2, delayMs: 1 })
    ).resolves.toBe('ok');
    expect(op).toHaveBeenCalledTimes(2);
  });

  it('does not retry business errors', async () => {
    const op = vi.fn().mockRejectedValue(new Error('Yeterli bilet kalmadı'));
    await expect(withTransientRetry(op, { retries: 2, delayMs: 1 })).rejects.toThrow(
      'Yeterli bilet kalmadı'
    );
    expect(op).toHaveBeenCalledTimes(1);
  });
});
