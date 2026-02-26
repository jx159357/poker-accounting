import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Delete,
} from '@nestjs/common';
import { GameService } from './game.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  // 创建游戏房间
  @Post('create')
  async createGame(@Body() body: any, @Request() req: any) {
    try {
      const userId = req.user?.userId;
      const guestId = body.guestId;

      return await this.gameService.createGame(
        body.name,
        body.buyIn,
        body.players,
        userId,
        guestId,
      );
    } catch (error) {
      throw error;
    }
  }

  // 加入游戏房间
  @Post('join/:roomCode')
  async joinGame(
    @Param('roomCode') roomCode: string,
    @Body() body: any,
    @Request() req: any,
  ) {
    try {
      return await this.gameService.joinGame(roomCode, body.nickname);
    } catch (error) {
      throw error;
    }
  }

  // 获取我的游戏列表
  @Get('my-games')
  async getMyGames(@Query('guestId') guestId: string, @Request() req: any) {
    try {
      const userId = req.user?.userId;
      return await this.gameService.getMyGames(userId, guestId);
    } catch (error) {
      throw error;
    }
  }

  // 获取房间详情
  @Get('room/:roomCode')
  async getRoomDetail(@Param('roomCode') roomCode: string) {
    try {
      return await this.gameService.getRoomDetail(roomCode);
    } catch (error) {
      throw error;
    }
  }

  // 添加记录
  @Post('room/:roomCode/score')
  async addScore(@Param('roomCode') roomCode: string, @Body() body: any) {
    try {
      return await this.gameService.addScore(
        roomCode,
        body.playerId,
        Number(body.amount),
        body.type,
      );
    } catch (error) {
      throw error;
    }
  }

  // 撤销记录
  @Delete('room/:roomCode/record/:recordId')
  async undoRecord(
    @Param('roomCode') roomCode: string,
    @Param('recordId') recordId: string,
  ) {
    try {
      return await this.gameService.undoRecord(roomCode, parseInt(recordId));
    } catch (error) {
      throw error;
    }
  }

  // 结算房间
  @Post('room/:roomCode/settle')
  async settleRoom(
    @Param('roomCode') roomCode: string,
    @Body() body: any,
    @Request() req: any,
  ) {
    try {
      const userId = req.user?.userId;
      const guestId = body.guestId;

      return await this.gameService.settleRoom(
        roomCode,
        body.clearRecords || false,
        userId,
        guestId,
      );
    } catch (error) {
      throw error;
    }
  }

  // 结束房间
  @Post('room/:roomCode/finish')
  async finishRoom(@Param('roomCode') roomCode: string) {
    try {
      return await this.gameService.finishRoom(roomCode);
    } catch (error) {
      throw error;
    }
  }

  // 获取统计数据
  @Get('statistics')
  @UseGuards(JwtAuthGuard)
  async getStatistics(@Request() req: any) {
    try {
      const userId = req.user.userId;
      return await this.gameService.getStatistics(userId);
    } catch (error) {
      throw error;
    }
  }
}
