import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Game } from './game.entity';

export enum PlayerRole {
  MAFIA = 'MAFIA',
  CITIZEN = 'CITIZEN',
  DOCTOR = 'DOCTOR',
  DETECTIVE = 'DETECTIVE',
  DON = 'DON',
  MANIAC = 'MANIAC',
  BEAUTY = 'BEAUTY',
}

@Entity()
export class GamePlayer {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Game, game => game.players)
  game: Game;

  @ManyToOne(() => User, { eager: true })
  player: User;

  @Column({
    type: 'enum',
    enum: PlayerRole
  })
  role: PlayerRole;

  // Позиция игрока за столом (0..playersPerGame-1)
  @Column({ type: 'int', nullable: true })
  seatIndex: number | null;

  @Column({ type: 'float', default: 0 })
  points: number;

  @Column({ type: 'float', default: 0 })
  bonusPoints: number;

  @Column({ type: 'float', default: 0 })
  penaltyPoints: number;

  @Column({ default: 0 })
  gamesPlayed: number;

  @Column({ default: 0 })
  gamesWon: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 