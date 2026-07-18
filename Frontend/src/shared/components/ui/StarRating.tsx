interface StarRatingProps {
  value: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = { sm: 'text-sm', md: 'text-xl', lg: 'text-2xl' };

export default function StarRating({ value, onChange, readonly = false, size = 'md' }: StarRatingProps) {
  const stars = Array.from({ length: 10 }, (_, i) => i + 1);

  return (
    <div className="flex gap-0.5" role="group" aria-label={`Rating: ${value} out of 10`}>
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={`
            ${sizeMap[size]} transition-all duration-100
            ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-125'}
            ${star <= value ? 'opacity-100' : 'opacity-30 hover:opacity-70'}
          `}
          aria-label={`Rate ${star} out of 10`}
        >
          ⭐
        </button>
      ))}
      {!readonly && (
        <span className="ml-2 text-sm text-slate-400 self-center">{value}/10</span>
      )}
    </div>
  );
}
