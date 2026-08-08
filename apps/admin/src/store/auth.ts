import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@blog/shared';

/** 全局状态（Zustand）：登录态与当前用户 */
interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  isAuthed: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
      isAuthed: () => Boolean(get().token),
    }),
    { name: 'admin_auth' },
  ),
);
