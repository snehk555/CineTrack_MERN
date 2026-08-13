import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Pagination from '../shared/components/ui/Pagination';
import MovieCard from '../features/movies/components/MovieCard';
import { useFeed } from '../features/feed/hooks/feedQueries';
import HeroSlider from '../features/home/components/HeroSlider';
import type { Movie } from '../types';

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="ct-home-section-head">
      <div>
        <h2>{title}</h2>
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="ct-home-empty">
      <span>🎬</span>
      <p>{label}</p>
    </div>
  );
}

function ContentGrid({
  items,
  isLoading,
  emptyLabel,
  onCardClick,
  page,
  totalPages,
  onPage,
}: {
  items: Movie[];
  isLoading: boolean;
  emptyLabel: string;
  onCardClick: (item: Movie) => void;
  page: number;
  totalPages: number;
  onPage: (page: number) => void;
}) {
  if (isLoading) {
    return (
      <div className="ct-grid-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} style={{ width: '100%', aspectRatio: '2/3', background: '#222', borderRadius: 8, animation: 'pulse 1.5s infinite' }} />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return <EmptyState label={emptyLabel} />;
  }

  return (
    <>
      <div className="ct-grid-6">
        {items.map((item) => (
          <div key={item._id} style={{ position: 'relative' }}>
            <MovieCard movie={item} onClick={() => onCardClick(item)} />
            {(item as any)._type === 'series' && (
              <div style={{ position: 'absolute', top: 44, right: 8, background: '#3b82f6', color: '#fff', fontSize: 11, padding: '2px 6px', borderRadius: 4, fontWeight: 'bold', zIndex: 10, pointerEvents: 'none' }}>
                Series
              </div>
            )}
          </div>
        ))}
      </div>
      <Pagination page={page} totalPages={totalPages} onPage={onPage} alwaysShow={true} />
    </>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const { data: feedData, isLoading } = useFeed(page, 18);

  // For the unified feed, backend sends _type in data if it's series, but we mapped it to `totalSeasons` in UI if we wanted.
  // Actually, we can just use the item as a generic movie card.
  const feed = feedData?.data ?? [];

  return (
    <div className="ct-home-page">
      <HeroSlider />
      <main className="ct-home-container ct-home-content">
        <section className="ct-home-panel">
          <SectionHeader title="Newly Added" />
          <ContentGrid
            items={feed}
            isLoading={isLoading}
            emptyLabel="No content yet. Check back soon!"
            onCardClick={(item) => {
              if ((item as any).totalSeasons || (item as any)._type === 'series') {
                navigate(`/series/${item._id}`);
              } else {
                navigate(`/movies/${item._id}`);
              }
            }}
            page={feedData?.page ?? page}
            totalPages={feedData?.totalPages ?? 1}
            onPage={(nextPage) => {
              setPage(nextPage);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </section>
      </main>
    </div>
  );
}
