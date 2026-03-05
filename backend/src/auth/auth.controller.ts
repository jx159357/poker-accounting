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

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body()
    registerDto: {
      username: string;
      password: string;
      nickname?: string;
    },
  ) {
    return this.authService.register(
      registerDto.username,
      registerDto.password,
      registerDto.nickname,
    );
  }

  @Post('login')
  async login(@Body() loginDto: { username: string; password: string }) {
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
    @Body() updateDto: { nickname?: string },
  ) {
    return this.authService.updateProfile(req.user.userId, updateDto);
  }

  @Post('guest-to-user')
  async convertGuestToUser(
    @Body() convertDto: { username: string; password: string; guestId: string },
  ) {
    return this.authService.convertGuestToUser(
      convertDto.username,
      convertDto.password,
      convertDto.guestId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('merge-guest')
  async mergeGuestData(@Request() req, @Body() mergeDto: { guestId: string }) {
    return this.authService.mergeGuestData(req.user.userId, mergeDto.guestId);
  }
}
