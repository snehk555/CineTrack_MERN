interface PaginationProps {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
  alwaysShow?: boolean;
}

export default function Pagination({ page, totalPages, onPage, alwaysShow = false }: PaginationProps) {
  if (totalPages <= 1 && !alwaysShow) return null;

  const maxPages = Math.max(1, totalPages);
  const pages: (number | '...')[] = [];
  
  if (maxPages <= 7) {
    for (let i = 1; i <= maxPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('...');
    const start = Math.max(2, page - 1);
    const end = Math.min(maxPages - 1, page + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (page < maxPages - 2) pages.push('...');
    pages.push(maxPages);
  }

  return (
    <div className="ct-pagination">
      <button disabled={page <= 1} onClick={() => onPage(page - 1)}>‹ Prev</button>
      {pages.map((p, i) =>
        p === '...' ? (
          <button key={`ellipsis-${i}`} disabled style={{ cursor: 'default' }}>…</button>
        ) : (
          <button
            key={p}
            className={Number(p) === Number(page) ? 'active' : ''}
            onClick={() => onPage(Number(p))}
          >
            {p}
          </button>
        )
      )}
      <button disabled={page >= maxPages} onClick={() => onPage(page + 1)}>Next ›</button>
    </div>
  );
}
