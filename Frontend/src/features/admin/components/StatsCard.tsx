interface StatsCardProps {
  icon: string;
  label: string;
  value: number | string;
  trend?: number;   // positive = green, negative = red
  loading?: boolean;
}

export default function StatsCard({ icon, label, value, trend, loading }: StatsCardProps) {
  return (
    <div className="bg-white/5 border border-white/8 rounded-2xl p-5 flex items-start gap-4 hover:border-violet-500/30 transition-colors duration-200">
      <div className="text-3xl">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-slate-400 text-xs mb-1 truncate">{label}</p>
        {loading ? (
          <div className="h-7 w-24 bg-white/10 rounded-lg animate-pulse" />
        ) : (
          <p className="text-2xl font-bold text-white">{typeof value === 'number' ? value.toLocaleString() : value}</p>
        )}
        {trend !== undefined && !loading && (
          <p className={`text-xs mt-1 font-medium ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs yesterday
          </p>
        )}
      </div>
    </div>
  );
}
