import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User } from '../users/user.entity';
import { Club } from '../clubs/club.entity';
import { ClubRequest } from '../clubs/club-request.entity';
import { Season } from '../seasons/season.entity';
import { Game } from '../games/game.entity';
import { Tournament } from '../tournaments/tournament.entity';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Club, ClubRequest, Season, Game, Tournament]),
    AuthModule,
    UsersModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {} 