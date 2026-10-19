import { createHash, timingSafeEqual } from 'crypto';
import type { Request } from 'express';
import { isIP } from 'net';

const MIN_KEY_LENGTH = 32;

function digest(value: string) {
  return createHash('sha256').update(value).digest();
}

function hasInternalKey(request: Request) {
  const key = process.env.INTERNAL_API_KEY;
  const sent = request.get('x-internal-key');

  return !!key && !!sent && timingSafeEqual(digest(sent), digest(key));
}

// O servidor do Next informa o IP do navegador em X-Client-IP e prova com a INTERNAL_API_KEY
// que é ele. Sem a chave o header é ignorado, senão quem chamasse a API direto inventaria o IP
export function clientIp(request: Request) {
  const forwarded = request.get('x-client-ip');

  if (forwarded && isIP(forwarded) && hasInternalKey(request)) {
    return forwarded;
  }

  return request.ip;
}

// Sem a chave, todos os visitantes chegariam com o IP do servidor do Next e dividiriam o limite
export function assertInternalKey() {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  if ((process.env.INTERNAL_API_KEY ?? '').length < MIN_KEY_LENGTH) {
    throw new Error(
      `INTERNAL_API_KEY ausente ou com menos de ${MIN_KEY_LENGTH} caracteres.`,
    );
  }
}
