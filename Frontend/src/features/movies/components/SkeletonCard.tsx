export default function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden border border-white/8 bg-white/5 animate-pulse">
      {/* Poster skeleton */}
      <div className="aspect-[2/3] bg-white/10" />
      {/* Info skeleton */}
      <div className="p-3 flex flex-col gap-2">
        <div className="h-3 bg-white/10 rounded-full w-3/4" />
        <div className="h-2 bg-white/8 rounded-full w-1/3" />
      </div>
    </div>
  );
}
