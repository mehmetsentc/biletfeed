/** Capacitor native only — web build'de yüklü değil */
declare module '@capacitor-community/apple-sign-in' {
  export const SignInWithApple: {
    authorize(options: {
      clientId: string;
      redirectURI: string;
      scopes: string;
      state: string;
      nonce: string;
    }): Promise<{
      response: {
        identityToken?: string;
        authorizationCode?: string;
      };
    }>;
  };
}
