import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { PlayerRole } from '../games/game-player.entity';

@Entity()
export class UserRoleStats {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, user => user.roleStats, { onDelete: 'CASCADE' })
  user: User;

  @Column({
    type: 'enum',
    enum: PlayerRole
  })
  role: PlayerRole;

  @Column({ default: 0 })
  gamesPlayed: number;

  @Column({ default: 0 })
  gamesWon: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
