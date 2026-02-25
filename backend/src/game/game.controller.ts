import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { GameService } from './game.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('game')
@UseGuards(JwtAuthGuard)
export class GameController {
  constructor(private gameService: GameService) {}

  @Post('create')
  async createGame(
    @Body() body: { gameType: string; nickname: string },
    @Request() req,
  ) {
    try {
      const userId = req.user?.id;
      const guestId = req.headers['x-guest-id'];

      if (!userId && !guestId) {
        throw new HttpException('未授权', HttpStatus.UNAUTHORIZED);
      }

      return await this.gameService.createGame(
        body.gameType,
        userId,
        guestId,
        body.nickname,
      );
    } catch (error) {
      throw new HttpException(
        error.message || '创建房间失败',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('join')
  async joinGame(
    @Body() body: { roomCode: string; nickname: string },
    @Request() req,
  ) {
    try {
      const userId = req.user?.id;
      const guestId = req.headers['x-guest-id'];

      if (!userId && !guestId) {
        throw new HttpException('未授权', HttpStatus.UNAUTHORIZED);
      }

      return await this.gameService.joinGame(
        body.roomCode,
        userId,
        guestId,
        body.nickname,
      );
    } catch (error) {
      throw new HttpException(
        error.message || '加入房间失败',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('my-games')
  async getMyGames(@Request() req) {
    try {
      const userId = req.user?.id;
      const guestId = req.headers['x-guest-id'];

      if (!userId && !guestId) {
        return [];
      }

      return await this.gameService.getMyGames(userId, guestId);
    } catch (error) {
      throw new HttpException(
        error.message || '获取房间列表失败',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get(':roomCode')
  async getRoomDetail(@Param('roomCode') roomCode: string) {
    try {
      return await this.gameService.getRoomDetail(roomCode);
    } catch (error) {
      throw new HttpException(
        error.message || '获取房间详情失败',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post(':roomCode/score')
  async addScore(
    @Param('roomCode') roomCode: string,
    @Body() body: { fromPlayerId: number; toPlayerId: number; amount: number },
  ) {
    try {
      return await this.gameService.addScore(
        roomCode,
        body.fromPlayerId,
        body.toPlayerId,
        body.amount,
      );
    } catch (error) {
      throw new HttpException(
        error.message || '添加记分失败',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete(':roomCode/record/:recordId')
  async undoRecord(
    @Param('roomCode') roomCode: string,
    @Param('recordId') recordId: string,
  ) {
    try {
      return await this.gameService.undoRecord(roomCode, parseInt(recordId));
    } catch (error) {
      throw new HttpException(
        error.message || '撤销记录失败',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post(':roomCode/settle')
  async settleRoom(
    @Param('roomCode') roomCode: string,
    @Body() body: { clearRecords?: boolean },
  ) {
    try {
      return await this.gameService.settleRoom(
        roomCode,
        body.clearRecords || false,
      );
    } catch (error) {
      throw new HttpException(
        error.message || '结算失败',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post(':roomCode/finish')
  async finishRoom(@Param('roomCode') roomCode: string) {
    try {
      return await this.gameService.finishRoom(roomCode);
    } catch (error) {
      throw new HttpException(
        error.message || '结束房间失败',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
