'use client';

import { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, User as UserIcon, Phone, MapPin, CheckCircle, Share2 } from 'lucide-react';
import type { Job, User } from '../../types';
import { getMockEmployerName, getMockEmployerPhone } from '../../lib/mock-employer';
import { formatRelativeDate, getFirstName } from '../../lib/job-format';
import { trackContactClick, trackShareJob } from '../../lib/analytics';

interface JobCardProps {
  job: Job;
  isExpanded: boolean;
  /** Deep-link arrival flash — adds the highlight ring to the expanded card. */
  isHighlighted?: boolean;
  currentUser: User | null;
  users: User[];
  successMessage: string;
  shareMenuJob: string | null;
  onSelect: (job: Job) => void;
  onCollapse: () => void;
  onShowBlurWarning: () => void;
  onEdit: (job: Job) => void;
  onReview: (job: Job) => void;
  onHire: (jobId: string, operatorId: string) => void;
  onApply: (jobId: string) => void | Promise<void>;
  onCompleteAndReview: (job: Job) => void | Promise<void>;
  onDelete: (job: Job) => void;
  onCancelHiring: (job: Job) => void;
  onToggleShareMenu: (jobId: string | null) => void;
  /** Called after the job link is copied to the clipboard (parent shows a toast). */
  onCopied: () => void;
  /** Router navigation (login/register/profile links). */
  onNavigate: (path: string) => void;
}

/**
 * A single job listing — renders the collapsed summary card or, when
 * `isExpanded`, the full detail card with the hire/apply/review workflow.
 * All side effects are delegated to the parent via callback props.
 */
