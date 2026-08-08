import Link from 'next/link';
import { fetchArticles, fetchCategories } from '@/lib/api';
import { ArticleCard } from '@/components/article-card';

export default async function Home() {
  const [articles, categories] = await Promise.all([
    fetchArticles({ page: 1, pageSize: 12 }),
    fetchCategories(),
  ]);

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_240px]">
      <section>
        <h1 className="mb-6 text-2xl font-bold">最新文章</h1>
        {articles.items.length === 0 ? (
          <p className="text-gray-500">暂无已发布文章。</p>
        ) : (
          <div className="grid gap-4">
            {articles.items.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        )}
      </section>

      <aside>
        <h2 className="mb-3 text-sm font-semibold uppercase text-gray-400">分类</h2>
        <ul className="space-y-2 text-sm">
          {categories.map((c) => (
            <li key={c.id}>
              <Link href={`/category/${c.slug}`} className="text-gray-600 hover:text-indigo-600">
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
