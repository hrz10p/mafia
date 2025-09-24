import { PlayerRole } from '../../games/game-player.entity';
import { GameResult } from '../../games/game.entity';

/**
 * Утилита для расчета баллов за победу в зависимости от роли и результата игры
 */

export interface WinPointsConfig {
  role: PlayerRole;
  gameResult: GameResult;
  points: number;
}

/**
 * Конфигурация баллов за победу
 * При выигрыше мирных жителей: Мирные, Доктор, Красотка, Шериф - 1 балл
 * При выигрыше мафии: Мафия, Дон - 1 балл  
 * При выигрыше маньяка: Маньяк - 2 балла
 */
export const WIN_POINTS_CONFIG: WinPointsConfig[] = [
  // Победа мирных жителей - 1 балл
  { role: PlayerRole.CITIZEN, gameResult: GameResult.CITIZEN_WIN, points: 1 },
  { role: PlayerRole.DOCTOR, gameResult: GameResult.CITIZEN_WIN, points: 1 },
  { role: PlayerRole.BEAUTY, gameResult: GameResult.CITIZEN_WIN, points: 1 },
  { role: PlayerRole.DETECTIVE, gameResult: GameResult.CITIZEN_WIN, points: 1 },
  
  // Победа мафии - 1 балл
  { role: PlayerRole.MAFIA, gameResult: GameResult.MAFIA_WIN, points: 1 },
  { role: PlayerRole.DON, gameResult: GameResult.MAFIA_WIN, points: 1 },
  
  // Победа маньяка - 2 балла
  { role: PlayerRole.MANIAC, gameResult: GameResult.MANIAC_WIN, points: 2 },
];

/**
 * Получить баллы за победу для игрока
 * @param role - роль игрока
 * @param gameResult - результат игры
 * @returns количество баллов за победу (0 если не победил)
 */
export function getWinPoints(role: PlayerRole, gameResult: GameResult): number {
  if (!gameResult || !role) {
    return 0;
  }
  const config = WIN_POINTS_CONFIG.find(
    c => c.role === role && c.gameResult === gameResult
  );
  
  return config ? config.points : 0;
}

/**
 * Проверить, является ли игрок победителем
 * @param role - роль игрока
 * @param gameResult - результат игры
 * @returns true если игрок победил
 */
export function isPlayerWinner(role: PlayerRole, gameResult: GameResult): boolean {
  return getWinPoints(role, gameResult) > 0;
}

/**
 * Получить все роли, которые побеждают при данном результате игры
 * @param gameResult - результат игры
 * @returns массив ролей-победителей
 */
export function getWinningRoles(gameResult: GameResult): PlayerRole[] {
  return WIN_POINTS_CONFIG
    .filter(config => config.gameResult === gameResult)
    .map(config => config.role);
}
