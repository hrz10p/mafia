import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import { MailService } from 'src/mail/mail.service';
import { plainToClass } from 'class-transformer';
import { LoginDto, SignupDto } from 'src/common/dto/auth.dto';
import { CacheService } from 'src/cache/cache.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    private readonly cacheService: CacheService,
  ) {}

  async refreshTokens(token: string) {
    const payload = this.jwtService.verify(token);
    return this.generateTokens({ email: payload.email, id: payload.id });
  }

  async signup(dto: SignupDto) {
    const user = await this.usersService.createUser(dto);
    const token = Math.floor(1000 + Math.random() * 9000).toString();
    this.cacheService.set(token, user, 60 * 60 * 24);
    return this.login(plainToClass(LoginDto, dto));
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.validateUser(dto);
    if (!user) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }
    const payload = { email: user.email, id: user.id, role: user.role };
    const tokens = await this.generateTokens(payload);
    return {
      user,
      tokens,
    };
  }

  async confirmUser(token: string) {
    const user = await this.cacheService.getWithDelete(token);
    if (!user) {
      throw new HttpException('Invalid token', HttpStatus.BAD_REQUEST);
    }

    return this.usersService.confirmUser(user.email);
  }

  // UTILS

  async verifyToken(token: string, secret: any) {
    return this.jwtService.verifyAsync(token, secret);
  }

  async generateTokens(payload: any) {
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRATION'),
    });
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION'),
    });

    return {
      accessToken,
      refreshToken,
    };
  }
}
