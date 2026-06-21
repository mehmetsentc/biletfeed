import { FirebaseError } from 'firebase/app';

export function getFirebaseAuthErrorMessage(
  error: unknown,
  fallback: string
): string {
  const code =
    error instanceof FirebaseError
      ? error.code
      : (error as { code?: string })?.code;

  switch (code) {
    case 'auth/popup-closed-by-user':
      return 'Google penceresi kapatıldı. Tekrar deneyin.';
    case 'auth/popup-blocked':
      return 'Popup engellendi — sayfa yönlendirmesi ile giriş deneniyor...';
    case 'auth/cancelled-popup-request':
      return 'Başka bir giriş penceresi açık. Lütfen bekleyin ve tekrar deneyin.';
    case 'auth/operation-not-allowed':
      return 'Firebase Console → Authentication → Sign-in method → Google etkin değil.';
    case 'auth/unauthorized-domain':
      return 'Bu domain yetkili değil. Firebase → Authorized domains → localhost ekleyin.';
    case 'auth/invalid-api-key':
    case 'auth/api-key-not-valid.-please-pass-a-valid-api-key.':
      return 'Geçersiz Firebase API key. Firebase Console → Project Settings → Web app → config değerlerini .env.local\'a yeniden kopyalayın.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'E-posta veya şifre hatalı';
    case 'auth/email-already-in-use':
      return 'Bu e-posta zaten kayıtlı. Giriş yapmayı deneyin.';
    case 'auth/too-many-requests':
      return 'Çok fazla deneme. Lütfen bir süre sonra tekrar deneyin.';
    case 'auth/network-request-failed':
      return 'Ağ hatası. İnternet bağlantınızı kontrol edin.';
    case 'auth/missing-or-invalid-nonce':
      return 'Oturum süresi doldu. Sayfayı yenileyip tekrar deneyin.';
    case 'auth/account-exists-with-different-credential':
      return 'Bu e-posta farklı yöntemle kayıtlı. E-posta/şifre ile giriş deneyin.';
    default:
      if (code) return `${fallback} (${code})`;
      return fallback;
  }
}
