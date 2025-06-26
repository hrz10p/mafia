import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RatingsController } from './ratings.controller';
import { RatingsService } from './ratings.service';
import { User } from '../users/user.entity';
import { Season } from '../seasons/season.entity';
import { Tournament } from '../tournaments/tournament.entity';
import { Game } from '../games/game.entity';
import { GamePlayer } from '../games/game-player.entity';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Season, Tournament, Game, GamePlayer]),
    AuthModule,
    UsersModule,
  ],
  controllers: [RatingsController],
  providers: [RatingsService],
  exports: [RatingsService],
})
export class RatingsModule {} 