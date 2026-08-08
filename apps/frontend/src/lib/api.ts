import { Article, Category, Tag, ApiResponse, User } from '@blog/shared';

/** 后端基础地址（服务端组件需绝对地址，浏览器端同源亦可） */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:3000/api/v1';

/** 服务端/通用 GET 请求，自动解析统一响应契约 */
async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`请求失败 (${res.status})`);
  const body = (await res.json()) as ApiResponse<T>;
  return body.data;
}

export interface ArticlePage {
  items: Article[];
  total: number;
  page: number;
  pageSize: number;
}

export function fetchArticles(
  params: {
    page?: number;
    pageSize?: number;
    category?: string;
    tag?: string;
    keyword?: string;
  } = {},
): Promise<ArticlePage> {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.pageSize) qs.set('pageSize', String(params.pageSize));
  if (params.category) qs.set('category', params.category);
  if (params.tag) qs.set('tag', params.tag);
  if (params.keyword) qs.set('keyword', params.keyword);
  const q = qs.toString();
  return apiGet<ArticlePage>(`/articles${q ? `?${q}` : ''}`);
}

export function fetchArticle(slug: string): Promise<Article> {
  return apiGet<Article>(`/articles/${slug}`);
}

export function fetchCategories(): Promise<Category[]> {
  return apiGet<Category[]>('/categories');
}

export function fetchTags(): Promise<Tag[]> {
  return apiGet<Tag[]>('/tags');
}

/* ------------------------- 客户端认证（browser） ------------------------- */

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export async function login(email: string, password: string): Promise<AuthResult> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = (await res.json()) as ApiResponse<AuthResult>;
  if (!res.ok || body.code !== 0) {
    throw new Error(body.message ?? '登录失败');
  }
  return body.data;
}

export async function register(
  username: string,
  email: string,
  password: string,
): Promise<AuthResult> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  });
  const body = (await res.json()) as ApiResponse<AuthResult>;
  if (!res.ok || body.code !== 0) {
    throw new Error(body.message ?? '注册失败');
  }
  return body.data;
}
