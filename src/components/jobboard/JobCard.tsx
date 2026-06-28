'use client';

import { ChevronLeft, User as UserIcon, Phone, MapPin, CheckCircle, Share2 } from 'lucide-react';
import type { Job, User } from '../../types';
import { getMockEmployerName, getMockEmployerPhone } from '../../lib/mock-employer';
import { formatDate, getFirstName } from '../../lib/job-format';

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
                      className="bg-[var(--color-glass-bg)] backdrop-blur-md border-2 border-violet-600 p-5 rounded-2xl text-left space-y-4 shadow-2xl transition-all duration-300 w-full self-start"
                    >
                      {/* ── HEADER: back button + date ── */}
                      <div className="flex items-center justify-between pb-3 border-b border-[var(--color-glass-border)]">
                        <button
                          onClick={(e) => { e.stopPropagation(); onCollapse(); }}
                          className="p-1.5 -ml-1 rounded-lg hover:bg-white/10 text-[#9aa3b5] hover:text-[#f1f3f8] transition-colors cursor-pointer flex items-center space-x-1"
                          title="Буцах"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          <span className="text-xs text-[#9aa3b5]">Буцах</span>
                        </button>
                        <span className="font-mono text-[10px] text-[#9aa3b5]">{formatDate(job.createdAt)}</span>
                      </div>

                      {/* ── CREATOR INFO ROW (Name on left, Phone on right) ── */}
                      <div className="flex justify-between items-center pb-2 border-b border-[var(--color-glass-border)]" onClick={(e) => e.stopPropagation()}>
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
                          <UserIcon className="w-4 h-4 text-violet-400 shrink-0" />
                          <span className={`text-xs font-bold font-sans ${
                            !currentUser ? 'text-violet-400 filter blur-[5px] select-none cursor-pointer' : 'text-violet-400 hover:underline'
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
                          <Phone className="w-3.5 h-3.5 text-violet-400" />
                          <span className={`font-mono text-xs font-bold text-violet-400 ${
                            !currentUser ? 'filter blur-[5px] select-none' : ''
                          }`}>
                            {!currentUser ? getMockEmployerPhone(job.id) : (getEmployerPhone(job) || 'Утасгүй')}
                          </span>
                        </div>
                      </div>

                      {/* ── TITLE + DESCRIPTION ── */}
                      <div className="space-y-2">
                        <h3 className="text-base font-extrabold text-[#f1f3f8] leading-snug">{job.title}</h3>
                        <p className="text-[12px] text-[#9aa3b5] leading-relaxed">{job.description}</p>
                        {job.additionalInfo && (
                          <p className="text-[11px] text-[#9aa3b5] italic bg-white/5 p-2.5 rounded-lg border border-[var(--color-glass-border)] leading-relaxed">
                            {job.additionalInfo}
                          </p>
                        )}
                      </div>

                      {/* ── IMAGES ── */}
                      {job.imageUrls && job.imageUrls.length > 0 ? (
                        <div className="w-full space-y-1">
                          <div className="flex overflow-x-auto gap-2 snap-x snap-mandatory scrollbar-none py-1">
                            {job.imageUrls.map((url, idx) => (
                              <div key={idx} className="shrink-0 w-full snap-center h-48 md:h-64 overflow-hidden rounded-xl border border-[var(--color-glass-border)] bg-white/5 flex items-center justify-center relative">
                                <img
                                  src={url}
                                  alt={`Slide ${idx + 1}`}
                                  className="w-full h-full object-contain"
                                />
                                <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md text-white text-[9px] font-bold px-2 py-0.5 rounded-full border border-white/10 font-sans">
                                  {idx + 1} / {job.imageUrls?.length}
                                </div>
                              </div>
                            ))}
                          </div>
                          {job.imageUrls.length > 1 && (
                            <p className="text-[9px] text-[#9aa3b5] text-center font-sans select-none">
                              ↔️ Хажуу тийш гүйлгэж үзнэ үү
                            </p>
                          )}
                        </div>
                      ) : (job.imageUrl && (
                        <div className="w-full h-48 md:h-64 overflow-hidden rounded-xl border border-[var(--color-glass-border)] bg-white/5 flex items-center justify-center">
                          <img
                            src={job.imageUrl}
                            alt={job.title}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ))}

                      {/* ── SALARY + LOCATION 2-column grid ── */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/5 p-3.5 rounded-xl border border-[var(--color-glass-border)]">
                          <span className="text-[9.5px] text-[#9aa3b5] uppercase tracking-wider font-bold block mb-1">Цалин / Төлбөр</span>
                          <span className="font-mono font-bold text-teal-300 text-sm">
                            {job.salary === 0 ? 'Тохиролцоно' : `${job.salary.toLocaleString()} ₮`}
                          </span>
                          {job.salaryUnit && job.salaryUnit !== 'Өдрөөр' && (
                            <span className="text-[9px] text-[#9aa3b5] block mt-0.5">{job.salaryUnit}</span>
                          )}
                        </div>
                        <div className="bg-white/5 p-3.5 rounded-xl border border-[var(--color-glass-border)]">
                          <span className="text-[9.5px] text-[#9aa3b5] uppercase tracking-wider font-bold block mb-1">Байршил</span>
                          <span className="font-semibold text-[#f1f3f8] text-xs flex items-start gap-1">
                            <MapPin className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5" />
                            {job.location}
                          </span>
                        </div>
                      </div>

                      {/* ── STATUS BADGE ── */}
                      <div>
                        {(() => {
                          if (job.status === 'open') {
                            return (
                              <span className="inline-flex items-center text-[10.5px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full border-2 border-violet-500/40 bg-violet-500/10 text-violet-300">
                                <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-violet-400 animate-pulse" />
                                Нээлттэй (Идэвхтэй)
                              </span>
                            );
                          } else if (job.status === 'in_progress') {
                            return (
                              <span className="inline-flex items-center text-[10.5px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full border-2 border-amber-500/40 bg-amber-500/10 text-amber-400">
                                <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-amber-400 animate-pulse" />
                                Ажиллаж байгаа
                              </span>
                            );
                          } else {
                            const isReviewed = job.isReviewedByEmployer;
                            if (isReviewed) {
                              return (
                                <span className="inline-flex items-center text-[10.5px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full border-2 border-teal-500/40 bg-teal-500/10 text-teal-300">
                                  Үнэлэгдсэн • Хаагдсан ✓
                                </span>
                              );
                            } else {
                              return (
                                <span className="inline-flex items-center text-[10.5px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full border-2 border-amber-500/40 bg-amber-500/10 text-amber-400 animate-pulse">
                                  <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-amber-400" />
                                  Ажил дууссан • Үнэлэх шаардлагатай ⚠️
                                </span>
                              );
                            }
                          }
                        })()}
                      </div>



                      {/* ── WORKFLOW ACTIONS ── */}
                      <div className="border-t border-[var(--color-glass-border)] pt-3 space-y-3" onClick={(e) => e.stopPropagation()}>
                        {!currentUser ? (
                          <div className="bg-white/5 p-4 border border-[var(--color-glass-border)] rounded-xl text-center space-y-3">
                            <p className="text-xs text-[#c8cbe0] font-sans">
                              Та энэхүү заранд хүсэлт илгээх эсвэл зар тавихын тулд системд нэвтэрсэн байх шаардлагатай.
                            </p>
                            <div className="flex justify-center space-x-3">
                              <button onClick={() => onNavigate('/auth?tab=login')} className="bg-white/10 hover:bg-white/20 text-white font-semibold text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer">
                                Нэвтрэх
                              </button>
                              <button onClick={() => onNavigate('/auth?tab=register')} className="bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer">
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
                                    <div className="bg-white/5 p-3.5 rounded-xl border border-[var(--color-glass-border)] space-y-3">
                                      <span className="text-[10px] text-[#9aa3b5] block uppercase font-mono tracking-wider">Зарын Тохиргоо:</span>
                                      <div className="flex space-x-2.5">
                                        <button type="button" onClick={() => onEdit(job)} className="flex-1 border border-[var(--color-glass-border)] hover:border-white/20 bg-white/5 hover:bg-white/10 text-[#9aa3b5] hover:text-[#f1f3f8] font-semibold text-[10.5px] py-1.5 px-2.5 rounded-lg transition-colors cursor-pointer text-center">
                                          Засах
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => onDelete(job)}
                                          className="flex-1 border border-[var(--color-glass-border)] hover:border-white/20 bg-white/5 hover:bg-white/10 text-[#9aa3b5] hover:text-[#f1f3f8] font-semibold text-[10.5px] py-1.5 px-2.5 rounded-lg transition-colors cursor-pointer text-center"
                                        >
                                          Устгах
                                        </button>
                                      </div>
                                    </div>
                                    <div className="flex items-center justify-between text-xs border-b border-[var(--color-glass-border)] pb-2">
                                      <span className="font-bold text-[#e3e6ee]">Хүсэлт ирүүлсэн харилцагч ({job.applicants.length})</span>
                                    </div>
                                    {job.applicants.length === 0 ? (
                                      <p className="text-[11px] text-[#9aa3b5] text-center py-2">Ирүүлсэн хүсэлт байхгүй байна.</p>
                                    ) : (
                                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                        {job.applicants.map((opId) => {
                                          const op = users.find(u => u.id === opId);
                                          if (!op) return null;
                                          return (
                                            <div key={opId} className="flex items-center justify-between bg-white/5 p-2.5 rounded-lg border border-[var(--color-glass-border)]">
                                              <button type="button" onClick={() => onNavigate(`/profile?id=${op.id}`)} className="text-xs text-[#f1f3f8] font-medium hover:underline hover:text-violet-400 text-left focus:outline-none">
                                                {op.fullName} {op.type === 'operator' && `(${op.experienceYears || 0} жил)`}
                                              </button>
                                              <button onClick={() => onHire(job.id, op.id)} className="bg-violet-600 hover:bg-violet-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer">
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
                                      <button disabled className="w-full bg-white/5 text-[#9aa3b5] text-xs font-bold py-3 px-4 rounded-xl cursor-not-allowed border border-[var(--color-glass-border)] text-center">
                                        Хүсэлт илгээсэн
                                      </button>
                                      {successMessage && successMessage.includes('хүсэлт') && (
                                        <div className="bg-violet-500/10 border border-violet-500/30 text-violet-300 p-3.5 rounded-xl text-xs flex items-start space-x-2 animate-fade-in text-left">
                                          <CheckCircle className="w-4 h-4 text-teal-300 shrink-0 mt-0.5" />
                                          <span className="font-sans leading-normal text-[11px]">{successMessage}</span>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <button onClick={() => onApply(job.id)} className="w-full bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold py-3 px-4 rounded-xl transition-all shadow-md shadow-violet-600/10 cursor-pointer text-center">
                                      Хүсэлт илгээх
                                    </button>
                                  )
                                )}
                              </>
                            )}

                            {job.status === 'in_progress' && (
                              <div className="bg-white/5 p-3.5 rounded-xl border border-[var(--color-glass-border)] space-y-3">
                                <div className="text-xs text-[#c8cbe0] flex items-center justify-between">
                                  <span>Хамтран ажиллаж буй оператор:</span>
                                  <span className="font-bold text-[#f1f3f8]">
                                    {(() => {
                                      const op = users.find(u => u.id === job.hiredOperatorId);
                                      return op ? getFirstName(op) : getFirstName(job.hiredOperatorName);
                                    })()}
                                  </span>
                                </div>
                                {successMessage && successMessage.includes('томиллоо') && (
                                  <div className="bg-violet-500/10 border border-violet-500/30 text-violet-300 p-3 rounded-xl text-[11px] flex items-start space-x-2 animate-fade-in text-left">
                                    <CheckCircle className="w-4 h-4 text-teal-300 shrink-0 mt-0.5" />
                                    <span className="font-sans leading-normal">{successMessage}</span>
                                  </div>
                                )}
                                {currentUser.id === job.employerId && (
                                  <button id="employer-complete-job-btn" onClick={() => onCompleteAndReview(job)} className="w-full bg-violet-600 hover:bg-violet-700 text-white py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer text-center">
                                    ✓ Ажил дууссаныг баталгаажуулж үнэлэх
                                  </button>
                                )}
                                {currentUser.id !== job.employerId && (
                                  <p className="text-[10px] text-[#9aa3b5]">Ажил олгогч ажлыг дууссаныг тэмдэглэсний дараа та үнэлгээ өгөх боломжтой болно.</p>
                                )}
                              </div>
                            )}

                            {job.status === 'completed' && (
                              <div className="bg-white/5 p-4 border border-[var(--color-glass-border)] rounded-xl space-y-3">
                                <div className="flex items-center space-x-1.5 text-xs text-teal-300 font-bold">
                                  <CheckCircle className="w-4 h-4" />
                                  <span>ЭНЭХҮҮ АЖИЛ АМЖИЛТТАЙ ГҮЙЦЭТГЭГДЭЖ ДУУССАН</span>
                                </div>

                                {currentUser.type === 'operator' && job.hiredOperatorId === currentUser.id && !job.isReviewedByOperator && (
                                  <button id="op-review-employer-btn" onClick={() => onReview(job)} className="w-full bg-violet-600 hover:bg-violet-500 text-white py-1.5 px-3 rounded-lg text-xs font-bold cursor-pointer transition-colors">
                                    Захиалагчийг Үнэлэх (Цалингийн мурилт эсвэл харилцаа)
                                  </button>
                                )}

                                {currentUser.type === 'employer' && job.employerId === currentUser.id && !job.isReviewedByEmployer && (
                                  <div className="space-y-2">
                                    <button id="emp-review-operator-btn" onClick={() => onReview(job)} className="w-full bg-violet-600 hover:bg-violet-500 text-white py-1.5 px-3 rounded-lg text-xs font-bold cursor-pointer transition-colors">
                                      Жолоочийг Үнэлэх (Согтууруулах ундаа, Ажилдаа эзэн болсон байдал)
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => onCancelHiring(job)}
                                      className="w-full text-center py-1.5 text-xs border border-[var(--color-glass-border)] hover:border-white/20 bg-white/5 hover:bg-white/10 text-[#9aa3b5] hover:text-[#f1f3f8] rounded-lg transition-colors cursor-pointer font-bold"
                                    >
                                      Сонгосон жолоочийг болих
                                    </button>
                                  </div>
                                )}

                                {((currentUser.type === 'operator' && job.isReviewedByOperator) ||
                                  (currentUser.type === 'employer' && job.isReviewedByEmployer)) && (
                                  <div className="text-[11px] text-[#9aa3b5] text-center italic">
                                    Таны үнэлгээ системд хэдийн бүртгэгдсэн байна. Таны хариуцлагатай оролцоонд баярлалаа!
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* ── SHARE BUTTON ── */}
                      <div className="relative border-t border-[var(--color-glass-border)] pt-3">
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
                              } catch (_) {
                                // User cancelled share — do nothing
                              }
                            } else {
                              // Desktop fallback: open dropdown
                              onToggleShareMenu(shareMenuJob === job.id ? null : job.id);
                            }
                          }}
                          className="flex items-center space-x-1.5 text-[11px] text-[#9aa3b5] hover:text-violet-400 transition-colors cursor-pointer"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>Хуваалцах</span>
                        </button>

                        {/* Desktop-only dropdown (shown only when Web Share API is not available) */}
                        {shareMenuJob === job.id && (
                          <div
                            className="absolute bottom-full left-0 mb-2 bg-[var(--color-brand-bg2)] border border-[var(--color-glass-border)] rounded-xl shadow-2xl p-3 z-50 w-64 animate-fade-in"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <p className="text-[9.5px] text-[#9aa3b5] uppercase font-bold tracking-wider mb-2">Хуваалцах платформ</p>
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
                                    onToggleShareMenu(null);
                                  }}
                                  className="flex flex-col items-center justify-center bg-white/5 hover:bg-white/10 border border-[var(--color-glass-border)] hover:border-white/20 rounded-lg p-2 text-[10px] text-[#c8cbe0] hover:text-[#f1f3f8] transition-colors cursor-pointer gap-1"
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
                      onClick={() => onSelect(job)}
                      className="w-full bg-[var(--color-glass-bg)] hover:bg-white/[0.06] backdrop-blur-md transition-all border border-[var(--color-glass-border)] hover:border-violet-500/40 border-l-4 border-l-violet-500 p-5 rounded-2xl cursor-pointer flex flex-col justify-between space-y-4 text-left group shadow-sm hover:shadow-md self-start"
                    >
                      <div className="space-y-3">
                        {/* Employer name and Date */}
                        <div className="flex justify-between items-center text-[11px] text-[#9aa3b5]">
                          {!currentUser ? (
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                onShowBlurWarning();
                              }}
                              className="font-semibold text-violet-400 font-sans filter blur-[5px] select-none cursor-pointer"
                              title="Дэлгэрэнгүйг нэвтэрч харна уу"
                            >
                              {getMockEmployerName(job.id)}
                            </span>
                          ) : (
                            <span className="font-semibold text-violet-400 font-sans">
                              {getEmployerDisplayName(job)}
                            </span>
                          )}
                          <span className="font-mono text-[#9aa3b5]">
                            {formatDate(job.createdAt)}
                          </span>
                        </div>

                        {/* Title */}
                        <h4 className="text-sm font-bold text-[#f1f3f8] group-hover:text-violet-300 transition-colors leading-snug">
                          {job.title}
                        </h4>

                        {/* Job Image Thumbnail */}
                        {((job.imageUrls && job.imageUrls.length > 0) || job.imageUrl) && (
                          <div className="w-full h-36 rounded-xl overflow-hidden bg-white/5 border border-[var(--color-glass-border)] relative shrink-0">
                            <img
                              src={job.imageUrls && job.imageUrls.length > 0 ? job.imageUrls[0] : job.imageUrl}
                              alt={job.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        {/* Short description preview */}
                        <p className="text-xs text-[#9aa3b5] line-clamp-2 leading-relaxed">
                          {job.description}
                        </p>
                      </div>

                      <div className="border-t border-[var(--color-glass-border)] pt-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                        {/* Phone Number */}
                        <div
                          onClick={(e) => {
                            if (!currentUser) {
                              e.stopPropagation();
                              onShowBlurWarning();
                            }
                          }}
                          className={`flex items-center space-x-1.5 text-[#9aa3b5] ${!currentUser ? 'cursor-pointer' : ''}`}
                        >
                          <Phone className="w-3.5 h-3.5 text-[#9aa3b5]" />
                          <span className={`font-mono font-medium text-[#9aa3b5] ${!currentUser ? 'filter blur-[5px] select-none' : ''}`}>
                            {!currentUser ? getMockEmployerPhone(job.id) : (getEmployerPhone(job) || 'Утасгүй')}
                          </span>
                        </div>

                        {/* Salary and Status */}
                        <div className="flex flex-col items-end space-y-2 shrink-0">
                          <span className="font-sans font-bold text-[#f1f3f8] flex items-center gap-1.5">
                            <span className="text-[9px] text-[#9aa3b5] font-semibold uppercase tracking-wider">Цалин / Төлбөр:</span>
                            <span className="font-mono text-xs text-teal-300">{job.salary === 0 ? 'Тохиролцоно' : `${job.salary.toLocaleString()} ₮`}</span>
                          </span>

                          {(() => {
                            if (job.status === 'open') {
                              return (
                                <span className="inline-flex items-center text-[9.5px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border border-violet-500/40 bg-violet-500/10 text-violet-300">
                                  <span className="w-1 h-1 rounded-full mr-1 bg-violet-400 animate-pulse" />
                                  <span>Нээлттэй</span>
                                </span>
                              );
                            } else if (job.status === 'in_progress') {
                              return (
                                <span className="inline-flex items-center text-[9.5px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-400">
                                  <span className="w-1 h-1 rounded-full mr-1 bg-amber-400 animate-pulse" />
                                  <span>Ажиллаж байгаа</span>
                                </span>
                              );
                            } else {
                              const isReviewed = job.isReviewedByEmployer;
                              if (isReviewed) {
                                return (
                                  <span className="inline-flex items-center text-[9.5px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border border-teal-500/40 bg-teal-500/10 text-teal-300">
                                    <span>Хаагдсан ✓</span>
                                  </span>
                                );
                              } else {
                                return (
                                  <span className="inline-flex items-center text-[9.5px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-400 animate-pulse">
                                    <span className="w-1 h-1 rounded-full mr-1 bg-amber-400" />
                                    <span>Ажил дууссан ⚠️</span>
                                  </span>
                                );
                              }
                            }
                          })()}
                        </div>
                      </div>
                    </div>
                  );
                }
}
