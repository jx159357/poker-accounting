import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Request,
} from '@nestjs/common';
import { GameService } from './game.service';

@Controller('game')
export class GameController {
  constructor(private gameService: GameService) {}

  // 创建房间
  @Post('create')
  async createRoom(
    @Body() body: { gameType: string; nickname: string; guestId?: string },
    @Request() req,
  ) {
    const userId = req.user?.id;
    return this.gameService.createRoom(
      body.gameType,
      body.nickname,
      userId,
      body.guestId,
    );
  }

  // 加入房间
  @Post('join')
  async joinRoom(
    @Body() body: { roomCode: string; nickname: string; guestId?: string },
    @Request() req,
  ) {
    const userId = req.user?.id;
    return this.gameService.joinRoom(
      body.roomCode,
      body.nickname,
      userId,
      body.guestId,
    );
  }

  // 获取房间详情
  @Get(':roomCode')
  async getGameDetail(@Param('roomCode') roomCode: string) {
    return this.gameService.getGameDetail(roomCode);
  }

  // 记账
  @Post(':roomCode/score')
  async addScore(
    @Param('roomCode') roomCode: string,
    @Body()
    body: {
      fromPlayerId: number;
      toPlayerId: number;
      amount: number;
      note?: string;
    },
  ) {
    return this.gameService.addScore(
      roomCode,
      body.fromPlayerId,
      body.toPlayerId,
      body.amount,
      body.note,
    );
  }

  // 撤销记账
  @Post(':roomCode/undo')
  async undoRecord(
    @Param('roomCode') roomCode: string,
    @Body() body: { recordId: number },
  ) {
    return this.gameService.undoRecord(roomCode, body.recordId);
  }

  // 结算
  @Post(':roomCode/settle')
  async settleRoom(
    @Param('roomCode') roomCode: string,
    @Body() body: { keepRecords?: boolean },
  ) {
    return this.gameService.settleRoom(roomCode, body.keepRecords || false);
  }

  // 获取用户的所有房间
  @Get('user/list')
  async getUserGames(
    @Query('guestId') guestId: string,
    @Query('nickname') nickname: string,
    @Request() req,
  ) {
    const userId = req.user?.id;
    return this.gameService.getUserGames(userId, guestId, nickname);
  }
}
