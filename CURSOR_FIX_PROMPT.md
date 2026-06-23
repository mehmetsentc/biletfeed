# BiletFeed — Tüm Kritik Hataları Düzeltme Görevi

## Bağlam

Bu bir Next.js 15 App Router projesidir (TypeScript). Proje Vercel'de deploy edilmektedir. Firebase Auth (client-side) + HMAC tabanlı session cookie + PostgreSQL/Neon + Prisma ORM kullanılmaktadır.

## Kök Sorun: `require() of ES Module` Hatası

**Neden oluyor?**
- `firebase-admin/app` ve `firebase-admin/auth` paketi ESM-only'dir.
- Next.js, server component'leri CommonJS olarak bundle eder ve `require()` ile çağırır.
- `lib/firebase/admin.ts` dosyası bu ESM modüllerini import eder.
- Bu dosyayı (doğrudan veya transitif olarak) import eden her route/page 500 hatası verir.

**Sorunlu import zinciri:**
```
lib/auth/session.ts
  → lib/firebase/admin.ts          (import { getAdminAuth } from ...)
    → firebase-admin/app           ← ESM-only → CRASH
    → firebase-admin/auth          ← ESM-only → CRASH
  → lib/services/users.ts
    → lib/firebase/admin.ts        ← aynı crash
```

Bu zincir şu sayfaları/rotaları çökertiyor:
- `POST /api/auth/session` → "Oturum oluşturulamadı" hatası → giriş yapılamıyor
- `GET /biletlerim` → 500 Internal Server Error

---

## GÖREV 1: `lib/auth/session.ts` dosyasını tamamen yeniden yaz

**Dosyayı aç:** `lib/auth/session.ts`

**Mevcut sorunlu içeriği SİL, yerine şunu yaz:**

```typescript
import { createHmac } from 'crypto';
import { cookies } from 'next/headers';
import type { UserRole } from '@/types';
import { hasRole, ROLES } from '@/lib/auth/roles';

// firebase-admin import YOK — ESM uyumsuzluğunu önlemek için
// Tüm session doğrulama HMAC tabanlı yapılıyor

const SESSION_COOKIE_NAME = 'session';

export interface SessionUser {
  uid: string;
  email?: string;
  role: UserRole;
}

const SIMPLE_SESSION_SECRET =
  process.env.NEXTAUTH_SECRET ??
  process.env.TICKET_SECRET_KEY ??
  'biletfeed-simple-session-fallback-key';

function verifySimpleSession(token: string): SessionUser | null {
  try {
    const dotIdx = token.lastIndexOf('.');
    if (dotIdx === -1) return null;

    const b64 = token.slice(0, dotIdx);
    const sig = token.slice(dotIdx + 1);

    const expectedSig = createHmac('sha256', SIMPLE_SESSION_SECRET)
      .update(b64)
      .digest('hex');

    if (sig !== expectedSig) return null;

    const parsed = JSON.parse(Buffer.from(b64, 'base64url').toString()) as {
      uid?: string;
      email?: string;
      role?: string;
      exp?: number;
    };

    if (!parsed.uid || !parsed.exp) return null;
    if (Date.now() > parsed.exp) return null;

    return {
      uid: parsed.uid,
      email: parsed.email,
      role: (parsed.role as UserRole) ?? ROLES.USER
    };
  } catch {
    return null;
  }
}

export async function verifySessionCookie(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!session) return null;
  return verifySimpleSession(session);
}

export function sessionHasRole(
  session: SessionUser | null,
  requiredRole: UserRole
): boolean {
  if (!session) return false;
  return hasRole(session.role, requiredRole);
}

export { SESSION_COOKIE_NAME };
```

**Kontrol et:** Bu dosyada `firebase-admin`, `getAdminAuth`, `isFirebaseAdminConfigured`, `getUserRoleByFirebaseUid` gibi herhangi bir import OLMAMALI.

---

## GÖREV 2: `app/api/auth/session/route.ts` dosyasını tamamen yeniden yaz

