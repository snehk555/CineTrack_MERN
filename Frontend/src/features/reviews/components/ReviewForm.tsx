import { useState } from 'react';
import Modal from '../../../shared/components/ui/Modal';
import Button from '../../../shared/components/ui/Button';
import { useSubmitReview } from '../hooks/reviewsQueries';

interface ReviewFormProps {
  movieId: string;
  movieTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

// ─── Interactive star picker ──────────────────────────────────────────────────
function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  const display = hovered || Math.round(value / 2);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(star * 2)} // convert 1-5 star to 1-10 rating
            className="transition-transform hover:scale-110"
          >
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path
                d="M14 2l3.09 6.26L24 9.27l-5 4.87 1.18 6.88L14 17.77l-6.18 3.25L9 14.14 4 9.27l6.91-1.01L14 2z"
                fill={star <= display ? '#7c3aed' : 'rgba(255,255,255,0.1)'}
                stroke={star <= display ? '#7c3aed' : 'rgba(255,255,255,0.12)'}
                strokeWidth="1"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        ))}
        <span className="ml-2 text-amber-300 font-bold text-lg w-12">{value}/10</span>
      </div>

      {/* Precise slider for fine-tuning */}
      <input
        type="range"
        min={1}
        max={10}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-amber-600 cursor-pointer"
      />
      <div className="flex justify-between text-xs text-slate-500">
        <span>1 — Poor</span>
        <span>5 — Average</span>
        <span>10 — Masterpiece</span>
      </div>
    </div>
  );
}

// ─── ReviewForm ───────────────────────────────────────────────────────────────
export default function ReviewForm({ movieId, movieTitle, isOpen, onClose }: ReviewFormProps) {
  const [rating, setRating]   = useState(7);
  const [comment, setComment] = useState('');
  const { mutate: submit, isPending } = useSubmitReview();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit(
      { movieId, rating, comment: comment.trim() || undefined },
      {
        onSuccess: () => {
          setRating(7);
          setComment('');
          onClose();
        },
      }
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Review: ${movieTitle}`} size="md">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">

        {/* Rating picker */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-3">Your Rating</label>
          <StarPicker value={rating} onChange={setRating} />
        </div>

        {/* Comment */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Comment <span className="text-slate-500 font-normal">(optional)</span>
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What did you think? Share your thoughts..."
            maxLength={1000}
            rows={4}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-200 placeholder-slate-500 text-sm outline-none resize-none focus:border-amber-500 transition-colors"
          />
          <p className="text-right text-xs text-slate-500 mt-1">{comment.length}/1000</p>
        </div>

        {/* Info note */}
        <div className="flex gap-2.5 p-3 rounded-xl bg-amber-500/8 border border-amber-500/15">
          <span className="text-amber-400 text-sm shrink-0">ℹ️</span>
          <p className="text-amber-300/80 text-xs leading-relaxed">
            Your review will be visible after admin approval. This usually takes less than 24 hours.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <Button type="submit" isLoading={isPending} className="flex-1">
            {isPending ? 'Submitting...' : 'Submit Review'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
