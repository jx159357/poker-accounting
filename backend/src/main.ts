import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: true, // 允许所有来源（开发环境）
    credentials: true,
  });

  await app.listen(3000);
  console.log('后端服务运行在: http://localhost:3000');
}
bootstrap();
