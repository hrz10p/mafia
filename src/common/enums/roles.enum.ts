export enum UserRole {
  PLAYER = 'player',
  CLUB_ADMIN = 'club_admin',
  CLUB_OWNER = 'club_owner',
  ADMIN = 'admin',
}

export const RoleHierarchy = {
  [UserRole.PLAYER]: [UserRole.PLAYER],
  [UserRole.CLUB_ADMIN]: [UserRole.PLAYER, UserRole.CLUB_ADMIN],
  [UserRole.CLUB_OWNER]: [UserRole.PLAYER, UserRole.CLUB_ADMIN, UserRole.CLUB_OWNER],
  [UserRole.ADMIN]: [UserRole.PLAYER, UserRole.CLUB_ADMIN, UserRole.CLUB_OWNER, UserRole.ADMIN],
}; 