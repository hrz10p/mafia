import { IsString, IsOptional } from 'class-validator';
import { ClubStatus } from '../club.entity';
import { UserDTO } from '../../common/dto/user.dto';

export class CreateClubDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateClubDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  logo?: string;
}

export class ClubDTO {
  id: number;
  name: string;
  description?: string;
  logo?: string;
  status: ClubStatus;
  owner: UserDTO;
  members: UserDTO[];
  createdAt: Date;
  updatedAt: Date;
} 