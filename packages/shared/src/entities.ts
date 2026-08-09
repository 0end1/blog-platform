/**
 * 共享领域类型（与后端 TypeORM 实体一一对应，供前端 IDE 提示）
 */

/** 审计日志条目（S4-04 安全加固） */
export interface AuditLog {
  id: string;
  actorId?: string | null;
  actorEmail?: string | null;
  action: string;
  resource?: string | null;
  resourceId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  success: boolean;
  detail?: string | null;
  createdAt: string;
}

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
  /** 第三方账号绑定（S4-01/05）：{ github?: id, google?: id } */
  socials?: Record<string, string> | null;
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
  status: 'draft' | 'scheduled' | 'published';
  authorId: string;
  author?: AuthorBrief;
  categoryId?: string | null;
  category?: Category;
  tags?: Tag[];
  viewCount: number;
  likeCount: number;
  publishedAt?: string | null;
  scheduledPublishAt?: string | null;
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

/** 热门文章条目（仪表盘 Top） */
export interface TopArticle {
  id: string;
  slug: string;
  title: string;
  viewCount: number;
}

/** 日期计数点（趋势图） */
export interface DateCount {
  date: string; // YYYY-MM-DD
  count: number;
}

/** 分类分布点 */
export interface CategoryCount {
  name: string;
  count: number;
}

/** 后台仪表盘统计（Sprint 3 深化） */
export interface DashboardStats {
  articleCount: number;
  publishedArticleCount: number;
  commentCount: number;
  pendingCommentCount: number;
  userCount: number;
  categoryCount: number;
  tagCount: number;
  /** 累计总阅读量 */
  totalViewCount: number;
  /** 热门文章 Top5 */
  topArticles: TopArticle[];
  /** 近 14 天文章发布趋势 */
  articleTrend: DateCount[];
  /** 近 14 天评论趋势 */
  commentTrend: DateCount[];
  /** 各分类文章分布 */
  categoryDistribution: CategoryCount[];
}

/** 文章列表查询参数 */
export interface ArticleQuery {
  page?: number;
  pageSize?: number;
  category?: string;
  tag?: string;
  keyword?: string;
  status?: 'draft' | 'scheduled' | 'published';
}
