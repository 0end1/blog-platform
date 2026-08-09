'use client';

import { useMemo, useState } from 'react';
import {
  fetchComments,
  postComment,
  type CommentView,
} from '@/lib/api';

interface Props {
  articleId: string;
  /** 当前登录用户 id；未登录时评论以游客身份（演示）发表 */
  currentUserId?: string;
}

/** 将扁平评论按 parentId 组装为树形结构 */
function buildTree(list: CommentView[]): CommentView[] {
  const map = new Map<string, CommentView & { children: CommentView[] }>();
  list.forEach((c) => map.set(c.id, { ...c, children: [] }));
  const roots: (CommentView & { children: CommentView[] })[] = [];
  map.forEach((node) => {
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots as unknown as CommentView[];
}

function CommentNode({
  node,
  depth,
  onReply,
}: {
  node: CommentView & { children?: CommentView[] };
  depth: number;
  onReply: (parentId: string) => void;
}) {
  return (
    <div className={depth > 0 ? 'ml-6 border-l pl-4' : ''}>
      <div className="py-2">
        <div className="text-sm font-medium text-gray-700">
          {node.author?.username ?? '访客'}
        </div>
        <p className="mt-1 text-sm leading-6 text-gray-800">{node.content}</p>
        <button
          onClick={() => onReply(node.id)}
          className="mt-1 text-xs text-indigo-600 hover:underline"
        >
          回复
        </button>
      </div>
      {node.children?.map((child) => (
        <CommentNode
          key={child.id}
          node={child}
          depth={depth + 1}
          onReply={onReply}
        />
      ))}
    </div>
  );
}

export default function CommentSection({ articleId, currentUserId }: Props) {
  const [comments, setComments] = useState<CommentView[] | null>(null);
  const [content, setContent] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setComments(await fetchComments(articleId));
    } catch {
      setComments([]);
    }
  };

  useMemo(() => {
    load();
  }, [articleId]);

  const submit = async () => {
    if (!content.trim()) return;
    setLoading(true);
    setError('');
    try {
      await postComment({
        articleId,
        authorId: currentUserId ?? '00000000-0000-0000-0000-000000000000',
        content: content.trim(),
        parentId: replyTo,
      });
      setContent('');
      setReplyTo(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : '发表失败');
    } finally {
      setLoading(false);
    }
  };

  const tree = comments ? buildTree(comments) : [];

  return (
    <section className="mt-10 border-t pt-6">
      <h2 className="mb-4 text-lg font-semibold">评论 ({comments?.length ?? 0})</h2>

      <div className="mb-6">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={replyTo ? '回复评论…' : '写下你的评论…'}
          rows={3}
          className="w-full rounded-md border border-gray-300 p-3 text-sm focus:border-indigo-500 focus:outline-none"
        />
        <div className="mt-2 flex items-center gap-3">
          <button
            onClick={submit}
            disabled={loading}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? '发表中…' : replyTo ? '回复' : '发表评论'}
          </button>
          {replyTo && (
            <button
              onClick={() => setReplyTo(null)}
              className="text-xs text-gray-500 hover:underline"
            >
              取消回复
            </button>
          )}
        </div>
        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
      </div>

      {comments === null ? (
        <p className="text-sm text-gray-400">加载评论中…</p>
      ) : tree.length === 0 ? (
        <p className="text-sm text-gray-400">还没有评论，来抢沙发吧～</p>
      ) : (
        tree.map((c) => (
          <CommentNode
            key={c.id}
            node={c}
            depth={0}
            onReply={(id) => setReplyTo(id)}
          />
        ))
      )}
    </section>
  );
}
