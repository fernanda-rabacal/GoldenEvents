import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module.js';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { setupApp } from './setup-app.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  setupApp(app);

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
