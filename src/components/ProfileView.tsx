'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { User, Review, JobHistoryItem, Job } from '../types';
import { getReviews, getJobHistory, saveSingleUser, getSingleUser, getJobs, getUsersByIds, hireOperator, completeJob, deleteJob, cancelHiring, deleteReview, updateReview } from '../lib/db';
import { Star, ShieldAlert, Award, Phone, Mail, MapPin, Calendar, CheckCircle, X, Bookmark } from 'lucide-react';
const ProfileEditModal = dynamic(() => import('./ProfileEditModal'), { ssr: false });
const ReviewModal = dynamic(() => import('./ReviewModal'), { ssr: false });
const JobPostModal = dynamic(() => import('./JobPostModal'), { ssr: false });
import ConfirmModal from './ConfirmModal';
import { parseReviewDateToTimestamp } from '../lib/job-format';
import GivenReviewsList from './profile/GivenReviewsList';
import ReceivedReviewsList from './profile/ReceivedReviewsList';
import PrivacyTogglesBar from './profile/PrivacyTogglesBar';
import ApplicationsTab from './profile/ApplicationsTab';

interface ProfileViewProps {
  user: User; // User being viewed
  isOwnProfile: boolean; // Flag to enable edit options
  onUpdateCurrentUser?: (updated: User) => void; // Callback to notify app state has changed
  defaultTab?: 'profile' | 'applications';
  highlightJobId?: string;
  onBack?: () => void;
  onViewUserProfile?: (targetUser: User) => void;
}

