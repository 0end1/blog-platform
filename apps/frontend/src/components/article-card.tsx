import { Article } from '@blog/shared';

export function ArticleCard({ article }: { article: Article }) {
  return (
    <a
      href={`/article/${article.slug}`}
      className="block rounded-lg border p-4 transition hover:shadow-md"
    >
      <h2 className="text-lg font-semibold">{article.title}</h2>
      {article.summary && (
        <p className="mt-2 line-clamp-2 text-sm text-gray-600">{article.summary}</p>
      )}
      <div className="mt-3 text-xs text-gray-400">
        {article.viewCount} 阅读 · {new Date(article.createdAt).toLocaleDateString()}
      </div>
    </a>
  );
}
