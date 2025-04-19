import { Expose } from 'class-transformer';

export class UserDTO {
  @Expose()
  id: string;

  @Expose()
  email: string;

  @Expose()
  nickname: string;

  @Expose()
  name?: string;

  @Expose()
  city?: string;

  @Expose()
  avatar?: string;

  @Expose()
  role: string;
}

import { IsString, IsOptional } from 'class-validator';

export class UpdateUserProfileDto {
  @IsString()
  @IsOptional()
  nickname?: string;

  @IsString()
  @IsOptional()
  avatar?: string;
}



