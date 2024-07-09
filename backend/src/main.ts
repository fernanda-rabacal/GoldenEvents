import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Validation Pipe
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  // Swagger Documentation
  const docConfig = new DocumentBuilder()
    .setTitle('Golten Events API')
    .setDescription('Api para disponibilizar os serviços do golden events.')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, docConfig);
  SwaggerModule.setup('/docs', app, document);
  app.enableCors();

  await app.listen(8080);
}
bootstrap();
