import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ParasutConfig } from '@/lib/accounting/einvoice/parasut/config';
import { GIB_NIHAI_TUKETICI_TAX_ID } from '@/lib/accounting/einvoice/nihai-tuketici';

const parasutRequest = vi.hoisted(() => vi.fn());

vi.mock('@/lib/accounting/einvoice/parasut/client', () => ({
  parasutRequest,
  asResourceList: (doc: { data?: unknown }) =>
    Array.isArray(doc?.data) ? doc.data : [],
  asSingleResource: (doc: { data?: unknown }) =>
    doc?.data && !Array.isArray(doc.data) ? doc.data : null
}));

import {
  ensureContact,
  findContactByTaxOrEmail
} from '@/lib/accounting/einvoice/parasut/contacts';

const config = { companyId: '1' } as ParasutConfig;

describe('Paraşüt contacts — B2C nihai tüketici', () => {
  beforeEach(() => {
    parasutRequest.mockReset();
  });

  it('does not look up contacts by 11111111111 tax id', async () => {
    parasutRequest.mockResolvedValueOnce({ data: [] });

    await findContactByTaxOrEmail(config, {
      name: 'Murat Işık Yenal',
      taxNumber: GIB_NIHAI_TUKETICI_TAX_ID,
      email: 'smyenal@gmail.com',
      isCorporate: false
    });

    expect(parasutRequest).toHaveBeenCalledTimes(1);
    expect(parasutRequest.mock.calls[0][2]?.query).toEqual(
      expect.objectContaining({
        'filter[email]': 'smyenal@gmail.com'
      })
    );
    expect(parasutRequest.mock.calls[0][2]?.query).not.toHaveProperty(
      'filter[tax_number]'
    );
  });

  it('creates a new contact instead of reusing Didem when tax is nihai', async () => {
    // email miss → create
    parasutRequest
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({
        data: { id: 'contact-leda', type: 'contacts', attributes: {} }
      });

    const id = await ensureContact(config, {
      name: 'Leda',
      taxNumber: GIB_NIHAI_TUKETICI_TAX_ID,
      email: 'ledamanuelyan1@gmail.com',
      isCorporate: false
    });

    expect(id).toBe('contact-leda');
    const createCall = parasutRequest.mock.calls.find(
      (c) => c[2]?.method === 'POST'
    );
    expect(createCall?.[2]?.body).toEqual(
      expect.objectContaining({
        data: expect.objectContaining({
          attributes: expect.objectContaining({
            name: 'Leda',
            tax_number: GIB_NIHAI_TUKETICI_TAX_ID
          })
        })
      })
    );
  });

  it('updates contact name when reusing the same email', async () => {
    parasutRequest
      .mockResolvedValueOnce({
        data: [
          {
            id: 'contact-same',
            type: 'contacts',
            attributes: { name: 'Eski Ad', email: 'a@b.com' }
          }
        ]
      })
      .mockResolvedValueOnce({ data: { id: 'contact-same', type: 'contacts' } });

    const id = await ensureContact(config, {
      name: 'Yeni Ad',
      taxNumber: null,
      email: 'a@b.com',
      isCorporate: false
    });

    expect(id).toBe('contact-same');
    const put = parasutRequest.mock.calls.find((c) => c[2]?.method === 'PUT');
    expect(put?.[1]).toBe('/contacts/contact-same');
    expect(put?.[2]?.body).toEqual(
      expect.objectContaining({
        data: expect.objectContaining({
          attributes: expect.objectContaining({ name: 'Yeni Ad' })
        })
      })
    );
  });
});
