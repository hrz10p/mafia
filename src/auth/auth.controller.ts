import { Controller, Post, Body, Query, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, SignupDto } from 'src/common/dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('signup')
  async signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Post('refresh')
  async refresh(@Body() { refreshToken }) {
    return this.authService.refreshTokens(refreshToken);
  }

  @Post('confirm')
  async confirm(@Query('token') token: string) {
    return this.authService.confirmUser(token);
  }
}
