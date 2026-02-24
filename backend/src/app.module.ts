import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { User } from './entities/user.entity';
import { Game } from './entities/game.entity';
import { Record } from './entities/record.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'database.sqlite',
      entities: [User, Game, Record],
      synchronize: true, // 开发环境自动同步表结构，生产环境改为 false
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
