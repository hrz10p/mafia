import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Game } from './game.entity';

export enum PlayerRole {
  MAFIA = 'MAFIA',
  CITIZEN = 'CITIZEN',
  DOCTOR = 'DOCTOR',
  DETECTIVE = 'DETECTIVE',
  DON = 'DON',
  MANIAC = 'MANIAC'
}

export enum PlayerStatus {
  ALIVE = 'ALIVE',
  DEAD = 'DEAD',
  KICKED = 'KICKED'
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

  @Column({
    type: 'enum',
    enum: PlayerStatus,
    default: PlayerStatus.ALIVE
  })
  status: PlayerStatus;

  @Column({ default: 0 })
  points: number;

  @Column({ default: 0 })
  bonusPoints: number;

  @Column({ default: 0 })
  penaltyPoints: number;

  @Column({ default: 0 })
  gamesPlayed: number;

  @Column({ default: 0 })
  gamesWon: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'timestamp', nullable: true })
  diedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  kickedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 