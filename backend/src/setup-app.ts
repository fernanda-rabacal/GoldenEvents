import { INestApplication, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { DomainErrorFilter } from './app/common/errors/filters/domain-error.filter.js';

// O Express só entende true e número de saltos como boolean e number, não como texto
function parseTrustProxy(value: string) {
  if (value === 'true') {
    return true;
  }

  return /^\d+$/.test(value) ? Number(value) : value;
}

// Usado pelo main.ts e pelos testes e2e, para os dois rodarem com as mesmas regras.
// Sem CORS: o navegador nunca chama a API direto, só o servidor do Next
export function setupApp(app: INestApplication) {
  app.use(
    helmet({
      contentSecurityPolicy: {
        // Fora de produção a API roda em http: o upgrade para https quebraria o Swagger
        directives: {
          upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
        },
      },
    }),
  );
  // O proxy na frente da API (ex.: a borda do Railway). req.ip só lê o X-Forwarded-For quando a
  // conexão vem dele. Confiar em qualquer origem deixaria o cliente inventar o próprio IP
  app
    .getHttpAdapter()
    .getInstance()
    .set('trust proxy', parseTrustProxy(process.env.TRUST_PROXY ?? 'loopback'));
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new DomainErrorFilter(app.getHttpAdapter()));
}
