'use client';

import { ChevronLeft, User as UserIcon, Phone, MapPin, CheckCircle, Share2 } from 'lucide-react';
import type { Job, User } from '../../types';
import { getMockEmployerName, getMockEmployerPhone } from '../../lib/mock-employer';
import { formatRelativeDate, getFirstName } from '../../lib/job-format';
import { trackContactClick, trackShareJob } from '../../lib/analytics';

interface JobCardProps {
  job: Job;
  isExpanded: boolean;
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
  onApply: (jobId: string) => void;
  onCompleteAndReview: (job: Job) => void;
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

                if (isExpanded) {
                  return (
                    <div
                      id={`job-card-expanded-${job.id}`}
                      key={`expanded-${job.id}`}
                      className="bg-[var(--card)] border border-[var(--border-strong)] p-5 rounded-md text-left space-y-4 shadow-sm transition-all duration-200 w-full self-start"
                    >
                      {/* ── HEADER: back button + date ── */}
                      <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                        <button
                          onClick={(e) => { e.stopPropagation(); onCollapse(); }}
                          className="p-1.5 -ml-1 rounded hover:bg-[var(--bg2)] text-[var(--muted-foreground)] hover:text-[var(--fg)] transition-colors cursor-pointer flex items-center space-x-1"
                          title="Буцах"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          <span className="text-xs text-[var(--muted-foreground)]">Буцах</span>
                        </button>
                        <span className="font-mono text-xs text-[var(--muted-foreground)]">{formatRelativeDate(job.createdAt)}</span>
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
                          <span className={`text-xs font-bold font-sans text-[var(--accent-soft-foreground)] ${
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
                            <span className="font-mono text-xs font-bold text-[var(--fg)] filter blur-[5px] select-none">
                              {getMockEmployerPhone(job.id)}
                            </span>
                          ) : getEmployerPhone(job) ? (
                            <a
                              href={`tel:${getEmployerPhone(job)}`}
                              onClick={(e) => { e.stopPropagation(); trackContactClick(job.id, 'tel'); }}
                              className="font-mono text-xs font-bold text-[var(--fg)] underline decoration-[var(--accent)] underline-offset-2"
                            >
                              {getEmployerPhone(job)}
                            </a>
                          ) : (
                            <span className="font-mono text-xs font-bold text-[var(--fg)]">Утасгүй</span>
                          )}
                        </div>
                      </div>

                      {/* ── TITLE + DESCRIPTION ── */}
                      <div className="space-y-2">
                        <h2 className="text-base font-display font-extrabold uppercase tracking-tight text-[var(--fg)] leading-snug">{job.title}</h2>
                        <p className="text-[12px] text-[var(--muted-foreground)] leading-relaxed">{job.description}</p>
                        {job.additionalInfo && (
                          <p className="text-sm text-[var(--muted-foreground)] italic bg-[var(--bg2)] p-2.5 rounded-md border border-[var(--border)] leading-relaxed">
                            {job.additionalInfo}
                          </p>
                        )}
                      </div>

                      {/* ── IMAGES ── */}
                      {job.imageUrls && job.imageUrls.length > 0 ? (
                        <div className="w-full space-y-1">
                          <div className="flex overflow-x-auto gap-2 snap-x snap-mandatory scrollbar-none py-1">
                            {job.imageUrls.map((url, idx) => (
                              <div key={idx} className="shrink-0 w-full snap-center h-48 md:h-64 overflow-hidden rounded-md border border-[var(--border)] bg-[var(--bg2)] flex items-center justify-center relative">
                                <img
                                  src={url}
                                  alt={`Slide ${idx + 1}`}
                                  loading="lazy"
                                  decoding="async"
                                  className="w-full h-full object-contain"
                                />
                                <div className="absolute bottom-2 right-2 bg-[var(--fg)]/75 text-[var(--card)] text-xs font-bold px-2 py-0.5 rounded-full font-sans">
                                  {idx + 1} / {job.imageUrls?.length}
                                </div>
                              </div>
                            ))}
                          </div>
                          {job.imageUrls.length > 1 && (
                            <p className="text-xs text-[var(--muted-foreground)] text-center font-sans select-none">
                              ↔️ Хажуу тийш гүйлгэж үзнэ үү
                            </p>
                          )}
                        </div>
                      ) : (job.imageUrl && (
                        <div className="w-full h-48 md:h-64 overflow-hidden rounded-md border border-[var(--border)] bg-[var(--bg2)] flex items-center justify-center">
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
                        <div className="bg-[var(--bg2)] p-3.5 rounded-md border border-[var(--border)]">
                          <span className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider font-bold block mb-1">Цалин / Төлбөр</span>
                          <span className="font-mono font-bold text-[var(--verify)] text-sm">
                            {job.salary === 0 ? 'Тохиролцоно' : `${job.salary.toLocaleString()} ₮`}
                          </span>
                          {job.salaryUnit && job.salaryUnit !== 'Өдрөөр' && (
                            <span className="text-xs text-[var(--muted-foreground)] block mt-0.5">{job.salaryUnit}</span>
                          )}
                        </div>
                        <div className="bg-[var(--bg2)] p-3.5 rounded-md border border-[var(--border)]">
                          <span className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider font-bold block mb-1">Байршил</span>
                          <span className="font-semibold text-[var(--fg)] text-xs flex items-start gap-1">
                            <MapPin className="w-3.5 h-3.5 text-[var(--muted-foreground)] shrink-0 mt-0.5" />
                            {job.location}
                          </span>
                        </div>
                      </div>

                      {/* ── STATUS BADGE ── */}
                      <div>
                        {(() => {
                          if (job.status === 'open') {
                            return (
                              <span className="inline-flex items-center text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-sm border border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-soft-foreground)]">
                                <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-[var(--accent)] animate-pulse" />
                                Нээлттэй (Идэвхтэй)
                              </span>
                            );
                          } else if (job.status === 'in_progress') {
                            return (
                              <span className="inline-flex items-center text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-sm border border-[var(--alert)] bg-[rgba(255,92,40,0.1)] text-[var(--alert)]">
                                <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-[var(--alert)] animate-pulse" />
                                Ажиллаж байгаа
                              </span>
                            );
                          } else {
                            const isReviewed = job.isReviewedByEmployer;
                            if (isReviewed) {
                              return (
                                <span className="inline-flex items-center text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-sm border border-[var(--verify)] bg-[rgba(31,138,76,0.1)] text-[var(--verify)]">
                                  Үнэлэгдсэн • Хаагдсан ✓
                                </span>
                              );
                            } else {
                              return (
                                <span className="inline-flex items-center text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-sm border border-[var(--alert)] bg-[rgba(255,92,40,0.1)] text-[var(--alert)] animate-pulse">
                                  <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-[var(--alert)]" />
                                  Ажил дууссан • Үнэлэх шаардлагатай ⚠️
                                </span>
                              );
                            }
                          }
                        })()}
                      </div>



                      {/* ── WORKFLOW ACTIONS ── */}
                      <div className="border-t border-[var(--border)] pt-3 space-y-3" onClick={(e) => e.stopPropagation()}>
                        {!currentUser ? (
                          <div className="bg-[var(--bg2)] p-4 border border-[var(--border)] rounded-md text-center space-y-3">
                            <p className="text-xs text-[var(--muted-foreground)] font-sans">
                              Та энэхүү заранд хүсэлт илгээх эсвэл зар тавихын тулд системд нэвтэрсэн байх шаардлагатай.
                            </p>
                            <div className="flex justify-center space-x-3">
                              <button onClick={() => onNavigate('/auth?tab=login')} className="border border-[var(--border)] hover:border-[var(--border-strong)] bg-[var(--card)] hover:bg-[var(--bg2)] text-[var(--fg)] font-semibold text-xs px-4 py-2 rounded transition-colors cursor-pointer">
                                Нэвтрэх
                              </button>
                              <button onClick={() => onNavigate('/auth?tab=register')} className="bg-[var(--accent)] hover:brightness-95 text-[var(--accent-foreground)] font-bold text-xs px-4 py-2 rounded transition-all cursor-pointer">
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
                                    <div className="bg-[var(--bg2)] p-3.5 rounded-md border border-[var(--border)] space-y-3">
                                      <span className="text-xs text-[var(--muted-foreground)] block uppercase font-mono tracking-wider">Зарын Тохиргоо:</span>
                                      <div className="flex space-x-2.5">
                                        <button type="button" onClick={() => onEdit(job)} className="flex-1 border border-[var(--border)] hover:border-[var(--border-strong)] bg-[var(--card)] hover:bg-[var(--bg2)] text-[var(--muted-foreground)] hover:text-[var(--fg)] font-semibold text-xs py-1.5 px-2.5 rounded transition-colors cursor-pointer text-center">
                                          Засах
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => onDelete(job)}
                                          className="flex-1 border border-rose-300 hover:border-rose-400 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 font-semibold text-xs py-1.5 px-2.5 rounded transition-colors cursor-pointer text-center"
                                        >
                                          Устгах
                                        </button>
                                      </div>
                                    </div>
                                    <div className="flex items-center justify-between text-xs border-b border-[var(--border)] pb-2">
                                      <span className="font-bold text-[var(--fg)]">Хүсэлт ирүүлсэн харилцагч ({job.applicants.length})</span>
                                    </div>
                                    {job.applicants.length === 0 ? (
                                      <p className="text-xs text-[var(--muted-foreground)] text-center py-2">Ирүүлсэн хүсэлт байхгүй байна.</p>
                                    ) : (
                                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1 overscroll-contain">
                                        {job.applicants.map((opId) => {
                                          const op = users.find(u => u.id === opId);
                                          if (!op) return null;
                                          return (
                                            <div key={opId} className="flex items-center justify-between bg-[var(--bg2)] p-2.5 rounded-md border border-[var(--border)]">
                                              <button type="button" onClick={() => onNavigate(`/profile?id=${op.id}`)} className="text-xs text-[var(--fg)] font-medium hover:underline hover:text-[var(--accent-soft-foreground)] text-left focus:outline-none">
                                                {op.fullName} {op.type === 'operator' && `(${op.experienceYears || 0} жил)`}
                                              </button>
                                              <button onClick={() => onHire(job.id, op.id)} className="min-h-11 bg-[var(--accent)] hover:brightness-95 text-[var(--accent-foreground)] text-xs font-bold px-3 rounded transition-all cursor-pointer">
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
                                      <button disabled className="w-full bg-[var(--bg2)] text-[var(--muted-foreground)] text-xs font-bold py-3 px-4 rounded-md cursor-not-allowed border border-[var(--border)] text-center">
                                        Хүсэлт илгээсэн
                                      </button>
                                      {successMessage && successMessage.includes('хүсэлт') && (
                                        <div className="bg-[rgba(31,138,76,0.08)] border border-[rgba(31,138,76,0.3)] text-[var(--verify)] p-3.5 rounded-md text-xs flex items-start space-x-2 animate-fade-in text-left">
                                          <CheckCircle className="w-4 h-4 text-[var(--verify)] shrink-0 mt-0.5" />
                                          <span className="font-sans leading-normal text-sm">{successMessage}</span>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <button onClick={() => onApply(job.id)} className="w-full bg-[var(--accent)] hover:brightness-95 text-[var(--accent-foreground)] text-xs font-bold py-3 px-4 rounded-md transition-all shadow-sm cursor-pointer text-center">
                                      Хүсэлт илгээх
                                    </button>
                                  )
                                )}
                              </>
                            )}

                            {job.status === 'in_progress' && (
                              <div className="bg-[var(--bg2)] p-3.5 rounded-md border border-[var(--border)] space-y-3">
                                <div className="text-xs text-[var(--fg)] flex items-center justify-between">
                                  <span>Хамтран ажиллаж буй оператор:</span>
                                  <span className="font-bold text-[var(--fg)]">
                                    {(() => {
                                      const op = users.find(u => u.id === job.hiredOperatorId);
                                      return op ? getFirstName(op) : getFirstName(job.hiredOperatorName);
                                    })()}
                                  </span>
                                </div>
                                {successMessage && successMessage.includes('томиллоо') && (
                                  <div className="bg-[rgba(31,138,76,0.08)] border border-[rgba(31,138,76,0.3)] text-[var(--verify)] p-3 rounded-md text-sm flex items-start space-x-2 animate-fade-in text-left">
                                    <CheckCircle className="w-4 h-4 text-[var(--verify)] shrink-0 mt-0.5" />
                                    <span className="font-sans leading-normal">{successMessage}</span>
                                  </div>
                                )}
                                {currentUser.id === job.employerId && (
                                  <button id="employer-complete-job-btn" onClick={() => onCompleteAndReview(job)} className="w-full bg-[var(--accent)] hover:brightness-95 text-[var(--accent-foreground)] py-2 px-3 rounded text-xs font-bold transition-all cursor-pointer text-center">
                                    ✓ Ажил дууссаныг баталгаажуулж үнэлэх
                                  </button>
                                )}
                                {currentUser.id !== job.employerId && (
                                  <p className="text-sm text-[var(--muted-foreground)]">Ажил олгогч ажлыг дууссаныг тэмдэглэсний дараа та үнэлгээ өгөх боломжтой болно.</p>
                                )}
                              </div>
                            )}

                            {job.status === 'completed' && (
                              <div className="bg-[var(--bg2)] p-4 border border-[var(--border)] rounded-md space-y-3">
                                <div className="flex items-center space-x-1.5 text-xs text-[var(--verify)] font-bold">
                                  <CheckCircle className="w-4 h-4" />
                                  <span>ЭНЭХҮҮ АЖИЛ АМЖИЛТТАЙ ГҮЙЦЭТГЭГДЭЖ ДУУССАН</span>
                                </div>

                                {currentUser.type === 'operator' && job.hiredOperatorId === currentUser.id && !job.isReviewedByOperator && (
                                  <button id="op-review-employer-btn" onClick={() => onReview(job)} className="w-full bg-[var(--accent)] hover:brightness-95 text-[var(--accent-foreground)] py-1.5 px-3 rounded text-xs font-bold cursor-pointer transition-all">
                                    Захиалагчийг Үнэлэх (Цалин хоцрогдол эсвэл харилцаа)
                                  </button>
                                )}

                                {currentUser.type === 'employer' && job.employerId === currentUser.id && !job.isReviewedByEmployer && (
                                  <div className="space-y-2">
                                    <button id="emp-review-operator-btn" onClick={() => onReview(job)} className="w-full bg-[var(--accent)] hover:brightness-95 text-[var(--accent-foreground)] py-1.5 px-3 rounded text-xs font-bold cursor-pointer transition-all">
                                      Жолоочийг Үнэлэх (Согтууруулах ундаа, Ажилдаа эзэн болсон байдал)
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => onCancelHiring(job)}
                                      className="w-full text-center py-1.5 text-xs border border-rose-300 hover:border-rose-400 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 rounded transition-colors cursor-pointer font-bold"
                                    >
                                      Сонгосон жолоочийг болих
                                    </button>
                                  </div>
                                )}

                                {((currentUser.type === 'operator' && job.isReviewedByOperator) ||
                                  (currentUser.type === 'employer' && job.isReviewedByEmployer)) && (
                                  <div className="text-sm text-[var(--muted-foreground)] text-center italic">
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
                            const shareText = `${job.title} — ${job.location}\nЦалин: ${job.salary.toLocaleString()}₮ (${job.salaryUnit})\n\n${jobUrl}`;

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
                          className="flex items-center space-x-1.5 text-xs text-[var(--muted-foreground)] hover:text-[var(--fg)] transition-colors cursor-pointer"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>Хуваалцах</span>
                        </button>

                        {/* Desktop-only dropdown (shown only when Web Share API is not available) */}
                        {shareMenuJob === job.id && (
                          <div
                            className="absolute bottom-full left-0 mb-2 bg-[var(--card)] border border-[var(--border)] rounded-md shadow-md p-3 z-50 w-64 animate-fade-in"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <p className="text-xs text-[var(--muted-foreground)] uppercase font-bold tracking-wider mb-2">Хуваалцах платформ</p>
                            <div className="grid grid-cols-3 gap-2">
                              {(() => {
                                const jobUrl = typeof window !== 'undefined' ? `${window.location.origin}/jobs/${job.id}` : '';
                                const shareMsg = encodeURIComponent(`${job.title}\n${jobUrl}`);
                                return [
                                  {
                                    label: 'Facebook',
                                    emoji: '📘',
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
                                    emoji: '💬',
                                    action: () => {
                                      // Direct Messenger deep link — opens Messenger app with share dialog
                                      window.location.href = `fb-messenger://share/?link=${encodeURIComponent(jobUrl)}&app_id=966242223397117`;
                                    },
                                  },
                                  {
                                    label: 'Telegram',
                                    emoji: '✈️',
                                    action: () => {
                                      // tg:// deep link opens Telegram app directly
                                      window.location.href = `tg://msg_url?url=${encodeURIComponent(jobUrl)}&text=${encodeURIComponent(job.title)}`;
                                    },
                                  },
                                  {
                                    label: 'WhatsApp',
                                    emoji: '💚',
                                    action: () => {
                                      window.open(`https://api.whatsapp.com/send?text=${shareMsg}`, '_blank');
                                    },
                                  },
                                  {
                                    label: 'Gmail',
                                    emoji: '📧',
                                    action: () => {
                                      window.open(`mailto:?subject=${encodeURIComponent(job.title)}&body=${encodeURIComponent(jobUrl)}`, '_blank');
                                    },
                                  },
                                  {
                                    label: 'Хуулах',
                                    emoji: '🔗',
                                    action: async () => {
                                      await navigator.clipboard.writeText(jobUrl);
                                      onCopied();
                                    },
                                  },
                                ];
                              })().map(({ label, emoji, action }) => (
                                <button
                                  key={label}
                                  type="button"
                                  onClick={async () => {
                                    await action();
                                    trackShareJob(job.id, label.toLowerCase());
                                    onToggleShareMenu(null);
                                  }}
                                  className="flex flex-col items-center justify-center bg-[var(--bg2)] hover:bg-[var(--border)] border border-[var(--border)] hover:border-[var(--border-strong)] rounded p-2 text-xs text-[var(--muted-foreground)] hover:text-[var(--fg)] transition-colors cursor-pointer gap-1"
                                >
                                  <span className="text-base">{emoji}</span>
                                  <span>{label}</span>
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
                      className="w-full bg-[var(--card)] transition-all duration-150 border border-[var(--border)] hover:border-[var(--border-strong)] p-5 rounded-md cursor-pointer flex flex-col justify-between space-y-4 text-left group shadow-sm hover:shadow-md hover:-translate-y-0.5 self-start"
                    >
                      <div className="space-y-3">
                        {/* Employer name and Date */}
                        <div className="flex justify-between items-center text-xs text-[var(--muted-foreground)]">
                          {!currentUser ? (
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                onShowBlurWarning();
                              }}
                              className="font-semibold text-[var(--accent-soft-foreground)] font-sans filter blur-[5px] select-none cursor-pointer"
                              title="Дэлгэрэнгүйг нэвтэрч харна уу"
                            >
                              {getMockEmployerName(job.id)}
                            </span>
                          ) : (
                            <span className="font-semibold text-[var(--accent-soft-foreground)] font-sans">
                              {getEmployerDisplayName(job)}
                            </span>
                          )}
                          <span className="font-mono text-[var(--muted-foreground)]">
                            {formatRelativeDate(job.createdAt)}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-base font-display font-bold uppercase tracking-tight text-[var(--fg)] transition-colors leading-snug">
                          {job.title}
                        </h3>

                        {/* Job Image Thumbnail — prefer the 320px thumbnailUrls entry over
                            the full 800px image (audit P3); older jobs without a thumbnail
                            fall back to the full image. */}
                        {((job.imageUrls && job.imageUrls.length > 0) || job.imageUrl) && (
                          <div className="w-full h-36 rounded-md overflow-hidden bg-[var(--bg2)] border border-[var(--border)] relative shrink-0">
                            <img
                              src={job.thumbnailUrls?.[0] || (job.imageUrls && job.imageUrls.length > 0 ? job.imageUrls[0] : job.imageUrl)}
                              alt={job.title}
                              width={400}
                              height={144}
                              loading="lazy"
                              decoding="async"
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                            />
                          </div>
                        )}

                        {/* Short description preview */}
                        <p className="text-sm text-[var(--muted-foreground)] line-clamp-2 leading-relaxed">
                          {job.description}
                        </p>
                      </div>

                      <div className="border-t border-[var(--border)] pt-3.5 space-y-3">
                        {/* Salary — the single most important datum on the card — and status */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <span className="block text-xs text-[var(--muted-foreground)] font-semibold uppercase tracking-wider">Цалин / Төлбөр</span>
                            <span className="font-mono text-base font-bold text-[var(--verify)] leading-tight">
                              {job.salary === 0 ? 'Тохиролцоно' : `${job.salary.toLocaleString()} ₮`}
                            </span>
                          </div>

                          {(() => {
                            if (job.status === 'open') {
                              return (
                                <span className="shrink-0 inline-flex items-center text-xs font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-sm border border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-soft-foreground)]">
                                  <span className="w-1 h-1 rounded-full mr-1 bg-[var(--accent)] animate-pulse" />
                                  <span>Нээлттэй</span>
                                </span>
                              );
                            } else if (job.status === 'in_progress') {
                              return (
                                <span className="shrink-0 inline-flex items-center text-xs font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-sm border border-[var(--alert)] bg-[rgba(255,92,40,0.1)] text-[var(--alert)]">
                                  <span className="w-1 h-1 rounded-full mr-1 bg-[var(--alert)] animate-pulse" />
                                  <span>Ажиллаж байгаа</span>
                                </span>
                              );
                            } else {
                              const isReviewed = job.isReviewedByEmployer;
                              if (isReviewed) {
                                return (
                                  <span className="shrink-0 inline-flex items-center text-xs font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-sm border border-[var(--verify)] bg-[rgba(31,138,76,0.1)] text-[var(--verify)]">
                                    <span>Хаагдсан ✓</span>
                                  </span>
                                );
                              } else {
                                return (
                                  <span className="shrink-0 inline-flex items-center text-xs font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-sm border border-[var(--alert)] bg-[rgba(255,92,40,0.1)] text-[var(--alert)] animate-pulse">
                                    <span className="w-1 h-1 rounded-full mr-1 bg-[var(--alert)]" />
                                    <span>Ажил дууссан ⚠️</span>
                                  </span>
                                );
                              }
                            }
                          })()}
                        </div>

                        {/* Location + phone row */}
                        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 text-xs">
                          <span className="flex items-center gap-1.5 text-[var(--muted-foreground)] min-w-0">
                            <MapPin className="w-3.5 h-3.5 shrink-0" />
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
                            <Phone className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                            {!currentUser ? (
                              <span className="font-mono font-medium text-[var(--muted-foreground)] filter blur-[5px] select-none">
                                {getMockEmployerPhone(job.id)}
                              </span>
                            ) : getEmployerPhone(job) ? (
                              <a
                                href={`tel:${getEmployerPhone(job)}`}
                                onClick={(e) => { e.stopPropagation(); trackContactClick(job.id, 'tel'); }}
                                className="font-mono font-medium text-[var(--fg)] underline decoration-[var(--accent)] underline-offset-2"
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
