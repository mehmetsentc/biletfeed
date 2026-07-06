/** Panelde etkinlik oluşturmak için zorunlu organizatör alanları */
export type OrganizerProfileSnapshot = {
  name: string;
  contactEmail: string | null;
  status: string;
};

/** Organizatör iletişim e-postası veya hesap e-postası */
export function resolveOrganizerContactEmail(
  organizer: Pick<OrganizerProfileSnapshot, 'contactEmail'>,
  ownerEmail?: string | null
): string | null {
  const contact = organizer.contactEmail?.trim();
  if (contact) return contact;
  const owner = ownerEmail?.trim();
  return owner || null;
}

export function isOrganizerProfileComplete(
  organizer: OrganizerProfileSnapshot,
  ownerEmail?: string | null
): boolean {
  return (
    organizer.name.trim().length >= 2 &&
    Boolean(resolveOrganizerContactEmail(organizer, ownerEmail))
  );
}

export function canAccessOrganizerPanel(
  organizer: OrganizerProfileSnapshot | null | undefined
): boolean {
  if (!organizer) return false;
  if (organizer.status === 'suspended') return false;
  return isOrganizerProfileComplete(organizer);
}

/** Yeni etkinlik veya onaya gönderme için zorunlu profil mesajı */
export function organizerProfileIncompleteError(): string {
  return 'Organizatör profilinizi tamamlayın. Ayarlar sayfasından iletişim e-postanızı ekleyin.';
}
