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
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { GameService } from './game.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateGameDto } from './dto/create-game.dto';
import { JoinGameDto } from './dto/join-game.dto';
import { AddScoreDto } from './dto/add-score.dto';
import { UpdatePlayerNicknameDto } from './dto/update-player-nickname.dto';
import { DeleteGameDto } from './dto/delete-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { AchievementService } from './achievement.service';

@Controller('game')
export class GameController {
  constructor(
    private readonly gameService: GameService,
    private readonly achievementService: AchievementService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('create')
  async createGame(@Body() body: CreateGameDto, @Request() req) {
    return this.gameService.createGame(
      body.name,
      body.gameType || '其他',
      body.creatorId,
      body.creatorType,
      body.nickname,
      req.user,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('join/:roomCode')
  async joinGame(
    @Param('roomCode') roomCode: string,
    @Body() body: JoinGameDto,
    @Request() req,
  ) {
    return this.gameService.joinGame(
      roomCode,
      body.nickname,
      body.playerId,
      body.playerType,
      req.user,
    );
  }

  // === 具名路由放在 :roomCode 之前 ===

  @UseGuards(JwtAuthGuard)
  @Get('my-games/list')
  async getMyGames(
    @Request() req,
    @Query('playerId') playerId: string,
    @Query('playerType') playerType: string,
    @Query('gameType') gameType?: string,
    @Query('status') status?: string,
    @Query('recentDays') recentDays?: string,
  ) {
    const filters: any = {};
    if (gameType) filters.gameType = gameType;
    if (status) filters.status = status;
    if (recentDays) filters.recentDays = parseInt(recentDays, 10);
    return this.gameService.getMyGames(
      playerId,
      playerType,
      Object.keys(filters).length ? filters : undefined,
      req.user,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('stats/data')
  async getStats(
    @Request() req,
    @Query('playerId') playerId: string,
    @Query('playerType') playerType: string,
  ) {
    const effectivePlayerId = req.user?.username
      ? `user_${req.user.username}`
      : playerId;
    const effectivePlayerType = req.user?.userId ? 'user' : playerType;
    return this.gameService.getStats(effectivePlayerId, effectivePlayerType);
  }

  @UseGuards(JwtAuthGuard)
  @Get('stats/opponents')
  async getOpponentStats(
    @Request() req,
    @Query('playerId') playerId: string,
    @Query('playerType') playerType: string,
  ) {
    const effectivePlayerId = req.user?.username
      ? `user_${req.user.username}`
      : playerId;
    const effectivePlayerType = req.user?.userId ? 'user' : playerType;
    return this.gameService.getOpponentStats(
      effectivePlayerId,
      effectivePlayerType,
    );
  }

  @Get('stats/leaderboard')
  async getLeaderboard(@Query('limit') limit?: string) {
    return this.gameService.getLeaderboard(limit ? parseInt(limit) : 20);
  }

  @UseGuards(JwtAuthGuard)
  @Get('stats/achievements')
  async getAchievements(@Request() req) {
    if (!req.user?.userId) {
      return [];
    }
    return this.achievementService.getUserAchievements(req.user.userId);
  }

  // === 通配符路由 ===

  @Get(':roomCode')
  async getGameDetail(@Param('roomCode') roomCode: string) {
    return this.gameService.getGameDetail(roomCode);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':roomCode/score')
  async addScore(
    @Param('roomCode') roomCode: string,
    @Body() body: AddScoreDto,
    @Request() req,
  ) {
    return this.gameService.addScore(
      roomCode,
      body.fromPlayerId,
      body.toPlayerId,
      body.score,
      body.note,
      body.requesterId,
      req.user,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':roomCode/score/:recordId')
  async undoScore(
    @Param('roomCode') roomCode: string,
    @Param('recordId') recordId: string,
    @Body('requesterId') requesterId: string,
    @Request() req,
  ) {
    if (!requesterId) {
      throw new BadRequestException('请提供请求者ID');
    }

    await this.gameService.undoScore(
      roomCode,
      parseInt(recordId),
      requesterId,
      req.user,
    );

    return { message: '撤销成功' };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':roomCode/player/:playerId/nickname')
  async updatePlayerNickname(
    @Param('roomCode') roomCode: string,
    @Param('playerId') playerId: number,
    @Body() body: UpdatePlayerNicknameDto,
    @Request() req,
  ) {
    return this.gameService.updatePlayerNickname(
      roomCode,
      playerId,
      body.nickname,
      body.requesterId,
      req.user,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post(':roomCode/end')
  async endGame(
    @Param('roomCode') roomCode: string,
    @Body('requesterId') requesterId: string,
    @Request() req,
  ) {
    return this.gameService.endGame(roomCode, requesterId, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':roomCode')
  async deleteGame(
    @Param('roomCode') roomCode: string,
    @Body() body: DeleteGameDto,
    @Request() req,
  ) {
    return this.gameService.deleteGame(roomCode, body.requesterId, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':roomCode')
  async updateGame(
    @Param('roomCode') roomCode: string,
    @Request() req,
    @Body() body: UpdateGameDto,
  ) {
    return this.gameService.updateGame(roomCode, req.user.userId, body);
  }
}
