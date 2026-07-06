function getApiBase(): string {
  return (
    process.env.TOSLA_API_BASE_URL ?? 'https://entegrasyon.tosla.com/api/Payment'
  ).replace(/\/$/, '');
}

function get3DHostBase(): string {
  return (
    process.env.TOSLA_3D_HOST_URL ?? `${getApiBase()}/threeDSecure`
  ).replace(/\/$/, '');
}

/** Kart formu doğrudan Tosla'ya POST edilir — kart bilgisi BiletFeed sunucusuna gitmez */
export function getToslaProcessCardFormUrl(): string {
  return (
    process.env.TOSLA_PROCESS_CARD_FORM_URL ?? `${getApiBase()}/processCardForm`
  ).replace(/\/$/, '');
}

/** Ortak ödeme sayfası — yedek / iframe */
export function getToslaHostedPaymentUrl(sessionId: string): string {
  return `${get3DHostBase()}/${sessionId}`;
}
