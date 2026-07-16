import { useState, FormEvent, useEffect } from 'react';
import { Star, X, ShieldCheck } from 'lucide-react';
import { Review, UserType } from '../types';
import { submitReview } from '../lib/db';
import ConfirmModal from './ConfirmModal';

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
  const [showDiscardConfirm, setShowDiscardConfirm] = useState<boolean>(false);

  // A tap on the backdrop used to silently throw away everything the user had
  // typed (review 2026-07-14) — confirm the discard when there's a draft.
  const handleClose = () => {
    if (comment.trim()) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

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
      onClick={handleClose}
      className="fixed inset-0 bg-[var(--fg)]/40 flex p-4 z-50 overflow-y-auto animate-fade-in"
    >
      <div
        id="review-modal-container"
        onClick={(e) => e.stopPropagation()}
        className="bg-[var(--card)] border border-[var(--border-strong)] max-w-md w-full rounded-2xl overflow-hidden shadow-md m-auto"
      >

        {/* Header */}
        <div className="flex justify-between items-center border-b border-[var(--border)] px-6 py-4">
          <h3 className="text-base font-display font-bold text-[var(--fg)]">Үнэлгээ өгөх</h3>
          <button id="close-review-modal" onClick={handleClose} aria-label="Хаах" className="min-w-11 min-h-11 flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--fg)] hover:bg-[var(--bg2)] rounded-full transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-[var(--bg2)] p-4 rounded-xl space-y-1">
            <span className="text-[13px] text-[var(--muted-foreground)] block font-medium">Ажлын нэр</span>
            <p className="text-sm font-semibold text-[var(--fg)]">{jobTitle}</p>
            <div className="pt-2 flex items-center justify-between text-sm text-[var(--muted-foreground)]">
              <span>Үнэлгээ авах хүн:</span>
              <span className="font-semibold text-[var(--fg)]">{targetUserName}</span>
            </div>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Stars */}
          <div className="space-y-1.5 text-center py-2">
            <label className="block text-[13px] text-[var(--muted-foreground)] font-medium">Хариуцлагын зэрэглэл сонгох</label>
            <div className="flex items-center justify-center space-x-1 pt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  id={`review-star-rate-${star}`}
                  key={star}
                  type="button"
                  aria-label={`${star} од`}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(null)}
                  className="p-1.5 focus:outline-none transition-transform hover:scale-110 cursor-pointer"
                >
                  <Star
                    className={`w-8 h-8 ${
                      (hoveredRating !== null ? star <= hoveredRating : star <= rating)
                        ? 'fill-[var(--verify)] text-[var(--verify)]'
                        : 'text-[var(--concrete)]'
                    }`}
                  />
                </button>
              ))}
            </div>
            <div className="text-sm font-medium text-[var(--verify)] font-sans mt-1">
              {rating === 1 && 'Маш хариуцлагагүй (ажил хаясан, согтуу эсвэл мурисан)'}
              {rating === 2 && 'Шаардлага хангахгүй (ажлын хурд муу, утас унтраадаг)'}
              {rating === 3 && 'Дундаж (ажлаа дуусгасан ч алдаа дутагдалтай)'}
              {rating === 4 && 'Сайн ажилласан (шаардлагад нийцсэн, зөв хандлагатай)'}
              {rating === 5 && 'Маш сайн, хариуцлагатай (мэргэжлийн, үлгэр жишээ)'}
            </div>
          </div>

          {/* Comments Text */}
          <div>
            <label className="block text-[13px] font-medium text-[var(--muted-foreground)] mb-1.5" htmlFor="review-comment">
              Сэтгэгдэл, үнэлгээний дэлгэрэнгүй түүх бичих
            </label>
            <textarea
              id="review-comment"
              rows={4}
              required
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Үнэлгээ болон сэтгэгдлийн дэлгэрэнгүйг энд бичнэ үү..."
              className="block w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--bg)] text-[var(--fg)] placeholder-[var(--muted-foreground)] text-base focus:ring-2 focus:ring-[var(--accent-soft)] focus:border-[var(--fg)] focus:outline-none resize-none font-sans"
            />
          </div>

          <p className="text-sm text-[var(--muted-foreground)] leading-normal flex items-start gap-2.5 bg-[var(--bg2)] p-3.5 rounded-xl">
            <ShieldCheck className="w-4.5 h-4.5 text-[var(--accent-soft-foreground)] shrink-0 mt-0.5" aria-hidden="true" />
            <span>Санамж: Таны бичсэн үнэлгээ устгах боломжгүй бөгөөд тухайн хэрэглэгчийн бүртгэлийн түүхэнд байнга хадгалагдан харагдана. Үнэн зөв мэдээлнэ үү.</span>
          </p>

          <div className="flex space-x-3 pt-2">
            <button
              id="cancel-submit-review"
              type="button"
              onClick={handleClose}
              className="flex-1 min-h-12 border border-[var(--border)] hover:border-[var(--border-strong)] text-[var(--fg)] text-sm font-semibold rounded-full hover:bg-[var(--bg2)] transition-colors cursor-pointer"
            >
              Буцах
            </button>
            <button
              id="submit-review-form-btn"
              type="submit"
              disabled={isSubmitting}
              className="flex-1 min-h-12 bg-[var(--accent)] hover:opacity-90 text-[var(--accent-foreground)] text-[15px] font-semibold rounded-full transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Бүртгэж байна...' : 'Үнэлгээг бүртгэх'}
            </button>
          </div>

        </form>
      </div>

      {/* Draft-discard confirmation */}
      {showDiscardConfirm && (
        <div onClick={(e) => e.stopPropagation()}>
          <ConfirmModal
            title="Бичсэн үнэлгээгээ орхих уу?"
            message="Таны бичсэн сэтгэгдэл хадгалагдахгүй устана."
            confirmLabel="Тийм, орхих"
            danger
            onConfirm={() => {
              setShowDiscardConfirm(false);
              onClose();
            }}
            onClose={() => setShowDiscardConfirm(false)}
          />
        </div>
      )}
    </div>
  );
}
