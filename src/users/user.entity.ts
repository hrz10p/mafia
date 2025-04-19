import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
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
}
