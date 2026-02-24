import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 启用 CORS
  app.enableCors({
    origin: 'http://localhost:5173', // 前端地址
    credentials: true,
  });

  await app.listen(3000);
  console.log('后端服务运行在: http://localhost:3000');
}
bootstrap();
