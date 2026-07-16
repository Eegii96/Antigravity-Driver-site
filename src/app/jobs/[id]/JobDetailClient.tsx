'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, MapPin, Briefcase,
  CheckCircle, User as UserIcon, Loader2, AlertCircle, ChevronDown, ChevronLeft, ChevronRight, LogOut, Settings as SettingsIcon,
  Phone, Share2
} from 'lucide-react';
import { getSingleJob, getSingleUser, applyForJob } from '../../../lib/db';
import { getMockEmployerName, getMockEmployerPhone } from '../../../lib/mock-employer';
import { formatRelativeDate } from '../../../lib/job-format';
import { Job, User } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import GuestBlurWarningModal from '../../../components/jobboard/GuestBlurWarningModal';
import { trackViewJob, trackContactClick, trackApplySubmit, trackShareJob } from '../../../lib/analytics';

interface JobDetailClientProps {
  jobId: string;
}

export default function JobDetailClient({ jobId }: JobDetailClientProps) {
  const router = useRouter();
  const { currentUser, logout } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [employer, setEmployer] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);
  const [showBlurWarningModal, setShowBlurWarningModal] = useState<boolean>(false);
  const [linkCopied, setLinkCopied] = useState<boolean>(false);

  // Image carousel: desktop has no natural horizontal-drag gesture, so md+
  // gets explicit prev/next arrows (review 2026-07-14).
  const carouselRef = useRef<HTMLDivElement>(null);
  const scrollCarousel = (dir: -1 | 1) => {
    const el = carouselRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth, behavior: 'smooth' });
  };

  useEffect(() => {
    if (showBlurWarningModal) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [showBlurWarningModal]);

  useEffect(() => {
    // Fetch job details
    const fetchJobData = async () => {
      try {
        const jobData = await getSingleJob(jobId);
        if (jobData) {
          setJob(jobData);
          trackViewJob(jobData.id, jobData.status);
        } else {
          setError('Уучлаарай, ажлын зар олдсонгүй эсвэл устгагдсан байна.');
        }
      } catch (err) {
        console.error(err);
        setError('Өгөгдөл уншихад алдаа гарлаа.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobData();
  }, [jobId]);

  // Fetch the real employer profile only for authenticated users — guests always see
  // blurred mock data and the users collection now requires auth to read anyway.
  useEffect(() => {
    if (!currentUser || !job) return;
    getSingleUser(job.employerId).then(empData => {
      if (empData) setEmployer(empData);
    });
  }, [currentUser, job]);

  const handleApply = async () => {
    if (!currentUser) {
      router.push('/auth');
      return;
    }
    if (!job) return;

    setIsApplying(true);
    try {
      const success = await applyForJob(job.id, currentUser.id);
      if (success) {
        // Update local state
        const updatedJob = { ...job, applicants: [...job.applicants, currentUser.id] };
        setJob(updatedJob);
        trackApplySubmit(job.id);
        setSuccessMessage('Ажилд орох хүсэлт амжилттай илгээгдлээ! Захиалагч хянах болно.');
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        setError('Хүсэлт илгээх боломжгүй байна (магадгүй зар хаагдсан эсвэл та өөрийн заранд хүсэлт илгээхийг оролдлоо).');
      }
    } catch (err) {
      console.error(err);
      setError('Хүсэлт илгээхэд алдаа гарлаа.');
    } finally {
      setIsApplying(false);
    }
  };

  // This page IS the share-link target — it needs its own share affordance
  // (mobile: OS share sheet, desktop: copy link).
  const handleShare = async () => {
    if (!job) return;
    const jobUrl = `${window.location.origin}/jobs/${job.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: job.title, url: jobUrl });
        trackShareJob(job.id, 'native');
      } catch (_) {
        // User cancelled the share sheet — do nothing.
      }
    } else {
      await navigator.clipboard.writeText(jobUrl);
      trackShareJob(job.id, 'copy');
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    }
  };

  // JobPostModal historically saved this literal placeholder for blank
  // descriptions — hide it instead of announcing it (AGENTS.md §4).
  const hasRealDescription = (text: string | undefined): boolean => {
    const t = (text || '').trim();
    return t !== '' && t !== 'Нэмэлт мэдээлэл оруулаагүй.';
  };

  const getFirstName = (userObj: User | string | null): string => {
    if (!userObj) return 'Хэрэглэгч';
    if (typeof userObj === 'string') {
      const parts = userObj.trim().split(/\s+/);
      return parts[parts.length - 1];
    }
    if (userObj.firstName) return userObj.firstName;
    const parts = userObj.fullName.trim().split(/\s+/);
    return parts[parts.length - 1];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center text-[var(--fg)] font-sans">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-12 h-12 text-[var(--accent-soft-foreground)] animate-spin" />
          <p className="text-[var(--muted-foreground)] text-sm">Уншиж байна...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow bg-[var(--bg)] text-[var(--fg)] font-sans flex flex-col justify-between relative overflow-hidden">
      {/* Premium Header */}
      <header className="sticky top-0 z-40 bg-[var(--card)] border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              if (typeof document !== 'undefined' && document.referrer && document.referrer.includes(window.location.host)) {
                window.history.back();
              } else {
                window.location.href = '/';
              }
            }}
            aria-label="Буцах"
            className="min-w-11 min-h-11 flex items-center justify-center bg-[var(--card)] border border-[var(--border)] rounded-full hover:bg-[var(--bg2)] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4.5 h-4.5 text-[var(--fg)]" />
          </button>
          <div>
            <h1 className="text-sm font-bold text-[var(--fg)] text-left font-display">Жолооч Монголиа</h1>
            <p className="text-xs text-[var(--muted-foreground)] font-medium">Хүнд машин, механизм & Газар шорооны ажлын сайт</p>
          </div>
        </div>

        {currentUser ? (
          <div 
            className="relative"
            onMouseEnter={() => setShowProfileMenu(true)}
            onMouseLeave={() => setShowProfileMenu(false)}
          >
            <button
              onClick={() => setShowProfileMenu(prev => !prev)}
              className="flex items-center space-x-2 bg-[var(--card)] p-1.5 pl-3 rounded-full hover:bg-[var(--bg2)] transition-colors border border-[var(--border)] text-left cursor-pointer"
            >
              <div className="hidden md:block">
                <p className="text-xs font-semibold text-[var(--fg)] leading-none">{getFirstName(currentUser)}</p>
                <span className="text-xs text-[var(--muted-foreground)] font-sans">
                  {currentUser.type === 'operator' ? 'Жолооч' : 'Ажил олгогч'} · {currentUser.rating}★
                </span>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentUser.profileImage}
                alt="user avatar"
                className="w-8 h-8 rounded-full object-cover border-2 border-[var(--accent)]"
                onError={(e) => { (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=U&background=334155&color=fff'; }}
              />
              <ChevronDown className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 top-full pt-1.5 w-48 z-50 animate-fade-in">
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-md py-2">
                  <button
                    onClick={() => router.push('/profile')}
                    className="w-full text-left px-4 py-2.5 text-[13px] hover:bg-[var(--bg2)] text-[var(--fg)] flex items-center space-x-2.5 cursor-pointer"
                  >
                    <UserIcon className="w-4 h-4 text-[var(--muted-foreground)]" />
                    <span>Миний профайл</span>
                  </button>
                  <button
                    onClick={() => router.push('/applications')}
                    className="w-full text-left px-4 py-2.5 text-[13px] hover:bg-[var(--bg2)] text-[var(--fg)] flex items-center space-x-2.5 cursor-pointer"
                  >
                    <Briefcase className="w-4 h-4 text-[var(--muted-foreground)]" />
                    <span>Миний зарууд, хүсэлтүүд</span>
                  </button>
                  <button
                    onClick={() => router.push('/settings')}
                    className="w-full text-left px-4 py-2.5 text-[13px] hover:bg-[var(--bg2)] text-[var(--fg)] flex items-center space-x-2.5 cursor-pointer"
                  >
                    <SettingsIcon className="w-4 h-4 text-[var(--muted-foreground)]" />
                    <span>Тохиргоо</span>
                  </button>
                  <div className="border-t border-[var(--border)] my-1"></div>
                  <button
                    onClick={async () => {
                      await logout();
                      router.push('/auth');
                    }}
                    className="w-full text-left px-4 py-2.5 text-[13px] hover:bg-rose-50 text-rose-600 hover:text-rose-700 flex items-center space-x-2.5 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Системээс гарах</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => router.push('/auth')}
            className="text-sm bg-[var(--accent)] hover:opacity-90 text-[var(--accent-foreground)] font-bold px-4 py-2.5 rounded-full transition-all shadow-sm cursor-pointer"
          >
            Нэвтрэх / Бүртгүүлэх
          </button>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-3xl mx-auto w-full px-6 py-10 relative z-10">
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-sm flex items-center space-x-2.5 mb-6 text-left">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}



        {job && (
          <div className="bg-[var(--card)] border border-[var(--border)] p-6 md:p-8 rounded-2xl space-y-6 shadow-sm">
            {/* Header info */}
            <div className="border-b border-[var(--border)] pb-5 space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-[var(--border)]" onClick={(e) => e.stopPropagation()}>
                {/* Creator name */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!currentUser) { setShowBlurWarningModal(true); return; }
                    router.push(`/profile?id=${job.employerId}`);
                  }}
                  className="flex items-center space-x-2 text-left focus:outline-none hover:opacity-80 transition-opacity bg-transparent border-0 p-0 cursor-pointer"
                >
                  <UserIcon className="w-4 h-4 text-[var(--muted-foreground)] shrink-0" />
                  <span className={`text-sm font-semibold font-sans text-[var(--fg)] ${
                    !currentUser ? 'filter blur-[5px] select-none cursor-pointer' : 'hover:underline'
                  }`}>
                    {!currentUser ? getMockEmployerName(job.id) : (employer?.companyName || employer?.fullName || job.employerName)}
                  </span>
                </button>

                {/* Phone number */}
                <div
                  onClick={(e) => {
                    if (!currentUser) { e.stopPropagation(); setShowBlurWarningModal(true); }
                  }}
                  className={`flex items-center space-x-1.5 ${ !currentUser ? 'cursor-pointer' : '' }`}
                >
                  <Phone className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                  {!currentUser ? (
                    <span className="font-mono text-sm font-semibold text-[var(--fg)] filter blur-[5px] select-none">
                      {getMockEmployerPhone(job.id)}
                    </span>
                  ) : employer?.phone ? (
                    <a
                      href={`tel:${employer.phone}`}
                      onClick={() => trackContactClick(job.id, 'tel')}
                      className="font-mono text-sm font-semibold text-[var(--fg)] underline decoration-[var(--border-strong)] underline-offset-4 py-2 -my-2"
                    >
                      {employer.phone}
                    </a>
                  ) : (
                    <span className="font-mono text-sm font-semibold text-[var(--fg)]">Утасгүй</span>
                  )}
                </div>
              </div>


              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[13px] text-[var(--concrete)]">
                  {job.createdAt ? formatRelativeDate(job.createdAt) : ''}
                </span>
                <span className="text-[13px] text-[var(--muted-foreground)] flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{job.location}</span>
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-[var(--fg)] leading-snug text-left font-display">
                {job.title}
              </h2>
            </div>

            {/* Job Image Banner */}
            {job.imageUrls && job.imageUrls.length > 0 ? (
              <div className="w-full space-y-1">
                <div className="relative">
                  <div ref={carouselRef} className="flex overflow-x-auto gap-2.5 snap-x snap-mandatory scrollbar-none py-1">
                    {job.imageUrls.map((url, idx) => (
                      <div key={idx} className="shrink-0 w-full snap-center h-64 md:h-96 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg2)] flex items-center justify-center relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt={`Slide ${idx + 1}`}
                          className="w-full h-full object-contain"
                        />
                        <div className="absolute bottom-2.5 right-2.5 bg-[var(--fg)]/75 text-[var(--card)] text-xs font-bold px-2 py-0.5 rounded-full font-sans">
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
                        onClick={() => scrollCarousel(-1)}
                        className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center rounded-full bg-[var(--card)]/90 border border-[var(--border)] text-[var(--fg)] shadow-sm hover:bg-[var(--card)] transition-colors cursor-pointer z-10"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        aria-label="Дараагийн зураг"
                        onClick={() => scrollCarousel(1)}
                        className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center rounded-full bg-[var(--card)]/90 border border-[var(--border)] text-[var(--fg)] shadow-sm hover:bg-[var(--card)] transition-colors cursor-pointer z-10"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
                {job.imageUrls.length > 1 && (
                  <p className="text-xs text-[var(--muted-foreground)] text-center font-sans select-none md:hidden">
                    Хажуу тийш гүйлгэж үзнэ үү
                  </p>
                )}
              </div>
            ) : (job.imageUrl && (
              <div className="w-full max-h-96 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg2)] flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={job.imageUrl}
                  alt={job.title}
                  className="w-full max-h-96 object-contain rounded-xl"
                />
              </div>
            ))}

            {/* Quick Details Card Grid — mirrors the board's expanded card
                (Цалин | Байршил); the old "АЖЛЫН ХУГАЦАА" card showed the same
                hardcoded "Тохиролцоно" on every job (review 2026-07-14). */}
            <div className="grid grid-cols-2 gap-3 text-left">
              <div className="bg-[var(--bg2)] p-4 rounded-xl">
                <span className="text-xs text-[var(--muted-foreground)] font-medium block mb-1.5">Цалин / Төлбөр</span>
                <span className="font-display font-bold text-[var(--verify)] text-base tabular-nums">
                  {job.salary === 0 ? 'Тохиролцоно' : `${job.salary.toLocaleString()} ₮`}
                </span>
                {job.salaryUnit && (
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

            {/* Description — hidden entirely when the poster left it blank */}
            {hasRealDescription(job.description) && (
              <div className="space-y-2 text-left">
                <span className="text-[13px] font-semibold text-[var(--muted-foreground)]">Ажлын дэлгэрэнгүй тодорхойлолт</span>
                <p className="text-[15px] text-[var(--fg)] leading-relaxed bg-[var(--bg2)] p-4 rounded-xl whitespace-pre-wrap">
                  {job.description}
                </p>
              </div>
            )}

            {/* Requirements */}
            <div className="space-y-3 text-left">
              <span className="text-[13px] font-semibold text-[var(--muted-foreground)]">Шаардлага</span>
              <ul className="space-y-2 text-sm text-[var(--fg)]">
                {job.requirements.map((req, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="text-[var(--accent-soft-foreground)] mr-2.5 font-bold">•</span>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions Zone */}
            <div className="border-t border-[var(--border)] pt-6">
              {currentUser ? (
                /* Authenticated User Actions */
                currentUser.id === job.employerId ? (
                  <div className="space-y-3">
                    <p className="font-semibold text-[var(--fg)] text-left text-[15px]">Таны оруулсан зар байна.</p>
                    <button
                      onClick={() => router.push(`/profile?id=${currentUser.id}`)}
                      className="w-full min-h-12 bg-[var(--card)] hover:bg-[var(--bg2)] text-[var(--fg)] border border-[var(--border)] hover:border-[var(--border-strong)] px-4 rounded-full text-sm font-semibold cursor-pointer transition-colors"
                    >
                      Хүсэлт ирүүлсэн харилцагчдыг хянах
                    </button>
                  </div>
                ) : (
                  job.applicants.includes(currentUser.id) ? (
                    <div className="space-y-3">
                      <div className="bg-[rgba(31,138,76,0.08)] p-4 rounded-xl text-center text-sm text-[var(--verify)] font-semibold flex items-center justify-center space-x-2">
                        <CheckCircle className="w-5 h-5 text-[var(--verify)]" />
                        <span>Та энэ заранд хүсэлтээ амжилттай илгээсэн байна. Захиалагчийн хариуг хүлээж байна.</span>
                      </div>
                      {successMessage && (
                        <div className="bg-[rgba(31,138,76,0.08)] border border-[rgba(31,138,76,0.3)] text-[var(--verify)] p-3.5 rounded-xl text-xs flex items-start space-x-2 animate-fade-in text-left">
                          <CheckCircle className="w-4.5 h-4.5 text-[var(--verify)] shrink-0 mt-0.5" />
                          <span className="font-sans leading-normal text-sm">{successMessage}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={handleApply}
                      disabled={isApplying || job.status !== 'open'}
                      className="w-full bg-[var(--accent)] hover:opacity-90 disabled:opacity-50 text-[var(--accent-foreground)] py-3 px-6 rounded-full font-bold text-sm transition-all cursor-pointer flex items-center justify-center space-x-2 shadow-sm"
                    >
                      {isApplying ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Илгээж байна...</span>
                        </>
                      ) : (
                        <>
                          <Briefcase className="w-4 h-4" />
                          <span>Хүсэлт илгээх</span>
                        </>
                      )}
                    </button>
                  )
                )
              ) : (
                /* Guest User Call To Action */
                <div className="bg-[var(--bg2)] p-5 rounded-xl text-center space-y-4">
                  <div className="space-y-1.5">
                    <p className="text-[17px] font-display font-bold text-[var(--fg)]">Та энэ заранд хүсэлт илгээх үү?</p>
                    <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                      Хувийн үнэлгээ, ажлын түүхээ хавсаргаж хүсэлт илгээхийн тулд системд нэвтэрсэн байх шаардлагатай.
                    </p>
                  </div>
                  <button
                    onClick={() => router.push('/auth')}
                    className="inline-flex items-center min-h-12 space-x-2 bg-[var(--accent)] hover:opacity-90 text-[var(--accent-foreground)] font-semibold text-[15px] px-6 rounded-full transition-all shadow-sm cursor-pointer"
                  >
                    <span>Нэвтэрч ороод хүсэлт илгээх</span>
                  </button>
                </div>
              )}
            </div>

            {/* Share — this page is the canonical share target */}
            <div className="border-t border-[var(--border)] pt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={handleShare}
                className="flex items-center gap-2 text-[13px] font-medium text-[var(--muted-foreground)] hover:text-[var(--fg)] transition-colors cursor-pointer py-2 -my-2 pr-2"
              >
                <Share2 className="w-4 h-4" />
                <span>Хуваалцах</span>
              </button>
              {linkCopied && (
                <span className="text-[13px] text-[var(--verify)] font-medium animate-fade-in">Холбоос хуулагдлаа</span>
              )}
            </div>
          </div>
        )}
      </main>
      {/* Guest Blur Warning Modal — the single shared implementation
          (an inline copy used to live here and drift; review 2026-07-14) */}
      {showBlurWarningModal && (
        <GuestBlurWarningModal
          onClose={() => setShowBlurWarningModal(false)}
          onLogin={() => {
            setShowBlurWarningModal(false);
            router.push('/auth?tab=login');
          }}
        />
      )}

    </div>
  );
}
