import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { ConfigModule } from '@nestjs/config';
import { AuthGuard } from '../auth/authGuard.guard';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [ConfigModule, AuthModule, UsersModule],
  controllers: [FilesController],
  providers: [FilesService, AuthGuard],
  exports: [FilesService],
})
export class FilesModule {} 