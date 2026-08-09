import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole, UserStatus } from '@blog/shared';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 50 })
  username: string;

  @Column({ unique: true, length: 100 })
  email: string;

  @Column({ select: false })
  password: string;

  @Column({ type: 'varchar', length: 20, default: 'reader' })
  role: UserRole;

  @Column({ type: 'varchar', length: 10, default: 'active' })
  status: UserStatus;

  @Column({ nullable: true })
  avatar: string;

  /** 第三方账号绑定（S4-01/05）：存储各 provider 的外部 ID，如 { github: '123', google: '456' } */
  @Column({ type: 'json', nullable: true })
  socials?: Record<string, string> | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
