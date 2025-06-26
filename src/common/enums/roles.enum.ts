export enum UserRole {
  PLAYER = 'player',
  JUDGE = 'judge',
  CLUB_ADMIN = 'club_admin',
  CLUB_OWNER = 'club_owner',
  ADMIN = 'admin',
}

export const RoleHierarchy = {
  [UserRole.PLAYER]: [UserRole.PLAYER],
  [UserRole.JUDGE]: [UserRole.PLAYER, UserRole.JUDGE],
  [UserRole.CLUB_ADMIN]: [UserRole.PLAYER, UserRole.JUDGE, UserRole.CLUB_ADMIN],
  [UserRole.CLUB_OWNER]: [UserRole.PLAYER, UserRole.JUDGE, UserRole.CLUB_ADMIN, UserRole.CLUB_OWNER],
  [UserRole.ADMIN]: [UserRole.PLAYER, UserRole.JUDGE, UserRole.CLUB_ADMIN, UserRole.CLUB_OWNER, UserRole.ADMIN],
}; 