import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClubsController } from './clubs.controller';
import { ClubsService } from './clubs.service';
import { Club } from './club.entity';
import { ClubRequest } from './club-request.entity';
import { User } from '../users/user.entity';
import { UsersModule } from '../users/users.module';
import { AuthGuard } from '../auth/authGuard.guard';
import { AuthModule } from '../auth/auth.module';
import { FilesModule } from '../files/files.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([Club, User, ClubRequest]),
    UsersModule,
    AuthModule,
    FilesModule,
  ],
  controllers: [ClubsController],
  providers: [ClubsService, AuthGuard],
  exports: [ClubsService],
})
export class ClubsModule {} 