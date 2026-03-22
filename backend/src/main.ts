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
  await app.listen(port);
  console.log(`服务运行在端口 ${port}`);
}
bootstrap();
