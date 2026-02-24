import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(
    @Body() body: { username: string; password: string; nickname: string },
  ) {
    return this.authService.register(
      body.username,
      body.password,
      body.nickname,
    );
  }

  @Post('login')
  async login(@Body() body: { username: string; password: string }) {
    return this.authService.login(body.username, body.password);
  }

  @UseGuards(AuthGuard)
  @Get('me')
  async getProfile(@Request() req) {
    return this.authService.getUserInfo(req.user.id);
  }
}
