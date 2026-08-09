import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchArticle } from '@/lib/api';
import CommentSection from '@/components/CommentSection';

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const slug = decodeURIComponent(params.slug);
  let article;
  try {
    article = await fetchArticle(slug);
  } catch {
    notFound();
  }

  return (
    <article className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold">{article.title}</h1>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-400">
        <span>{article.author?.username ?? '匿名'}</span>
        <span>·</span>
        <span>{new Date(article.createdAt).toLocaleDateString()}</span>
        <span>·</span>
        <span>{article.viewCount} 阅读</span>
        {article.category && (
          <>
            <span>·</span>
            <Link
              href={`/category/${article.category.slug}`}
              className="text-indigo-600 hover:underline"
            >
              {article.category.name}
            </Link>
          </>
        )}
      </div>

      {article.tags && article.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {article.tags.map((t) => (
            <Link
              key={t.id}
              href={`/tag/${t.slug}`}
              className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600 hover:bg-gray-200"
            >
              #{t.name}
            </Link>
          ))}
        </div>
      )}

      <div className="prose mt-6 whitespace-pre-wrap leading-7 text-gray-800">
        {article.content}
      </div>

      <CommentSection articleId={article.id} />
    </article>
  );
}
