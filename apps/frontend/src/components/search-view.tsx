'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { fetchSearch, fetchSearchSuggest, SearchHit } from '@/lib/api';

export default function SearchView({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const [q, setQ] = useState(initialQuery);
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<SearchHit[]>([]);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [suggests, setSuggests] = useState<string[]>([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  function runSearch(term: string, p: number) {
    const t = term.trim();
    if (!t) {
      setItems([]);
      setTotal(0);
      return;
    }
    setLoading(true);
    fetchSearch(t, { page: p, pageSize })
      .then((res) => {
        setItems(res.items);
        setTotal(res.total);
        setPageSize(res.pageSize);
        setPage(res.page);
      })
      .finally(() => setLoading(false));
  }

  // 初次进入或 URL 中 q 变化时执行检索
  useEffect(() => {
    setQ(initialQuery);
    runSearch(initialQuery, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  // 输入联想
  useEffect(() => {
    const term = q.trim();
    if (!term || term === initialQuery) {
      setSuggests([]);
      return;
    }
    const t = setTimeout(async () => {
      const s = await fetchSearchSuggest(term);
      setSuggests(s);
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

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

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">搜索</h1>

      <div ref={boxRef} className="relative mb-6">
        <form onSubmit={handleSubmit} className="flex">
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setShowSuggest(true);
            }}
            onFocus={() => setShowSuggest(true)}
            placeholder="搜索文章…"
            className="w-full rounded-l-md border border-r-0 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <button
            type="submit"
            className="rounded-r-md bg-indigo-600 px-5 py-2 text-white hover:bg-indigo-700"
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
                  className="block w-full truncate px-4 py-2 text-left text-sm hover:bg-gray-50"
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {loading && <p className="text-sm text-gray-500">搜索中…</p>}

      {!loading && q && total > 0 && (
        <p className="mb-4 text-sm text-gray-500">
          找到 {total} 条与「{q}」相关的结果
        </p>
      )}

      {!loading && q && total === 0 && (
        <p className="text-gray-500">未找到与「{q}」相关的文章。</p>
      )}

      <div className="grid gap-4">
        {items.map((h) => (
          <a
            key={h.id}
            href={`/article/${h.slug}`}
            className="block rounded-lg border p-4 transition hover:shadow-md"
          >
            <h2
              className="text-lg font-semibold"
              dangerouslySetInnerHTML={{ __html: h.highlightedTitle }}
            />
            {h.snippet && (
              <p
                className="mt-2 line-clamp-3 text-sm text-gray-600"
                dangerouslySetInnerHTML={{ __html: h.snippet }}
              />
            )}
            <div className="mt-3 text-xs text-gray-400">
              {h.viewCount} 阅读 · {new Date(h.createdAt).toLocaleDateString()}
            </div>
          </a>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            disabled={page <= 1}
            onClick={() => runSearch(q, page - 1)}
            className="rounded-md border px-4 py-1.5 text-sm disabled:opacity-40 hover:bg-gray-50"
          >
            上一页
          </button>
          <span className="text-sm text-gray-500">
            {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => runSearch(q, page + 1)}
            className="rounded-md border px-4 py-1.5 text-sm disabled:opacity-40 hover:bg-gray-50"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}
