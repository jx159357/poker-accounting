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
  Headers,
} from '@nestjs/common';
import { GameService } from './game.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateGameDto } from './dto/create-game.dto';

@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  // 创建游戏房间
  @Post('create')
  @UseGuards(JwtAuthGuard)
  async createGame(
    @Body() dto: CreateGameDto,
    @Request() req: any,
    @Headers('x-guest-id') guestId: string,
  ) {
    const userId = req.user?.userId;
    dto.guestId = dto.guestId || guestId;
    return await this.gameService.createGame(dto, userId);
  }

  // 加入游戏房间
  @Post('join/:roomCode')
  @UseGuards(JwtAuthGuard)
  async joinGame(
    @Param('roomCode') roomCode: string,
    @Body() body: any,
    @Request() req: any,
    @Headers('x-guest-id') guestId: string,
  ) {
    const userId = req.user?.userId;
    const nickname = body.nickname || body.name;
    return await this.gameService.joinGame(
      roomCode,
      nickname,
      userId,
      guestId,
    );
  }

  // 获取我的游戏列表
  @Get('my-games')
  @UseGuards(JwtAuthGuard)
  async getMyGames(
    @Query('guestId') queryGuestId: string,
    @Request() req: any,
    @Headers('x-guest-id') headerGuestId: string,
  ) {
    const userId = req.user?.userId;
    const guestId = queryGuestId || headerGuestId;
    return await this.gameService.getMyGames(userId, guestId);
  }

  // 获取房间详情
  @Get('room/:roomCode')
  async getRoomDetail(@Param('roomCode') roomCode: string) {
    return await this.gameService.getRoomDetail(roomCode);
  }

  // 添加转账
  @Post('room/:roomCode/transaction')
  async addTransaction(
    @Param('roomCode') roomCode: string,
    @Body() body: any,
  ) {
    return await this.gameService.addTransaction(
      roomCode,
      body.fromPlayerId,
      body.toPlayerId,
      Number(body.amount),
      body.remark,
    );
  }

  // 撤销转账
  @Delete('room/:roomCode/transaction/:transactionId')
  async undoTransaction(
    @Param('roomCode') roomCode: string,
    @Param('transactionId') transactionId: string,
  ) {
    return await this.gameService.undoTransaction(
      roomCode,
      parseInt(transactionId),
    );
  }

  // 结算房间
  @Post('room/:roomCode/settle')
  @UseGuards(JwtAuthGuard)
  async settleRoom(@Param('roomCode') roomCode: string) {
    return await this.gameService.settleRoom(roomCode);
  }

  // 结束房间
  @Post('room/:roomCode/finish')
  async finishRoom(@Param('roomCode') roomCode: string) {
    return await this.gameService.finishRoom(roomCode);
  }

  // 获取统计数据
  @Get('statistics')
  @UseGuards(JwtAuthGuard)
  async getStatistics(@Request() req: any) {
    const userId = req.user.userId;
    return await this.gameService.getStatistics(userId);
  }
}
