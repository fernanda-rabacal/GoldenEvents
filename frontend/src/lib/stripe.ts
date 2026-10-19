import { loadStripe, type Stripe } from '@stripe/stripe-js';

const instances = new Map<string, Promise<Stripe | null>>();

// loadStripe deve rodar uma vez por chave, fora da renderização
export function getStripe(publishableKey: string) {
  let instance = instances.get(publishableKey);

  if (!instance) {
    instance = loadStripe(publishableKey);
    instances.set(publishableKey, instance);
  }

  return instance;
}
