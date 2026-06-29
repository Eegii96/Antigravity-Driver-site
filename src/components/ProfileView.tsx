'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Review, JobHistoryItem, Job } from '../types';
import { getReviews, getJobHistory, saveSingleUser, getSingleUser, getJobs, getUsers, hireOperator, completeJob, deleteJob, cancelHiring, deleteReview, updateReview } from '../lib/db';
import { Star, ShieldAlert, Award, Phone, Mail, MapPin, Calendar, CheckCircle, Clock, DollarSign, Briefcase, Users, X, Edit, Trash2, Bookmark } from 'lucide-react';
import ProfileEditModal from './ProfileEditModal';
import ReviewModal from './ReviewModal';
import JobPostModal from './JobPostModal';
import { formatDate, formatReviewDate, parseReviewDateToTimestamp } from '../lib/job-format';
import GivenReviewsList from './profile/GivenReviewsList';
import ReceivedReviewsList from './profile/ReceivedReviewsList';
import PrivacyTogglesBar from './profile/PrivacyTogglesBar';

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
  const router = useRouter();
  const [showEdit, setShowEdit] = useState<boolean>(false);
  const [profileUser, setProfileUser] = useState<User>(user);
  
  // Asynchronous state for reviews and history
  const [displayReviews, setDisplayReviews] = useState<Review[]>([]);
  const [historyItems, setHistoryItems] = useState<JobHistoryItem[]>([]);
  const [success, setSuccess] = useState<string>('');

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
  const [activeTab, setActiveTab] = useState<'profile' | 'applications'>(defaultTab || 'profile');
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

  useEffect(() => {
    setProfileUser(user);
  }, [user]);

  const loadProfileData = async () => {
    setIsLoading(true);
    try {
      const [freshUser, allReviews, allHistory, usersList, allJobsList] = await Promise.all([
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
        getUsers().catch(err => {
          console.error('Error fetching users:', err);
          return [] as User[];
        }),
        getJobs().catch(err => {
          console.error('Error loading jobs:', err);
          return [] as Job[];
        })
      ]);

      if (freshUser) {
        setProfileUser(freshUser);
      }
      if (usersList) {
        setAllUsers(usersList);
      }
      if (allJobsList) {
        setAllJobs(allJobsList);
      }

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

  const handleHireOperator = async (jobId: string, operatorId: string) => {
    try {
      const success = await hireOperator(jobId, operatorId);
      if (success) {
        setSuccess('🤝 Жолоочийг ажилд амжилттай томиллоо. Гэрээ идэвхжлээ.');
        setTimeout(() => setSuccess(''), 4500);
        await loadProfileData();
      }
    } catch (err) {
      console.error('Error hiring operator:', err);
      alert('Алдаа гарлаа. Дахин оролдоно уу.');
    }
  };

  const handleCancelHiring = async (jobId: string) => {
    try {
      if (window.confirm('Та сонгосон жолоочийг цуцалж, зарыг буцааж нээлттэй болгохдоо итгэлтэй байна уу?')) {
        const success = await cancelHiring(jobId);
        if (success) {
          setSuccess('Зарын сонгосон жолоочийг амжилттай цуцаллаа. Зар буцаж нээлттэй төлөвт шилжлээ.');
          setTimeout(() => setSuccess(''), 4500);
          await loadProfileData();
        }
      }
    } catch (err) {
      console.error('Error canceling hiring:', err);
      alert('Алдаа гарлаа. Дахин оролдоно уу.');
    }
  };

  const handleCompleteJobTrigger = async (job: Job) => {
    try {
      const success = await completeJob(job.id);
      if (success) {
        setSuccess('✓ Ажил амжилттай дууслаа. Одоо үнэлгээгээ өгнө үү.');
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
      alert('Алдаа гарлаа. Дахин оролдоно уу.');
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (window.confirm('Та энэ үнэлгээг устгахдаа итгэлтэй байна уу?')) {
      try {
        const success = await deleteReview(reviewId);
        if (success) {
          setSuccess('Үнэлгээг амжилттай устгалаа.');
          setTimeout(() => setSuccess(''), 3000);
          await loadProfileData();
        } else {
          alert('Үнэлгээг устгаход алдаа гарлаа.');
        }
      } catch (err) {
        console.error('Error deleting review:', err);
        alert('Үнэлгээг устгаход алдаа гарлаа.');
      }
    }
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
      alert('Тохиргоо хадгалахад алдаа гарлаа. Дахин оролдоно уу.');
    }
  };

  return (
    <div id="profile-view-wrapper" className="max-w-4xl mx-auto p-4 md:p-6 text-[var(--fg)] font-sans space-y-8 relative overflow-hidden">
      {/* Ambient background glow blobs */}

      {/* Back to jobs / breadcrumb */}
      <div className="flex items-center justify-between relative z-10">
        <h2 className="text-xl font-bold tracking-tight text-[var(--fg)] flex items-center space-x-2">
          {defaultTab === 'applications' ? (
            <Bookmark className="w-6 h-6 text-[var(--accent-soft-foreground)] animate-pulse-soft" />
          ) : (
            <Award className="w-6 h-6 text-[var(--accent-soft-foreground)] animate-pulse-soft" />
          )}
          <span>
            {defaultTab === 'applications'
              ? 'Миний хүсэлтүүд & Зарууд'
              : (isOwnProfile ? 'Миний Хувийн Профайл' : `${profileUser.fullName}-ийн Профайл`)}
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
          className="text-xs bg-[var(--color-glass-bg)] hover:bg-[rgba(255,255,255,0.07)] text-[var(--accent-soft-foreground)] border border-[var(--color-glass-border)] px-4 py-2 rounded-md transition-all cursor-pointer shadow-md"
        >
          {defaultTab === 'applications' ? 'Жагсаалт руу буцах' : 'Буцах'}
        </button>
      </div>

      {success && (
        <div className="fixed top-6 right-6 max-w-sm bg-[var(--color-glass-bg)] border border-[var(--accent)] text-[var(--accent-soft-foreground)] p-4 rounded-md text-xs flex items-center space-x-2.5 animate-fade-in text-left z-50 shadow-md">
          <CheckCircle className="w-4.5 h-4.5 text-[var(--accent-soft-foreground)] shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {activeTab === 'profile' && (
        <>
          {/* Security incompleteness alert banner */}
          {isOwnProfile && !(profileUser.securityQuestion1 && profileUser.securityAnswer1 && profileUser.securityQuestion2 && profileUser.securityAnswer2) && (
        <div className="panel p-4 rounded-md border border-[var(--alert)] bg-[rgba(255,92,40,0.1)] text-xs space-y-2 relative overflow-hidden z-10 animate-fade-in text-left">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[var(--alert)] flex items-center space-x-2">
              <ShieldAlert className="w-4.5 h-4.5 text-[var(--alert)] shrink-0 animate-pulse" />
              <span>🔒 БҮРТГЭЛИЙН АЮУЛГҮЙ БАЙДАЛ ДУТУУ БАЙНА!</span>
            </span>
            <button
              onClick={() => setShowEdit(true)}
              className="bg-[var(--alert)] hover:brightness-95 text-[var(--muted-foreground)] px-3.5 py-1 rounded-lg font-bold text-[10.5px] transition-colors cursor-pointer font-sans"
            >
              Асуулт тохируулах (Хамгаалах)
            </button>
          </div>
          <p className="text-[11px] text-[var(--muted-foreground)] leading-relaxed font-sans">
            Та аюулгүй байдлын 2 нууц асуултыг тохируулаагүй байна. Нууц асуултыг тохируулснаар нууц үгээ мартсан үедээ утасны дугаараар найдвартай сэргээх боломж бүрдэж, бусад хүмүүс таны хаягийг хулгайлахаас 100% сэргийлнэ.
          </p>
        </div>
      )}

      {/* Main Intro Card */}
      <div className="panel p-6 rounded-md grid grid-cols-1 md:grid-cols-4 gap-6 relative overflow-hidden shadow-md z-10">
        
        {/* Profile photo and badges */}
        <div className="md:col-span-1 flex flex-col items-center space-y-4">
          <div className="relative">
            <img
              src={profileUser.profileImage}
              alt={profileUser.fullName}
              className="w-28 h-28 rounded-full border-4 border-[var(--color-glass-border)] object-cover shadow-md drop-shadow-[0_0_10px_rgba(16,185,129,0.2)]"
              referrerPolicy="no-referrer"
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=U&background=334155&color=fff'; }}
            />
            <div className={`absolute bottom-0 right-1 px-3 py-0.5 rounded-full text-[8px] font-bold font-mono text-[var(--accent-foreground)] tracking-wider ${
              profileUser.rating >= 4.5 ? 'bg-[var(--verify)]' : profileUser.rating >= 3.5 ? 'bg-[var(--accent)]' : 'bg-[var(--alert)]'
            }`}>
              {profileUser.type === 'operator' ? 'ЖОЛООЧ' : 'ЗАХИАЛАГЧ'}
            </div>
          </div>

          <div className="text-center">
            <h3 className="text-base font-bold text-[var(--fg)] leading-tight">
              {profileUser.fullName}
              {profileUser.companyName && (
                <span className="block text-xs font-semibold text-[var(--accent-soft-foreground)] mt-1">{profileUser.companyName}</span>
              )}
            </h3>
            <p className="text-[10px] text-[var(--muted-foreground)] mt-1 font-mono">ID: {profileUser.id}</p>
          </div>

          {/* Rating overview */}
          <div className="bg-[var(--color-glass-bg)] border border-[var(--color-glass-border)] p-3.5 rounded-md w-full text-center">
            <p className="text-[11px] text-[var(--muted-foreground)] font-medium">Дундаж үнэлгээ</p>
            <div className="flex items-center justify-center space-x-1 mt-1">
              <Star className="w-5 h-5 text-[var(--accent-soft-foreground)] fill-[var(--accent)] drop-shadow-[0_0_5px_rgba(245,158,11,0.4)]" />
              <span className="text-2xl font-black font-mono text-[var(--fg)]">{(profileUser.rating ?? 5).toFixed(1)}</span>
            </div>
            <p className="text-[10px] text-[var(--muted-foreground)] mt-1.5 font-semibold">{displayReviews.length} удаагийн ажил дуусгасан</p>
          </div>
        </div>

        {/* Detailed details */}
        <div className="md:col-span-3 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <span className="bg-[rgba(255,255,255,0.04)] px-3.5 py-1.5 rounded-md text-xs text-[var(--muted-foreground)] border border-[var(--color-glass-border)] flex items-center space-x-1.5 shadow-sm">
                <Calendar className="w-4 h-4 text-[var(--muted-foreground)]" />
                <span>Гишүүн болсон: {profileUser.createdAt}</span>
              </span>
              {profileUser.type === 'operator' && (
                <span className="bg-[var(--accent-soft)] px-3.5 py-1.5 rounded-md text-xs text-[var(--accent-soft-foreground)] border border-[var(--accent)] font-mono shadow-sm">
                  Туршлага: {profileUser.experienceYears || 0} жил техник барьсан
                </span>
              )}
            </div>

            {/* Toggles bar for granular privacy - visible if isOwnProfile */}
            {isOwnProfile && (
              <PrivacyTogglesBar profileUser={profileUser} onToggle={toggleFieldVisibility} />
            )}

            <div className="text-xs space-y-2.5 border-t border-[var(--color-glass-border)] pt-4">
              {(profileUser.emailVisible !== false || isOwnProfile) ? (
                <div className="flex items-center space-x-2 text-[var(--muted-foreground)]">
                  <Mail className="w-4 h-4 text-[var(--accent-soft-foreground)] shrink-0" />
                  <span className="font-semibold text-[var(--muted-foreground)]">Имэйл хаяг:</span>
                  <span className="select-all font-sans text-[var(--fg)]">{profileUser.email ? profileUser.email : 'бөглөөгүй'}</span>
                  {isOwnProfile && profileUser.emailVisible === false && (
                    <span className="text-[10px] bg-[var(--bg2)] text-[var(--muted-foreground)] border border-[var(--border)] px-2 py-0.5 rounded font-medium ml-2 shrink-0">Бусдад харагдахгүй</span>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-[var(--muted-foreground)]">
                  <Mail className="w-4 h-4 text-[var(--muted-foreground)] shrink-0" />
                  <span className="font-semibold text-[var(--muted-foreground)]">Имэйл хаяг:</span>
                  <span className="italic text-[10px] text-[var(--muted-foreground)] font-sans">(Нууцалсан)</span>
                </div>
              )}

              {(profileUser.phoneVisible !== false || isOwnProfile) ? (
                <div className="flex items-center space-x-2 text-[var(--muted-foreground)]">
                  <Phone className="w-4 h-4 text-[var(--accent-soft-foreground)] shrink-0" />
                  <span className="font-semibold text-[var(--muted-foreground)]">Утас:</span>
                  <span className="select-all font-mono font-bold text-[var(--accent-soft-foreground)]">{profileUser.phone}</span>
                  {isOwnProfile && profileUser.phoneVisible === false && (
                    <span className="text-[10px] bg-[var(--bg2)] text-[var(--muted-foreground)] border border-[var(--border)] px-2 py-0.5 rounded font-medium ml-2 shrink-0">Бусдад харагдахгүй</span>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-[var(--muted-foreground)]">
                  <Phone className="w-4 h-4 text-[var(--muted-foreground)] shrink-0" />
                  <span className="font-semibold text-[var(--muted-foreground)]">Утас:</span>
                  <span className="italic text-[10px] text-[var(--muted-foreground)] font-sans">(Нууцалсан)</span>
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

            <div className="border-t border-[var(--color-glass-border)] pt-4">
              <h4 className="text-xs font-bold text-[var(--muted-foreground)] mb-1.5">Танилцуулга ба Нэмэлт мэдээлэл:</h4>
              <p className="text-xs leading-relaxed text-[var(--muted-foreground)] bg-[rgba(255,255,255,0.04)] p-4 rounded-md border border-[var(--color-glass-border)] whitespace-pre-line">
                {profileUser.bio}
              </p>
            </div>

            {profileUser.type === 'operator' && profileUser.machineTypes && profileUser.machineTypes.length > 0 && (
              <div className="pt-2">
                <h4 className="text-xs font-bold text-[var(--muted-foreground)] mb-2">Мэргэшсэн механизмын төрлүүд:</h4>
                <div className="flex flex-wrap gap-2">
                  {profileUser.machineTypes.map((m, idx) => (
                    <span key={idx} className="bg-[rgba(255,255,255,0.04)] px-3.5 py-1.5 rounded-md text-xs text-[var(--verify)] font-mono border border-[var(--color-glass-border)] shadow-sm">
                      🚜 {m}
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
                className="bg-[var(--accent)] hover:brightness-95 text-[var(--accent-foreground)] font-bold text-xs py-2 px-5 rounded-md transition-all cursor-pointer shadow-lg "
              >
                Хувийн Мэдээлэл Засах
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Grid: Job history & Ratings list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
        
        {/* Verification lists of Jobs */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-widest border-b border-[var(--color-glass-border)] pb-2.5 flex items-center space-x-2">
            <CheckCircle className="w-4.5 h-4.5 text-[var(--accent-soft-foreground)] drop-shadow-[0_0_5px_rgba(16,185,129,0.2)]" />
            <span>Баталгаажсан Ажлын Түүх ({profileUser.historyVisible !== false || isOwnProfile ? historyItems.length : 0})</span>
            {isOwnProfile && profileUser.historyVisible === false && (
              <span className="text-[9px] bg-[var(--bg2)] text-[var(--muted-foreground)] border border-[var(--border)] px-2 py-0.5 rounded font-normal normal-case ml-2 shrink-0">Бусдад харагдахгүй</span>
            )}
          </h3>

          {(profileUser.historyVisible !== false || isOwnProfile) ? (
            historyItems.length === 0 ? (
              <div className="panel p-6 rounded-md border border-[var(--color-glass-border)] text-center text-xs text-[var(--muted-foreground)] font-sans">
                Ажлын бүртгэлийн түүх байхгүй байна.
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {historyItems.map((item) => (
                  <div key={item.id} className="panel p-4 rounded-md border border-[var(--color-glass-border)] hover:border-[var(--color-glass-border)] space-y-2 relative overflow-hidden group">
                    <div className="flex justify-between items-start">
                      <h4 className="text-xs font-bold text-[var(--fg)] block max-w-[70%] truncate group-hover:text-[var(--verify)] transition-colors">{item.title}</h4>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold font-mono tracking-wide uppercase ${
                        item.status === 'completed' ? 'bg-[rgba(34,211,238,0.15)] text-[#22d3ee] border border-[rgba(34,211,238,0.3)]' : 'bg-[var(--accent-soft)] text-[var(--accent-soft-foreground)] border border-[var(--accent)]'
                      }`}>
                        {item.status === 'completed' ? 'Гүйцэтгэсэн' : 'Идэвхтэй'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-[11px] text-[var(--muted-foreground)] font-mono">
                      <span>Хамтарсан тал:</span>
                      <span className="text-[var(--muted-foreground)] font-sans font-medium">{item.partnerName}</span>
                    </div>

                    <div className="flex justify-between text-[11px] text-[var(--muted-foreground)] font-mono">
                      <span>Хугацаа:</span>
                      <span className="text-[var(--muted-foreground)]">{item.dateRange}</span>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="panel p-6 rounded-md border border-[var(--color-glass-border)] text-center text-xs text-[var(--muted-foreground)] italic font-sans">
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
        <div className="space-y-6 animate-fade-in relative z-10 text-left">
          {/* Sub-tabs for Sent Applications vs Posted Jobs */}
          <div className="flex border-b border-[var(--color-glass-border)] space-x-6">
            <button
              onClick={() => setApplicationsSubTab('sent')}
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
              onClick={() => setApplicationsSubTab('posted')}
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
            <div className="panel p-12 rounded-md border border-[var(--color-glass-border)] text-center text-xs text-[var(--muted-foreground)] font-sans flex flex-col items-center justify-center space-y-4">
              <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
              <span>Мэдээллийг ачаалж байна...</span>
            </div>
          ) : driverJobs.length === 0 ? (
            <div className="panel p-12 rounded-md border border-[var(--color-glass-border)] text-center text-xs text-[var(--muted-foreground)] font-sans">
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
                    badgeClass = 'bg-[var(--color-glass-bg)] text-[var(--muted-foreground)] border border-[var(--color-glass-border)]';
                    statusDesc = '❌ Захиалагч энэ заранд өөр жолооч сонгон ажилласан байна. Та дараагийн зар руу хүсэлтээ илгээнэ үү.';
                  }

                  return (
                    <div
                      key={job.id}
                      id={`job-card-${job.id}`}
                      className={`panel p-5 rounded-md transition-all flex flex-col justify-between space-y-4 text-left ${
                        activeHighlightJobId === job.id
                          ? 'highlighted-job-card'
                          : 'border border-[var(--color-glass-border)] hover:border-[var(--color-glass-border)]'
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
                          <div className="w-full h-36 rounded-md overflow-hidden bg-[var(--color-glass-bg)] border border-[var(--color-glass-border)] relative shrink-0">
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
                          <p className="text-[10.5px] text-[var(--muted-foreground)] leading-relaxed italic font-sans bg-[rgba(255,255,255,0.04)] p-2.5 rounded-lg border border-[var(--color-glass-border)]">
                            Нэмэлт: {job.additionalInfo}
                          </p>
                        )}
                        
                        <div className="bg-[var(--color-glass-bg)] p-2.5 rounded-lg border border-[var(--color-glass-border)] flex justify-between items-center text-[10.5px]">
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
                          <span className={`inline-flex px-2.5 py-0.5 rounded text-[9.5px] font-bold font-mono tracking-wide uppercase ${badgeClass}`}>
                            {statusText}
                          </span>
                          <p className="text-[11px] text-[var(--muted-foreground)] leading-relaxed bg-[rgba(255,255,255,0.04)] p-3 rounded-lg border border-[var(--color-glass-border)] font-sans">
                            {statusDesc}
                          </p>
                        </div>

                        {/* Step Indicator for active jobs */}
                        {isHired && job.status === 'in_progress' && (
                          <div className="pt-2">
                            <span className="text-[10px] text-[var(--muted-foreground)] block uppercase font-mono tracking-wider mb-2">Ажлын явцын төлөв:</span>
                            <div className="flex items-center space-x-2 text-xs">
                              <div className="flex items-center text-[var(--accent-soft-foreground)]">
                                <span className="h-4 w-4 rounded-full bg-[var(--accent)] text-[var(--muted-foreground)] flex items-center justify-center text-[9px] font-bold mr-1.5">1</span>
                                <span>Сонгогдсон</span>
                              </div>
                              <span className="text-[var(--muted-foreground)]">➔</span>
                              <div className="flex items-center text-[var(--accent-soft-foreground)] font-bold animate-pulse-soft">
                                <span className="h-4 w-4 rounded-full bg-[var(--accent)] text-[var(--muted-foreground)] flex items-center justify-center text-[9px] font-bold mr-1.5 animate-ping-slow">2</span>
                                <span>Ажиллаж байна</span>
                              </div>
                              <span className="text-[var(--muted-foreground)]">➔</span>
                              <div className="flex items-center text-[var(--muted-foreground)]">
                                <span className="h-4 w-4 rounded-full bg-[rgba(255,255,255,0.06)] text-[var(--muted-foreground)] flex items-center justify-center text-[9px] font-bold mr-1.5">3</span>
                                <span>Үнэлгээ</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Footer containing received review (for completed jobs) and salary for ALL statuses */}
                      <div className="space-y-3 pt-2 mt-auto border-t border-[var(--color-glass-border)]">
                        {isHired && job.status === 'completed' && (() => {
                          const receivedReview = displayReviews.find(r => r.jobId === job.id);
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
                              <p className="text-[11px] text-[var(--muted-foreground)] italic">"{receivedReview.comment}"</p>
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
                                  onClick={() => setActiveReviewJob(job)}
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
                          : 'border border-[var(--color-glass-border)] hover:border-[var(--color-glass-border)]'
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
                          <div className="w-full h-36 rounded-md overflow-hidden bg-[var(--color-glass-bg)] border border-[var(--color-glass-border)] relative shrink-0">
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
                          <p className="text-[10.5px] text-[var(--muted-foreground)] leading-relaxed italic font-sans bg-[rgba(255,255,255,0.04)] p-2.5 rounded-lg border border-[var(--color-glass-border)]">
                            Нэмэлт: {job.additionalInfo}
                          </p>
                        )}

                        {/* Status badge and description */}
                        <div className="space-y-2 pt-1.5">
                          <span className={`inline-flex px-2.5 py-0.5 rounded text-[9.5px] font-bold font-mono tracking-wide uppercase ${badgeClass}`}>
                            {statusText}
                          </span>
                          <p className="text-[11px] text-[var(--muted-foreground)] leading-relaxed bg-[rgba(255,255,255,0.04)] p-3 rounded-lg border border-[var(--color-glass-border)] font-sans">
                            {statusDesc}
                          </p>
                        </div>

                        {job.hiredOperatorId && (
                          <div className="bg-[var(--color-glass-bg)] p-2.5 rounded-lg border border-[var(--color-glass-border)] flex justify-between items-center text-[10.5px] mt-2">
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
                                  onClick={() => handleCancelHiring(job.id)}
                                  className="text-[var(--muted-foreground)] hover:text-[var(--accent-soft-foreground)] bg-[var(--color-glass-bg)] border border-[var(--color-glass-border)] hover:border-[var(--color-glass-border)] px-2 py-0.5 rounded text-[9.5px] font-bold cursor-pointer transition-colors"
                                >
                                  Болих
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Applicants rendering for open jobs */}
                        {job.status === 'open' && job.applicants.length > 0 && (
                          <div className="space-y-2 pt-2 border-t border-[var(--color-glass-border)]">
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
                                    className="bg-[var(--color-glass-bg)] p-2.5 rounded-md border border-[var(--color-glass-border)] flex items-center justify-between text-xs"
                                  >
                                    <div
                                      onClick={() => { window.location.href = `/profile?id=${op.id}`; }}
                                      className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
                                    >
                                      <img
                                        src={op.profileImage}
                                        alt={op.fullName}
                                        className="w-7 h-7 rounded-full object-cover border border-[var(--color-glass-border)]"
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
                                      onClick={() => handleHireOperator(job.id, op.id)}
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
                              onClick={() => handleCompleteJobTrigger(job)}
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
                            const receivedReview = displayReviews.find(r => r.jobId === job.id);
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
                                <p className="text-[11px] text-[var(--muted-foreground)] italic">"{receivedReview.comment}"</p>
                              </div>
                            );
                          })()}

                          {!job.isReviewedByEmployer && (
                            <div className="pt-2 flex justify-end">
                              <button
                                type="button"
                                onClick={() => setActiveReviewJob(job)}
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
                        <div className="flex space-x-2.5 pt-2 mt-auto border-t border-[var(--color-glass-border)]">
                          {job.status !== 'completed' && (
                            <button
                              type="button"
                              onClick={() => setEditingJob(job)}
                              className="flex-1 border border-[var(--color-glass-border)] hover:border-[var(--color-glass-border)] bg-[var(--color-glass-bg)] hover:bg-[var(--color-glass-bg)] text-[var(--muted-foreground)] hover:text-[var(--fg)] font-semibold text-[10.5px] py-1.5 px-2.5 rounded-lg transition-colors cursor-pointer text-center"
                            >
                              Засах
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={async () => {
                              if (window.confirm('Та энэ зарыг устгахдаа итгэлтэй байна уу? Устгасны дараа сэргээх боломжгүй.')) {
                                try {
                                  await deleteJob(job.id);
                                  await loadProfileData();
                                  setSuccess('Зарыг амжилттай устгалаа.');
                                  setTimeout(() => setSuccess(''), 3000);
                                } catch (err) {
                                  console.error(err);
                                  alert('Зарыг устгахад алдаа гарлаа.');
                                }
                              }
                            }}
                            className={`${job.status === 'completed' ? 'w-full' : 'flex-1'} border border-[var(--color-glass-border)] hover:border-[var(--color-glass-border)] bg-[var(--color-glass-bg)] hover:bg-[var(--color-glass-bg)] text-[var(--muted-foreground)] hover:text-[var(--fg)] font-semibold text-[10.5px] py-1.5 px-2.5 rounded-lg transition-colors cursor-pointer text-center`}
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
          onSuccess={async (rev) => {
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
            setSuccess('🎉 Ажлын зар амжилттай засагдаж шинэчлэгдлээ!');
            setTimeout(() => setSuccess(''), 3000);
          }}
        />
      )}

      {/* Edit Review Modal */}
      {editingReview && (
        <div 
          id="edit-review-modal-backdrop" 
          onClick={() => setEditingReview(null)}
          className="fixed inset-0 bg-[var(--bg2)] flex items-center justify-center p-4 z-50 animate-fade-in"
        >
          <div 
            id="edit-review-modal-container" 
            onClick={(e) => e.stopPropagation()}
            className="bg-[var(--color-glass-bg)] border border-[var(--color-glass-border)] max-w-md w-full rounded-md overflow-hidden shadow-md relative text-left animate-fade-in"
          >
            {/* Header */}
            <div className="flex justify-between items-center border-b border-[var(--color-glass-border)] px-6 py-4">
              <h3 className="text-sm font-semibold text-[var(--fg)]">Үнэлгээ Засах</h3>
              <button 
                type="button" 
                onClick={() => setEditingReview(null)} 
                className="text-[var(--muted-foreground)] hover:text-[var(--fg)] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleEditReviewSubmit} className="p-6 space-y-4">
              <div className="bg-[rgba(255,255,255,0.06)] p-3.5 rounded-lg border border-[var(--color-glass-border)] space-y-1">
                <span className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-widest block font-mono">Ажлын нэр</span>
                <p className="text-xs font-semibold text-[var(--accent-soft-foreground)]">{editingReview.jobTitle}</p>
              </div>

              {/* Rating selection */}
              <div className="flex flex-col items-center py-3 space-y-2 bg-[rgba(255,255,255,0.04)] border border-[var(--color-glass-border)] rounded-lg">
                <span className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-widest font-mono">Үнэлгээ</span>
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
                <span className="text-xs font-bold text-[var(--accent-soft-foreground)] font-mono">
                  {editRating === 5 ? '5.0 / Маш сайн' : 
                   editRating === 4 ? '4.0 / Сайн' :
                   editRating === 3 ? '3.0 / Дундаж' :
                   editRating === 2 ? '2.0 / Хангалтгүй' : '1.0 / Маш муу'}
                </span>
              </div>

              {/* Comment field */}
              <div className="space-y-1.5">
                <label htmlFor="edit-review-comment" className="block text-[10px] text-[var(--muted-foreground)] uppercase tracking-widest font-mono">Сэтгэгдэл, тайлбар</label>
                <textarea
                  id="edit-review-comment"
                  required
                  rows={4}
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  placeholder="Хамтран ажилласан сэтгэгдлээ энд бичнэ үү..."
                  className="block w-full px-3.5 py-2.5 border border-[var(--color-glass-border)] rounded bg-[rgba(255,255,255,0.06)] text-[var(--fg)] text-xs focus:ring-1 focus:ring-[var(--accent)] focus:outline-none placeholder-[var(--muted-foreground)] font-sans"
                />
              </div>

              {/* Error */}
              {editError && (
                <div className="text-[11px] text-[var(--accent-soft-foreground)] bg-[var(--accent-soft)] border border-[var(--accent)] p-2.5 rounded-lg text-center font-semibold">
                  {editError}
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingReview(null)}
                  className="flex-1 bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.07)] border border-[var(--color-glass-border)] text-[var(--fg)] text-xs font-semibold py-2.5 px-4 rounded transition-colors cursor-pointer text-center"
                >
                  Цуцлах
                </button>
                <button
                  type="submit"
                  disabled={isEditSubmitting}
                  className="flex-1 bg-[var(--accent)] hover:brightness-95 disabled:bg-[var(--accent)] disabled:opacity-50 text-[var(--muted-foreground)] text-xs font-bold py-2.5 px-4 rounded transition-colors cursor-pointer text-center"
                >
                  {isEditSubmitting ? 'Хадгалж байна...' : 'Хадгалах'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
