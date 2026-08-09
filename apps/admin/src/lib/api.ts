import {
  User,
  Category,
  Tag,
  Article,
  DashboardStats,
  Comment,
  Role,
  UserStatus,
  AuditLog,
} from '@blog/shared';
import { useAuthStore } from '@/store/auth';

/** 后端地址：默认直连本地后端（3000）；可用 VITE_API_BASE 覆盖 */
const env = (import.meta as { env?: Record<string, string> }).env ?? {};
export const API_BASE = env.VITE_API_BASE ?? 'http://localhost:3000/api/v1';

interface ApiEnvelope<T> {
  code: number;
  message: string;
  data: T;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().token;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const body = (await res.json()) as ApiEnvelope<T>;
  if (!res.ok || body.code !== 0) {
    throw new Error(body.message ?? `请求失败 (${res.status})`);
  }
  return body.data;
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export const authApi = {
  login: (email: string, password: string) =>
    request<AuthResult>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  me: () => request<User>('/auth/me'),
};

/** 第三方登录 / 绑定（S4-01/05） */
export const oauthApi = {
  /** 解绑第三方账号（需登录态） */
  unbind: (provider: 'github' | 'google') =>
    request<{ unbound: boolean }>(`/auth/oauth/bind/${provider}`, {
      method: 'DELETE',
    }),
};

export const dashboardApi = {
  stats: () => request<DashboardStats>('/admin/dashboard'),
};

export const userApi = {
  list: () => request<User[]>('/users'),
  updateRole: (id: string, role: Role) =>
    request<User>(`/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    }),
  updateStatus: (id: string, status: UserStatus) =>
    request<User>(`/users/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
  remove: (id: string) => request<{ id: string }>(`/users/${id}`, { method: 'DELETE' }),
};

export const categoryApi = {
  list: () => request<Category[]>('/categories'),
  create: (name: string, slug: string) =>
    request<Category>('/categories', {
      method: 'POST',
      body: JSON.stringify({ name, slug }),
    }),
  update: (id: string, name?: string, slug?: string) =>
    request<Category>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name, slug }),
    }),
  remove: (id: string) => request<{ id: string }>(`/categories/${id}`, { method: 'DELETE' }),
};

export const tagApi = {
  list: () => request<Tag[]>('/tags'),
  create: (name: string, slug: string) =>
    request<Tag>('/tags', {
      method: 'POST',
      body: JSON.stringify({ name, slug }),
    }),
  update: (id: string, name?: string, slug?: string) =>
    request<Tag>(`/tags/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name, slug }),
    }),
  remove: (id: string) => request<{ id: string }>(`/tags/${id}`, { method: 'DELETE' }),
};

export interface ArticlePage {
  items: Article[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ArticleInput {
  title: string;
  slug: string;
  summary?: string;
  content: string;
  cover?: string;
  status?: 'draft' | 'scheduled' | 'published';
  scheduledPublishAt?: string;
  categoryId?: string;
  tagIds?: string[];
}

export const articleApi = {
  list: (page = 1, pageSize = 10) =>
    request<ArticlePage>(`/admin/articles?page=${page}&pageSize=${pageSize}`),
  save: (dto: ArticleInput, id?: string) =>
    request<Article>(
      id ? `/admin/articles/${id}` : '/admin/articles',
      { method: id ? 'PUT' : 'POST', body: JSON.stringify(dto) },
    ),
  remove: (id: string) =>
    request<{ id: string }>(`/admin/articles/${id}`, { method: 'DELETE' }),
};

/** 上传图片（封面/正文图），返回可访问 URL */
export async function uploadImage(file: File): Promise<string> {
  const token = useAuthStore.getState().token;
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch(`${API_BASE}/upload/image`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: fd,
  });
  const body = (await res.json()) as ApiEnvelope<{ url: string }>;
  if (!res.ok || body.code !== 0) {
    throw new Error(body.message ?? '上传失败');
  }
  return body.data.url;
}

export interface SensitiveWord {
  id: string;
  word: string;
  createdAt: string;
}

export const commentApi = {
  list: (status?: 'pending' | 'approved' | 'rejected') =>
    request<Comment[]>(
      `/admin/comments${status ? `?status=${status}` : ''}`,
    ),
  moderate: (id: string, status: 'pending' | 'approved' | 'rejected') =>
    request<Comment>(`/admin/comments/${id}/moderate`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
  bulkModerate: (ids: string[], status: 'pending' | 'approved' | 'rejected') =>
    request<{ updated: number }>('/admin/comments/bulk-moderate', {
      method: 'POST',
      body: JSON.stringify({ ids, status }),
    }),
};

export const sensitiveWordApi = {
  list: () => request<SensitiveWord[]>('/admin/sensitive-words'),
  create: (word: string) =>
    request<SensitiveWord>('/admin/sensitive-words', {
      method: 'POST',
      body: JSON.stringify({ word }),
    }),
  remove: (id: string) =>
    request<{ id: string }>(`/admin/sensitive-words/${id}`, { method: 'DELETE' }),
};

export interface AuditLogPage {
  items: AuditLog[];
  total: number;
  limit: number;
  offset: number;
}

/** 审计日志查询（S4-04 安全加固） */
export const auditLogApi = {
  list: (params: {
    limit?: number;
    offset?: number;
    action?: string;
    actorId?: string;
  } = {}) => {
    const qs = new URLSearchParams();
    if (params.limit != null) qs.set('limit', String(params.limit));
    if (params.offset != null) qs.set('offset', String(params.offset));
    if (params.action) qs.set('action', params.action);
    if (params.actorId) qs.set('actorId', params.actorId);
    const q = qs.toString();
    return request<AuditLogPage>(`/admin/audit-logs${q ? `?${q}` : ''}`);
  },
};
