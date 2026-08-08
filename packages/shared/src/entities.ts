/**
 * 共享领域类型（与后端 TypeORM 实体一一对应，供前端 IDE 提示）
 */

export type UserRole = 'admin' | 'author' | 'reader';

/** 角色枚举（前后端共用，用于 RBAC 鉴权） */
export enum Role {
  ADMIN = 'admin',
  AUTHOR = 'author',
  READER = 'reader',
}

export type UserStatus = 'active' | 'disabled';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

/** 文章作者摘要（列表/详情中嵌套展示） */
export interface AuthorBrief {
  id: string;
  username: string;
  avatar?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  articleCount?: number;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  articleCount?: number;
}

export interface Comment {
  id: string;
  articleId: string;
  parentId?: string | null;
  authorId: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  summary?: string;
  content: string;
  cover?: string;
  status: 'draft' | 'published';
  authorId: string;
  author?: AuthorBrief;
  categoryId?: string | null;
  category?: Category;
  tags?: Tag[];
  viewCount: number;
  likeCount: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/** 列表分页响应封装 */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** 后台仪表盘统计 */
export interface DashboardStats {
  articleCount: number;
  publishedArticleCount: number;
  commentCount: number;
  pendingCommentCount: number;
  userCount: number;
  categoryCount: number;
  tagCount: number;
  todayViewCount: number;
}

/** 文章列表查询参数 */
export interface ArticleQuery {
  page?: number;
  pageSize?: number;
  category?: string;
  tag?: string;
  keyword?: string;
  status?: 'draft' | 'published';
}
