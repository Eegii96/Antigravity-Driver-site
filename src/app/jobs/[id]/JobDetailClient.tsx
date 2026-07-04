'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, MapPin, DollarSign, Briefcase, Clock, 
  CheckCircle, Star, Users, User as UserIcon, Loader2, AlertCircle, ChevronDown, LogOut, Settings as SettingsIcon, X,
  Phone
} from 'lucide-react';
import { getSingleJob, getSingleUser, saveSingleUser, applyForJob } from '../../../lib/db';
import { getMockEmployerName, getMockEmployerPhone } from '../../../lib/mock-employer';
import { Job, User } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { trackViewJob, trackContactClick, trackApplySubmit } from '../../../lib/analytics';

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
        setSuccessMessage('Ажилд орох хүсэлт амжилттай илгээгдлээ! Захиалагч хянах болно. 🎉');
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
            className="p-2 bg-[var(--card)] border border-[var(--border)] rounded-md hover:bg-[var(--bg2)] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[var(--fg)]" />
          </button>
          <div>
            <h1 className="text-sm font-black tracking-wide text-[var(--fg)] uppercase text-left font-display">Жолооч Монголиа</h1>
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
                <span className="text-xs text-[var(--muted-foreground)] font-mono">
                  {currentUser.type === 'operator' ? 'Жолооч' : 'Ажил олгогч'} • {currentUser.rating}⭐
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
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-md shadow-md py-2">
                  <button
                    onClick={() => router.push('/profile')}
                    className="w-full text-left px-4 py-2 text-xs hover:bg-[var(--bg2)] text-[var(--fg)] flex items-center space-x-2.5 cursor-pointer"
                  >
                    <UserIcon className="w-4 h-4 text-[var(--muted-foreground)]" />
                    <span>Миний профайл</span>
                  </button>
                  <button
                    onClick={() => router.push('/applications')}
                    className="w-full text-left px-4 py-2 text-xs hover:bg-[var(--bg2)] text-[var(--fg)] flex items-center space-x-2.5 cursor-pointer"
                  >
                    <Briefcase className="w-4 h-4 text-[var(--muted-foreground)]" />
                    <span>Миний зарууд, хүсэлтүүд</span>
                  </button>
                  <button
                    onClick={() => router.push('/settings')}
                    className="w-full text-left px-4 py-2 text-xs hover:bg-[var(--bg2)] text-[var(--fg)] flex items-center space-x-2.5 cursor-pointer"
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
                    className="w-full text-left px-4 py-2 text-xs hover:bg-rose-50 text-rose-600 hover:text-rose-700 flex items-center space-x-2.5 cursor-pointer"
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
            className="text-xs bg-[var(--accent)] hover:brightness-95 text-[var(--accent-foreground)] font-bold px-4 py-2 rounded transition-all shadow-sm cursor-pointer"
          >
            Нэвтрэх / Бүртгүүлэх
          </button>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-3xl mx-auto w-full px-6 py-10 relative z-10">
        {error && (
          <div className="bg-rose-50 border border-rose-300 text-rose-600 p-4 rounded-md text-xs flex items-center space-x-2.5 mb-6 text-left">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}



        {job && (
          <div className="bg-[var(--card)] border border-[var(--border)] p-6 md:p-8 rounded-md space-y-6 shadow-sm">
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
                  <span className={`text-xs font-bold font-sans text-[var(--accent-soft-foreground)] ${
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
                    <span className="font-mono text-xs font-bold text-[var(--fg)] filter blur-[5px] select-none">
                      {getMockEmployerPhone(job.id)}
                    </span>
                  ) : employer?.phone ? (
                    <a
                      href={`tel:${employer.phone}`}
                      onClick={() => trackContactClick(job.id, 'tel')}
                      className="font-mono text-xs font-bold text-[var(--fg)] underline decoration-[var(--accent)] underline-offset-2"
                    >
                      {employer.phone}
                    </a>
                  ) : (
                    <span className="font-mono text-xs font-bold text-[var(--fg)]">Утасгүй</span>
                  )}
                </div>
              </div>


              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-xs text-[var(--muted-foreground)]">
                  {job.createdAt ? new Date(job.createdAt).toLocaleDateString('mn-MN').replace(/\//g, '.') : ''}
                </span>
                <span className="text-xs text-[var(--muted-foreground)] flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{job.location}</span>
                </span>
              </div>
              <h2 className="text-lg md:text-xl font-extrabold text-[var(--fg)] leading-snug text-left font-display">
                {job.title}
              </h2>
            </div>

            {/* Job Image Banner */}
            {job.imageUrls && job.imageUrls.length > 0 ? (
              <div className="w-full space-y-1">
                <div className="flex overflow-x-auto gap-2.5 snap-x snap-mandatory scrollbar-none py-1">
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
                  <p className="text-xs text-[var(--muted-foreground)] text-center font-sans select-none">
                    ↔️ Хажуу тийш гүйлгэж үзнэ үү
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

            {/* Quick Details Card Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-left">
              <div className="bg-[var(--bg2)] p-4 rounded-md border border-[var(--border)]">
                <span className="text-xs text-[var(--muted-foreground)] block font-mono">ТӨЛБӨРИЙН ХЭМЖЭЭ</span>
                <span className="font-bold text-lg text-[var(--verify)] block font-mono mt-1">
                  {job.salary === 0 ? 'Тохиролцоно' : `${job.salary.toLocaleString('mn-MN')} ₮`}
                </span>
              </div>
              <div className="bg-[var(--bg2)] p-4 rounded-md border border-[var(--border)]">
                <span className="text-xs text-[var(--muted-foreground)] block font-mono">АЖЛЫН ХУГАЦАА</span>
                <span className="font-bold text-lg text-[var(--fg)] block mt-1">
                  {job.duration}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2 text-left">
              <span className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wide">Ажлын дэлгэрэнгүй тодорхойлолт</span>
              <p className="text-xs text-[var(--fg)] leading-relaxed bg-[var(--bg2)] p-4 rounded-md border border-[var(--border)] whitespace-pre-wrap">
                {job.description}
              </p>
            </div>

            {/* Requirements */}
            <div className="space-y-3 text-left">
              <span className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wide">Шаардлага</span>
              <ul className="space-y-2 text-xs text-[var(--fg)]">
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
                    <p className="font-semibold text-[var(--fg)] text-left">Таны оруулсан зар байна.</p>
                    <button
                      onClick={() => router.push(`/profile?id=${currentUser.id}`)}
                      className="w-full bg-[var(--bg2)] hover:bg-[var(--border)] text-[var(--fg)] border border-[var(--border)] py-2 px-4 rounded-md text-xs cursor-pointer transition-colors"
                    >
                      Хүсэлт ирүүлсэн харилцагчдыг хянах
                    </button>
                  </div>
                ) : (
                  job.applicants.includes(currentUser.id) ? (
                    <div className="space-y-3">
                      <div className="bg-[rgba(31,138,76,0.08)] border border-[rgba(31,138,76,0.3)] p-4 rounded-md text-center text-xs text-[var(--verify)] font-semibold flex items-center justify-center space-x-2">
                        <CheckCircle className="w-5 h-5 text-[var(--verify)]" />
                        <span>Та энэ заранд хүсэлтээ амжилттай илгээсэн байна. Захиалагчийн хариуг хүлээж байна.</span>
                      </div>
                      {successMessage && (
                        <div className="bg-[rgba(31,138,76,0.08)] border border-[rgba(31,138,76,0.3)] text-[var(--verify)] p-3.5 rounded-md text-xs flex items-start space-x-2 animate-fade-in text-left">
                          <CheckCircle className="w-4.5 h-4.5 text-[var(--verify)] shrink-0 mt-0.5" />
                          <span className="font-sans leading-normal text-sm">{successMessage}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={handleApply}
                      disabled={isApplying || job.status !== 'open'}
                      className="w-full bg-[var(--accent)] hover:brightness-95 disabled:opacity-50 text-[var(--accent-foreground)] py-3 px-6 rounded-md font-bold text-xs transition-all cursor-pointer flex items-center justify-center space-x-2 shadow-sm"
                    >
                      {isApplying ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Илгээж байна...</span>
                        </>
                      ) : (
                        <>
                          <Briefcase className="w-4 h-4" />
                          <span>ХҮСЭЛТ ИЛГЭЭХ (Хувийн мэдээлэл хавсаргах)</span>
                        </>
                      )}
                    </button>
                  )
                )
              ) : (
                /* Guest User Call To Action */
                <div className="bg-[var(--bg2)] p-5 rounded-md border border-[var(--border)] text-center space-y-4">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-[var(--fg)]">Та энэ заранд хүсэлт илгээх үү?</p>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      Хувийн үнэлгээ, ажлын түүхээ хавсаргаж хүсэлт илгээхийн тулд системд нэвтэрсэн байх шаардлагатай.
                    </p>
                  </div>
                  <button
                    onClick={() => router.push('/auth')}
                    className="inline-flex items-center space-x-2 bg-[var(--accent)] hover:brightness-95 text-[var(--accent-foreground)] font-bold text-xs px-6 py-2.5 rounded transition-all shadow-sm cursor-pointer"
                  >
                    <span>Нэвтэрч ороод хүсэлт илгээх</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      {/* Guest Blur Warning Modal */}
      {showBlurWarningModal && (
        <div 
          id="blur-warning-modal-backdrop" 
          onClick={() => setShowBlurWarningModal(false)}
          className="fixed inset-0 bg-[var(--fg)]/40 flex items-center justify-center p-4 z-50 animate-fade-in"
        >
          <div
            id="blur-warning-modal-container"
            onClick={(e) => e.stopPropagation()}
            className="bg-[var(--card)] border border-[var(--border-strong)] max-w-sm w-full rounded-md overflow-hidden shadow-md relative p-6 space-y-4"
          >
            {/* Header */}
            <div className="flex justify-between items-center pb-2 border-b border-[var(--border)]">
              <div className="flex items-center space-x-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-[var(--accent)] animate-pulse"></span>
                <h3 className="text-sm font-display font-bold uppercase text-[var(--fg)] tracking-wide">Дэлгэрэнгүй харах</h3>
              </div>
              <button
                onClick={() => setShowBlurWarningModal(false)}
                className="text-[var(--muted-foreground)] hover:text-[var(--fg)] transition-colors cursor-pointer p-1 rounded hover:bg-[var(--bg2)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Description */}
            <div className="space-y-3 text-left font-sans">
              <p className="text-xs text-[var(--fg)] leading-relaxed">
                Ажлын зар байршуулсан хэрэглэгч болон утасны дугаар зэрэг дэлгэрэнгүй мэдээлэл нь зөвхөн системд нэвтэрсэн хэрэглэгчдэд харагдах боломжтой.
              </p>
              <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                Та системд нэвтэрч орсны дараа зар бүтнээр харагдах болно.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowBlurWarningModal(false);
                  router.push('/auth?tab=login');
                }}
                className="w-full py-2.5 bg-[var(--accent)] hover:brightness-95 text-[var(--accent-foreground)] text-xs font-bold rounded transition-all shadow-sm cursor-pointer font-sans text-center"
              >
                Нэвтрэх хэсэг рүү очих
              </button>
              <button
                type="button"
                onClick={() => setShowBlurWarningModal(false)}
                className="w-full py-2.5 border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--fg)] text-xs font-medium rounded hover:bg-[var(--bg2)] transition-colors cursor-pointer font-sans"
              >
                Хаах
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
