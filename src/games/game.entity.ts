import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Club } from '../clubs/club.entity';
import { Season } from '../seasons/season.entity';
import { Tournament } from '../tournaments/tournament.entity';
import { GamePlayer } from './game-player.entity';

export enum GameStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum GameResult {
  MAFIA_WIN = 'MAFIA_WIN',
  CITIZEN_WIN = 'CITIZEN_WIN',
  DRAW = 'DRAW'
}

@Entity()
export class Game {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'timestamp' })
  scheduledDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedDate: Date;

  @Column({
    type: 'enum',
    enum: GameStatus,
    default: GameStatus.SCHEDULED
  })
  status: GameStatus;

  @Column({
    type: 'enum',
    enum: GameResult,
    nullable: true
  })
  result: GameResult;

  @ManyToOne(() => Club, { eager: true })
  club: Club;

  @ManyToOne(() => User, { eager: true })
  referee: User;

  @ManyToOne(() => Season, season => season.games, { nullable: true })
  season: Season;

  @ManyToOne(() => Tournament, tournament => tournament.games, { nullable: true })
  tournament: Tournament;

  @OneToMany(() => GamePlayer, gamePlayer => gamePlayer.game, { cascade: true })
  players: GamePlayer[];

  @Column({ default: 0 })
  totalPlayers: number;

  @Column({ default: 0 })
  mafiaCount: number;

  @Column({ default: 0 })
  citizenCount: number;

  @Column({ type: 'json', nullable: true })
  resultTable: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 