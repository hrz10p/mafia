import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GamesService } from './games.service';
import { GamesController } from './games.controller';
import { Game } from './game.entity';
import { GamePlayer } from './game-player.entity';
import { User } from '../users/user.entity';
import { Club } from '../clubs/club.entity';
import { Season } from '../seasons/season.entity';
import { Tournament } from '../tournaments/tournament.entity';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Game, GamePlayer, User, Club, Season, Tournament]),
    AuthModule,
    UsersModule,
  ],
  controllers: [GamesController],
  providers: [GamesService],
  exports: [GamesService],
})
export class GamesModule {} 