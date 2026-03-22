import {
  Controller,
  Post,
  Body,
  Get,
  Put,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { GuestToUserDto } from './dto/guest-to-user.dto';
import { UpdateNicknameDto } from './dto/update-nickname.dto';
import { MergeGuestDto } from './dto/merge-guest.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AchievementService } from '../game/achievement.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly achievementService: AchievementService,
  ) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(
      registerDto.username,
      registerDto.password,
      registerDto.nickname,
    );
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.username, loginDto.password);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    return this.authService.getProfile(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  async updateProfile(
    @Request() req,
    @Body() updateDto: UpdateNicknameDto,
  ) {
    return this.authService.updateProfile(req.user.userId, updateDto);
  }

  @Post('guest-to-user')
  async convertGuestToUser(@Body() convertDto: GuestToUserDto) {
    return this.authService.convertGuestToUser(
      convertDto.username,
      convertDto.password,
      convertDto.guestId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('merge-guest')
  async mergeGuestData(@Request() req, @Body() mergeDto: MergeGuestDto) {
    return this.authService.mergeGuestData(req.user.userId, mergeDto.guestId);
  }

  @UseGuards(JwtAuthGuard)
  @Put('password')
  async changePassword(@Request() req, @Body() body: ChangePasswordDto) {
    return this.authService.changePassword(
      req.user.userId,
      body.oldPassword,
      body.newPassword,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('achievements')
  async getAchievements(@Request() req) {
    if (!req.user?.userId) {
      return [];
    }
    return this.achievementService.getUserAchievements(req.user.userId);
  }
}
