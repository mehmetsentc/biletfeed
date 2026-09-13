/** Etkinlik değişince eski seansın bilet türü ID'si kalmasın. */
export function resolveSelectedTicketTypeId(
  previousId: string,
  types: Array<{ id: string }>
): string {
  if (previousId && types.some((type) => type.id === previousId)) {
    return previousId;
  }
  return types[0]?.id ?? '';
}
