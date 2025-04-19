import { IsString, IsOptional } from 'class-validator';
import { ClubRequestStatus } from '../club-request.entity';
import { UserDTO } from '../../common/dto/user.dto';
import { ClubDTO } from './club.dto';

export class CreateJoinRequestDto {
  @IsString()
  @IsOptional()
  message?: string;
}

export class ClubRequestDTO {
  id: number;
  user: UserDTO;
  club: ClubDTO;
  status: ClubRequestStatus;
  message?: string;
  createdAt: Date;
  updatedAt: Date;
} 