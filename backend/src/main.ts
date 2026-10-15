import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module.js';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { setupApp } from './setup-app.js';

async function bootstrap() {
  // rawBody: a assinatura dos webhooks é calculada sobre os bytes originais do corpo
  const app = await NestFactory.create(AppModule, { rawBody: true });
  setupApp(app);
  // Fecha os workers da fila antes de sair, sem abandonar jobs no meio
  app.enableShutdownHooks();

  // Swagger Documentation
  const docConfig = new DocumentBuilder()
    .setTitle('Golden Events API')
    .setDescription('Api para disponibilizar os serviços do golden events.')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, docConfig);
  SwaggerModule.setup('/docs', app, document);
  app.enableCors();

  await app.listen(process.env.PORT || 8080);
}
bootstrap();
