import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ClubRequestStatus, ClubRequestType } from '../club-request.entity';
import { UserDTO } from '../../common/dto/user.dto';
import { ClubDTO } from './club.dto';
import { ApiProperty } from '@nestjs/swagger';

export class CreateJoinRequestDto {
  @ApiProperty({
    example: 'I would like to join your club',
    description: 'Join request message',
    required: false,
  })
  @IsString()
  @IsOptional()
  message?: string;
}

export class CreateClubRequestDto {
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
  @IsString()
  @IsOptional()
  socialMediaLink?: string;

  @ApiProperty({
    example: 'I would like to create a new club',
    description: 'Request message',
    required: false,
  })
  @IsString()
  @IsOptional()
  message?: string;
}

export class ClubRequestDTO {
  @ApiProperty({
    example: 1,
    description: 'Request ID',
  })
  id: number;

  @ApiProperty({
    type: UserDTO,
    description: 'User who created the request',
  })
  user: UserDTO;

  @ApiProperty({
    type: ClubDTO,
    description: 'Club the request is for',
  })
  club: ClubDTO;

  @ApiProperty({
    example: 'MEMBERSHIP',
    description: 'Request type',
    enum: ['CLUB_CREATION', 'MEMBERSHIP'],
  })
  @IsEnum(ClubRequestType)
  type: ClubRequestType;

  @ApiProperty({
    example: 'PENDING',
    description: 'Request status',
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
  })
  @IsEnum(ClubRequestStatus)
  status: ClubRequestStatus;

  @ApiProperty({
    example: 'I would like to join your club',
    description: 'Request message',
    required: false,
  })
  message?: string;

  @ApiProperty({
    example: '2024-03-14T12:00:00Z',
    description: 'Request creation date',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-03-14T12:00:00Z',
    description: 'Request last update date',
  })
  updatedAt: Date;
} 