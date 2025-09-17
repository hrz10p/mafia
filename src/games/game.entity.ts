import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Club } from '../clubs/club.entity';
import { Season } from '../seasons/season.entity';
import { Tournament } from '../tournaments/tournament.entity';
import { GamePlayer } from './game-player.entity';

export enum GameResult {
  MAFIA_WIN = 'MAFIA_WIN',
  CITIZEN_WIN = 'CITIZEN_WIN',
  MANIAC_WIN = 'MANIAC_WIN',
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

  @Column({
    type: 'enum',
    enum: GameResult,
    nullable: true
  })
  result: GameResult;

  @ManyToOne(() => Club, { eager: true, onDelete: 'CASCADE' })
  club: Club;

  @ManyToOne(() => User, { eager: true })
  referee: User;

  @ManyToOne(() => Season, season => season.games, { nullable: true })
  season: Season;

  @ManyToOne(() => Tournament, tournament => tournament.games, { nullable: true, onDelete: 'CASCADE' })
  tournament: Tournament;

  @OneToMany(() => GamePlayer, gamePlayer => gamePlayer.game, { cascade: true })
  players: GamePlayer[];

  @Column({ default: 0 })
  totalPlayers: number;

  @Column({ default: 0 })
  mafiaCount: number;

  @Column({ default: 0 })
  citizenCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 