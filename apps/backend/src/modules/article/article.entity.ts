import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  ManyToMany,
  JoinColumn,
  JoinTable,
} from 'typeorm';
import { CategoryEntity } from '../category/category.entity';
import { TagEntity } from '../tag/tag.entity';
import { UserEntity } from '../user/user.entity';

@Entity('articles')
export class ArticleEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_slug')
  @Column({ unique: true })
  slug: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  summary: string;

  @Column({ type: 'longtext' })
  content: string;

  @Column({ nullable: true })
  cover: string;

  @Index('idx_status_published')
  @Column({ default: 'draft' })
  status: 'draft' | 'scheduled' | 'published';

  @Index('idx_author')
  @Column({ nullable: true })
  authorId: string;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'authorId' })
  author?: UserEntity;

  @Column({ nullable: true })
  categoryId: string | null;

  @ManyToOne(() => CategoryEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'categoryId' })
  category?: CategoryEntity | null;

  @ManyToMany(() => TagEntity, (tag) => tag.articles)
  @JoinTable({
    name: 'article_tags',
    joinColumn: { name: 'article_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
  })
  tags?: TagEntity[];

  @Column({ default: 0 })
  viewCount: number;

  @Column({ default: 0 })
  likeCount: number;

  @Column({ type: 'datetime', nullable: true })
  publishedAt: Date;

  @Column({ type: 'datetime', nullable: true })
  scheduledPublishAt?: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