**Dosyayı aç:** `app/api/auth/session/route.ts`

**Mevcut içeriği SİL, yerine şunu yaz:**

```typescript
import { createHmac } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { prisma, isDatabaseConfigured } from '@/lib/db/prisma';

// lib/auth/session'dan import etmiyoruz — firebase-admin transitif bağımlılığını kırmak için
const SESSION_COOKIE_NAME = 'session';

const SESSION_EXPIRES_MS = 60 * 60 * 24 * 5 * 1000; // 5 gün

const SIMPLE_SESSION_SECRET =
  process.env.NEXTAUTH_SECRET ??
  process.env.TICKET_SECRET_KEY ??
  'biletfeed-simple-session-fallback-key';

function buildSimpleSession(
  uid: string,
  email: string,
  role: string,
  expiresMs: number
): string {
  const payload = JSON.stringify({ uid, email, role, exp: Date.now() + expiresMs });
  const b64 = Buffer.from(payload).toString('base64url');
  const sig = createHmac('sha256', SIMPLE_SESSION_SECRET).update(b64).digest('hex');
  return `${b64}.${sig}`;
}

/** Firebase REST API ile ID token doğrular — Admin SDK gerekmez */
async function verifyIdTokenViaRestApi(
  idToken: string
): Promise<{ uid: string; email: string }> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) throw new Error('NEXT_PUBLIC_FIREBASE_API_KEY ayarlanmamış');

  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken })
    }
  );

  if (!res.ok) throw new Error('Token geçersiz');

  const data = (await res.json()) as {
    users?: Array<{ localId: string; email?: string }>;
  };
  const user = data.users?.[0];
  if (!user?.localId) throw new Error('Kullanıcı bulunamadı');

  return { uid: user.localId, email: user.email ?? '' };
}

/** Kullanıcıyı DB'ye kaydet — hata olursa sessizce geç */
async function syncUserToDB(uid: string, email: string): Promise<string> {
  if (!isDatabaseConfigured()) return 'ROLE_USER';
  try {
    const existing = await prisma.user.findFirst({
      where: { firebaseUid: uid, deletedAt: null },
      select: { role: true }
    });
    if (existing) return existing.role as string;

    await prisma.user.create({
      data: {
        firebaseUid: uid,
        email,
        displayName: email.split('@')[0] || 'Kullanıcı',
        role: 'ROLE_USER'
      }
    });
    return 'ROLE_USER';
  } catch {
    return 'ROLE_USER';
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
    }

    const body = (await request.json()) as { idToken?: string };
    const { idToken } = body;
    if (!idToken) {
      return NextResponse.json({ error: 'Token gerekli' }, { status: 400 });
    }

    const { uid, email } = await verifyIdTokenViaRestApi(idToken);
    const role = await syncUserToDB(uid, email);
    const sessionCookie = buildSimpleSession(uid, email, role, SESSION_EXPIRES_MS);

    const response = NextResponse.json({ success: true, role });
    response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
      maxAge: SESSION_EXPIRES_MS / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });
    return response;
  } catch {
    return NextResponse.json({ error: 'Oturum oluşturulamadı' }, { status: 401 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE_NAME, '', { maxAge: 0, path: '/' });
  return response;
}
```

**Kontrol et:** Bu dosyada `firebase-admin`, `getAdminAuth`, `getFirebaseAdmin` gibi herhangi bir import OLMAMALI.

---

## GÖREV 3: `components/auth/already-signed-in-panel.tsx` düzelt

**Dosyayı aç:** `components/auth/already-signed-in-panel.tsx`

Şu satırı bul:
```tsx
disabled={syncing || Boolean(sessionError)}
```

Şununla değiştir:
```tsx
disabled={syncing}
```

**Neden:** Session hatası olduğunda "Devam et" butonu kalıcı olarak devre dışı kalıyordu, kullanıcı tekrar deneyemiyordu.

---

## GÖREV 4: `components/events/favorite-button.tsx` düzelt

**Dosyayı aç:** `components/events/favorite-button.tsx`

