'use client';

import { X, Star } from 'lucide-react';
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
        className="bg-[var(--card)] border border-[var(--border-strong)] max-w-md w-full rounded-md overflow-hidden shadow-md relative"
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b border-[var(--border)] px-6 py-4.5">
          <div className="flex items-center space-x-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-[var(--accent)] animate-pulse"></span>
            <h3 className="text-sm font-display font-bold uppercase tracking-wide text-[var(--fg)]">Шинэ үнэлгээний дэлгэрэнгүй</h3>
          </div>
          <button
            id="close-view-review-modal"
            onClick={onClose}
            className="text-[var(--muted-foreground)] hover:text-[var(--fg)] transition-colors cursor-pointer p-1 rounded hover:bg-[var(--bg2)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 space-y-5">
          {/* Rating Big Circle */}
          <div className="flex flex-col items-center justify-center py-4 bg-[var(--bg2)] rounded-md border border-[var(--border)]">
            <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-[rgba(31,138,76,0.1)] border border-[var(--verify)] mb-3">
              <Star className="w-8 h-8 text-[var(--verify)] fill-[var(--verify)]" />
            </div>
            <span className="text-2xl font-bold font-mono text-[var(--fg)] tracking-tight">{review.rating}.0 / 5.0</span>
            <div className="flex items-center space-x-1 mt-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${star <= review.rating ? 'fill-[var(--verify)] text-[var(--verify)]' : 'text-[var(--border)]'}`}
                />
              ))}
            </div>
            <span className="text-[10px] text-[var(--muted-foreground)] font-mono mt-2 uppercase tracking-widest">Үнэлгээний оноо</span>
          </div>

          {/* Reviewer & Job info */}
          <div className="space-y-3 bg-[var(--bg2)] p-4 rounded-md border border-[var(--border)] text-xs text-left">
            <div className="flex justify-between items-center pb-2 border-b border-[var(--border)]">
              <span className="text-[var(--muted-foreground)]">Үнэлгээ өгсөн хүн:</span>
              <span className="font-semibold text-[var(--accent-soft-foreground)] font-sans">{review.reviewerName}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-[var(--border)]">
              <span className="text-[var(--muted-foreground)]">Төсөл / Ажлын нэр:</span>
              <span className="font-semibold text-[var(--fg)] font-sans text-right truncate max-w-[60%]">{review.jobTitle}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[var(--muted-foreground)]">Огноо:</span>
              <span className="font-mono text-[var(--muted-foreground)]">{review.createdAt}</span>
            </div>
          </div>

          {/* Comment text block */}
          <div className="space-y-2 text-left">
            <span className="text-[10px] text-[var(--muted-foreground)] uppercase font-mono tracking-wider block">Бичсэн сэтгэгдэл:</span>
            <div className="relative bg-[var(--bg2)] p-4.5 rounded-md border border-[var(--border)] italic text-xs text-[var(--fg)] leading-relaxed font-sans">
              <span className="absolute -top-1 left-2 text-3xl text-[var(--concrete)] font-serif pointer-events-none">“</span>
              <p className="relative z-10 px-2">&ldquo;{review.comment}&rdquo;</p>
              <span className="absolute -bottom-4 right-3 text-3xl text-[var(--concrete)] font-serif pointer-events-none">”</span>
            </div>
          </div>

          {/* Footer info/warning */}
          <p className="text-[11px] text-[var(--muted-foreground)] leading-normal text-center bg-[var(--bg2)] p-2 rounded border border-[var(--border)]">
            🛡️ Энэхүү үнэлгээ нь таны профайлын дундаж үнэлгээ болон ажилчны түүхэнд шууд нөлөөлж, бусад хэрэглэгчдэд харагдах болно.
          </p>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-1">
            <button
              id="close-review-detail-btn"
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--fg)] text-xs font-medium rounded hover:bg-[var(--bg2)] transition-colors cursor-pointer font-sans"
            >
              Хаах
            </button>
            <button
              id="go-to-profile-from-review-btn"
              type="button"
              onClick={onGoToProfile}
              className="flex-1 py-2.5 bg-[var(--accent)] hover:brightness-95 text-[var(--accent-foreground)] text-xs font-bold rounded transition-all shadow-sm cursor-pointer font-sans"
            >
              Миний Профайл руу очих
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
