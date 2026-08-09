'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { getAuth, clearAuth, isAuthed } from '@/lib/auth';
import { fetchSearchSuggest } from '@/lib/api';

export function Navbar() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [username, setUsername] = useState('');
  const [q, setQ] = useState('');
  const [suggests, setSuggests] = useState<string[]>([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const auth = getAuth();
    setAuthed(isAuthed());
    setUsername(auth?.user?.username ?? '');
  }, []);

  // 输入时拉取搜索建议（防抖）
  useEffect(() => {
    const term = q.trim();
    if (!term) {
      setSuggests([]);
      return;
    }
    const t = setTimeout(async () => {
      const s = await fetchSearchSuggest(term);
      setSuggests(s);
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  // 点击外部关闭建议
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setShowSuggest(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  function doSearch(term: string) {
    const t = term.trim();
    if (!t) return;
    setShowSuggest(false);
    setSuggests([]);
    router.push(`/search?q=${encodeURIComponent(t)}`);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    doSearch(q);
  }

  function handleLogout() {
    clearAuth();
    setAuthed(false);
    router.push('/');
  }

  return (
    <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
      <nav className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="shrink-0 text-lg font-bold text-indigo-600">
          博客平台
        </Link>

        <div ref={boxRef} className="relative hidden flex-1 md:block">
          <form onSubmit={handleSubmit} className="flex">
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setShowSuggest(true);
              }}
              onFocus={() => setShowSuggest(true)}
              placeholder="搜索文章…"
              className="w-full rounded-l-md border border-r-0 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
            <button
              type="submit"
              className="rounded-r-md bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700"
            >
              搜索
            </button>
          </form>
          {showSuggest && suggests.length > 0 && (
            <ul className="absolute left-0 top-full z-20 mt-1 w-full overflow-hidden rounded-md border bg-white shadow">
              {suggests.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => doSearch(s)}
                    className="block w-full truncate px-3 py-2 text-left text-sm hover:bg-gray-50"
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-4 text-sm">
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
