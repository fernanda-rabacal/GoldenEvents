import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module.js';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConflictInterceptor } from './app/common/errors/interceptors/conflict.interceptor.js';
import { DatabaseInterceptor } from './app/common/errors/interceptors/database.interceptor.js';
import { UnauthorizedInterceptor } from './app/common/errors/interceptors/unauthorized.interceptor.js';
import { NotFoundInterceptor } from './app/common/errors/interceptors/not-found.interceptor.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger Documentation
  const docConfig = new DocumentBuilder()
    .setTitle('Golden Events API')
    .setDescription('Api para disponibilizar os serviços do golden events.')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, docConfig);
  SwaggerModule.setup('/docs', app, document);
  app.enableCors();

  app.useGlobalInterceptors(
    new ConflictInterceptor(),
    new DatabaseInterceptor(),
    new UnauthorizedInterceptor(),
    new NotFoundInterceptor(),
  );

  await app.listen(process.env.PORT || 8080);
}
bootstrap();
