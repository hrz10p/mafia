import { IsString, IsOptional, IsUrl } from 'class-validator';
import { ClubStatus } from '../club.entity';
import { UserDTO } from '../../common/dto/user.dto';
import { ApiProperty } from '@nestjs/swagger';

export class CreateClubDto {
  @ApiProperty({
    example: 'Mafia Club',
    description: 'Club name',
  })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'A club for mafia game enthusiasts',
    description: 'Club description',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: 'New York',
    description: 'Club city',
    required: false,
  })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({
    example: 'https://facebook.com/mafiaclub',
    description: 'Club social media link',
    required: false,
  })
  @IsUrl()
  @IsOptional()
  socialMediaLink?: string;
}

export class UpdateClubDto {
  @ApiProperty({
    example: 'Mafia Club',
    description: 'Club name',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    example: 'A club for mafia game enthusiasts',
    description: 'Club description',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: 'club-logo.jpg',
    description: 'Club logo filename',
    required: false,
  })
  @IsString()
  @IsOptional()
  logo?: string;

  @ApiProperty({
    example: 'New York',
    description: 'Club city',
    required: false,
  })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({
    example: 'https://facebook.com/mafiaclub',
    description: 'Club social media link',
    required: false,
  })
  @IsUrl()
  @IsOptional()
  socialMediaLink?: string;
}

export class ClubDTO {
  @ApiProperty({
    example: 1,
    description: 'Club ID',
  })
  id: number;

  @ApiProperty({
    example: 'Mafia Club',
    description: 'Club name',
  })
  name: string;

  @ApiProperty({
    example: 'A club for mafia game enthusiasts',
    description: 'Club description',
    required: false,
  })
  description?: string;

  @ApiProperty({
    example: 'club-logo.jpg',
    description: 'Club logo filename',
    required: false,
  })
  logo?: string;

  @ApiProperty({
    example: 'New York',
    description: 'Club city',
    required: false,
  })
  city?: string;

  @ApiProperty({
    example: 'https://facebook.com/mafiaclub',
    description: 'Club social media link',
    required: false,
  })
  socialMediaLink?: string;

  @ApiProperty({
    example: 'PENDING',
    description: 'Club status',
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
  })
  status: ClubStatus;

  @ApiProperty({
    type: UserDTO,
    description: 'Club owner',
  })
  owner: UserDTO;

  @ApiProperty({
    type: [UserDTO],
    description: 'Club administrators',
  })
  administrators: UserDTO[];

  @ApiProperty({
    type: [UserDTO],
    description: 'Club members',
  })
  members: UserDTO[];

  @ApiProperty({
    example: 1500,
    description: 'Club ELO rating (average of all members)',
  })
  elo: number;

  @ApiProperty({
    example: '2024-03-14T12:00:00Z',
    description: 'Club creation date',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-03-14T12:00:00Z',
    description: 'Club last update date',
  })
  updatedAt: Date;
} 