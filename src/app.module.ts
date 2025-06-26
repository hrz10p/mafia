import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { CacheService } from './cache/cache.service';
import { SelfModule } from './self/self.module';
import { ClubsModule } from './clubs/clubs.module';
import { SeasonsModule } from './seasons/seasons.module';
import { GamesModule } from './games/games.module';
import { TournamentsModule } from './tournaments/tournaments.module';
import { AdminModule } from './admin/admin.module';
import { RatingsModule } from './ratings/ratings.module';
import { User } from './users/user.entity';
import { Club } from './clubs/club.entity';
import { ClubRequest } from './clubs/club-request.entity';
import { Season } from './seasons/season.entity';
import { Game } from './games/game.entity';
import { GamePlayer } from './games/game-player.entity';
import { Tournament } from './tournaments/tournament.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('POSTGRES_HOST'),
        port: configService.get<number>('POSTGRES_PORT'),
        username: configService.get<string>('POSTGRES_USER'),
        password: configService.get<string>('POSTGRES_PASSWORD'),
        database: configService.get<string>('POSTGRES_DATABASE'),
        entities: [User, Club, ClubRequest, Season, Game, GamePlayer, Tournament],
        synchronize: true,
        dropSchema: true,
        ssl: configService.get<boolean>('DB_SSL')
          ? { rejectUnauthorized: false }
          : false,
      }),
    }),
    UsersModule,
    AuthModule,
    MailModule,
    SelfModule,
    ClubsModule,
    SeasonsModule,
    GamesModule,
    TournamentsModule,
    AdminModule,
    RatingsModule,
  ],
  providers: [CacheService],
  exports: [CacheService],
  controllers: [],
})
export class AppModule {}