export default function ProfileView({ user, isOwnProfile, onUpdateCurrentUser, defaultTab, highlightJobId }: ProfileViewProps) {
  const [showEdit, setShowEdit] = useState<boolean>(false);
  const [profileUser, setProfileUser] = useState<User>(user);
  
  // Asynchronous state for reviews and history
  const [displayReviews, setDisplayReviews] = useState<Review[]>([]);
  const [historyItems, setHistoryItems] = useState<JobHistoryItem[]>([]);
  const [success, setSuccess] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // States for reviews given and editing reviews
  const [givenReviews, setGivenReviews] = useState<Review[]>([]);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [editRating, setEditRating] = useState<number>(5);
  const [editHoverRating, setEditHoverRating] = useState<number | null>(null);
  const [editComment, setEditComment] = useState<string>('');
  const [editError, setEditError] = useState<string>('');
  const [isEditSubmitting, setIsEditSubmitting] = useState<boolean>(false);

  // Tracking driver applications and job status
  const activeTab = defaultTab || 'profile';
  const [applicationsSubTab, setApplicationsSubTab] = useState<'sent' | 'posted'>(
    user.type === 'operator' ? 'sent' : 'posted'
  );
  const [sentApplications, setSentApplications] = useState<Job[]>([]);
  const [postedJobs, setPostedJobs] = useState<Job[]>([]);
  const driverJobs = applicationsSubTab === 'sent' ? sentApplications : postedJobs;
  const [activeReviewJob, setActiveReviewJob] = useState<Job | null>(null);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeHighlightJobId, setActiveHighlightJobId] = useState<string | undefined>(highlightJobId);

  // Design-system confirmation dialog state — replaces window.confirm (AGENTS.md §4).
  const [confirmState, setConfirmState] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    danger?: boolean;
    action: () => Promise<void> | void;
  } | null>(null);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    setActiveHighlightJobId(highlightJobId);
  }, [highlightJobId]);

  useEffect(() => {
    if (!activeHighlightJobId) return;

    const handleGlobalClick = () => {
      setActiveHighlightJobId(undefined);
    };

    const timer = setTimeout(() => {
      document.addEventListener('click', handleGlobalClick);
    }, 150);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleGlobalClick);
    };
  }, [activeHighlightJobId]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    setProfileUser(user);
  }, [user]);

  const loadProfileData = async () => {
    setIsLoading(true);
    try {
      const [freshUser, allReviews, allHistory, allJobsList] = await Promise.all([
        getSingleUser(profileUser.id).catch(err => {
          console.error('Error fetching fresh profile user:', err);
          return null;
        }),
        getReviews().catch(err => {
          console.error('Error fetching reviews:', err);
          return [] as Review[];
        }),
        getJobHistory().catch(err => {
          console.error('Error fetching job history:', err);
          return [] as JobHistoryItem[];
        }),
        getJobs().catch(err => {
          console.error('Error loading jobs:', err);
          return [] as Job[];
        })
      ]);

      if (freshUser) {
        setProfileUser(freshUser);
      }
      if (allJobsList) {
        setAllJobs(allJobsList);
      }

      // Fetch only the user profiles this view actually needs, by known id —
      // Firestore rules deny collection-wide `list` reads on `users` (prevents
      // bulk PII scraping). Applicant profiles are only needed for jobs this
      // profile owner posted (to render the hire/applicants list).
      const neededUserIds = new Set<string>();
      (allJobsList || []).forEach(j => {
        if (j.employerId === profileUser.id) {
          j.applicants.forEach(id => neededUserIds.add(id));
        }
        neededUserIds.add(j.employerId);
        if (j.hiredOperatorId) neededUserIds.add(j.hiredOperatorId);
      });
      getUsersByIds(Array.from(neededUserIds)).then(setAllUsers).catch(err => {
        console.error('Error fetching users by id:', err);
      });

      // Received Reviews
      const targetUserJobIds = new Set<string>();
      for (const j of allJobsList || []) {
        if (profileUser.type === 'operator' && j.hiredOperatorId === profileUser.id) {
          targetUserJobIds.add(j.id);
        } else if (profileUser.type === 'employer' && j.employerId === profileUser.id) {
          targetUserJobIds.add(j.id);
        }
      }

      const reviews = allReviews.filter(r => {
        if (profileUser.id === 'user_op_unreliable') {
          return r.id.includes('unreliable');
        }
        if (r.id.includes('unreliable')) return false;

        if (!targetUserJobIds.has(r.jobId)) return false;
        if (r.reviewerType === profileUser.type) return false;
        if (r.reviewerId === profileUser.id) return false;
        return true;
      });

      const sortedReceived = reviews.sort((a, b) => 
        parseReviewDateToTimestamp(b.createdAt) - parseReviewDateToTimestamp(a.createdAt)
      );
      setDisplayReviews(sortedReceived);

      // Given Reviews
      const writtenReviews = allReviews.filter(r => {
        if (profileUser.id === 'user_op_unreliable') {
          return false;
        }
        if (r.id.includes('unreliable')) return false;
        return r.reviewerId === profileUser.id;
      });

      const sortedGiven = writtenReviews.sort((a, b) => 
        parseReviewDateToTimestamp(b.createdAt) - parseReviewDateToTimestamp(a.createdAt)
      );
      setGivenReviews(sortedGiven);

      // Job History
      const isDemoUnreliable = profileUser.id === 'user_op_unreliable';
      const histItems = allHistory.filter(h => {
        if (isDemoUnreliable) {
          return h.id.includes('unreliable');
        }
        return h.role === profileUser.type && !h.id.includes('unreliable');
      });
      setHistoryItems(histItems);

      // Sent Applications
      const sentApps = (allJobsList || []).filter(j => 
        j.applicants.includes(profileUser.id) || j.hiredOperatorId === profileUser.id
      );
      setSentApplications(sentApps);

      // Posted Jobs
      const posted = (allJobsList || []).filter(j => 
        j.employerId === profileUser.id
      );
      setPostedJobs(posted);
    } catch (err) {
      console.error('Error loading profile data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadProfileData();
  }, [profileUser.id]);

  useEffect(() => {
    if (activeHighlightJobId && activeTab === 'applications' && driverJobs.length > 0) {
      const timer = setTimeout(() => {
        const element = document.getElementById(`job-card-${activeHighlightJobId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [activeHighlightJobId, activeTab, driverJobs]);

  useEffect(() => {
    const isModalOpen = showEdit || !!activeReviewJob || !!editingReview || !!editingJob;
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showEdit, activeReviewJob, editingReview, editingJob]);

  // Hiring is the single biggest state change in the system (open → completed,
  // other applicants dropped) — it gets a confirmation step like delete does.
  const handleHireOperator = (jobId: string, operatorId: string) => {
    const op = allUsers.find(u => u.id === operatorId);
    setConfirmState({
      title: 'Жолоочийг ажилд сонгох уу?',
      message: `${op ? `«${op.fullName}»-ийг` : 'Энэ жолоочийг'} сонгосноор зар нээлттэй жагсаалтаас хасагдаж, бусад хүсэлтүүд хүчингүй болно.`,
      confirmLabel: 'Тийм, сонгох',
      action: async () => {
        try {
          const success = await hireOperator(jobId, operatorId);
          if (success) {
            setSuccess('Жолоочийг ажилд амжилттай томиллоо. Гэрээ идэвхжлээ.');
            setTimeout(() => setSuccess(''), 4500);
            await loadProfileData();
          }
        } catch (err) {
          console.error('Error hiring operator:', err);
          setErrorMsg('Алдаа гарлаа. Дахин оролдоно уу.');
          setTimeout(() => setErrorMsg(''), 4000);
        } finally {
          setConfirmState(null);
        }
      },
    });
  };

  const handleCancelHiring = (jobId: string) => {
    setConfirmState({
      title: 'Сонгосон жолоочийг цуцлах уу?',
      message: 'Сонголт цуцлагдаж, зар буцаад нээлттэй төлөвт шилжинэ.',
      confirmLabel: 'Тийм, цуцлах',
      danger: true,
      action: async () => {
        try {
          const success = await cancelHiring(jobId);
          if (success) {
            setSuccess('Зарын сонгосон жолоочийг амжилттай цуцаллаа. Зар буцаж нээлттэй төлөвт шилжлээ.');
            setTimeout(() => setSuccess(''), 4500);
            await loadProfileData();
          }
        } catch (err) {
          console.error('Error canceling hiring:', err);
          setErrorMsg('Алдаа гарлаа. Дахин оролдоно уу.');
          setTimeout(() => setErrorMsg(''), 4000);
        } finally {
          setConfirmState(null);
        }
      },
    });
  };

  const handleCompleteJobTrigger = async (job: Job) => {
    try {
      const success = await completeJob(job.id);
      if (success) {
        setSuccess('Ажил амжилттай дууслаа. Одоо үнэлгээгээ өгнө үү.');
        setTimeout(() => setSuccess(''), 4500);
        await loadProfileData();
        
        // Set active review job to open review modal immediately!
        const allJobsList = await getJobs();
        const updatedJob = allJobsList.find(j => j.id === job.id);
        if (updatedJob) {
          setActiveReviewJob(updatedJob);
        }
      }
    } catch (err) {
      console.error('Error completing job:', err);
      setErrorMsg('Алдаа гарлаа. Дахин оролдоно уу.');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  const handleDeleteOwnJob = (job: Job) => {
    setConfirmState({
      title: 'Зарыг устгах уу?',
      message: `«${job.title}» зарыг устгасны дараа сэргээх боломжгүй.`,
      confirmLabel: 'Устгах',
      danger: true,
      action: async () => {
        try {
          await deleteJob(job.id);
          await loadProfileData();
          setSuccess('Зарыг амжилттай устгалаа.');
          setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
          console.error(err);
          setErrorMsg('Зарыг устгахад алдаа гарлаа.');
          setTimeout(() => setErrorMsg(''), 4000);
        } finally {
          setConfirmState(null);
        }
      },
    });
  };

  const handleDeleteReview = (reviewId: string) => {
    setConfirmState({
      title: 'Үнэлгээг устгах уу?',
      message: 'Устгасан үнэлгээг сэргээх боломжгүй.',
      confirmLabel: 'Устгах',
      danger: true,
      action: async () => {
        try {
          const success = await deleteReview(reviewId);
          if (success) {
            setSuccess('Үнэлгээг амжилттай устгалаа.');
            setTimeout(() => setSuccess(''), 3000);
            await loadProfileData();
          } else {
            setErrorMsg('Үнэлгээг устгахад алдаа гарлаа.');
            setTimeout(() => setErrorMsg(''), 4000);
          }
        } catch (err) {
          console.error('Error deleting review:', err);
          setErrorMsg('Үнэлгээг устгахад алдаа гарлаа.');
          setTimeout(() => setErrorMsg(''), 4000);
        } finally {
          setConfirmState(null);
        }
      },
    });
  };

  const handleEditReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReview) return;
    setIsEditSubmitting(true);
    setEditError('');
    try {
      const success = await updateReview(editingReview.id, editRating, editComment);
      if (success) {
        setSuccess('Үнэлгээг амжилттай шинэчиллээ.');
        setTimeout(() => setSuccess(''), 3000);
        setEditingReview(null);
        await loadProfileData();
      } else {
        setEditError('Үнэлгээг шинэчлэхэд алдаа гарлаа.');
      }
    } catch (err) {
      console.error('Error updating review:', err);
      setEditError('Системийн алдаа гарлаа.');
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const handleProfileSaved = (updated: User) => {
    setProfileUser(updated);
    setShowEdit(false);
    if (onUpdateCurrentUser) {
      onUpdateCurrentUser(updated);
    }
  };

  const toggleFieldVisibility = async (fieldName: 'emailVisible' | 'phoneVisible' | 'historyVisible' | 'reviewsVisible') => {
    const currentVal = profileUser[fieldName] !== false;
    const updated: User = {
      ...profileUser,
      [fieldName]: !currentVal
    };
    
    // 1. Optimistically update local and global state immediately for instant 60FPS UI toggle
    setProfileUser(updated);
    if (onUpdateCurrentUser) {
      onUpdateCurrentUser(updated);
    }

    let fieldStr = '';
    if (fieldName === 'emailVisible') fieldStr = 'Имэйл хаяг';
    else if (fieldName === 'phoneVisible') fieldStr = 'Утасны дугаар';
    else if (fieldName === 'historyVisible') fieldStr = 'Ажлын түүх';
    else if (fieldName === 'reviewsVisible') fieldStr = 'Сэтгэгдэл, үнэлгээ';

    const actionStr = !currentVal ? 'харагддаг боллоо' : 'нууцлагдлаа';
    setSuccess(`${fieldStr} амжилттай ${actionStr}!`);
    setTimeout(() => setSuccess(''), 3000);

    // 2. Perform network write asynchronously in background
    try {
      await saveSingleUser(updated);
    } catch (err) {
      console.error('Error toggling visibility:', err);
      // Revert state if save fails
      const reverted: User = {
        ...profileUser,
        [fieldName]: currentVal
      };
      setProfileUser(reverted);
      if (onUpdateCurrentUser) {
        onUpdateCurrentUser(reverted);
      }
      setErrorMsg('Тохиргоо хадгалахад алдаа гарлаа. Дахин оролдоно уу.');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  return (
    <div id="profile-view-wrapper" className="max-w-4xl mx-auto p-4 md:p-6 text-[var(--fg)] font-sans space-y-8 relative overflow-hidden">
      {/* Ambient background glow blobs */}

      {/* Back to jobs / breadcrumb */}
      <div className="flex items-center justify-between relative z-10">
        <h2 className="text-xl font-display font-bold tracking-tight text-[var(--fg)] flex items-center space-x-2">
          {defaultTab === 'applications' ? (
            <Bookmark className="w-6 h-6 text-[var(--accent-soft-foreground)]" />
          ) : (
            <Award className="w-6 h-6 text-[var(--accent-soft-foreground)]" />
          )}
          <span>
            {defaultTab === 'applications'
              ? 'Миний хүсэлтүүд, зарууд'
              : (isOwnProfile ? 'Миний хувийн профайл' : `${profileUser.fullName}-ийн профайл`)}
          </span>
        </h2>
        <button
          id="back-to-board-btn"
          onClick={() => {
            if (typeof document !== 'undefined' && document.referrer && document.referrer.includes(window.location.host)) {
              window.history.back();
            } else {
              window.location.href = '/';
            }
          }}
          className="text-[13px] font-semibold min-h-11 bg-[var(--card)] hover:bg-[var(--bg2)] text-[var(--fg)] border border-[var(--border)] hover:border-[var(--border-strong)] px-4 rounded-full transition-all cursor-pointer shadow-sm"
        >
          {defaultTab === 'applications' ? 'Жагсаалт руу буцах' : 'Буцах'}
        </button>
      </div>

      {success && (
        <div className="fixed top-6 right-6 max-w-sm bg-[var(--card)] border border-[var(--accent)] text-[var(--accent-soft-foreground)] p-4 rounded-xl text-sm flex items-center space-x-2.5 animate-fade-in text-left z-50 shadow-md">
          <CheckCircle className="w-4.5 h-4.5 text-[var(--accent-soft-foreground)] shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {errorMsg && (
        <div className="fixed top-6 right-6 max-w-sm bg-[var(--card)] border border-[var(--alert)] text-[var(--alert)] p-4 rounded-xl text-sm flex items-center space-x-2.5 animate-fade-in text-left z-50 shadow-md">
          <X className="w-4.5 h-4.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {activeTab === 'profile' && (
        <>
          {/* Security incompleteness alert banner */}
          {isOwnProfile && !(profileUser.securityQuestion1 && profileUser.securityAnswer1 && profileUser.securityQuestion2 && profileUser.securityAnswer2) && (
        <div className="panel p-4 rounded-2xl border border-[var(--alert)] bg-[rgba(188,79,36,0.06)] space-y-2 relative overflow-hidden z-10 animate-fade-in text-left">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-bold text-[var(--alert)] text-sm flex items-center space-x-2">
              <ShieldAlert className="w-4.5 h-4.5 text-[var(--alert)] shrink-0" />
              <span>Бүртгэлийн аюулгүй байдал дутуу байна!</span>
            </span>
            <button
              onClick={() => setShowEdit(true)}
              className="bg-[var(--alert)] hover:brightness-95 text-white px-4 min-h-10 rounded-full font-bold text-[13px] transition-colors cursor-pointer font-sans"
            >
              Асуулт тохируулах
            </button>
          </div>
          <p className="text-sm text-[var(--muted-foreground)] leading-relaxed font-sans">
            Та аюулгүй байдлын 2 нууц асуултыг тохируулаагүй байна. Нууц асуултыг тохируулснаар нууц үгээ мартсан үедээ утасны дугаараар найдвартай сэргээх боломж бүрдэж, бусад хүмүүс таны хаягийг хулгайлахаас 100% сэргийлнэ.
          </p>
        </div>
      )}

      {/* Main Intro Card */}
      <div className="panel p-6 rounded-xl grid grid-cols-1 md:grid-cols-4 gap-6 relative overflow-hidden shadow-md z-10">
        
        {/* Profile photo and badges */}
        <div className="md:col-span-1 flex flex-col items-center space-y-4">
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={profileUser.profileImage}
              alt={profileUser.fullName}
              className="w-28 h-28 rounded-full border-4 border-[var(--border)] object-cover shadow-md"
              referrerPolicy="no-referrer"
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=U&background=334155&color=fff'; }}
            />
            <div className={`absolute bottom-0 right-1 px-3 py-0.5 rounded-full text-xs font-bold font-sans text-[var(--accent-foreground)] ${
              profileUser.rating >= 4.5 ? 'bg-[var(--verify)]' : profileUser.rating >= 3.5 ? 'bg-[var(--accent)]' : 'bg-[var(--alert)]'
            }`}>
              {profileUser.type === 'operator' ? 'Жолооч' : 'Захиалагч'}
            </div>
          </div>

          <div className="text-center">
            <h3 className="text-base font-bold text-[var(--fg)] leading-tight">
              {profileUser.fullName}
              {profileUser.companyName && (
                <span className="block text-xs font-semibold text-[var(--accent-soft-foreground)] mt-1">{profileUser.companyName}</span>
              )}
            </h3>
            <p className="text-xs text-[var(--muted-foreground)] mt-1 font-mono">ID: {profileUser.id}</p>
          </div>

          {/* Rating overview */}
          <div className="bg-[var(--card)] border border-[var(--border)] p-3.5 rounded-xl w-full text-center">
            <p className="text-xs text-[var(--muted-foreground)] font-medium">Дундаж үнэлгээ</p>
            <div className="flex items-center justify-center space-x-1 mt-1">
              <Star className="w-5 h-5 text-[var(--verify)] fill-[var(--verify)]" />
              <span className="text-2xl font-bold font-mono text-[var(--fg)]">{(profileUser.rating ?? 5).toFixed(1)}</span>
            </div>
            <p className="text-xs text-[var(--muted-foreground)] mt-1.5 font-semibold">{displayReviews.length} удаагийн ажил дуусгасан</p>
          </div>
        </div>

        {/* Detailed details */}
        <div className="md:col-span-3 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <span className="bg-[var(--bg2)] px-3.5 py-1.5 rounded-full text-[13px] text-[var(--muted-foreground)] flex items-center space-x-1.5">
                <Calendar className="w-4 h-4 text-[var(--muted-foreground)]" />
                <span>Гишүүн болсон: {profileUser.createdAt}</span>
              </span>
              {profileUser.type === 'operator' && (
                <span className="bg-[var(--accent-soft)] px-3.5 py-1.5 rounded-full text-[13px] text-[var(--accent-soft-foreground)] font-sans font-medium">
                  Туршлага: {profileUser.experienceYears || 0} жил техник барьсан
                </span>
              )}
            </div>

            {/* Toggles bar for granular privacy - visible if isOwnProfile */}
            {isOwnProfile && (
              <PrivacyTogglesBar profileUser={profileUser} onToggle={toggleFieldVisibility} />
            )}

            <div className="text-sm space-y-2.5 border-t border-[var(--border)] pt-4">
              {(profileUser.emailVisible !== false || isOwnProfile) ? (
                <div className="flex items-center space-x-2 text-[var(--muted-foreground)]">
                  <Mail className="w-4 h-4 text-[var(--accent-soft-foreground)] shrink-0" />
                  <span className="font-semibold text-[var(--muted-foreground)]">Имэйл хаяг:</span>
                  <span className="select-all font-sans text-[var(--fg)]">{profileUser.email ? profileUser.email : 'бөглөөгүй'}</span>
                  {isOwnProfile && profileUser.emailVisible === false && (
                    <span className="text-xs bg-[var(--bg2)] text-[var(--muted-foreground)] border border-[var(--border)] px-2 py-0.5 rounded font-medium ml-2 shrink-0">Бусдад харагдахгүй</span>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-[var(--muted-foreground)]">
                  <Mail className="w-4 h-4 text-[var(--muted-foreground)] shrink-0" />
                  <span className="font-semibold text-[var(--muted-foreground)]">Имэйл хаяг:</span>
                  <span className="italic text-xs text-[var(--muted-foreground)] font-sans">(Нууцалсан)</span>
                </div>
              )}

              {(profileUser.phoneVisible !== false || isOwnProfile) ? (
                <div className="flex items-center space-x-2 text-[var(--muted-foreground)]">
                  <Phone className="w-4 h-4 text-[var(--accent-soft-foreground)] shrink-0" />
                  <span className="font-semibold text-[var(--muted-foreground)]">Утас:</span>
                  <span className="select-all font-mono font-bold text-[var(--accent-soft-foreground)]">{profileUser.phone}</span>
                  {isOwnProfile && profileUser.phoneVisible === false && (
                    <span className="text-xs bg-[var(--bg2)] text-[var(--muted-foreground)] border border-[var(--border)] px-2 py-0.5 rounded font-medium ml-2 shrink-0">Бусдад харагдахгүй</span>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-[var(--muted-foreground)]">
                  <Phone className="w-4 h-4 text-[var(--muted-foreground)] shrink-0" />
                  <span className="font-semibold text-[var(--muted-foreground)]">Утас:</span>
                  <span className="italic text-xs text-[var(--muted-foreground)] font-sans">(Нууцалсан)</span>
                </div>
              )}

              {profileUser.phone2 && ((profileUser.phoneVisible !== false || isOwnProfile) ? (
                <div className="flex items-center space-x-2 text-[var(--muted-foreground)]">
                  <Phone className="w-4 h-4 text-[var(--accent-soft-foreground)] shrink-0 opacity-80" />
                  <span className="font-semibold text-[var(--muted-foreground)]">Утас 2:</span>
                  <span className="select-all font-mono font-bold text-[var(--accent-soft-foreground)] opacity-90">{profileUser.phone2}</span>
                </div>
              ) : null)}

              <div className="flex items-center space-x-2 text-[var(--muted-foreground)]">
                <MapPin className="w-4 h-4 text-[var(--accent-soft-foreground)] shrink-0" />
                <span className="font-semibold text-[var(--muted-foreground)]">Хаяг:</span>
                <span className="text-[var(--fg)]">{profileUser.address}</span>
              </div>
            </div>

            <div className="border-t border-[var(--border)] pt-4">
              <h4 className="text-[13px] font-semibold text-[var(--muted-foreground)] mb-1.5">Танилцуулга ба нэмэлт мэдээлэл:</h4>
              <p className="text-[15px] leading-relaxed text-[var(--fg)] bg-[var(--bg2)] p-4 rounded-xl whitespace-pre-line">
                {profileUser.bio}
              </p>
            </div>

            {profileUser.type === 'operator' && profileUser.machineTypes && profileUser.machineTypes.length > 0 && (
              <div className="pt-2">
                <h4 className="text-[13px] font-semibold text-[var(--muted-foreground)] mb-2">Мэргэшсэн механизмын төрлүүд:</h4>
                <div className="flex flex-wrap gap-2">
                  {profileUser.machineTypes.map((m, idx) => (
                    <span key={idx} className="bg-[rgba(35,121,82,0.08)] px-3.5 py-1.5 rounded-full text-[13px] text-[var(--verify)] font-sans font-medium">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Edit profiles button */}
          {isOwnProfile && (
            <div className="flex justify-end pt-4 md:pt-2">
              <button
                id="open-edit-profile-modal"
                onClick={() => setShowEdit(true)}
                className="bg-[var(--accent)] hover:opacity-90 text-[var(--accent-foreground)] font-semibold text-sm min-h-12 px-6 rounded-full transition-all cursor-pointer shadow-sm"
              >
                Хувийн мэдээлэл засах
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Grid: Job history & Ratings list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
        
        {/* Verification lists of Jobs */}
        <div className="space-y-4">
          <h3 className="text-[13px] font-bold text-[var(--muted-foreground)] border-b border-[var(--border)] pb-2.5 flex items-center space-x-2">
            <CheckCircle className="w-4.5 h-4.5 text-[var(--accent-soft-foreground)]" />
            <span>Баталгаажсан ажлын түүх ({profileUser.historyVisible !== false || isOwnProfile ? historyItems.length : 0})</span>
            {isOwnProfile && profileUser.historyVisible === false && (
              <span className="text-xs bg-[var(--bg2)] text-[var(--muted-foreground)] border border-[var(--border)] px-2 py-0.5 rounded font-normal normal-case ml-2 shrink-0">Бусдад харагдахгүй</span>
            )}
          </h3>

          {(profileUser.historyVisible !== false || isOwnProfile) ? (
            historyItems.length === 0 ? (
              <div className="panel p-6 rounded-xl border border-[var(--border)] text-center text-xs text-[var(--muted-foreground)] font-sans">
                Ажлын бүртгэлийн түүх байхгүй байна.
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {historyItems.map((item) => (
                  <div key={item.id} className="panel p-4 rounded-xl border border-[var(--border)] hover:border-[var(--border)] space-y-2 relative overflow-hidden group">
                    <div className="flex justify-between items-start">
                      <h4 className="text-sm font-bold text-[var(--fg)] block max-w-[70%] truncate">{item.title}</h4>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-sans ${
                        item.status === 'completed' ? 'bg-[rgba(35,121,82,0.08)] text-[var(--verify)]' : 'bg-[var(--accent-soft)] text-[var(--accent-soft-foreground)]'
                      }`}>
                        {item.status === 'completed' ? 'Гүйцэтгэсэн' : 'Идэвхтэй'}
                      </span>
                    </div>

                    <div className="flex justify-between text-[13px] text-[var(--muted-foreground)] font-sans">
                      <span>Хамтарсан тал:</span>
                      <span className="font-medium text-[var(--fg)]">{item.partnerName}</span>
                    </div>

                    <div className="flex justify-between text-[13px] text-[var(--muted-foreground)] font-sans">
                      <span>Хугацаа:</span>
                      <span>{item.dateRange}</span>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="panel p-6 rounded-xl border border-[var(--border)] text-center text-xs text-[var(--muted-foreground)] italic font-sans">
              Хэрэглэгч ажлын түүхийн мэдээллээ нууцалсан байна.
            </div>
          )}
        </div>

        {/* Uncensored reviews written for this user */}
        <ReceivedReviewsList
          reviews={displayReviews}
          reviewsVisible={profileUser.reviewsVisible !== false}
          isOwnProfile={isOwnProfile}
        />

      </div>

      {/* Reviews I Have Given section */}
      {isOwnProfile && (
        <GivenReviewsList
          givenReviews={givenReviews}
          allJobs={allJobs}
          onEditReview={(rev) => {
            setEditingReview(rev);
            setEditRating(rev.rating);
            setEditComment(rev.comment);
          }}
          onDeleteReview={handleDeleteReview}
        />
      )}
        </>
      )}

      {activeTab === 'applications' && (
        <ApplicationsTab
          sentApplications={sentApplications}
          postedJobs={postedJobs}
          applicationsSubTab={applicationsSubTab}
          onSubTabChange={setApplicationsSubTab}
          isLoading={isLoading}
          activeHighlightJobId={activeHighlightJobId}
          profileUser={profileUser}
          allUsers={allUsers}
          reviews={displayReviews}
          isOwnProfile={isOwnProfile}
          onReview={setActiveReviewJob}
          onHire={handleHireOperator}
          onComplete={handleCompleteJobTrigger}
          onCancelHiring={handleCancelHiring}
          onEdit={setEditingJob}
          onDelete={handleDeleteOwnJob}
        />
      )}

      {/* Edit Modal Popup */}
      {showEdit && (
        <ProfileEditModal
          user={profileUser}
          onClose={() => setShowEdit(false)}
          onSave={handleProfileSaved}
        />
      )}

      {/* Review Modal Popup */}
      {activeReviewJob && (
        <ReviewModal
          jobId={activeReviewJob.id}
          jobTitle={activeReviewJob.title}
          targetUserId={activeReviewJob.employerId}
          targetUserName={activeReviewJob.employerName}
          reviewerId={profileUser.id}
          reviewerName={profileUser.fullName}
          reviewerType={profileUser.type}
          onClose={() => setActiveReviewJob(null)}
          onSuccess={async () => {
            setActiveReviewJob(null);
            await loadProfileData();
            setSuccess('Сэтгэгдэл, үнэлгээ амжилттай бүртгэгдлээ!');
            setTimeout(() => setSuccess(''), 3000);
          }}
        />
      )}

      {editingJob && (
        <JobPostModal
          employerId={profileUser.id}
          employerName={profileUser.companyName || profileUser.fullName}
          employerRating={profileUser.rating}
          jobToEdit={editingJob}
          onClose={() => setEditingJob(null)}
          onSuccess={async () => {
            setEditingJob(null);
            await loadProfileData();
            setSuccess('Ажлын зар амжилттай засагдаж шинэчлэгдлээ!');
            setTimeout(() => setSuccess(''), 3000);
          }}
        />
      )}

      {/* Edit Review Modal */}
      {editingReview && (
        <div 
          id="edit-review-modal-backdrop" 
          onClick={() => setEditingReview(null)}
          className="fixed inset-0 bg-[var(--fg)]/40 flex items-center justify-center p-4 z-50 animate-fade-in"
        >
          <div
            id="edit-review-modal-container"
            onClick={(e) => e.stopPropagation()}
            className="bg-[var(--card)] border border-[var(--border-strong)] max-w-md w-full rounded-2xl overflow-hidden shadow-md relative text-left animate-fade-in"
          >
            {/* Header */}
            <div className="flex justify-between items-center border-b border-[var(--border)] px-6 py-4">
              <h3 className="text-base font-display font-bold text-[var(--fg)]">Үнэлгээ засах</h3>
              <button
                type="button"
                onClick={() => setEditingReview(null)}
                aria-label="Хаах"
                className="min-w-11 min-h-11 flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--fg)] hover:bg-[var(--bg2)] rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleEditReviewSubmit} className="p-6 space-y-4">
              <div className="bg-[var(--bg2)] p-4 rounded-xl space-y-1">
                <span className="text-[13px] text-[var(--muted-foreground)] block font-medium">Ажлын нэр</span>
                <p className="text-sm font-semibold text-[var(--fg)]">{editingReview.jobTitle}</p>
              </div>

              {/* Rating selection */}
              <div className="flex flex-col items-center py-3 space-y-2 bg-[var(--bg2)] rounded-xl">
                <span className="text-[13px] text-[var(--muted-foreground)] font-medium">Үнэлгээ</span>
                <div className="flex items-center space-x-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setEditRating(star)}
                      onMouseEnter={() => setEditHoverRating(star)}
                      onMouseLeave={() => setEditHoverRating(null)}
                      className="p-1 focus:outline-none transition-transform hover:scale-110 cursor-pointer"
                    >
                      <Star
                        className={`w-7 h-7 transition-colors ${
                          star <= (editHoverRating ?? editRating)
                            ? 'text-[var(--accent-soft-foreground)] fill-[var(--accent)]'
                            : 'text-[var(--muted-foreground)]'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-sm font-bold text-[var(--accent-soft-foreground)] font-sans">
                  {editRating === 5 ? '5.0 / Маш сайн' :
                   editRating === 4 ? '4.0 / Сайн' :
                   editRating === 3 ? '3.0 / Дундаж' :
                   editRating === 2 ? '2.0 / Хангалтгүй' : '1.0 / Маш муу'}
                </span>
              </div>

              {/* Comment field */}
              <div className="space-y-1.5">
                <label htmlFor="edit-review-comment" className="block text-[13px] text-[var(--muted-foreground)] font-medium">Сэтгэгдэл, тайлбар</label>
                <textarea
                  id="edit-review-comment"
                  required
                  rows={4}
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  placeholder="Хамтран ажилласан сэтгэгдлээ энд бичнэ үү..."
                  className="block w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--bg)] text-[var(--fg)] text-base focus:ring-2 focus:ring-[var(--accent-soft)] focus:border-[var(--fg)] focus:outline-none placeholder-[var(--muted-foreground)] font-sans"
                />
              </div>

              {/* Error */}
              {editError && (
                <div className="text-sm text-[var(--accent-soft-foreground)] bg-[var(--accent-soft)] border border-[var(--accent)] p-2.5 rounded-lg text-center font-semibold">
                  {editError}
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingReview(null)}
                  className="flex-1 min-h-12 bg-[var(--card)] hover:bg-[var(--bg2)] border border-[var(--border)] hover:border-[var(--border-strong)] text-[var(--fg)] text-sm font-semibold px-4 rounded-full transition-colors cursor-pointer text-center"
                >
                  Цуцлах
                </button>
                <button
                  type="submit"
                  disabled={isEditSubmitting}
                  className="flex-1 min-h-12 bg-[var(--accent)] hover:opacity-90 disabled:opacity-50 text-[var(--accent-foreground)] text-[15px] font-semibold px-4 rounded-full transition-colors cursor-pointer text-center"
                >
                  {isEditSubmitting ? 'Хадгалж байна...' : 'Хадгалах'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Design-system confirmation dialog (delete job / cancel hiring / delete review) */}
      {confirmState && (
        <ConfirmModal
          title={confirmState.title}
          message={confirmState.message}
          confirmLabel={confirmState.confirmLabel}
          danger={confirmState.danger}
          onConfirm={confirmState.action}
          onClose={() => setConfirmState(null)}
        />
      )}

    </div>
  );
}