`text-foreground` class'ını bul (kalp ikonunun renk class'ı):
```tsx
className="... text-foreground ..."
```

`text-gray-700 hover:text-gray-900` ile değiştir:
```tsx
className="... text-gray-700 hover:text-gray-900 ..."
```

**Neden:** Kalp ikonu koyu temada görünmüyordu (beyaz arka plan üzerinde beyaz ikon).

---

## GÖREV 5: Build kontrolü

Cursor terminal'inde çalıştır:
```bash
npx tsc --noEmit 2>&1 | head -50
```

Hata yoksa devam et. Hata varsa bana göster.

---

## GÖREV 6: Git commit ve Vercel deploy

Cursor terminal'inde sırayla çalıştır:

```bash
# Önce lock dosyalarını temizle
rm -f .git/HEAD.lock .git/index.lock

# Değiştirilmiş dosyaları commit et
git add lib/auth/session.ts app/api/auth/session/route.ts components/auth/already-signed-in-panel.tsx components/events/favorite-button.tsx
git commit -m "fix: firebase-admin ESM hatası çözüldü — session ve biletlerim düzeltildi"
git push

# Vercel'e deploy et
npx vercel --prod
```

---

## GÖREV 7: Canlıda Test

Deploy tamamlandıktan sonra https://biletfeed.com adresinde şunları test et:

### Test 1: Giriş session hatası
1. Tarayıcı konsolunu aç (F12)
2. `https://biletfeed.com/giris` sayfasına git
3. Konsolda şunu çalıştır:
```javascript
// Önce mevcut session durumunu kontrol et
document.cookie.split(';').find(c => c.trim().startsWith('session='))
```

### Test 2: Session API endpoint
```javascript
// Konsolda çalıştır — 401 (token yok) dönmeli, 500 değil
fetch('/api/auth/session', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({idToken: 'test'})
}).then(r => console.log('Status:', r.status))
  .then(() => {})
```
- **Başarı:** Status 401 (token geçersiz — doğru davranış)
- **Başarısız:** Status 500 (hâlâ ESM hatası var demektir)

### Test 3: Giriş yapma
1. `/giris` sayfasına git
2. E-posta/şifre ile giriş yap
3. "Oturum oluşturulamadı" hatası ÇIKMAMALI
4. Ana sayfaya yönlendirilmeli

### Test 4: /biletlerim
1. Giriş yaptıktan sonra `/biletlerim` sayfasına git
2. 500 hatası ÇIKMAMALI
3. Boş liste veya biletler görünmeli

### Test 5: Etkinlik Oluştur
1. Ana sayfada "Etkinlik Oluştur" butonuna tıkla
2. Sonsuz döngüye GİRMEMELİ
3. Giriş sayfasına gitmelisin (giriş yapmadan)

---

## Önemli Notlar

- `lib/firebase/admin.ts` dosyasına DOKUNMA — bu dosya organizatör paneli ve admin route'larında kullanılıyor, silinmemeli. Sadece `lib/auth/session.ts` ondan import etmemeli.
- Prisma `UserRole` enum değerleri: `'ROLE_USER'`, `'ROLE_ORGANIZER'`, `'ROLE_ADMIN'`, `'ROLE_SUPER_ADMIN'` — `'USER'` veya `'ORGANIZER'` diye yazma, build hatası verir.
- Session cookie formatı: `base64url(JSON payload).hmac_hex` — hem session/route.ts hem de session.ts aynı `SIMPLE_SESSION_SECRET` kullanmalı.

---

## Eğer Hâlâ 500 Alıyorsan

Vercel runtime log'larına bak:
```
npx vercel logs --prod 2>&1 | grep -i "require\|ESM\|firebase" | head -20
```

Ya da Vercel dashboard'dan: Project → Functions → `/api/auth/session` → Logs

Hata mesajında hangi dosyanın `require()` edilmeye çalışıldığı yazıyor — o dosyanın import zincirini takip et ve firebase-admin'e uzanan bağlantıyı kes.
