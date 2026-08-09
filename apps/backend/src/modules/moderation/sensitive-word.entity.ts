import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

/** 敏感词库（S4-03 评论审核） */
@Entity('sensitive_words')
export class SensitiveWordEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column()
  word: string;

  @CreateDateColumn()
  createdAt: Date;
}
