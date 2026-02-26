import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { GameModule } from './game/game.module';
import { User } from './entities/user.entity';
import { Game } from './entities/game.entity';
import { GamePlayer } from './entities/game-player.entity';
import { GameRecord } from './entities/game-record.entity';
import { Record } from './entities/record.entity';

@Module({
  imports: [
    // 添加 ConfigModule，必须放在最前面
    ConfigModule.forRoot({
      isGlobal: true, // 设置为全局模块，所有模块都可以使用
      envFilePath: '.env', // 指定 .env 文件路径
    }),
    // 添加限流模块
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60秒
        limit: 10, // 最多10次请求
      },
    ]),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'poker.db',
      entities: [User, Game, GamePlayer, GameRecord, Record],
      synchronize: false, // 改为 false，生产环境不要自动同步
      logging: false, // 改为 false，减少日志输出
      extra: {
        // 开启 WAL 模式
        pragma: [
          'journal_mode = WAL',
          'synchronous = NORMAL',
          'cache_size = -64000',
          'temp_store = MEMORY',
        ],
      },
    }),
    AuthModule,
    GameModule,
  ],
  providers: [
    // 全局启用限流守卫
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
