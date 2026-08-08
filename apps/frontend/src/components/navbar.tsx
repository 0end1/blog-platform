'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getAuth, clearAuth, isAuthed } from '@/lib/auth';

export function Navbar() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [username, setUsername] = useState('');

  useEffect(() => {
    const auth = getAuth();
    setAuthed(isAuthed());
    setUsername(auth?.user?.username ?? '');
  }, []);

  function handleLogout() {
    clearAuth();
    setAuthed(false);
    router.push('/');
  }

  return (
    <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold text-indigo-600">
          博客平台
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/" className="text-gray-600 hover:text-gray-900">
            首页
          </Link>
          {authed ? (
            <>
              <span className="text-gray-500">{username}</span>
              <button
                onClick={handleLogout}
                className="rounded-md border px-3 py-1 text-gray-600 hover:bg-gray-50"
              >
                退出
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-md border px-3 py-1 text-gray-600 hover:bg-gray-50"
              >
                登录
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-indigo-600 px-3 py-1 text-white hover:bg-indigo-700"
              >
                注册
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
