import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api');

  const corsOrigin = configService.get('CORS_ORIGIN', 'http://localhost:9527');
  app.enableCors({
    origin: corsOrigin.split(','),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  const port = configService.get('PORT', 3000);
  const host = configService.get('HOST', '0.0.0.0');
  await app.listen(port, host);
  console.log(`服务运行在 ${host}:${port}`);
}
bootstrap();
