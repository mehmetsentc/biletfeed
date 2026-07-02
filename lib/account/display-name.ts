/** Header/profil için görünen ad — organizatör kod adları (örn. "Ksd #10") yerine okunabilir isim */
export function resolveProfileDisplayName(input: {
  displayName?: string | null;
  email?: string | null;
}): string {
  const raw = input.displayName?.trim();
  if (raw && !isOrganizerCodeLabel(raw)) {
    return raw;
  }

  const local = input.email?.split('@')[0]?.trim() ?? '';
  if (!local) return 'Hesabım';

  return local
    .replace(/[._-]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function isOrganizerCodeLabel(value: string): boolean {
  return /^[A-Za-zÇĞİÖŞÜçğıöşü0-9]{1,8}\s*#\d+$/u.test(value);
}
