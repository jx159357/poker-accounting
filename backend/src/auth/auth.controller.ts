import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  UseGuards,
  Request,
  Headers,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { MigrateDto } from './dto/migrate.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async register(
    @Body() registerDto: RegisterDto,
    @Headers('x-guest-id') guestId: string,
  ) {
    return this.authService.register(registerDto, guestId);
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Request() req) {
    if (!req.user) {
      return { user: null };
    }
    return this.authService.getUserInfo(req.user.userId);
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(@Request() req, @Body() body: { nickname?: string }) {
    return this.authService.updateProfile(req.user.userId, body);
  }

  @Post('migrate')
  @UseGuards(JwtAuthGuard)
  async migrate(@Request() req, @Body() migrateDto: MigrateDto) {
    return this.authService.migrate(req.user.userId, migrateDto);
  }
}
