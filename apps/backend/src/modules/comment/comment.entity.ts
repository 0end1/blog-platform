import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('comments')
export class CommentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_article')
  @Column()
  articleId: string;

  @Column({ type: 'uuid', nullable: true })
  parentId: string | null;

  @Column()
  authorId: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ default: 'pending' })
  status: 'pending' | 'approved' | 'rejected';

  @CreateDateColumn()
  createdAt: Date;
}
