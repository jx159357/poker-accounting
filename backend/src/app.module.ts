import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { GameModule } from './game/game.module';

@Module({
  imports: [
    // 启用定时任务
    ScheduleModule.forRoot(),

    // 配置限流 - 放宽限制
    ThrottlerModule.forRoot([{
      ttl: 60000, // 60秒
      limit: 99999, // 100次请求
    }]),

    // 数据库配置
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'poker-accounting.db',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
    }),

    AuthModule,
    UserModule,
    GameModule,
  ],
})
export class AppModule {}
