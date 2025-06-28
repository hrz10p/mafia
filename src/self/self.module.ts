import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SelfController } from './self.controller';
import { SelfService } from './self.service';
import { UsersModule } from '../users/users.module';
import { AuthGuard } from '../auth/authGuard.guard';
import { FilesModule } from '../files/files.module';
import { AuthModule } from 'src/auth/auth.module';
import { User } from '../users/user.entity';
import { Club } from '../clubs/club.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Club]),
    UsersModule, 
    FilesModule, 
    AuthModule
  ],
  controllers: [SelfController],
  providers: [SelfService, AuthGuard],
})
export class SelfModule {}
