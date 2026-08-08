'use client';

import { AuthResult } from './api';

const KEY = 'blog_auth';

export function getAuth(): AuthResult | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthResult;
  } catch {
    return null;
  }
}

export function setAuth(auth: AuthResult): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(KEY, JSON.stringify(auth));
}

export function clearAuth(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(KEY);
}

export function getAccessToken(): string {
  return getAuth()?.accessToken ?? '';
}

export function isAuthed(): boolean {
  return Boolean(getAccessToken());
}
