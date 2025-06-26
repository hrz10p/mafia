import { applyDecorators } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { UserRole } from '../enums/roles.enum';

export function ApiRoles(roles: UserRole[], description?: string) {
  const roleDescriptions = {
    [UserRole.PLAYER]: 'Игрок',
    [UserRole.JUDGE]: 'Судья',
    [UserRole.CLUB_ADMIN]: 'Администратор клуба',
    [UserRole.CLUB_OWNER]: 'Владелец клуба',
    [UserRole.ADMIN]: 'Администратор системы',
  };

  const roleNames = roles.map(role => roleDescriptions[role]).join(', ');
  const fullDescription = description 
    ? `${description}\n\n**Требуемые роли:** ${roleNames}`
    : `**Требуемые роли:** ${roleNames}`;

  return applyDecorators(
    ApiOperation({ 
      description: fullDescription,
    })
  );
} 