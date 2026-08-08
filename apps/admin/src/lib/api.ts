import {
  User,
  Category,
  Tag,
  Article,
  DashboardStats,
  Comment,
  Role,
  UserStatus,
} from '@blog/shared';
import { useAuthStore } from '@/store/auth';

/** 开发期经 Vite 代理访问后端（/api -> localhost:3000） */
const API_BASE = '/api/v1';

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

export const articleApi = {
  list: (page = 1, pageSize = 10) =>
    request<ArticlePage>(`/admin/articles?page=${page}&pageSize=${pageSize}`),
};

export const commentApi = {
  list: () => request<Comment[]>('/admin/comments'),
  moderate: (id: string, status: 'pending' | 'approved' | 'rejected') =>
    request<Comment>(`/admin/comments/${id}/moderate`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
};
