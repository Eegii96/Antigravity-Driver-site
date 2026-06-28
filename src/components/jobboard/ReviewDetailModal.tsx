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
      className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in"
    >
      <div
        id="view-review-detail-modal-container"
        onClick={(e) => e.stopPropagation()}
        className="bg-[var(--color-brand-bg2)] border border-[var(--color-glass-border)] max-w-md w-full rounded-2xl overflow-hidden shadow-2xl relative"
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-violet-600/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-500/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>

        {/* Header */}
        <div className="flex justify-between items-center border-b border-[var(--color-glass-border)] px-6 py-4.5">
          <div className="flex items-center space-x-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-violet-500 animate-pulse"></span>
            <h3 className="text-sm font-semibold text-[#f1f3f8] tracking-wide">Шинэ үнэлгээний дэлгэрэнгүй</h3>
          </div>
          <button
            id="close-view-review-modal"
            onClick={onClose}
            className="text-[#9aa3b5] hover:text-[#f1f3f8] transition-colors cursor-pointer p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 space-y-5">
          {/* Rating Big Circle */}
          <div className="flex flex-col items-center justify-center py-4 bg-white/5 rounded-2xl border border-[var(--color-glass-border)]">
            <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-teal-500/10 border border-teal-500/20 mb-3 shadow-[0_0_15px_rgba(34,211,238,0.15)]">
              <Star className="w-8 h-8 text-teal-300 fill-teal-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]" />
            </div>
            <span className="text-2xl font-bold font-mono text-[#f1f3f8] tracking-tight">{review.rating}.0 / 5.0</span>
            <div className="flex items-center space-x-1 mt-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${star <= review.rating ? 'fill-teal-300 text-teal-400' : 'text-white/15'}`}
                />
              ))}
            </div>
            <span className="text-[10px] text-[#9aa3b5] font-mono mt-2 uppercase tracking-widest">Үнэлгээний оноо</span>
          </div>

          {/* Reviewer & Job info */}
          <div className="space-y-3 bg-white/5 p-4 rounded-xl border border-[var(--color-glass-border)] text-xs text-left">
            <div className="flex justify-between items-center pb-2 border-b border-[var(--color-glass-border)]">
              <span className="text-[#9aa3b5]">Үнэлгээ өгсөн хүн:</span>
              <span className="font-semibold text-violet-400 font-sans">{review.reviewerName}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-[var(--color-glass-border)]">
              <span className="text-[#9aa3b5]">Төсөл / Ажлын нэр:</span>
              <span className="font-semibold text-[#e3e6ee] font-sans text-right truncate max-w-[60%]">{review.jobTitle}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#9aa3b5]">Огноо:</span>
              <span className="font-mono text-[#9aa3b5]">{review.createdAt}</span>
            </div>
          </div>

          {/* Comment text block */}
          <div className="space-y-2 text-left">
            <span className="text-[10px] text-[#9aa3b5] uppercase font-mono tracking-wider block">Бичсэн сэтгэгдэл:</span>
            <div className="relative bg-white/5 p-4.5 rounded-xl border border-[var(--color-glass-border)] italic text-xs text-[#e3e6ee] leading-relaxed font-sans shadow-inner">
              <span className="absolute -top-1 left-2 text-3xl text-violet-400/20 font-serif pointer-events-none">“</span>
              <p className="relative z-10 px-2">"{review.comment}"</p>
              <span className="absolute -bottom-4 right-3 text-3xl text-violet-400/20 font-serif pointer-events-none">”</span>
            </div>
          </div>

          {/* Footer info/warning */}
          <p className="text-[9.5px] text-[#9aa3b5] leading-normal text-center bg-white/5 p-2 rounded-lg border border-[var(--color-glass-border)]">
            🛡️ Энэхүү үнэлгээ нь таны профайлын дундаж үнэлгээ болон ажилчны түүхэнд шууд нөлөөлж, бусад хэрэглэгчдэд харагдах болно.
          </p>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-1">
            <button
              id="close-review-detail-btn"
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-[var(--color-glass-border)] text-[#c8cbe0] hover:text-[#f1f3f8] text-xs font-medium rounded-xl hover:bg-white/10 transition-colors cursor-pointer font-sans"
            >
              Хаах
            </button>
            <button
              id="go-to-profile-from-review-btn"
              type="button"
              onClick={onGoToProfile}
              className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-teal-600 hover:from-violet-500 hover:to-teal-500 text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-violet-600/25 cursor-pointer font-sans"
            >
              Миний Профайл руу очих
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
