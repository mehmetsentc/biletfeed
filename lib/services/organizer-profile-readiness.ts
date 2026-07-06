/** Panelde etkinlik oluşturmak için zorunlu organizatör alanları */
export type OrganizerProfileSnapshot = {
  name: string;
  contactEmail: string | null;
  status: string;
};

export function isOrganizerProfileComplete(
  organizer: OrganizerProfileSnapshot
): boolean {
  return (
    organizer.name.trim().length >= 2 &&
    Boolean(organizer.contactEmail?.trim())
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
