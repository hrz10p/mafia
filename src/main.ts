import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,              // удаляет лишние поля
      forbidNonWhitelisted: true,   // кидает ошибку, если есть лишние поля
      transform: true,              // кастит string -> number и т.д.
    }),
  );

  await app.listen(3000);
}
bootstrap();
