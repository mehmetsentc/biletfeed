/** Organizatör paneline yalnızca onaylı hesaplar erişebilir. */
export function isOrganizerApproved(status: string | null | undefined): boolean {
  return status === 'approved';
}

export function isOrganizerPending(status: string | null | undefined): boolean {
  return status === 'pending';
}
