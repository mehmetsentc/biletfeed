import { getRedirectResult, type Auth, type UserCredential } from 'firebase/auth';

let redirectResultPromise: Promise<UserCredential | null> | null = null;

export function resetRedirectResultCache() {
  redirectResultPromise = null;
}

/** Google ve Apple redirect akışları tek getRedirectResult çağrısı paylaşır */
export function consumeOAuthRedirectResult(
  auth: Auth
): Promise<UserCredential | null> {
  if (!redirectResultPromise) {
    redirectResultPromise = getRedirectResult(auth);
  }
  return redirectResultPromise;
}