export default function JobCard({
  job,
  isExpanded,
  isHighlighted = false,
  currentUser,
  users,
  successMessage,
  shareMenuJob,
  onSelect,
  onCollapse,
  onShowBlurWarning,
  onEdit,
  onReview,
  onHire,
  onApply,
  onCompleteAndReview,
  onDelete,
  onCancelHiring,
  onToggleShareMenu,
  onCopied,
  onNavigate,
}: JobCardProps) {
  // Async-action guard — apply/complete stay disabled while the write is in
  // flight so a slow network can't produce double submits (review 2026-07-14).
  const [busyAction, setBusyAction] = useState<'apply' | 'complete' | null>(null);

  // Image carousel: desktop has no natural horizontal-drag gesture, so md+
  // gets explicit prev/next arrows (review 2026-07-14).
  const carouselRef = useRef<HTMLDivElement>(null);
  const scrollCarousel = (dir: -1 | 1) => {
    const el = carouselRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth, behavior: 'smooth' });
  };

  const runBusy = async (action: 'apply' | 'complete', fn: () => void | Promise<void>) => {
    if (busyAction) return;
    setBusyAction(action);
    try {
      await fn();
    } finally {
      setBusyAction(null);
    }
  };

  const getEmployerDisplayName = (job: Job) => {
    const emp = users.find(u => u.id === job.employerId);
    if (emp) {
      return emp.companyName && emp.companyName.trim() ? emp.companyName.trim() : emp.fullName;
    }
    return job.employerName;
  };

  const getEmployerPhone = (job: Job) => {
    const emp = users.find(u => u.id === job.employerId);
    return emp ? emp.phone : '';
  };

  // JobPostModal historically saved this literal placeholder when the poster
  // left the description blank — professional cards hide empty content
  // instead of announcing it (redesign 2026-07-13).
  const hasRealDescription = (text: string | undefined): boolean => {
    const t = (text || '').trim();
    return t !== '' && t !== 'Нэмэлт мэдээлэл оруулаагүй.';
  };

                if (isExpanded) {
                  return (
                    <div
                      id={`job-card-expanded-${job.id}`}
                      key={`expanded-${job.id}`}
                      className={`bg-[var(--card)] border border-[var(--border-strong)] p-5 md:p-6 rounded-2xl text-left space-y-4 shadow-md transition-all duration-200 w-full self-start scroll-mt-24 ${
                        isHighlighted ? 'highlighted-job-card' : ''
                      }`}
                    >
                      {/* ── HEADER: back button + date ── */}
                      <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                        <button
                          onClick={(e) => { e.stopPropagation(); onCollapse(); }}
                          className="pl-2.5 pr-3.5 py-2 -ml-1 rounded-full hover:bg-[var(--bg2)] text-[var(--muted-foreground)] hover:text-[var(--fg)] transition-colors cursor-pointer flex items-center space-x-1"
                          title="Буцах"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          <span className="text-[13px] font-medium">Буцах</span>
                        </button>
                        <span className="text-[13px] text-[var(--concrete)]">{formatRelativeDate(job.createdAt)}</span>
                      </div>

                      {/* ── CREATOR INFO ROW (Name on left, Phone on right) ── */}
                      <div className="flex justify-between items-center pb-2 border-b border-[var(--border)]" onClick={(e) => e.stopPropagation()}>
                        {/* Creator name */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!currentUser) { onShowBlurWarning(); return; }
                            const employerUser = users.find(u => u.id === job.employerId);
                            if (employerUser) onNavigate(`/profile?id=${employerUser.id}`);
                          }}
                          className="flex items-center space-x-2 text-left focus:outline-none hover:opacity-80 transition-opacity bg-transparent border-0 p-0 cursor-pointer"
                        >
                          <UserIcon className="w-4 h-4 text-[var(--muted-foreground)] shrink-0" />
                          <span className={`text-sm font-semibold font-sans text-[var(--fg)] ${
                            !currentUser ? 'filter blur-[5px] select-none cursor-pointer' : 'hover:underline'
                          }`}>
                            {!currentUser ? getMockEmployerName(job.id) : getEmployerDisplayName(job)}
                          </span>
                        </button>

                        {/* Phone number */}
                        <div
                          onClick={(e) => {
                            if (!currentUser) { e.stopPropagation(); onShowBlurWarning(); }
                          }}
                          className={`flex items-center space-x-1.5 ${ !currentUser ? 'cursor-pointer' : '' }`}
                        >
                          <Phone className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                          {!currentUser ? (
                            <span className="font-mono text-sm font-semibold text-[var(--fg)] filter blur-[5px] select-none">
                              {getMockEmployerPhone(job.id)}
                            </span>
                          ) : getEmployerPhone(job) ? (
                            <a
                              href={`tel:${getEmployerPhone(job)}`}
                              onClick={(e) => { e.stopPropagation(); trackContactClick(job.id, 'tel'); }}
                              className="font-mono text-sm font-semibold text-[var(--fg)] underline decoration-[var(--border-strong)] underline-offset-4 py-2 -my-2"
                            >
                              {getEmployerPhone(job)}
                            </a>
                          ) : (
                            <span className="font-mono text-sm font-semibold text-[var(--fg)]">Утасгүй</span>
                          )}
                        </div>
                      </div>

                      {/* ── TITLE + DESCRIPTION ── */}
                      <div className="space-y-2.5">
                        <h2 className="text-xl font-display font-bold tracking-tight text-[var(--fg)] leading-snug">{job.title}</h2>
                        {hasRealDescription(job.description) && (
                          <p className="text-[15px] text-[var(--muted-foreground)] leading-relaxed">{job.description}</p>
                        )}
                        {job.additionalInfo && (
                          <p className="text-sm text-[var(--muted-foreground)] bg-[var(--bg2)] p-3.5 rounded-xl leading-relaxed">
                            {job.additionalInfo}
                          </p>
                        )}
                      </div>

                      {/* ── IMAGES ── */}
                      {job.imageUrls && job.imageUrls.length > 0 ? (
                        <div className="w-full space-y-1">
                          <div className="relative">
                            <div ref={carouselRef} className="flex overflow-x-auto gap-2 snap-x snap-mandatory scrollbar-none py-1">
                              {job.imageUrls.map((url, idx) => (
                                <div key={idx} className="shrink-0 w-full snap-center h-48 md:h-64 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg2)] flex items-center justify-center relative">
                                  <img
                                    src={url}
                                    alt={`Slide ${idx + 1}`}
                                    loading="lazy"
                                    decoding="async"
                                    className="w-full h-full object-contain"
                                  />
                                  <div className="absolute bottom-2.5 right-2.5 bg-[var(--fg)]/75 text-[var(--card)] text-xs font-semibold px-2.5 py-1 rounded-full font-sans">
                                    {idx + 1} / {job.imageUrls?.length}
                                  </div>
                                </div>
                              ))}
                            </div>
                            {job.imageUrls.length > 1 && (
                              <>
                                <button
                                  type="button"
                                  aria-label="Өмнөх зураг"
                                  onClick={(e) => { e.stopPropagation(); scrollCarousel(-1); }}
                                  className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center rounded-full bg-[var(--card)]/90 border border-[var(--border)] text-[var(--fg)] shadow-sm hover:bg-[var(--card)] transition-colors cursor-pointer z-10"
                                >
                                  <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button
                                  type="button"
                                  aria-label="Дараагийн зураг"
                                  onClick={(e) => { e.stopPropagation(); scrollCarousel(1); }}
                                  className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center rounded-full bg-[var(--card)]/90 border border-[var(--border)] text-[var(--fg)] shadow-sm hover:bg-[var(--card)] transition-colors cursor-pointer z-10"
                                >
                                  <ChevronRight className="w-5 h-5" />
                                </button>
                              </>
                            )}
                          </div>
                          {job.imageUrls.length > 1 && (
                            <p className="text-xs text-[var(--concrete)] text-center font-sans select-none md:hidden">
                              Хажуу тийш гүйлгэж үзнэ үү
                            </p>
                          )}
                        </div>
                      ) : (job.imageUrl && (
                        <div className="w-full h-48 md:h-64 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg2)] flex items-center justify-center">
                          <img
                            src={job.imageUrl}
                            alt={job.title}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ))}

                      {/* ── SALARY + LOCATION 2-column grid ── */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-[var(--bg2)] p-4 rounded-xl">
                          <span className="text-xs text-[var(--muted-foreground)] font-medium block mb-1.5">Цалин / Төлбөр</span>
                          <span className="font-display font-bold text-[var(--verify)] text-base tabular-nums">
                            {job.salary === 0 ? 'Тохиролцоно' : `${job.salary.toLocaleString()} ₮`}
                          </span>
                          {job.salaryUnit && job.salaryUnit !== 'Өдрөөр' && (
                            <span className="text-xs text-[var(--muted-foreground)] block mt-0.5">{job.salaryUnit}</span>
                          )}
                        </div>
                        <div className="bg-[var(--bg2)] p-4 rounded-xl">
                          <span className="text-xs text-[var(--muted-foreground)] font-medium block mb-1.5">Байршил</span>
                          <span className="font-semibold text-[var(--fg)] text-sm flex items-start gap-1.5">
                            <MapPin className="w-4 h-4 text-[var(--muted-foreground)] shrink-0 mt-0.5" />
                            {job.location}
                          </span>
                        </div>
                      </div>

                      {/* ── STATUS BADGE ── */}
                      <div>
                        {(() => {
                          if (job.status === 'open') {
                            return (
                              <span className="inline-flex items-center text-[13px] font-semibold px-3.5 py-1.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent-soft-foreground)]">
                                Нээлттэй зар
                              </span>
                            );
                          } else if (job.status === 'in_progress') {
                            return (
                              <span className="inline-flex items-center text-[13px] font-semibold px-3.5 py-1.5 rounded-full bg-[rgba(188,79,36,0.08)] text-[var(--alert)]">
                                Ажиллаж байгаа
                              </span>
                            );
                          } else {
                            const isReviewed = job.isReviewedByEmployer;
                            if (isReviewed) {
                              return (
                                <span className="inline-flex items-center text-[13px] font-semibold px-3.5 py-1.5 rounded-full bg-[rgba(35,121,82,0.08)] text-[var(--verify)]">
                                  Үнэлэгдсэн · Хаагдсан
                                </span>
                              );
                            } else {
                              return (
                                <span className="inline-flex items-center text-[13px] font-semibold px-3.5 py-1.5 rounded-full bg-[rgba(188,79,36,0.08)] text-[var(--alert)]">
                                  Ажил дууссан · Үнэлэх шаардлагатай
                                </span>
                              );
                            }
                          }
                        })()}
                      </div>



                      {/* ── WORKFLOW ACTIONS ── */}
                      <div className="border-t border-[var(--border)] pt-3 space-y-3" onClick={(e) => e.stopPropagation()}>
                        {!currentUser ? (
                          <div className="bg-[var(--bg2)] p-5 rounded-xl text-center space-y-3.5">
                            <p className="text-sm text-[var(--muted-foreground)] font-sans leading-relaxed">
                              Та энэхүү заранд хүсэлт илгээх эсвэл зар тавихын тулд системд нэвтэрсэн байх шаардлагатай.
                            </p>
                            <div className="flex justify-center space-x-3">
                              <button onClick={() => onNavigate('/auth?tab=login')} className="border border-[var(--border)] hover:border-[var(--border-strong)] bg-[var(--card)] text-[var(--fg)] font-semibold text-sm px-5 py-2.5 rounded-full transition-colors cursor-pointer">
                                Нэвтрэх
                              </button>
                              <button onClick={() => onNavigate('/auth?tab=register')} className="bg-[var(--accent)] hover:opacity-90 text-[var(--accent-foreground)] font-semibold text-sm px-5 py-2.5 rounded-full transition-all cursor-pointer">
                                Бүртгүүлэх
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {job.status === 'open' && (
                              <>
                                {currentUser.id === job.employerId ? (
                                  <div className="space-y-3">
                                    <div className="bg-[var(--bg2)] p-4 rounded-xl space-y-3">
                                      <span className="text-[13px] text-[var(--muted-foreground)] block font-medium">Зарын тохиргоо</span>
                                      <div className="flex space-x-2.5">
                                        <button type="button" onClick={() => onEdit(job)} className="flex-1 border border-[var(--border)] hover:border-[var(--border-strong)] bg-[var(--card)] text-[var(--fg)] font-semibold text-[13px] py-2.5 px-3 rounded-full transition-colors cursor-pointer text-center">
                                          Засах
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => onDelete(job)}
                                          className="flex-1 border border-rose-200 hover:border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 font-semibold text-[13px] py-2.5 px-3 rounded-full transition-colors cursor-pointer text-center"
                                        >
                                          Устгах
                                        </button>
                                      </div>
                                    </div>
                                    <div className="flex items-center justify-between text-sm border-b border-[var(--border)] pb-2.5">
                                      <span className="font-semibold text-[var(--fg)]">Хүсэлт ирүүлсэн харилцагч ({job.applicants.length})</span>
                                    </div>
                                    {job.applicants.length === 0 ? (
                                      <p className="text-sm text-[var(--muted-foreground)] text-center py-2.5">Ирүүлсэн хүсэлт байхгүй байна.</p>
                                    ) : (
                                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1 overscroll-contain">
                                        {job.applicants.map((opId) => {
                                          const op = users.find(u => u.id === opId);
                                          if (!op) return null;
                                          return (
                                            <div key={opId} className="flex items-center justify-between bg-[var(--bg2)] p-3 rounded-xl">
                                              <button type="button" onClick={() => onNavigate(`/profile?id=${op.id}`)} className="text-sm text-[var(--fg)] font-medium hover:underline text-left focus:outline-none">
                                                {op.fullName} {op.type === 'operator' && `(${op.experienceYears || 0} жил)`}
                                              </button>
                                              <button onClick={() => onHire(job.id, op.id)} className="min-h-11 bg-[var(--accent)] hover:opacity-90 text-[var(--accent-foreground)] text-[13px] font-semibold px-4 rounded-full transition-all cursor-pointer">
                                                Сонгох
                                              </button>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  job.applicants.includes(currentUser.id) ? (
                                    <div className="space-y-2.5">
                                      <button disabled className="w-full bg-[var(--bg2)] text-[var(--muted-foreground)] text-[15px] font-semibold py-3.5 px-4 rounded-full cursor-not-allowed text-center">
                                        Хүсэлт илгээсэн
                                      </button>
                                      {successMessage && successMessage.includes('хүсэлт') && (
                                        <div className="bg-[rgba(35,121,82,0.08)] text-[var(--verify)] p-4 rounded-xl flex items-start space-x-2 animate-fade-in text-left">
                                          <CheckCircle className="w-4 h-4 text-[var(--verify)] shrink-0 mt-0.5" />
                                          <span className="font-sans leading-normal text-sm">{successMessage}</span>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => runBusy('apply', () => onApply(job.id))}
                                      disabled={busyAction === 'apply'}
                                      className="w-full bg-[var(--accent)] hover:opacity-90 text-[var(--accent-foreground)] text-[15px] font-semibold py-3.5 px-4 rounded-full transition-all cursor-pointer text-center disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                      {busyAction === 'apply' ? 'Илгээж байна...' : 'Хүсэлт илгээх'}
                                    </button>
                                  )
                                )}
                              </>
                            )}

                            {job.status === 'in_progress' && (
                              <div className="bg-[var(--bg2)] p-4 rounded-xl space-y-3">
                                <div className="text-sm text-[var(--fg)] flex items-center justify-between">
                                  <span>Хамтран ажиллаж буй оператор:</span>
                                  <span className="font-semibold text-[var(--fg)]">
                                    {(() => {
                                      const op = users.find(u => u.id === job.hiredOperatorId);
                                      return op ? getFirstName(op) : getFirstName(job.hiredOperatorName);
                                    })()}
                                  </span>
                                </div>
                                {successMessage && successMessage.includes('томиллоо') && (
                                  <div className="bg-[rgba(35,121,82,0.08)] text-[var(--verify)] p-3.5 rounded-xl text-sm flex items-start space-x-2 animate-fade-in text-left">
                                    <CheckCircle className="w-4 h-4 text-[var(--verify)] shrink-0 mt-0.5" />
                                    <span className="font-sans leading-normal">{successMessage}</span>
                                  </div>
                                )}
                                {currentUser.id === job.employerId && (
                                  <button
                                    id="employer-complete-job-btn"
                                    onClick={() => runBusy('complete', () => onCompleteAndReview(job))}
                                    disabled={busyAction === 'complete'}
                                    className="w-full bg-[var(--accent)] hover:opacity-90 text-[var(--accent-foreground)] py-3 px-4 rounded-full text-sm font-semibold transition-all cursor-pointer text-center disabled:opacity-60 disabled:cursor-not-allowed"
                                  >
                                    {busyAction === 'complete' ? 'Баталгаажуулж байна...' : 'Ажил дууссаныг баталгаажуулж үнэлэх'}
                                  </button>
                                )}
                                {currentUser.id !== job.employerId && (
                                  <p className="text-sm text-[var(--muted-foreground)]">Ажил олгогч ажлыг дууссаныг тэмдэглэсний дараа та үнэлгээ өгөх боломжтой болно.</p>
                                )}
                              </div>
                            )}

                            {job.status === 'completed' && (
                              <div className="bg-[var(--bg2)] p-4 rounded-xl space-y-3">
                                <div className="flex items-center space-x-2 text-sm text-[var(--verify)] font-semibold">
                                  <CheckCircle className="w-4 h-4" />
                                  <span>Энэхүү ажил амжилттай гүйцэтгэгдэж дууссан</span>
                                </div>

                                {currentUser.type === 'operator' && job.hiredOperatorId === currentUser.id && !job.isReviewedByOperator && (
                                  <button id="op-review-employer-btn" onClick={() => onReview(job)} className="w-full bg-[var(--accent)] hover:opacity-90 text-[var(--accent-foreground)] py-3 px-4 rounded-full text-sm font-semibold cursor-pointer transition-all">
                                    Захиалагчийг үнэлэх (цалин хоцрогдол эсвэл харилцаа)
                                  </button>
                                )}

                                {currentUser.type === 'employer' && job.employerId === currentUser.id && !job.isReviewedByEmployer && (
                                  <div className="space-y-2">
                                    <button id="emp-review-operator-btn" onClick={() => onReview(job)} className="w-full bg-[var(--accent)] hover:opacity-90 text-[var(--accent-foreground)] py-3 px-4 rounded-full text-sm font-semibold cursor-pointer transition-all">
                                      Жолоочийг үнэлэх (хариуцлага, ажлын чанар)
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => onCancelHiring(job)}
                                      className="w-full text-center py-2.5 text-[13px] border border-rose-200 hover:border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 rounded-full transition-colors cursor-pointer font-semibold"
                                    >
                                      Сонгосон жолоочийг болих
                                    </button>
                                  </div>
                                )}

                                {((currentUser.type === 'operator' && job.isReviewedByOperator) ||
                                  (currentUser.type === 'employer' && job.isReviewedByEmployer)) && (
                                  <div className="text-sm text-[var(--muted-foreground)] text-center">
                                    Таны үнэлгээ системд хэдийн бүртгэгдсэн байна. Таны хариуцлагатай оролцоонд баярлалаа!
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* ── SHARE BUTTON ── */}
                      <div className="relative border-t border-[var(--border)] pt-3">
                        <button
                          type="button"
                          onClick={async (e) => {
                            e.stopPropagation();
                            const jobUrl = `${window.location.origin}/jobs/${job.id}`;
                            const salaryText = job.salary === 0
                              ? 'Тохиролцоно'
                              : `${job.salary.toLocaleString()}₮${job.salaryUnit ? ` (${job.salaryUnit})` : ''}`;
                            const shareText = `${job.title} — ${job.location}\nЦалин: ${salaryText}\n\n${jobUrl}`;

                            // Mobile: use native OS share sheet (Web Share API)
                            if (navigator.share) {
                              try {
                                await navigator.share({
                                  title: job.title,
                                  text: shareText,
                                  url: jobUrl,
                                });
                                trackShareJob(job.id, 'native');
                              } catch (_) {
                                // User cancelled share — do nothing
                              }
                            } else {
                              // Desktop fallback: open dropdown
                              onToggleShareMenu(shareMenuJob === job.id ? null : job.id);
                            }
                          }}
                          className="flex items-center gap-2 text-[13px] font-medium text-[var(--muted-foreground)] hover:text-[var(--fg)] transition-colors cursor-pointer py-2 -my-2 pr-2"
                        >
                          <Share2 className="w-4 h-4" />
                          <span>Хуваалцах</span>
                        </button>

                        {/* Desktop-only dropdown (shown only when Web Share API is not available) */}
                        {shareMenuJob === job.id && (
                          <div
                            className="absolute bottom-full left-0 mb-2 bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-md p-3.5 z-50 w-64 animate-fade-in"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <p className="text-[13px] text-[var(--muted-foreground)] font-medium mb-2.5">Хуваалцах платформ</p>
                            <div className="grid grid-cols-3 gap-2">
                              {(() => {
                                const jobUrl = typeof window !== 'undefined' ? `${window.location.origin}/jobs/${job.id}` : '';
                                const shareMsg = encodeURIComponent(`${job.title}\n${jobUrl}`);
                                return [
                                  {
                                    label: 'Facebook',
                                    action: () => {
                                      // Try native FB app deep link first, fallback to web sharer
                                      const fbAppUrl = `fb://share?href=${encodeURIComponent(jobUrl)}`;
                                      const fbWebUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(jobUrl)}`;
                                      const a = document.createElement('a');
                                      a.href = fbAppUrl;
                                      a.click();
                                      // Fallback after delay if app didn't open
                                      setTimeout(() => {
                                        if (!document.hidden) window.open(fbWebUrl, '_blank');
                                      }, 1500);
                                    },
                                  },
                                  {
                                    label: 'Messenger',
                                    action: () => {
                                      // Direct Messenger deep link — opens Messenger app with share dialog
                                      window.location.href = `fb-messenger://share/?link=${encodeURIComponent(jobUrl)}&app_id=966242223397117`;
                                    },
                                  },
                                  {
                                    label: 'Telegram',
                                    action: () => {
                                      // tg:// deep link opens Telegram app directly
                                      window.location.href = `tg://msg_url?url=${encodeURIComponent(jobUrl)}&text=${encodeURIComponent(job.title)}`;
                                    },
                                  },
                                  {
                                    label: 'WhatsApp',
                                    action: () => {
                                      window.open(`https://api.whatsapp.com/send?text=${shareMsg}`, '_blank');
                                    },
                                  },
                                  {
                                    label: 'Gmail',
                                    action: () => {
                                      window.open(`mailto:?subject=${encodeURIComponent(job.title)}&body=${encodeURIComponent(jobUrl)}`, '_blank');
                                    },
                                  },
                                  {
                                    label: 'Хуулах',
                                    action: async () => {
                                      await navigator.clipboard.writeText(jobUrl);
                                      onCopied();
                                    },
                                  },
                                ];
                              })().map(({ label, action }) => (
                                <button
                                  key={label}
                                  type="button"
                                  onClick={async () => {
                                    await action();
                                    trackShareJob(job.id, label.toLowerCase());
                                    onToggleShareMenu(null);
                                  }}
                                  className="flex items-center justify-center bg-[var(--bg2)] hover:bg-[var(--border)] rounded-full px-2 py-2.5 text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--fg)] transition-colors cursor-pointer"
                                >
                                  {label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div
                      id={`job-card-collapsed-${job.id}`}
                      key={`collapsed-${job.id}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => onSelect(job)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(job); } }}
                      className="w-full bg-[var(--card)] transition-all duration-150 border border-[var(--border)] hover:border-[var(--border-strong)] p-5 rounded-2xl cursor-pointer flex flex-col justify-between space-y-4 text-left group shadow-sm hover:shadow-md hover:-translate-y-0.5 self-start"
                    >
                      <div className="space-y-3">
                        {/* Employer name and Date */}
                        <div className="flex justify-between items-center gap-3">
                          {!currentUser ? (
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                onShowBlurWarning();
                              }}
                              className="text-sm font-semibold text-[var(--fg)] font-sans filter blur-[5px] select-none cursor-pointer"
                              title="Дэлгэрэнгүйг нэвтэрч харна уу"
                            >
                              {getMockEmployerName(job.id)}
                            </span>
                          ) : (
                            <span className="text-sm font-semibold text-[var(--fg)] font-sans">
                              {getEmployerDisplayName(job)}
                            </span>
                          )}
                          <span className="text-[13px] text-[var(--concrete)] shrink-0">
                            {formatRelativeDate(job.createdAt)}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-[17px] font-display font-bold tracking-tight text-[var(--fg)] transition-colors leading-snug">
                          {job.title}
                        </h3>

                        {/* Job Image Thumbnail — prefer the 320px thumbnailUrls entry over
                            the full 800px image (audit P3); older jobs without a thumbnail
                            fall back to the full image. */}
                        {((job.imageUrls && job.imageUrls.length > 0) || job.imageUrl) && (
                          <div className="w-full h-40 rounded-xl overflow-hidden bg-[var(--bg2)] relative shrink-0">
                            <img
                              src={job.thumbnailUrls?.[0] || (job.imageUrls && job.imageUrls.length > 0 ? job.imageUrls[0] : job.imageUrl)}
                              alt={job.title}
                              width={400}
                              height={160}
                              loading="lazy"
                              decoding="async"
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                            />
                          </div>
                        )}

                        {/* Short description preview — hidden when the poster left it blank */}
                        {hasRealDescription(job.description) && (
                          <p className="text-[15px] text-[var(--muted-foreground)] line-clamp-2 leading-relaxed">
                            {job.description}
                          </p>
                        )}
                      </div>

                      <div className="border-t border-[var(--border)] pt-4 space-y-3">
                        {/* Salary — the single most important datum on the card — and status.
                            Open is the default state and gets NO badge (redesign: accent
                            restraint); only exceptional states show a chip. */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <span className="block text-xs text-[var(--muted-foreground)] font-medium">Цалин / Төлбөр</span>
                            <span className="font-display text-[17px] font-bold text-[var(--verify)] leading-tight tabular-nums">
                              {job.salary === 0 ? 'Тохиролцоно' : `${job.salary.toLocaleString()} ₮`}
                            </span>
                          </div>

                          {(() => {
                            if (job.status === 'open') {
                              return null;
                            } else if (job.status === 'in_progress') {
                              return (
                                <span className="shrink-0 inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-full bg-[rgba(188,79,36,0.08)] text-[var(--alert)]">
                                  Ажиллаж байгаа
                                </span>
                              );
                            } else {
                              const isReviewed = job.isReviewedByEmployer;
                              if (isReviewed) {
                                return (
                                  <span className="shrink-0 inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-full bg-[rgba(35,121,82,0.08)] text-[var(--verify)]">
                                    Хаагдсан
                                  </span>
                                );
                              } else {
                                return (
                                  <span className="shrink-0 inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-full bg-[rgba(188,79,36,0.08)] text-[var(--alert)]">
                                    Үнэлгээ хүлээгдэж буй
                                  </span>
                                );
                              }
                            }
                          })()}
                        </div>

                        {/* Location + phone row */}
                        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 text-sm">
                          <span className="flex items-center gap-1.5 text-[var(--muted-foreground)] min-w-0">
                            <MapPin className="w-4 h-4 shrink-0" />
                            <span className="truncate">{job.location}</span>
                          </span>

                          <div
                            onClick={(e) => {
                              if (!currentUser) {
                                e.stopPropagation();
                                onShowBlurWarning();
                              }
                            }}
                            className={`flex items-center space-x-1.5 text-[var(--muted-foreground)] shrink-0 ${!currentUser ? 'cursor-pointer' : ''}`}
                          >
                            <Phone className="w-4 h-4 text-[var(--muted-foreground)]" />
                            {!currentUser ? (
                              <span className="font-mono font-medium text-[var(--muted-foreground)] filter blur-[5px] select-none">
                                {getMockEmployerPhone(job.id)}
                              </span>
                            ) : getEmployerPhone(job) ? (
                              <a
                                href={`tel:${getEmployerPhone(job)}`}
                                onClick={(e) => { e.stopPropagation(); trackContactClick(job.id, 'tel'); }}
                                className="font-mono font-medium text-[var(--fg)] underline decoration-[var(--border-strong)] underline-offset-4 py-2 -my-2"
                              >
                                {getEmployerPhone(job)}
                              </a>
                            ) : (
                              <span className="font-mono font-medium text-[var(--muted-foreground)]">Утасгүй</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
}
