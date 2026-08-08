import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchArticles, fetchCategories, fetchTags } from '@/lib/api';
import { ArticleCard } from '@/components/article-card';

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const slug = decodeURIComponent(params.slug);
  const [articles, categories, tags] = await Promise.all([
    fetchArticles({ category: slug, pageSize: 20 }),
    fetchCategories(),
    fetchTags(),
  ]);

  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_240px]">
      <section>
        <h1 className="mb-1 text-2xl font-bold">{category.name}</h1>
        <p className="mb-6 text-sm text-gray-400">共 {articles.total} 篇</p>
        {articles.items.length === 0 ? (
          <p className="text-gray-500">该分类下暂无文章。</p>
        ) : (
          <div className="grid gap-4">
            {articles.items.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        )}
      </section>
      <aside className="space-y-6">
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase text-gray-400">分类</h2>
          <ul className="space-y-2 text-sm">
            {categories.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/category/${c.slug}`}
                  className={
                    c.slug === slug ? 'text-indigo-600' : 'text-gray-600 hover:text-indigo-600'
                  }
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase text-gray-400">标签</h2>
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <Link
                key={t.id}
                href={`/tag/${t.slug}`}
                className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600 hover:bg-gray-200"
              >
                {t.name}
              </Link>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
