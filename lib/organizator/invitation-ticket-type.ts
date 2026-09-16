/** Etkinlik değişince eski seansın bilet türü ID'si kalmasın. Davetiye türü varsa onu seç. */
export function resolveSelectedTicketTypeId(
  previousId: string,
  types: Array<{ id: string; invitationOnly?: boolean; type?: string }>
): string {
  if (previousId && types.some((type) => type.id === previousId)) {
    return previousId;
  }
  const invite =
    types.find((type) => type.invitationOnly) ??
    types.find((type) => type.type === 'invitation');
  return invite?.id ?? types[0]?.id ?? '';
}
