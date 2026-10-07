import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DomainErrorFilter } from './app/common/errors/filters/domain-error.filter.js';

// Usado pelo main.ts e pelos testes e2e, para os dois rodarem com as mesmas regras
export function setupApp(app: INestApplication) {
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new DomainErrorFilter(app.getHttpAdapter()));
}
