import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UserDTO {
  @ApiProperty({
    example: '1',
    description: 'User ID',
  })
  @Expose()
  id: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @Expose()
  email: string;

  @ApiProperty({
    example: 'JohnDoe',
    description: 'User nickname',
  })
  @Expose()
  nickname: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'User full name',
    required: false,
  })
  @Expose()
  name?: string;

  @ApiProperty({
    example: 'New York',
    description: 'User city',
    required: false,
  })
  @Expose()
  city?: string;

  @ApiProperty({
    example: 'avatar.jpg',
    description: 'User avatar filename',
    required: false,
  })
  @Expose()
  avatar?: string;

  @ApiProperty({
    example: 'PLAYER',
    description: 'User role',
    enum: ['PLAYER', 'CLUB_ADMIN', 'CLUB_OWNER', 'ADMIN'],
  })
  @Expose()
  role: string;
}

export class UpdateUserProfileDto {
  @ApiProperty({
    example: 'JohnDoe',
    description: 'User nickname',
    required: false,
  })
  @IsString()
  @IsOptional()
  nickname?: string;

  @ApiProperty({
    example: 'avatar.jpg',
    description: 'User avatar filename',
    required: false,
  })
  @IsString()
  @IsOptional()
  avatar?: string;
}



