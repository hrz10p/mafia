import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './user.entity';
import { UserRoleStats } from './user-role-stats.entity';
import { UserRoleStatsService } from './user-role-stats.service';
import { Club } from '../clubs/club.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserRoleStats, Club]),
  ],
  providers: [UsersService, UserRoleStatsService],
  controllers: [UsersController],
  exports: [UsersService, UserRoleStatsService, TypeOrmModule],
})
export class UsersModule {}
