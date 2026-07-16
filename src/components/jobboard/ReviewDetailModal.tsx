'use client';

import { X, Star, ShieldCheck } from 'lucide-react';
import type { Review } from '../../types';

interface ReviewDetailModalProps {
  review: Review;
  onClose: () => void;
  /** Navigate to the current user's profile. */
  onGoToProfile: () => void;
}

/**
 * Read-only detail view of a single received review.
 * Render conditionally by the parent: `{review && <ReviewDetailModal .../>}`.
 */
export default function ReviewDetailModal({ review, onClose, onGoToProfile }: ReviewDetailModalProps) {
  return (
    <div
      id="view-review-detail-modal-backdrop"
      onClick={onClose}
      className="fixed inset-0 bg-[var(--fg)]/40 flex items-center justify-center p-4 z-50 animate-fade-in"
    >
      <div
        id="view-review-detail-modal-container"
        onClick={(e) => e.stopPropagation()}
        className="bg-[var(--card)] border border-[var(--border-strong)] max-w-md w-full rounded-2xl overflow-hidden shadow-md relative"
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b border-[var(--border)] px-6 py-4">
          <h3 className="text-[17px] font-display font-bold text-[var(--fg)]">Шинэ үнэлгээний дэлгэрэнгүй</h3>
          <button
            id="close-view-review-modal"
            onClick={onClose}
            aria-label="Хаах"
            className="min-w-11 min-h-11 flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--fg)] transition-colors cursor-pointer rounded-full hover:bg-[var(--bg2)] -mr-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 space-y-5">
          {/* Rating Big Circle */}
          <div className="flex flex-col items-center justify-center py-4 bg-[var(--bg2)] rounded-xl">
            <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-[rgba(35,121,82,0.08)] mb-3">
              <Star className="w-8 h-8 text-[var(--verify)] fill-[var(--verify)]" />
            </div>
            <span className="text-2xl font-display font-bold text-[var(--fg)] tracking-tight tabular-nums">{review.rating}.0 / 5.0</span>
            <div className="flex items-center space-x-1 mt-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${star <= review.rating ? 'fill-[var(--verify)] text-[var(--verify)]' : 'text-[var(--concrete)]'}`}
                />
              ))}
            </div>
            <span className="text-[13px] text-[var(--muted-foreground)] font-sans mt-2">Үнэлгээний оноо</span>
          </div>

          {/* Reviewer & Job info */}
          <div className="space-y-3 bg-[var(--bg2)] p-4 rounded-xl text-sm text-left">
            <div className="flex justify-between items-center pb-2 border-b border-[var(--border)]">
              <span className="text-[var(--muted-foreground)]">Үнэлгээ өгсөн хүн:</span>
              <span className="font-semibold text-[var(--fg)] font-sans">{review.reviewerName}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-[var(--border)]">
              <span className="text-[var(--muted-foreground)]">Төсөл / Ажлын нэр:</span>
              <span className="font-semibold text-[var(--fg)] font-sans text-right truncate max-w-[60%]">{review.jobTitle}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[var(--muted-foreground)]">Огноо:</span>
              <span className="font-sans tabular-nums text-[var(--muted-foreground)]">{review.createdAt}</span>
            </div>
          </div>

          {/* Comment text block */}
          <div className="space-y-2 text-left">
            <span className="text-[13px] text-[var(--muted-foreground)] font-sans font-medium block">Бичсэн сэтгэгдэл:</span>
            <div className="bg-[var(--bg2)] p-4 rounded-xl text-[15px] text-[var(--fg)] leading-relaxed font-sans">
              <p>&ldquo;{review.comment}&rdquo;</p>
            </div>
          </div>

          {/* Footer info/warning */}
          <p className="text-sm text-[var(--muted-foreground)] leading-normal text-left bg-[var(--bg2)] p-3.5 rounded-xl flex items-start gap-2.5">
            <ShieldCheck className="w-4.5 h-4.5 text-[var(--accent-soft-foreground)] shrink-0 mt-0.5" aria-hidden="true" />
            <span>Энэхүү үнэлгээ нь таны профайлын дундаж үнэлгээ болон ажилчны түүхэнд шууд нөлөөлж, бусад хэрэглэгчдэд харагдах болно.</span>
          </p>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-1">
            <button
              id="close-review-detail-btn"
              type="button"
              onClick={onClose}
              className="flex-1 min-h-12 border border-[var(--border)] hover:border-[var(--border-strong)] text-[var(--fg)] text-sm font-semibold rounded-full hover:bg-[var(--bg2)] transition-colors cursor-pointer font-sans"
            >
              Хаах
            </button>
            <button
              id="go-to-profile-from-review-btn"
              type="button"
              onClick={onGoToProfile}
              className="flex-1 min-h-12 bg-[var(--accent)] hover:opacity-90 text-[var(--accent-foreground)] text-[15px] font-semibold rounded-full transition-all shadow-sm cursor-pointer font-sans"
            >
              Миний профайл руу очих
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
