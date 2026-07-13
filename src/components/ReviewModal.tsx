import { useState, FormEvent, useEffect } from 'react';
import { Star, X } from 'lucide-react';
import { Review, UserType } from '../types';
import { submitReview } from '../lib/db';

interface ReviewModalProps {
  jobId: string;
  jobTitle: string;
  targetUserId: string;
  targetUserName: string;
  reviewerId: string;
  reviewerName: string;
  reviewerType: UserType; // Type of the person filling out this form
  onClose: () => void;
  onSuccess: (review: Review) => void;
}

export default function ReviewModal({
  jobId,
  jobTitle,
  targetUserId,
  targetUserName,
  reviewerId,
  reviewerName,
  reviewerType,
  onClose,
  onSuccess
}: ReviewModalProps) {
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  const [rating, setRating] = useState<number>(5);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [comment, setComment] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setError('Үнэлгээний тайлбар сэтгэгдлийг заавал бичнэ үү.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const review = await submitReview({
        jobId,
        jobTitle,
        reviewerId,
        reviewerName,
        reviewerType,
        rating,
        comment
      });

      onSuccess(review);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Үнэлгээ оруулахад алдаа гарлаа. Та дахин оролдоно уу.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      id="review-modal-backdrop" 
      onClick={onClose}
      className="fixed inset-0 bg-[var(--bg2)] flex items-center justify-center p-4 z-50"
    >
      <div 
        id="review-modal-container" 
        onClick={(e) => e.stopPropagation()}
        className="bg-[var(--bg2)] border border-[var(--border)] max-w-md w-full rounded-xl overflow-hidden shadow-2xl"
      >
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-[var(--border)] px-6 py-4">
          <h3 className="text-sm font-semibold text-[var(--fg)]">Үнэлгээ & Баталгаажуулалт</h3>
          <button id="close-review-modal" onClick={onClose} className="min-w-11 min-h-11 flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--fg)] transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-[var(--bg2)] p-3.5 rounded-lg border border-[var(--border)] space-y-1">
            <span className="text-xs text-[var(--muted-foreground)] block font-mono">Ажлын нэр</span>
            <p className="text-xs font-semibold text-[var(--accent-soft-foreground)]">{jobTitle}</p>
            <div className="pt-2 flex items-center justify-between text-xs text-[var(--muted-foreground)]">
              <span>Үнэлгээ авах хүн:</span>
              <span className="font-semibold text-[var(--fg)]">{targetUserName}</span>
            </div>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500 text-rose-300 p-2.5 rounded text-xs">
              {error}
            </div>
          )}

          {/* Stars */}
          <div className="space-y-1.5 text-center py-2">
            <label className="block text-xs text-[var(--muted-foreground)] font-medium">Хариуцлагын зэрэглэл сонгох</label>
            <div className="flex items-center justify-center space-x-1.5 pt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  id={`review-star-rate-${star}`}
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(null)}
                  className="p-1 focus:outline-none transition-transform hover:scale-110 cursor-pointer"
                >
                  <Star
                    className={`w-8 h-8 ${
                      (hoveredRating !== null ? star <= hoveredRating : star <= rating)
                        ? 'fill-[var(--verify)] text-[var(--verify)]'
                        : 'text-[var(--muted-foreground)]'
                    }`}
                  />
                </button>
              ))}
            </div>
            <div className="text-xs font-medium text-[var(--verify)] font-mono mt-1">
              {rating === 1 && 'Маш хариуцлагагүй! (Ажил хаясан, согтуу эсвэл мурисан)'}
              {rating === 2 && '👎 Шаардлага хангахгүй (Ажлын хурд муу, утас унтраадаг)'}
              {rating === 3 && '✊ Дундаж (Ажлаа дуусгасан ч алдаа дутагдалтай)'}
              {rating === 4 && '👍 Сайн ажилласан (Шаардлагад нийцсэн, зөв хандлагатай)'}
              {rating === 5 && '🌟 Маш сайн, хариуцлагатай! (Мэргэжлийн, үлгэр жишээ)'}
            </div>
          </div>

          {/* Comments Text */}
          <div>
            <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1" htmlFor="review-comment">
              Сэтгэгдэл, үнэлгээний дэлгэрэнгүй түүх бичих
            </label>
            <textarea
              id="review-comment"
              rows={4}
              required
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Үнэлгээ болон сэтгэгдлийн дэлгэрэнгүйг энд бичнэ үү..."
              className="block w-full px-3 py-2 border border-[var(--border)] rounded bg-[var(--bg2)] text-[var(--fg)] placeholder-[var(--muted-foreground)] text-xs focus:ring-1 focus:ring-[var(--accent)] focus:outline-none resize-none font-sans"
            />
          </div>

          <p className="text-sm text-[var(--muted-foreground)] leading-normal">
            🛡️ Санамж: Таны бичсэн үнэлгээ устгах боломжгүй бөгөөд тухайн хэрэглэгчийн бүртгэлийн түүхэнд байнга хадгалагдан харагдана. Үнэн зөв мэдээлнэ үү.
          </p>

          <div className="flex space-x-3 pt-2">
            <button
              id="cancel-submit-review"
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border border-[var(--border)] text-[var(--muted-foreground)] text-xs rounded hover:bg-[var(--bg2)] transition-colors cursor-pointer"
            >
              Буцах
            </button>
            <button
              id="submit-review-form-btn"
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 bg-[var(--accent)] hover:opacity-90 text-[var(--accent-foreground)] text-sm font-medium rounded-full transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Бүртгэж байна...' : 'Үнэлгээг Системд Бүртгэх'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
