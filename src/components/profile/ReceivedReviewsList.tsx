'use client';

import { Star, Users, Briefcase } from 'lucide-react';
import type { Review } from '../../types';
import { formatReviewDate } from '../../lib/job-format';

interface ReceivedReviewsListProps {
  reviews: Review[];
  /** Whether reviews are publicly visible (reviewsVisible). */
  reviewsVisible: boolean;
  isOwnProfile: boolean;
}

/** Reviews written FOR the viewed user. Respects the reviews-visibility privacy flag. */
export default function ReceivedReviewsList({ reviews, reviewsVisible, isOwnProfile }: ReceivedReviewsListProps) {
  return (
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-widest border-b border-[var(--color-glass-border)] pb-2.5 flex items-center space-x-2">
            <Star className="w-4.5 h-4.5 text-[var(--accent-soft-foreground)] drop-shadow-[0_0_5px_rgba(16,185,129,0.2)]" />
            <span>Надад өгсөн үнэлгээнүүд ({reviewsVisible || isOwnProfile ? reviews.length : 0})</span>
            {isOwnProfile && !reviewsVisible && (
              <span className="text-[9px] bg-[var(--bg2)] text-[var(--muted-foreground)] border border-[var(--border)] px-2 py-0.5 rounded font-normal normal-case ml-2 shrink-0">Бусдад харагдахгүй</span>
            )}
          </h3>

          {(reviewsVisible || isOwnProfile) ? (
            reviews.length === 0 ? (
              <div className="panel p-6 rounded-md border border-[var(--color-glass-border)] text-center text-xs text-[var(--muted-foreground)] font-sans">
                Хэрэглэгчид одоогоор үнэлгээ бичигдээгүй байна.
              </div>
            ) : (
              <div className="space-y-3.5 max-h-96 overflow-y-auto pr-1">
                {reviews.map((rev) => (
                  <div key={rev.id} className="panel p-4 rounded-md border border-[var(--color-glass-border)] hover:border-[var(--color-glass-border)] space-y-3 relative overflow-hidden group">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col space-y-1.5 text-left">
                        <span 
                          onClick={() => { window.location.href = `/profile?id=${rev.reviewerId}`; }}
                          className="text-xs font-semibold text-[var(--fg)] hover:text-[var(--accent-soft-foreground)] active:text-[var(--accent-soft-foreground)] transition-colors cursor-pointer select-none flex items-center gap-1.5"
                        >
                          <Users className="w-3.5 h-3.5 text-[var(--muted-foreground)] shrink-0" />
                          <span>{rev.reviewerName}</span>
                        </span>
                        <span 
                          onClick={() => { window.location.href = `/applications?jobId=${rev.jobId}`; }}
                          className="text-xs font-semibold text-[var(--fg)] hover:text-[var(--accent-soft-foreground)] active:text-[var(--accent-soft-foreground)] transition-colors cursor-pointer select-none flex items-center gap-1.5"
                        >
                          <Briefcase className="w-3.5 h-3.5 text-[var(--muted-foreground)] shrink-0" />
                          <span>{rev.jobTitle}</span>
                        </span>
                      </div>
                      {/* Stars indicator */}
                      <div className="flex items-center space-x-0.5 bg-[rgba(255,255,255,0.04)] px-2 py-1 rounded-lg border border-[var(--color-glass-border)] shadow-sm shrink-0">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={`w-2.5 h-2.5 ${s <= rev.rating ? 'text-[var(--accent-soft-foreground)] fill-[var(--accent)]' : 'text-[var(--muted-foreground)]'}`} />
                        ))}
                        <span className="text-[10px] text-[var(--fg)] font-bold ml-1 font-mono">{rev.rating}.0</span>
                      </div>
                    </div>

                    <p className="text-xs leading-relaxed text-[var(--muted-foreground)] italic font-sans bg-[rgba(255,255,255,0.04)] p-2.5 rounded-lg border border-[var(--color-glass-border)] text-left">
                      "{rev.comment}"
                    </p>

                    <div className="flex justify-end items-center text-[10px] text-[var(--muted-foreground)] font-mono border-t border-[var(--color-glass-border)] pt-2">
                      <span className="text-[var(--muted-foreground)]">{formatReviewDate(rev.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="panel p-6 rounded-md border border-[var(--color-glass-border)] text-center text-xs text-[var(--muted-foreground)] italic font-sans">
              Хэрэглэгч үнэлгээ, сэтгэгдлийн хэсгийг нууцалсан байна.
            </div>
          )}
        </div>
  );
}
