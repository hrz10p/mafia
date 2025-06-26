import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { UserRole } from '../common/enums/roles.enum';
import { Club } from '../clubs/club.entity';

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

  @Column({ default: 0 })
  totalKills: number;

  @Column({ default: 0 })
  totalDeaths: number;

  @Column({ default: 0 })
  mafiaGames: number;

  @Column({ default: 0 })
  mafiaWins: number;

  @Column({ default: 0 })
  citizenGames: number;

  @Column({ default: 0 })
  citizenWins: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
