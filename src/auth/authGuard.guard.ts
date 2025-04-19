import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    console.log('token', token);

    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const payload = await this.authService.verifyToken(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      console.log('payload', payload);
      // Fetch fresh user data including roles
      const user = await this.usersService.getUserById(payload.id);
      console.log('user', user);
      if (!user) {
        throw new UnauthorizedException();
      }

      // Attach fresh user data to request
      request.user = user;
    } catch (error) {
      console.log('error', error);
      throw new UnauthorizedException();
    }

    return true;
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
