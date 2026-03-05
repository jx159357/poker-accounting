import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { GameModule } from './game/game.module';

@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // 定时任务
    ScheduleModule.forRoot(),

    // 限流配置
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60秒
        limit: 99999, // 100次请求
      },
    ]),

    // 数据库配置
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'poker-accounting.db',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
    }),

    AuthModule,
    GameModule,
  ],
})
export class AppModule {}
