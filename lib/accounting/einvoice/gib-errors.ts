/** GİB e-Arşiv hata metinlerini sınıflandırır (panel UX). */

export type GibErrorCategory =
  | 'gecis_tarih'
  | 'efatura_satici'
  | 'ettn_uuid'
  | 'concurrent_session'
  | 'unknown';

export interface ParsedGibDateRange {
  from: Date;
  to: Date;
  fromLabel: string;
  toLabel: string;
}

export interface ClassifiedGibError {
  category: GibErrorCategory;
  title: string;
  explanation: string;
  dateRange?: ParsedGibDateRange;
  raw: string;
}

const DATE_TOKEN =
  /(\d{1,2}[./]\d{1,2}[./]\d{4}|\d{4}-\d{2}-\d{2})/g;

/** dd/MM/yyyy, dd.MM.yyyy veya ISO (yyyy-MM-dd) → Date (UTC midnight) */
export function parseGibDateToken(token: string): Date | null {
  const t = token.trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t);
  if (iso) {
    const y = Number(iso[1]);
    const m = Number(iso[2]);
    const d = Number(iso[3]);
    if (!y || m < 1 || m > 12 || d < 1 || d > 31) return null;
    return new Date(Date.UTC(y, m - 1, d));
  }
  const tr = /^(\d{1,2})[./](\d{1,2})[./](\d{4})$/.exec(t);
  if (tr) {
    const d = Number(tr[1]);
    const m = Number(tr[2]);
    const y = Number(tr[3]);
    if (!y || m < 1 || m > 12 || d < 1 || d > 31) return null;
    return new Date(Date.UTC(y, m - 1, d));
  }
  return null;
}

export function formatGibDateLabel(date: Date): string {
  const d = String(date.getUTCDate()).padStart(2, '0');
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const y = date.getUTCFullYear();
  return `${d}/${m}/${y}`;
}

/** GİB takvim günü (Europe/Istanbul) → YYYY-MM-DD */
export function istanbulDayKey(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Istanbul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

export function toUtcDay(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function isDateOutsideRange(
  issuedAt: Date,
  range: ParsedGibDateRange
): boolean {
  const day = istanbulDayKey(issuedAt);
  const from = istanbulDayKey(range.from);
  const to = istanbulDayKey(range.to);
  return day < from || day > to;
}

export function parseDateRangeFromMessage(
  message: string
): ParsedGibDateRange | undefined {
  const tokens = message.match(DATE_TOKEN) ?? [];
  const dates: Date[] = [];
  for (const tok of tokens) {
    const parsed = parseGibDateToken(tok);
    if (parsed) dates.push(parsed);
  }
  if (dates.length < 2) return undefined;
  const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());
  const from = sorted[0]!;
  const to = sorted[sorted.length - 1]!;
  return {
    from,
    to,
    fromLabel: formatGibDateLabel(from),
    toLabel: formatGibDateLabel(to)
  };
}

function looksLikeGecis(msg: string): boolean {
  return (
    /ge[cç]i[sş]/i.test(msg) ||
    /izin\s*verilen\s*tarih/i.test(msg) ||
    /yaln[ıi]zca\s+.+\s+tarih/i.test(msg) ||
    /tarih\s*(aral[ıi][gğ][ıi]|penceresi)/i.test(msg)
  );
}

function looksLikeEfaturaSeller(msg: string): boolean {
  return (
    /e[-\s]?fatura\s+kullan[ıi]c[ıi]/i.test(msg) ||
    (/e[-\s]?fatura/i.test(msg) &&
      /(sat[ıi]c[ıi]|m[uü]kellef|vkn|hesap)/i.test(msg)) ||
    /earsiv.*(e[-\s]?fatura)|e[-\s]?fatura.*(earsiv|e[-\s]?ar[sş]iv)/i.test(msg)
  );
}

function looksLikeEttn(msg: string): boolean {
  return (
    /\bettn\b/i.test(msg) ||
    /\buuid\b/i.test(msg) ||
    /fatura\s*uuid/i.test(msg) ||
    /ge[cç]ersiz\s+(ettn|uuid)/i.test(msg)
  );
}

function looksLikeConcurrent(msg: string): boolean {
  return (
    /e[sş]zamanl[ıi]/i.test(msg) ||
    /ba[sş]ka\s+bir\s+oturum/i.test(msg) ||
    /oturum\s+(me[sş]gul|çak[ıi][sş]|aktif)/i.test(msg) ||
    /ayn[ıi]\s+anda/i.test(msg) ||
    /concurrent/i.test(msg) ||
    /GİB oturumu meşgul/i.test(msg)
  );
}

const CATEGORY_COPY: Record<
  GibErrorCategory,
  { title: string; explanation: string }
> = {
  gecis_tarih: {
    title: 'GEÇİŞ tarih penceresi',
    explanation:
      'GİB hesabı GEÇİŞ modunda; yalnızca izin verilen tarih aralığında fatura kesilebilir. Muhasebeci IVD’den yetki/tarih açmalı veya fatura tarihini pencere içine taşımalıdır.'
  },
  efatura_satici: {
    title: 'Satıcı e-Fatura hesabı',
    explanation:
      'Satıcı VKN e-Fatura kullanıcısı olarak görünüyor veya e-Arşiv ile çakışma var. e-Arşiv portal gönderimi uygun olmayabilir — muhasebeciye danışın.'
  },
  ettn_uuid: {
    title: 'ETTN / UUID hatası',
    explanation:
      'GİB belge kimliği (ETTN/UUID) geçersiz veya çakışıyor. Başarısız gönderimde üretilen UUID saklanmamalı; tekrar denemeden önce durumu kontrol edin.'
  },
  concurrent_session: {
    title: 'Oturum çakışması',
    explanation:
      'GİB portal tek oturum kabul eder. IVD’de açık oturumu kapatıp birkaç saniye sonra tekrar deneyin.'
  },
  unknown: {
    title: 'GİB hatası',
    explanation:
      'Gönderim başarısız. Ham mesajı muhasebeci / GİB destek ile paylaşın.'
  }
};

export function classifyGibError(
  raw: string | null | undefined
): ClassifiedGibError | null {
  if (!raw || !raw.trim()) return null;
  const message = raw.trim();
  let category: GibErrorCategory = 'unknown';

  if (looksLikeGecis(message)) category = 'gecis_tarih';
  else if (looksLikeEfaturaSeller(message)) category = 'efatura_satici';
  else if (looksLikeConcurrent(message)) category = 'concurrent_session';
  else if (looksLikeEttn(message)) category = 'ettn_uuid';

  const copy = CATEGORY_COPY[category];
  const dateRange =
    category === 'gecis_tarih'
      ? parseDateRangeFromMessage(message)
      : undefined;

  let explanation = copy.explanation;
  if (category === 'gecis_tarih' && dateRange) {
    explanation = `GİB GEÇİŞ penceresi: ${dateRange.fromLabel} – ${dateRange.toLabel}. ${copy.explanation}`;
  }

  return {
    category,
    title: copy.title,
    explanation,
    dateRange,
    raw: message
  };
}

export function truncateGibRaw(raw: string, max = 120): string {
  const t = raw.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}
