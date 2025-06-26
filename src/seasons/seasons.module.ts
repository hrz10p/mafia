import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeasonsService } from './seasons.service';
import { SeasonsController } from './seasons.controller';
import { Season } from './season.entity';
import { User } from '../users/user.entity';
import { Club } from '../clubs/club.entity';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Season, User, Club]),
    AuthModule,
    UsersModule,
  ],
  controllers: [SeasonsController],
  providers: [SeasonsService],
  exports: [SeasonsService],
})
export class SeasonsModule {} 