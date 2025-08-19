import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { UserRole } from '../common/enums/roles.enum';
import { Club } from '../clubs/club.entity';
import { UserRoleStats } from './user-role-stats.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  nickname: string;

  @Column({ nullable: true })
  avatar?: string;

  @Column({ default: false })
  confirmed: boolean;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.PLAYER,
  })
  role: UserRole;

  @ManyToOne(() => Club, club => club.members, { nullable: true })
  club: Club;

  // Player statistics
  @Column({ default: 0 })
  totalGames: number;

  @Column({ default: 0 })
  totalWins: number;

  @Column({ default: 0 })
  totalPoints: number;

  // ELO rating system
  @Column({ type: 'int', default: 0 })
  eloRating: number;

  // Additional points from tournaments
  @Column({ type: 'int', default: 0 })
  totalBonusPoints: number;

  // Role-based statistics
  @OneToMany(() => UserRoleStats, roleStats => roleStats.user, { cascade: true })
  roleStats: UserRoleStats[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
