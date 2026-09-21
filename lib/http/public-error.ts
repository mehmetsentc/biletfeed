const TRANSIENT_CODES = new Set([
  'ECONNRESET',
  'ECONNREFUSED',
  'ECONNABORTED',
  'ETIMEDOUT',
  'ESOCKETTIMEDOUT',
  'EPIPE',
  'ENOTFOUND',
  'EAI_AGAIN',
  'EHOSTUNREACH',
  'ENETUNREACH',
  'EPROTO',
  'UND_ERR_SOCKET',
  'UND_ERR_CONNECT_TIMEOUT',
  'P1001',
  'P1017'
]);

const TRANSIENT_PATTERNS: RegExp[] = [
  /ECONNRESET/i,
  /ECONNREFUSED/i,
  /ECONNABORTED/i,
  /ETIMEDOUT/i,
  /ESOCKETTIMEDOUT/i,
  /EPIPE/i,
  /ENOTFOUND/i,
  /EAI_AGAIN/i,
  /EHOSTUNREACH/i,
  /ENETUNREACH/i,
  /socket hang up/i,
  /socket closed/i,
  /fetch failed/i,
  /failed to fetch/i,
  /networkerror/i,
  /network request failed/i,
  /load failed/i,
  /network connection was lost/i,
  /kind:\s*Closed/i,
  /connection terminated/i,
  /connection closed/i,
  /connection reset/i,
  /can't reach database/i,
  /timed out fetching a new connection/i,
  /server has closed the connection/i,
  /the connection is closed/i
];

export const CHECKOUT_CONNECTION_ERROR =
  'Bağlantı kesildi. Lütfen birkaç saniye sonra tekrar deneyin.';

function errorCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object' || !('code' in error)) return undefined;
  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' ? code : undefined;
}

function collectErrorText(error: unknown, depth = 0): string {
  if (depth > 4 || error == null) return '';
  if (typeof error === 'string') return error;
  if (error instanceof Error) {
    const cause =
      'cause' in error ? collectErrorText(error.cause, depth + 1) : '';
    return [error.message, error.name, errorCode(error), cause]
      .filter(Boolean)
      .join(' ');
  }
  if (typeof error === 'object') {
    const rec = error as {
      message?: unknown;
      code?: unknown;
      cause?: unknown;
    };
    return [rec.message, rec.code, collectErrorText(rec.cause, depth + 1)]
      .filter((value) => typeof value === 'string' && value.length > 0)
      .join(' ');
  }
  return String(error);
}

export function isTransientNetworkError(error: unknown): boolean {
  const code = errorCode(error)?.toUpperCase();
  if (code && TRANSIENT_CODES.has(code)) return true;
  const text = collectErrorText(error);
  return TRANSIENT_PATTERNS.some((pattern) => pattern.test(text));
}

function looksLikeInternalError(message: string): boolean {
  const trimmed = message.trim();
  if (!trimmed) return true;
  if (/^(read|write|connect|getaddrinfo)\s+\S+/i.test(trimmed)) return true;
  if (/^[A-Z]{2,}[A-Z0-9_]*$/.test(trimmed)) return true;
  if (/unexpected token|is not valid json/i.test(trimmed)) return true;
  if (
    /prisma|postgres|neon|sqlstate|iyzipay|openssl|undici|uv_interface/i.test(
      trimmed
    )
  ) {
    return true;
  }
  return isTransientNetworkError(trimmed);
}

export function publicApiErrorMessage(
  error: unknown,
  fallback: string
): string {
  if (isTransientNetworkError(error)) return CHECKOUT_CONNECTION_ERROR;
  const message = error instanceof Error ? error.message.trim() : '';
  if (!message || looksLikeInternalError(message)) return fallback;
  return message;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withTransientRetry<T>(
  operation: () => Promise<T>,
  options?: { retries?: number; delayMs?: number }
): Promise<T> {
  const retries = options?.retries ?? 2;
  const delayMs = options?.delayMs ?? 350;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!isTransientNetworkError(error) || attempt === retries) {
        throw error;
      }
      await sleep(delayMs * (attempt + 1));
    }
  }

  throw lastError;
}
