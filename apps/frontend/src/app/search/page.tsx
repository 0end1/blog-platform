import SearchView from '@/components/search-view';

export default function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = searchParams.q ?? '';
  // 用 q 作为 key，保证导航切换时组件重新挂载并触发检索
  return <SearchView key={q} initialQuery={q} />;
}
