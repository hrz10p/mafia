import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class AdminUpdateUserDto {
  @ApiPropertyOptional({ description: 'Новый email пользователя', example: 'new@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Новый никнейм пользователя', example: 'NewNick' })
  @IsOptional()
  @IsString()
  nickname?: string;
}


