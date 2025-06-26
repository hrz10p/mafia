import { ApiProperty } from '@nestjs/swagger';

export class UserSearchResultDto {
  @ApiProperty({ description: 'ID пользователя' })
  id: number;

  @ApiProperty({ description: 'Email пользователя' })
  email: string;

  @ApiProperty({ description: 'Имя пользователя' })
  name: string;

  @ApiProperty({ description: 'Роль пользователя' })
  role: string;

  @ApiProperty({ description: 'Клуб пользователя (если есть)' })
  club?: string;
}

export class SearchUsersDto {
  @ApiProperty({ description: 'Email для поиска (частичное совпадение)' })
  email: string;

  @ApiProperty({ description: 'Максимальное количество результатов', default: 10 })
  limit?: number;
} 