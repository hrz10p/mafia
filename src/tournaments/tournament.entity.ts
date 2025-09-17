import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Club } from '../clubs/club.entity';
import { Game } from '../games/game.entity';

export enum TournamentStatus {
  UPCOMING = 'UPCOMING',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum TournamentType {
  DEFAULT = 'DEFAULT',
  ELO = 'ELO'
}

@Entity()
export class Tournament {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'timestamp' })
  date: Date;

  @Column({
    type: 'enum',
    enum: TournamentStatus,
    default: TournamentStatus.UPCOMING
  })
  status: TournamentStatus;

  @Column({
    type: 'enum',
    enum: TournamentType,
    default: TournamentType.DEFAULT
  })
  type: TournamentType;

  @Column({ type: 'int', nullable: true })
  stars: number; // От 1 до 6, только для ELO турниров

  @ManyToOne(() => Club, { eager: true, nullable: true, onDelete: 'CASCADE' })
  club: Club;

  @ManyToOne(() => User, { eager: true })
  referee: User;

  @OneToMany(() => Game, game => game.tournament, { cascade: true })
  games: Game[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 