'use client';

import { Star, Users, Briefcase, Edit, Trash2 } from 'lucide-react';
import type { Review, Job } from '../../types';
import { formatReviewDate } from '../../lib/job-format';

interface GivenReviewsListProps {
  givenReviews: Review[];
  allJobs: Job[];
  /** Open the edit form for a review (parent seeds the edit-form state). */
  onEditReview: (review: Review) => void;
  onDeleteReview: (reviewId: string) => void;
}

/**
 * "Reviews I have given" — shown only on the user's own profile. Lists reviews
 * the user authored, each with edit/delete actions.
 */
export default function GivenReviewsList({ givenReviews, allJobs, onEditReview, onDeleteReview }: GivenReviewsListProps) {
  return (
        <div className="mt-8 space-y-4 relative z-10 text-left">
          <h3 className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-widest border-b border-[var(--border)] pb-2.5 flex items-center space-x-2">
            <Star className="w-4.5 h-4.5 text-[var(--accent-soft-foreground)] drop-shadow-[0_0_5px_rgba(16,185,129,0.2)]" />
            <span>Миний өгсөн үнэлгээнүүд ({givenReviews.length})</span>
          </h3>

          {givenReviews.length === 0 ? (
            <div className="panel p-6 rounded-md border border-[var(--border)] text-center text-xs text-[var(--muted-foreground)] font-sans">
              Та одоогоор өөр хэрэглэгчид үнэлгээ өгөөгүй байна.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[32rem] overflow-y-auto pr-1">
              {givenReviews.map((rev) => {
                const job = allJobs.find(j => j.id === rev.jobId);
                let targetId = '';
                let targetName = '';
                if (job) {
                  if (rev.reviewerType === 'employer') {
                    targetId = job.hiredOperatorId || '';
                    targetName = job.hiredOperatorName || 'Жолооч';
                  } else {
                    targetId = job.employerId || '';
                    targetName = job.employerName || 'Ажил олгогч';
                  }
                } else {
                  targetName = rev.reviewerType === 'employer' ? 'Жолооч' : 'Ажил олгогч';
                }

                return (
                  <div key={rev.id} className="panel p-4 rounded-md border border-[var(--border)] hover:border-[var(--border)] space-y-3 relative overflow-hidden group">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col space-y-1.5 text-left">
                        {targetId ? (
                          <span 
                            onClick={() => { window.location.href = `/profile?id=${targetId}`; }}
                            className="text-xs font-semibold text-[var(--fg)] hover:text-[var(--accent-soft-foreground)] active:text-[var(--accent-soft-foreground)] transition-colors cursor-pointer select-none flex items-center gap-1.5"
                          >
                            <Users className="w-3.5 h-3.5 text-[var(--muted-foreground)] shrink-0" />
                            <span>{targetName}</span>
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-[var(--muted-foreground)] flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-[var(--muted-foreground)] shrink-0" />
                            <span>{targetName}</span>
                          </span>
                        )}
                        <span 
                          onClick={() => { window.location.href = `/applications?jobId=${rev.jobId}`; }}
                          className="text-xs font-semibold text-[var(--fg)] hover:text-[var(--accent-soft-foreground)] active:text-[var(--accent-soft-foreground)] transition-colors cursor-pointer select-none flex items-center gap-1.5"
                        >
                          <Briefcase className="w-3.5 h-3.5 text-[var(--muted-foreground)] shrink-0" />
                          <span>{rev.jobTitle}</span>
                        </span>
                      </div>

                      <div className="flex flex-col items-end space-y-2 shrink-0">
                        {/* Stars */}
                        <div className="flex items-center space-x-0.5 bg-[rgba(255,255,255,0.04)] px-2 py-1 rounded-lg border border-[var(--border)] shadow-sm">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className={`w-2.5 h-2.5 ${s <= rev.rating ? 'text-[var(--accent-soft-foreground)] fill-[var(--accent)]' : 'text-[var(--muted-foreground)]'}`} />
                          ))}
                          <span className="text-xs text-[var(--fg)] font-bold ml-1 font-mono">{rev.rating}.0</span>
                        </div>

                        {/* Edit/Delete Actions */}
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => onEditReview(rev)}
                            className="text-xs bg-[var(--card)] hover:bg-[var(--card)] border border-[var(--border)] hover:border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--fg)] px-2 py-1 rounded transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Edit className="w-2.5 h-2.5 text-[var(--accent-soft-foreground)]" />
                            <span>Засах</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteReview(rev.id)}
                            className="text-xs bg-[var(--card)] hover:bg-[var(--card)] border border-[var(--border)] hover:border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--accent-soft-foreground)] px-2 py-1 rounded transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-2.5 h-2.5 text-[var(--accent-soft-foreground)]" />
                            <span>Устгах</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs leading-relaxed text-[var(--muted-foreground)] italic font-sans bg-[rgba(255,255,255,0.04)] p-2.5 rounded-lg border border-[var(--border)] text-left">
                      &ldquo;{rev.comment}&rdquo;
                    </p>

                    <div className="flex justify-end items-center text-xs text-[var(--muted-foreground)] font-mono border-t border-[var(--border)] pt-2">
                      <span className="text-[var(--muted-foreground)]">{formatReviewDate(rev.createdAt)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
  );
}
