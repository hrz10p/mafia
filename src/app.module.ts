import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { CacheService } from './cache/cache.service';
import { SelfModule } from './self/self.module';
import { ClubsModule } from './clubs/clubs.module';
import { User } from './users/user.entity';
import { Club } from './clubs/club.entity';
import { ClubRequest } from './clubs/club-request.entity';

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
        entities: [User, Club, ClubRequest],
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
  ],
  providers: [CacheService],
  exports: [CacheService],
  controllers: [],
})
export class AppModule {}
