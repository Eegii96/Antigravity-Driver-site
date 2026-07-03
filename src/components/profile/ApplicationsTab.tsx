'use client';

import { Clock, Briefcase, MapPin, DollarSign, Star, Users } from 'lucide-react';
import type { User, Job, Review } from '../../types';
import { formatDate } from '../../lib/job-format';

interface ApplicationsTabProps {
  sentApplications: Job[];
  postedJobs: Job[];
  applicationsSubTab: 'sent' | 'posted';
  onSubTabChange: (tab: 'sent' | 'posted') => void;
  isLoading: boolean;
  activeHighlightJobId?: string;
  profileUser: User;
  allUsers: User[];
  /** Reviews written for this user (used to surface a received review on a card). */
  reviews: Review[];
  isOwnProfile: boolean;
  onReview: (job: Job) => void;
  onHire: (jobId: string, operatorId: string) => void;
  onComplete: (job: Job) => void;
  onCancelHiring: (jobId: string) => void;
  onEdit: (job: Job) => void;
  onDelete: (job: Job) => void;
}

/**
 * The "applications" tab: an operator's sent applications and an employer's
 * posted jobs, with the per-card status + hire/complete/review/edit/delete flow.
 * All side effects are delegated to the parent via callbacks.
 */
export default function ApplicationsTab({
  sentApplications,
  postedJobs,
  applicationsSubTab,
  onSubTabChange,
  isLoading,
  activeHighlightJobId,
  profileUser,
  allUsers,
  reviews,
  isOwnProfile,
  onReview,
  onHire,
  onComplete,
  onCancelHiring,
  onEdit,
  onDelete,
}: ApplicationsTabProps) {
  const driverJobs = applicationsSubTab === 'sent' ? sentApplications : postedJobs;

  return (
        <div className="space-y-6 animate-fade-in relative z-10 text-left">
          {/* Sub-tabs for Sent Applications vs Posted Jobs */}
          <div className="flex border-b border-[var(--border)] space-x-6">
            <button
              onClick={() => onSubTabChange('sent')}
              className={`flex items-center space-x-2 pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                applicationsSubTab === 'sent'
                  ? 'border-[var(--accent)] text-[var(--accent-soft-foreground)] font-extrabold'
                  : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--muted-foreground)]'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>МИНИЙ ЯВУУЛСАН ХҮСЭЛТ ({sentApplications.length})</span>
            </button>
            <button
              onClick={() => onSubTabChange('posted')}
              className={`flex items-center space-x-2 pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                applicationsSubTab === 'posted'
                  ? 'border-[var(--accent)] text-[var(--accent-soft-foreground)] font-extrabold'
                  : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--muted-foreground)]'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>МИНИЙ ОРУУЛСАН ЗАР ({postedJobs.length})</span>
            </button>
          </div>

          {isLoading ? (
            <div className="panel p-12 rounded-md border border-[var(--border)] text-center text-xs text-[var(--muted-foreground)] font-sans flex flex-col items-center justify-center space-y-4">
              <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
              <span>Мэдээллийг ачаалж байна...</span>
            </div>
          ) : driverJobs.length === 0 ? (
            <div className="panel p-12 rounded-md border border-[var(--border)] text-center text-xs text-[var(--muted-foreground)] font-sans">
              {applicationsSubTab === 'sent' 
                ? 'Та одоогоор ямар нэгэн заранд хүсэлт илгээгээгүй байна.' 
                : 'Та одоогоор ямар нэгэн зар оруулаагүй байна.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {driverJobs.map((job) => {
                if (applicationsSubTab === 'sent') {
                  const isHired = job.hiredOperatorId === profileUser.id;
                  const isPending = !job.hiredOperatorId && job.status === 'open';
                  const isRejected = job.hiredOperatorId && job.hiredOperatorId !== profileUser.id;

                  let statusText = '';
                  let badgeClass = '';
                  let statusDesc = '';

                  if (isHired) {
                    if (job.status === 'in_progress') {
                      statusText = 'Идэвхтэй • Ажил явагдаж байна';
                      badgeClass = 'bg-[var(--accent-soft)] text-[var(--accent-soft-foreground)] border-2 border-[var(--accent)] shadow-[0_0_10px_rgba(16,185,129,0.15)]';
                      statusDesc = '🤝 Баяр хүргэе! Захиалагч таныг ажилд сонгосон байна. Ажлын хариуцлагын гэрээ идэвхтэй байгаа тул хариуцлагатай ажиллана уу.';
                    } else if (job.status === 'completed') {
                      const isReviewed = job.isReviewedByEmployer;
                      if (isReviewed) {
                        statusText = 'Үнэлгээ хийгдсэн • Хаагдсан ✓';
                        badgeClass = 'bg-[rgba(34,211,238,0.15)] text-[#22d3ee] border-2 border-[rgba(34,211,238,0.4)] shadow-[0_0_10px_rgba(34,211,238,0.15)]';
                        statusDesc = '✓ Ажил дууссан. Захиалагч таны гүйцэтгэлийг үнэлж, ажил амжилттай хаагдсан байна.';
                      } else {
                        statusText = 'Ажил дууссан • Үнэлэх шаардлагатай ⚠️';
                        badgeClass = 'bg-[var(--accent-soft)] text-[var(--accent-soft-foreground)] border-2 border-[var(--accent)] shadow-[0_0_10px_rgba(139,92,246,0.15)] animate-pulse';
                        statusDesc = '⏳ Ажил дууссан. Захиалагчаас ажлын гүйцэтгэлийн үнэлгээ болон баталгаажуулалтыг хүлээж байна.';
                      }
                    }
                  } else if (isPending) {
                    statusText = 'Хүсэлт илгээсэн • Хүлээгдэж буй';
                    badgeClass = 'bg-[var(--accent-soft)] text-[var(--accent-soft-foreground)] border-2 border-[var(--accent)] shadow-[0_0_10px_rgba(139,92,246,0.1)]';
                    statusDesc = '⏳ Таны ажилд орох хүсэлтийг захиалагч хянаж байна. Хэрэв та сонгогдвол системд шинэчлэгдэн харагдах болно.';
                  } else if (isRejected) {
                    statusText = 'Өөр жолооч сонгогдсон';
                    badgeClass = 'bg-[var(--card)] text-[var(--muted-foreground)] border border-[var(--border)]';
                    statusDesc = '❌ Захиалагч энэ заранд өөр жолооч сонгон ажилласан байна. Та дараагийн зар руу хүсэлтээ илгээнэ үү.';
                  }

                  return (
                    <div
                      key={job.id}
                      id={`job-card-${job.id}`}
                      className={`panel p-5 rounded-md transition-all flex flex-col justify-between space-y-4 text-left ${
                        activeHighlightJobId === job.id
                          ? 'highlighted-job-card'
                          : 'border border-[var(--border)] hover:border-[var(--border)]'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-start gap-1">
                          <span className="font-mono text-[10px] text-[var(--muted-foreground)]">{formatDate(job.createdAt)}</span>
                          <span className="text-[10px] text-[var(--muted-foreground)] shrink-0 flex items-center space-x-1">
                            <MapPin className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                            <span>{job.location.split(',')[0]}</span>
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-[var(--fg)] leading-snug">{job.title}</h4>

                        {/* Job Image Thumbnail */}
                        {((job.imageUrls && job.imageUrls.length > 0) || job.imageUrl) && (
                          <div className="w-full h-36 rounded-md overflow-hidden bg-[var(--card)] border border-[var(--border)] relative shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={job.imageUrls && job.imageUrls.length > 0 ? job.imageUrls[0] : job.imageUrl}
                              alt={job.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        {/* Description */}
                        {job.description && (
                          <p className="text-[11px] text-[var(--muted-foreground)] line-clamp-2 leading-relaxed font-sans">
                            {job.description}
                          </p>
                        )}

                        {/* Additional info */}
                        {job.additionalInfo && (
                          <p className="text-[10.5px] text-[var(--muted-foreground)] leading-relaxed italic font-sans bg-[rgba(255,255,255,0.04)] p-2.5 rounded-lg border border-[var(--border)]">
                            Нэмэлт: {job.additionalInfo}
                          </p>
                        )}
                        
                        <div className="bg-[var(--card)] p-2.5 rounded-lg border border-[var(--border)] flex justify-between items-center text-[10.5px]">
                          <span className="text-[var(--muted-foreground)]">Захиалагч:</span>
                          <button
                            type="button"
                            onClick={() => {
                              window.location.href = `/profile?id=${job.employerId}`;
                            }}
                            className="font-semibold text-[var(--accent-soft-foreground)] hover:text-[var(--accent-soft-foreground)] hover:underline cursor-pointer text-left transition-colors"
                          >
                            {job.employerName}
                          </button>
                        </div>

                        {/* Status badge and description */}
                        <div className="space-y-2 pt-1.5">
                          <span className={`inline-flex px-2.5 py-0.5 rounded text-[11px] font-bold font-mono tracking-wide uppercase ${badgeClass}`}>
                            {statusText}
                          </span>
                          <p className="text-[11px] text-[var(--muted-foreground)] leading-relaxed bg-[rgba(255,255,255,0.04)] p-3 rounded-lg border border-[var(--border)] font-sans">
                            {statusDesc}
                          </p>
                        </div>

                        {/* Step Indicator for active jobs */}
                        {isHired && job.status === 'in_progress' && (
                          <div className="pt-2">
                            <span className="text-[10px] text-[var(--muted-foreground)] block uppercase font-mono tracking-wider mb-2">Ажлын явцын төлөв:</span>
                            <div className="flex items-center space-x-2 text-xs">
                              <div className="flex items-center text-[var(--accent-soft-foreground)]">
                                <span className="h-4 w-4 rounded-full bg-[var(--accent)] text-[var(--muted-foreground)] flex items-center justify-center text-[10.5px] font-bold mr-1.5">1</span>
                                <span>Сонгогдсон</span>
                              </div>
                              <span className="text-[var(--muted-foreground)]">➔</span>
                              <div className="flex items-center text-[var(--accent-soft-foreground)] font-bold animate-pulse-soft">
                                <span className="h-4 w-4 rounded-full bg-[var(--accent)] text-[var(--muted-foreground)] flex items-center justify-center text-[10.5px] font-bold mr-1.5 animate-ping-slow">2</span>
                                <span>Ажиллаж байна</span>
                              </div>
                              <span className="text-[var(--muted-foreground)]">➔</span>
                              <div className="flex items-center text-[var(--muted-foreground)]">
                                <span className="h-4 w-4 rounded-full bg-[rgba(255,255,255,0.06)] text-[var(--muted-foreground)] flex items-center justify-center text-[10.5px] font-bold mr-1.5">3</span>
                                <span>Үнэлгээ</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Footer containing received review (for completed jobs) and salary for ALL statuses */}
                      <div className="space-y-3 pt-2 mt-auto border-t border-[var(--border)]">
                        {isHired && job.status === 'completed' && (() => {
                          const receivedReview = reviews.find(r => r.jobId === job.id);
                          if (!receivedReview) return null;
                          return (
                            <div className="bg-[var(--accent-soft)] border border-[var(--accent)] p-3 rounded-lg text-xs space-y-1.5">
                              <div className="flex justify-between items-center text-[10.5px]">
                                <span className="font-bold text-[var(--accent-soft-foreground)]">Захиалагчийн үнэлгээ:</span>
                                <div className="flex items-center space-x-0.5">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star 
                                      key={star} 
                                      className={`w-3 h-3 ${star <= receivedReview.rating ? 'fill-[var(--accent)] text-[var(--accent-soft-foreground)]' : 'text-[var(--muted-foreground)]'}`} 
                                    />
                                  ))}
                                  <span className="font-bold font-mono ml-1 text-[var(--fg)]">{receivedReview.rating}.0</span>
                                </div>
                              </div>
                              <p className="text-[11px] text-[var(--muted-foreground)] italic">&ldquo;{receivedReview.comment}&rdquo;</p>
                            </div>
                          );
                        })()}

                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-1">
                            <DollarSign className="w-3.5 h-3.5 text-[var(--accent-soft-foreground)]" />
                            <span className="font-mono font-bold text-[var(--fg)] text-xs">
                              {job.salary === 0 ? 'Тохиролцоно' : `${job.salary.toLocaleString()} ₮`}
                            </span>
                            {job.salaryUnit && job.salaryUnit !== 'Өдрөөр' && (
                              <span className="text-[10px] text-[var(--muted-foreground)] font-mono"> / {job.salaryUnit}</span>
                            )}
                          </div>

                          {isHired && job.status === 'completed' && (
                            <div>
                              {job.isReviewedByOperator ? (
                                <span className="text-[10px] text-[var(--accent-soft-foreground)] bg-[var(--accent-soft)] px-2 py-1 rounded font-semibold border border-[var(--accent)]">
                                  ✓ Захиалагчийг үнэлсэн
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => onReview(job)}
                                  className="bg-[var(--accent)] hover:brightness-95 text-[var(--accent-foreground)] font-bold text-[10.5px] py-1.5 px-3.5 rounded-lg transition-colors cursor-pointer"
                                >
                                  Захиалагчийг Үнэлэх
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                } else {
                  // Employer posted jobs tracking
                  let statusText = '';
                  let badgeClass = '';
                  let statusDesc = '';

                  if (job.status === 'open') {
                    statusText = 'Идэвхтэй • Жолооч хайж буй';
                    badgeClass = 'bg-[var(--accent-soft)] text-[var(--accent-soft-foreground)] border-2 border-[var(--accent)] shadow-[0_0_10px_rgba(16,185,129,0.15)]';
                    statusDesc = `⏳ Хүсэлт ирүүлсэн жолооч нарын тоо: ${job.applicants.length}. Жолооч сонгох буюу ажилд томилох боломжтой.`;
                  } else if (job.status === 'in_progress') {
                    statusText = 'Идэвхтэй • Ажил явагдаж байна';
                    badgeClass = 'bg-[var(--accent-soft)] text-[var(--accent-soft-foreground)] border-2 border-[var(--accent)] shadow-[0_0_10px_rgba(139,92,246,0.15)]';
                    statusDesc = `🤝 Томилогдсон жолооч: ${job.hiredOperatorName || 'Оператор'}. Ажил дууссаны дараа гүйцэтгэлийг баталгаажуулж үнэлнэ үү.`;
                  } else if (job.status === 'completed') {
                    const isReviewed = job.isReviewedByEmployer;
                    if (isReviewed) {
                      statusText = 'Үнэлгээ хийгдсэн • Хаагдсан ✓';
                      badgeClass = 'bg-[rgba(34,211,238,0.15)] text-[#22d3ee] border-2 border-[rgba(34,211,238,0.4)] shadow-[0_0_10px_rgba(34,211,238,0.15)]';
                      statusDesc = `Та жолоочийг үнэлж, ажил амжилттай хаагдсан байна.`;
                    } else {
                      statusText = 'Ажил дууссан • Үнэлэх шаардлагатай ⚠️';
                      badgeClass = 'bg-[var(--accent-soft)] text-[var(--accent-soft-foreground)] border-2 border-[var(--accent)] shadow-[0_0_10px_rgba(139,92,246,0.15)] animate-pulse';
                      statusDesc = `✓ Ажил дууссан. Та өөрийн томилсон жолоочийг үнэлж ажлыг хаана уу.`;
                    }
                  }

                  return (
                    <div
                      key={job.id}
                      id={`job-card-${job.id}`}
                      className={`panel p-5 rounded-md transition-all flex flex-col justify-between space-y-4 text-left ${
                        activeHighlightJobId === job.id
                          ? 'highlighted-job-card'
                          : 'border border-[var(--border)] hover:border-[var(--border)]'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-start gap-1">
                          <span className="font-mono text-[10px] text-[var(--muted-foreground)]">{formatDate(job.createdAt)}</span>
                          <span className="text-[10px] text-[var(--muted-foreground)] shrink-0 flex items-center space-x-1">
                            <MapPin className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                            <span>{job.location.split(',')[0]}</span>
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-[var(--fg)] leading-snug">{job.title}</h4>

                        {/* Job Image Thumbnail */}
                        {((job.imageUrls && job.imageUrls.length > 0) || job.imageUrl) && (
                          <div className="w-full h-36 rounded-md overflow-hidden bg-[var(--card)] border border-[var(--border)] relative shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={job.imageUrls && job.imageUrls.length > 0 ? job.imageUrls[0] : job.imageUrl}
                              alt={job.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        {/* Description */}
                        {job.description && (
                          <p className="text-[11px] text-[var(--muted-foreground)] line-clamp-2 leading-relaxed font-sans">
                            {job.description}
                          </p>
                        )}

                        {/* Additional info */}
                        {job.additionalInfo && (
                          <p className="text-[10.5px] text-[var(--muted-foreground)] leading-relaxed italic font-sans bg-[rgba(255,255,255,0.04)] p-2.5 rounded-lg border border-[var(--border)]">
                            Нэмэлт: {job.additionalInfo}
                          </p>
                        )}

                        {/* Status badge and description */}
                        <div className="space-y-2 pt-1.5">
                          <span className={`inline-flex px-2.5 py-0.5 rounded text-[11px] font-bold font-mono tracking-wide uppercase ${badgeClass}`}>
                            {statusText}
                          </span>
                          <p className="text-[11px] text-[var(--muted-foreground)] leading-relaxed bg-[rgba(255,255,255,0.04)] p-3 rounded-lg border border-[var(--border)] font-sans">
                            {statusDesc}
                          </p>
                        </div>

                        {job.hiredOperatorId && (
                          <div className="bg-[var(--card)] p-2.5 rounded-lg border border-[var(--border)] flex justify-between items-center text-[10.5px] mt-2">
                            <span className="text-[var(--muted-foreground)]">Томилогдсон жолооч:</span>
                            <div className="flex items-center space-x-2">
                              <button
                                type="button"
                                onClick={() => {
                                  window.location.href = `/profile?id=${job.hiredOperatorId}`;
                                }}
                                className="font-semibold text-[var(--accent-soft-foreground)] hover:text-[var(--accent-soft-foreground)] hover:underline cursor-pointer text-left transition-colors"
                              >
                                {job.hiredOperatorName}
                              </button>
                              {isOwnProfile && job.status === 'completed' && !job.isReviewedByEmployer && (
                                <button
                                  type="button"
                                  onClick={() => onCancelHiring(job.id)}
                                  className="text-[var(--muted-foreground)] hover:text-[var(--accent-soft-foreground)] bg-[var(--card)] border border-[var(--border)] hover:border-[var(--border)] px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-colors"
                                >
                                  Болих
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Applicants rendering for open jobs */}
                        {job.status === 'open' && job.applicants.length > 0 && (
                          <div className="space-y-2 pt-2 border-t border-[var(--border)]">
                            <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase font-mono tracking-wider flex items-center space-x-1.5">
                              <Users className="w-3.5 h-3.5 text-[var(--accent-soft-foreground)]" />
                              <span>Ирүүлсэн хүсэлтүүд ({job.applicants.length}):</span>
                            </span>
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                              {job.applicants.map((opId) => {
                                const op = allUsers.find(u => u.id === opId);
                                if (!op) return null;
                                return (
                                  <div
                                    key={op.id}
                                    className="bg-[var(--card)] p-2.5 rounded-md border border-[var(--border)] flex items-center justify-between text-xs"
                                  >
                                    <div
                                      onClick={() => { window.location.href = `/profile?id=${op.id}`; }}
                                      className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
                                    >
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={op.profileImage}
                                        alt={op.fullName}
                                        className="w-7 h-7 rounded-full object-cover border border-[var(--border)]"
                                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=U&background=334155&color=fff'; }}
                                      />
                                      <div>
                                        <div className="font-bold text-[var(--fg)] hover:text-[var(--accent-soft-foreground)] hover:underline">{op.fullName}</div>
                                        <div className="text-[10px] text-[var(--accent-soft-foreground)] flex items-center space-x-0.5">
                                          <Star className="w-2.5 h-2.5 fill-[var(--accent)] text-[var(--accent-soft-foreground)]" />
                                          <span>{op.rating.toFixed(1)} ({op.experienceYears || 0} жил)</span>
                                        </div>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => onHire(job.id, op.id)}
                                      className="bg-[var(--accent)] hover:brightness-95 text-[var(--accent-foreground)] font-bold text-[10px] py-1 px-2.5 rounded-lg transition-colors cursor-pointer"
                                    >
                                      Томилох
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Active Job Workflow for Employer */}
                        {job.status === 'in_progress' && (
                          <div className="pt-2">
                            <button
                              type="button"
                              onClick={() => onComplete(job)}
                              className="w-full bg-[var(--accent)] hover:brightness-95 text-[var(--accent-foreground)] font-bold text-xs py-2 px-3 rounded-lg transition-colors cursor-pointer flex items-center justify-center space-x-1"
                            >
                              <span>✓ Ажил Дууссаныг Баталгаажуулж Үнэлэх</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Completed Job action */}
                      {job.status === 'completed' && (
                        <div className="space-y-3 pt-2">
                          {(() => {
                            const receivedReview = reviews.find(r => r.jobId === job.id);
                            if (!receivedReview) return null;
                            return (
                              <div className="bg-[var(--accent-soft)] border border-[var(--accent)] p-3 rounded-lg text-xs space-y-1.5 mt-2">
                                <div className="flex justify-between items-center text-[10.5px]">
                                  <span className="font-bold text-[var(--accent-soft-foreground)]">Жолоочийн үнэлгээ:</span>
                                  <div className="flex items-center space-x-0.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star 
                                        key={star} 
                                        className={`w-3 h-3 ${star <= receivedReview.rating ? 'fill-[var(--accent)] text-[var(--accent-soft-foreground)]' : 'text-[var(--muted-foreground)]'}`} 
                                      />
                                    ))}
                                    <span className="font-bold font-mono ml-1 text-[var(--fg)]">{receivedReview.rating}.0</span>
                                  </div>
                                </div>
                                <p className="text-[11px] text-[var(--muted-foreground)] italic">&ldquo;{receivedReview.comment}&rdquo;</p>
                              </div>
                            );
                          })()}

                          {!job.isReviewedByEmployer && (
                            <div className="pt-2 flex justify-end">
                              <button
                                type="button"
                                onClick={() => onReview(job)}
                                className="bg-[var(--accent)] hover:brightness-95 text-[var(--accent-foreground)] font-bold text-[10.5px] py-1.5 px-3.5 rounded-lg transition-colors cursor-pointer"
                              >
                                Жолоочийг Үнэлэх
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action buttons (Edit/Delete) relocated to the bottom of the card */}
                      {isOwnProfile && (
                        <div className="flex space-x-2.5 pt-2 mt-auto border-t border-[var(--border)]">
                          {job.status !== 'completed' && (
                            <button
                              type="button"
                              onClick={() => onEdit(job)}
                              className="flex-1 border border-[var(--border)] hover:border-[var(--border)] bg-[var(--card)] hover:bg-[var(--card)] text-[var(--muted-foreground)] hover:text-[var(--fg)] font-semibold text-[10.5px] py-1.5 px-2.5 rounded-lg transition-colors cursor-pointer text-center"
                            >
                              Засах
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onDelete(job)}
                            className={`${job.status === 'completed' ? 'w-full' : 'flex-1'} border border-[var(--border)] hover:border-[var(--border)] bg-[var(--card)] hover:bg-[var(--card)] text-[var(--muted-foreground)] hover:text-[var(--fg)] font-semibold text-[10.5px] py-1.5 px-2.5 rounded-lg transition-colors cursor-pointer text-center`}
                          >
                            Устгах
                          </button>
                        </div>
                      )}
                    </div>
                  );
                }
              })}
            </div>
          )}
        </div>
  );
}
