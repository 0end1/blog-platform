import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Index,
  ManyToMany,
  CreateDateColumn,
} from 'typeorm';
import { ArticleEntity } from '../article/article.entity';

@Entity('tags')
export class TagEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Index('idx_slug')
  @Column({ unique: true })
  slug: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToMany(() => ArticleEntity, (article) => article.tags)
  articles: ArticleEntity[];
}
