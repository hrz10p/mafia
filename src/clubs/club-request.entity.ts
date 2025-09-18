import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Club } from './club.entity';

export enum ClubRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum ClubRequestType {
  CLUB_CREATION = 'CLUB_CREATION',
  MEMBERSHIP = 'MEMBERSHIP'
}

@Entity()
export class ClubRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Club, { eager: true, onDelete: 'CASCADE' })
  club: Club;

  @Column({
    type: 'enum',
    enum: ClubRequestType,
  })
  type: ClubRequestType;

  @Column({
    type: 'enum',
    enum: ClubRequestStatus,
    default: ClubRequestStatus.PENDING
  })
  status: ClubRequestStatus;

  @Column({ type: 'text', nullable: true })
  message?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 