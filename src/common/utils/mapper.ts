// user.mapper.ts
import { plainToInstance, instanceToPlain } from 'class-transformer';
import { UserDTO } from '../dto/user.dto';
import { User } from './../../users/user.entity';

export class UserMapper {
  static toDTO(entity: User): UserDTO {
    return plainToInstance(UserDTO, entity, {
      excludeExtraneousValues: true,
    });
  }

  static fromDTO(dto: UserDTO): User {
    return plainToInstance(User, instanceToPlain(dto));
  }

  static toDTOList(entities: User[] | undefined | null): UserDTO[] {
    if (!entities) return [];
    return entities.map(this.toDTO);
  }

  static fromDTOList(dtos: UserDTO[] | undefined | null): User[] {
    if (!dtos) return [];
    return dtos.map(this.fromDTO);
  }
}