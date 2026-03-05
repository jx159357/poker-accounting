import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  Request,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import { GameService } from './game.service';

@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post('create')
  async createGame(@Body() body: any) {
    return this.gameService.createGame(
      body.name,
      body.gameType || '其他',
      body.creatorId,
      body.creatorType,
      body.nickname,
    );
  }

  @Post('join/:roomCode')
  async joinGame(@Param('roomCode') roomCode: string, @Body() body: any) {
    return this.gameService.joinGame(
      roomCode,
      body.nickname,
      body.playerId,
      body.playerType,
    );
  }

  @Get(':roomCode')
  async getGameDetail(@Param('roomCode') roomCode: string) {
    return this.gameService.getGameDetail(roomCode);
  }

  @Get('my-games/list')
  async getMyGames(
    @Query('playerId') playerId: string,
    @Query('playerType') playerType: string,
  ) {
    return this.gameService.getMyGames(playerId, playerType);
  }

  @Post(':roomCode/score')
  async addScore(@Param('roomCode') roomCode: string, @Body() body: any) {
    return this.gameService.addScore(
      roomCode,
      body.fromPlayerId,
      body.toPlayerId,
      body.score,
      body.note,
    );
  }

  @Delete(':roomCode/score/:recordId')
  async undoScore(
    @Param('roomCode') roomCode: string,
    @Param('recordId') recordId: string,
    @Headers('x-guest-id') guestId: string,
    @Request() req,
  ) {
    // 获取请求者ID
    let requesterId: string;

    if (req.user) {
      // 注册用户
      requesterId = `user_${req.user.username}`;
    } else if (guestId) {
      // 游客
      requesterId = guestId;
    } else {
      throw new BadRequestException('未授权');
    }

    await this.gameService.undoScore(roomCode, parseInt(recordId), requesterId);

    return { message: '撤销成功' };
  }

  @Patch(':roomCode/player/:playerId/nickname')
  async updatePlayerNickname(
    @Param('roomCode') roomCode: string,
    @Param('playerId') playerId: number,
    @Body() body: any,
  ) {
    return this.gameService.updatePlayerNickname(
      roomCode,
      playerId,
      body.nickname,
    );
  }

  @Post(':roomCode/end')
  async endGame(@Param('roomCode') roomCode: string) {
    return this.gameService.endGame(roomCode);
  }

  @Delete(':roomCode')
  async deleteGame(@Param('roomCode') roomCode: string, @Body() body: any) {
    return this.gameService.deleteGame(roomCode, body.requesterId);
  }

  @Get('stats/data')
  async getStats(
    @Query('playerId') playerId: string,
    @Query('playerType') playerType: string,
  ) {
    return this.gameService.getStats(playerId, playerType);
  }
}
