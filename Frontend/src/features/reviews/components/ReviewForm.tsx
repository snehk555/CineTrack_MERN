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

export default function ReviewForm({ movieId, movieTitle, isOpen, onClose }: ReviewFormProps) {
  const [comment, setComment] = useState('');
  const { mutate: submit, isPending } = useSubmitReview();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    submit(
      { movieId, rating: undefined, comment: comment.trim() },
      {
        onSuccess: () => {
          setComment('');
          onClose();
        },
      }
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Comment on: ${movieTitle}`} size="md">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">

        {/* Comment */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Your Comment
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your thoughts about this movie..."
            maxLength={1000}
            rows={5}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-200 placeholder-slate-500 text-sm outline-none resize-none focus:border-violet-500 transition-colors"
          />
          <p className="text-right text-xs text-slate-500 mt-1">{comment.length}/1000</p>
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
          <Button type="submit" isLoading={isPending} className="flex-1" disabled={!comment.trim()}>
            {isPending ? 'Posting…' : 'Post Comment'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
