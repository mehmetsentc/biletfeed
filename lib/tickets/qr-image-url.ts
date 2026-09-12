import { getSiteUrl } from '@/lib/config/domain';

export function buildTicketQrImageUrl(params: {
  ticketCode: string;
  validationToken: string;
  ticketId: string;
}): string {
  const query = new URLSearchParams({
    code: params.ticketCode,
    token: params.validationToken,
    id: params.ticketId
  });
  return getSiteUrl(`/api/tickets/qr?${query.toString()}`);
}

export function buildPublicTicketPageUrl(params: {
  ticketCode: string;
  validationToken: string;
  ticketId: string;
}): string {
  return getSiteUrl(
    `/bilet/${encodeURIComponent(params.ticketCode)}?token=${encodeURIComponent(params.validationToken)}&id=${encodeURIComponent(params.ticketId)}`
  );
}
