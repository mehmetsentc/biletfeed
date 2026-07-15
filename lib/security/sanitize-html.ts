/**
 * Sunucu taraflı HTML sanitizer — jsdom / isomorphic-dompurify bağımlılığı yok.
 * Yalnızca organizatör duyurularında kullanılan kısıtlı whitelist'i destekler.
 */

const ALLOWED_TAGS = new Set([
  'p', 'br', 'strong', 'b', 'em', 'i', 'u',
  'ul', 'ol', 'li', 'a', 'h2', 'h3', 'h4', 'blockquote'
]);

/** href değerlerinde yalnızca bu protokollere izin ver */
const SAFE_HREF_RE = /^(https?:|mailto:|\/|#)/i;

/** <a> tagından güvenli atribütler çıkar */
function sanitizeAnchorAttrs(attrsStr: string): string {
  const parts: string[] = [];

  // href
  const hrefM = /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|(\S+))/i.exec(attrsStr);
  if (hrefM) {
    const href = (hrefM[1] ?? hrefM[2] ?? hrefM[3] ?? '').trim();
    if (SAFE_HREF_RE.test(href)) {
      parts.push(`href="${href.replace(/"/g, '&quot;')}"`);
    }
  }

  // target — yalnızca _blank veya _self
  const targetM = /\btarget\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(attrsStr);
  if (targetM) {
    const target = (targetM[1] ?? targetM[2] ?? '').trim();
    if (target === '_blank' || target === '_self') {
      parts.push(`target="${target}"`);
    }
  }

  // rel
  const relM = /\brel\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(attrsStr);
  if (relM) {
    const rel = (relM[1] ?? relM[2] ?? '').replace(/[<>"]/g, '').trim();
    if (rel) parts.push(`rel="${rel}"`);
  } else if (parts.some((p) => p.startsWith('target="_blank"'))) {
    // _blank için zorunlu güvenlik
    parts.push('rel="noopener noreferrer"');
  }

  return parts.length ? ' ' + parts.join(' ') : '';
}

/** Organizatör duyuru HTML — stored XSS önleme */
export function sanitizeOrganizerHtml(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';

  // 1. Tehlikeli blokları içerikleriyle birlikte sil
  let html = trimmed
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<object[\s\S]*?<\/object>/gi, '')
    .replace(/<embed[^>]*>/gi, '')
    .replace(/<form[\s\S]*?<\/form>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  // 2. Tüm event handler atribütlerini sil (onclick, onmouseover, vb.)
  html = html.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');

  // 3. javascript: / vbscript: protokollerini sil
  html = html.replace(/\b(javascript|vbscript|data)\s*:/gi, 'blocked:');

  // 4. Her tag'ı işle
  html = html.replace(/<(\/?)([a-zA-Z][a-zA-Z0-9]*)([^>]*)>/g, (_, closing, rawTag, attrs) => {
    const tag = rawTag.toLowerCase();

    if (!ALLOWED_TAGS.has(tag)) return ''; // Whitelist dışı → sil

    if (tag === 'br') return '<br>';
    if (closing) return `</${tag}>`;

    if (tag === 'a') {
      return `<a${sanitizeAnchorAttrs(attrs)}>`;
    }

    // Diğer izin verilen taglar — atribüt yok
    return `<${tag}>`;
  });

  return html.trim();
}

/** Düz metin alanları — HTML/kontrol karakterlerini sil */
export function sanitizePlainText(raw: string, maxLength = 500): string {
  return raw
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '')
    .trim()
    .slice(0, maxLength);
}
