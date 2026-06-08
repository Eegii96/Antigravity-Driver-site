'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Review, JobHistoryItem, Job } from '../types';
import { getReviews, getJobHistory, saveSingleUser, getSingleUser, getJobs, getUsers, hireOperator, completeJob, deleteJob } from '../lib/db';
import { Star, ShieldAlert, Award, Phone, Mail, MapPin, Calendar, CheckCircle, Clock, DollarSign, Briefcase, Users, X } from 'lucide-react';
import ProfileEditModal from './ProfileEditModal';
import ReviewModal from './ReviewModal';
import JobPostModal from './JobPostModal';

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

  // Tracking driver applications and job status
  const [activeTab, setActiveTab] = useState<'profile' | 'applications'>(defaultTab || 'profile');
  const [driverJobs, setDriverJobs] = useState<Job[]>([]);
  const [activeReviewJob, setActiveReviewJob] = useState<Job | null>(null);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setProfileUser(user);
  }, [user]);

  useEffect(() => {
    const loadProfileData = async () => {
      setIsLoading(true);
      try {
        // Run all queries in parallel to optimize load speed and eliminate the delay waterfall
        const [freshUser, allReviews, allHistory, usersList, allJobs] = await Promise.all([
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

        const reviews = allReviews.filter(r => {
          if (profileUser.type === 'operator') {
            return r.reviewerType === 'employer' && (r.jobId.includes('unreliable') ? profileUser.id === 'user_op_unreliable' : profileUser.id !== 'user_op_unreliable');
          } else {
            return r.reviewerType === 'operator';
          }
        });

        const isDemoUnreliable = profileUser.id === 'user_op_unreliable';
        const dispReviews = isDemoUnreliable 
          ? allReviews.filter(r => r.id.includes('unreliable'))
          : reviews.filter(r => !r.id.includes('unreliable'));

        const histItems = allHistory.filter(h => {
          if (isDemoUnreliable) {
            return h.id.includes('unreliable');
          }
          return h.role === profileUser.type && !h.id.includes('unreliable');
        });

        setDisplayReviews(dispReviews);
        setHistoryItems(histItems);

        const filteredJobs = allJobs.filter(j => {
          if (profileUser.type === 'operator') {
            return j.applicants.includes(profileUser.id) || j.hiredOperatorId === profileUser.id;
          } else {
            return j.employerId === profileUser.id;
          }
        });
        setDriverJobs(filteredJobs);
      } catch (err) {
        console.error('Error loading profile data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadProfileData();
  }, [profileUser.id]);

  useEffect(() => {
    if (highlightJobId && activeTab === 'applications' && driverJobs.length > 0) {
      const timer = setTimeout(() => {
        const element = document.getElementById(`job-card-${highlightJobId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [highlightJobId, activeTab, driverJobs]);

  const handleHireOperator = async (jobId: string, operatorId: string) => {
    try {
      const success = await hireOperator(jobId, operatorId);
      if (success) {
        setSuccess('🤝 Жолоочийг ажилд амжилттай томиллоо. Гэрээ идэвхжлээ.');
        setTimeout(() => setSuccess(''), 4500);
        
        // Refresh data
        const allJobs = await getJobs();
        const filteredJobs = allJobs.filter(j => {
          if (profileUser.type === 'operator') {
            return j.applicants.includes(profileUser.id) || j.hiredOperatorId === profileUser.id;
          } else {
            return j.employerId === profileUser.id;
          }
        });
        setDriverJobs(filteredJobs);
      }
    } catch (err) {
      console.error('Error hiring operator:', err);
      alert('Алдаа гарлаа. Дахин оролдоно уу.');
    }
  };

  const handleCompleteJobTrigger = async (job: Job) => {
    try {
      const success = await completeJob(job.id);
      if (success) {
        setSuccess('✓ Ажил амжилттай дууслаа. Одоо үнэлгээгээ өгнө үү.');
        setTimeout(() => setSuccess(''), 4500);
        
        // Refresh jobs
        const allJobs = await getJobs();
        const filteredJobs = allJobs.filter(j => {
          if (profileUser.type === 'operator') {
            return j.applicants.includes(profileUser.id) || j.hiredOperatorId === profileUser.id;
          } else {
            return j.employerId === profileUser.id;
          }
        });
        setDriverJobs(filteredJobs);
        
        // Set active review job to open review modal immediately!
        const updatedJob = allJobs.find(j => j.id === job.id);
        if (updatedJob) {
          setActiveReviewJob(updatedJob);
        }
      }
    } catch (err) {
      console.error('Error completing job:', err);
      alert('Алдаа гарлаа. Дахин оролдоно уу.');
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
    <div id="profile-view-wrapper" className="max-w-4xl mx-auto p-4 md:p-6 text-white font-sans space-y-8 relative overflow-hidden">
      {/* Ambient background glow blobs */}
      <div className="glow-blob bg-emerald-500 w-[300px] h-[300px] -top-20 -left-20 opacity-5"></div>
      <div className="glow-blob bg-cyan-500 w-[400px] h-[400px] bottom-0 -right-20 opacity-5" style={{ animationDelay: '-6s' }}></div>

      {/* Back to jobs / breadcrumb */}
      <div className="flex items-center justify-between relative z-10">
        <h2 className="text-xl font-bold tracking-tight text-white flex items-center space-x-2">
          <Award className="w-6 h-6 text-amber-400 text-neon-cyan animate-pulse-soft" />
          <span>
            {defaultTab === 'applications'
              ? (profileUser.type === 'operator' ? 'Миний Хүсэлтүүд & Ажлын Явц' : 'Миний Байршуулсан Зарууд')
              : (isOwnProfile ? 'Миний Хувийн Профайл' : `${profileUser.fullName}-ийн Профайл`)}
          </span>
        </h2>
        <button
          id="back-to-board-btn"
          onClick={() => router.push('/board')}
          className="text-xs bg-slate-900/60 hover:bg-slate-800 text-emerald-450 border border-slate-800/80 px-4 py-2 rounded-xl transition-all cursor-pointer shadow-md"
        >
          Жагсаалт руу буцах
        </button>
      </div>

      {success && (
        <div className="fixed top-6 right-6 max-w-sm bg-slate-900/95 border border-emerald-500/80 text-emerald-300 p-4 rounded-xl text-xs flex items-center space-x-2.5 animate-fade-in text-left z-50 backdrop-blur-md shadow-2xl">
          <CheckCircle className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {activeTab === 'profile' && (
        <>
          {/* Security incompleteness alert banner */}
          {isOwnProfile && !(profileUser.securityQuestion1 && profileUser.securityAnswer1 && profileUser.securityQuestion2 && profileUser.securityAnswer2) && (
        <div className="glass-panel p-4 rounded-xl border border-amber-500/40 bg-amber-500/5 text-xs space-y-2 relative overflow-hidden neon-border-amber z-10 animate-fade-in text-left">
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-400 flex items-center space-x-2">
              <ShieldAlert className="w-4.5 h-4.5 text-amber-400 shrink-0 animate-pulse" />
              <span>🔒 БҮРТГЭЛИЙН АЮУЛГҮЙ БАЙДАЛ ДУТУУ БАЙНА!</span>
            </span>
            <button
              onClick={() => setShowEdit(true)}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-1 rounded-lg font-bold text-[10.5px] transition-colors cursor-pointer font-sans"
            >
              Асуулт тохируулах (Хамгаалах)
            </button>
          </div>
          <p className="text-[11px] text-gray-300 leading-relaxed font-sans">
            Та аюулгүй байдлын 2 нууц асуултыг тохируулаагүй байна. Нууц асуултыг тохируулснаар нууц үгээ мартсан үедээ утасны дугаараар найдвартай сэргээх боломж бүрдэж, бусад хүмүүс таны хаягийг хулгайлахаас 100% сэргийлнэ.
          </p>
        </div>
      )}

      {/* Main Intro Card */}
      <div className="glass-panel p-6 rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-6 relative overflow-hidden shadow-2xl neon-border-cyan z-10">
        
        {/* Profile photo and badges */}
        <div className="md:col-span-1 flex flex-col items-center space-y-4">
          <div className="relative">
            <img
              src={profileUser.profileImage}
              alt={profileUser.fullName}
              className="w-28 h-28 rounded-full border-4 border-slate-800/80 object-cover shadow-2xl drop-shadow-[0_0_10px_rgba(16,185,129,0.2)]"
              referrerPolicy="no-referrer"
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=U&background=334155&color=fff'; }}
            />
            <div className={`absolute bottom-0 right-1 px-3 py-0.5 rounded-full text-[8px] font-bold font-mono text-white tracking-wider ${
              profileUser.rating >= 4.5 ? 'bg-emerald-600' : profileUser.rating >= 3.5 ? 'bg-amber-600' : 'bg-rose-600'
            }`}>
              {profileUser.type === 'operator' ? 'ЖОЛООЧ' : 'ЗАХИАЛАГЧ'}
            </div>
          </div>

          <div className="text-center">
            <h3 className="text-base font-bold text-white leading-tight">
              {profileUser.fullName}
              {profileUser.companyName && (
                <span className="block text-xs font-semibold text-emerald-400 mt-1">{profileUser.companyName}</span>
              )}
            </h3>
            <p className="text-[10px] text-slate-500 mt-1 font-mono">ID: {profileUser.id}</p>
          </div>

          {/* Rating overview */}
          <div className="bg-slate-950/40 border border-slate-850 p-3.5 rounded-2xl w-full text-center">
            <p className="text-[11px] text-slate-500 font-medium">Дундаж үнэлгээ</p>
            <div className="flex items-center justify-center space-x-1 mt-1">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400 drop-shadow-[0_0_5px_rgba(245,158,11,0.4)]" />
              <span className="text-2xl font-black font-mono text-white">{(profileUser.rating ?? 5).toFixed(1)}</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1.5 font-semibold">{displayReviews.length} удаагийн ажил дуусгасан</p>
          </div>
        </div>

        {/* Detailed details */}
        <div className="md:col-span-3 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <span className="bg-[#080d1a] px-3.5 py-1.5 rounded-xl text-xs text-slate-350 border border-slate-850 flex items-center space-x-1.5 shadow-sm">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span>Гишүүн болсон: {profileUser.createdAt}</span>
              </span>
              {profileUser.type === 'operator' && (
                <span className="bg-emerald-950/20 px-3.5 py-1.5 rounded-xl text-xs text-emerald-300 border border-emerald-900/30 font-mono shadow-sm">
                  Туршлага: {profileUser.experienceYears || 0} жил техник барьсан
                </span>
              )}
            </div>

            {/* Toggles bar for granular privacy - visible if isOwnProfile */}
            {isOwnProfile && (
              <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-850/80 flex flex-wrap gap-4 items-center justify-between text-xs w-full">
                <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  Нууцлалын Тохиргоо (Хүмүүст харагдуулах):
                </div>
                <div className="flex flex-wrap gap-4">
                  {/* Email Visibility TOGGLE */}
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] text-slate-300 font-medium">Имэйл:</span>
                    <button
                      type="button"
                      onClick={() => toggleFieldVisibility('emailVisible')}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                        profileUser.emailVisible !== false ? 'bg-emerald-600' : 'bg-rose-600'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out mt-0.5 ml-0.5 ${
                          profileUser.emailVisible !== false ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Phone Visibility TOGGLE */}
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] text-slate-300 font-medium">Утас:</span>
                    <button
                      type="button"
                      onClick={() => toggleFieldVisibility('phoneVisible')}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                        profileUser.phoneVisible !== false ? 'bg-emerald-600' : 'bg-rose-600'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out mt-0.5 ml-0.5 ${
                          profileUser.phoneVisible !== false ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* History Visibility TOGGLE */}
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] text-slate-300 font-medium">Ажлын түүх:</span>
                    <button
                      type="button"
                      onClick={() => toggleFieldVisibility('historyVisible')}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                        profileUser.historyVisible !== false ? 'bg-emerald-600' : 'bg-rose-600'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out mt-0.5 ml-0.5 ${
                          profileUser.historyVisible !== false ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Reviews Visibility TOGGLE */}
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] text-slate-300 font-medium">Сэтгэгдэл:</span>
                    <button
                      type="button"
                      onClick={() => toggleFieldVisibility('reviewsVisible')}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                        profileUser.reviewsVisible !== false ? 'bg-emerald-600' : 'bg-rose-600'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out mt-0.5 ml-0.5 ${
                          profileUser.reviewsVisible !== false ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="text-xs space-y-2.5 border-t border-slate-850 pt-4">
              {(profileUser.emailVisible !== false || isOwnProfile) ? (
                <div className="flex items-center space-x-2 text-slate-300">
                  <Mail className="w-4 h-4 text-emerald-450 shrink-0" />
                  <span className="font-semibold text-slate-500">Имэйл хаяг:</span>
                  <span className="select-all font-sans text-white">{profileUser.email ? profileUser.email : 'бөглөөгүй'}</span>
                  {isOwnProfile && profileUser.emailVisible === false && (
                    <span className="text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded font-medium ml-2 shrink-0">Бусдад харагдахгүй</span>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-slate-500">
                  <Mail className="w-4 h-4 text-slate-700 shrink-0" />
                  <span className="font-semibold text-slate-500">Имэйл хаяг:</span>
                  <span className="italic text-[10px] text-slate-600 font-sans">(Нууцалсан)</span>
                </div>
              )}

              {(profileUser.phoneVisible !== false || isOwnProfile) ? (
                <div className="flex items-center space-x-2 text-slate-300">
                  <Phone className="w-4 h-4 text-emerald-450 shrink-0" />
                  <span className="font-semibold text-slate-500">Утас:</span>
                  <span className="select-all font-mono font-bold text-emerald-400 text-neon-emerald">{profileUser.phone}</span>
                  {isOwnProfile && profileUser.phoneVisible === false && (
                    <span className="text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded font-medium ml-2 shrink-0">Бусдад харагдахгүй</span>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-slate-500">
                  <Phone className="w-4 h-4 text-slate-700 shrink-0" />
                  <span className="font-semibold text-slate-500">Утас:</span>
                  <span className="italic text-[10px] text-slate-600 font-sans">(Нууцалсан)</span>
                </div>
              )}

              {profileUser.phone2 && ((profileUser.phoneVisible !== false || isOwnProfile) ? (
                <div className="flex items-center space-x-2 text-slate-300">
                  <Phone className="w-4 h-4 text-emerald-450 shrink-0 opacity-80" />
                  <span className="font-semibold text-slate-500">Утас 2:</span>
                  <span className="select-all font-mono font-bold text-emerald-400 text-neon-emerald opacity-90">{profileUser.phone2}</span>
                </div>
              ) : null)}

              <div className="flex items-center space-x-2 text-slate-300">
                <MapPin className="w-4 h-4 text-emerald-450 shrink-0" />
                <span className="font-semibold text-slate-500">Хаяг:</span>
                <span className="text-white">{profileUser.address}</span>
              </div>
            </div>

            <div className="border-t border-slate-850 pt-4">
              <h4 className="text-xs font-bold text-slate-450 mb-1.5">Танилцуулга ба Нэмэлт мэдээлэл:</h4>
              <p className="text-xs leading-relaxed text-slate-300 bg-[#080d1a]/50 p-4 rounded-xl border border-slate-850 whitespace-pre-line">
                {profileUser.bio}
              </p>
            </div>

            {profileUser.type === 'operator' && profileUser.machineTypes && profileUser.machineTypes.length > 0 && (
              <div className="pt-2">
                <h4 className="text-xs font-bold text-slate-450 mb-2">Мэргэшсэн механизмын төрлүүд:</h4>
                <div className="flex flex-wrap gap-2">
                  {profileUser.machineTypes.map((m, idx) => (
                    <span key={idx} className="bg-[#080d1a] px-3.5 py-1.5 rounded-xl text-xs text-cyan-400 font-mono border border-slate-850 shadow-sm">
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
                className="bg-emerald-600 hover:bg-emerald-550 text-white font-bold text-xs py-2 px-5 rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-950/20 glow-btn-emerald"
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
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-850 pb-2.5 flex items-center space-x-2">
            <CheckCircle className="w-4.5 h-4.5 text-emerald-450 drop-shadow-[0_0_5px_rgba(16,185,129,0.2)]" />
            <span>Баталгаажсан Ажлын Түүх ({profileUser.historyVisible !== false || isOwnProfile ? historyItems.length : 0})</span>
            {isOwnProfile && profileUser.historyVisible === false && (
              <span className="text-[9px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded font-normal normal-case ml-2 shrink-0">Бусдад харагдахгүй</span>
            )}
          </h3>

          {(profileUser.historyVisible !== false || isOwnProfile) ? (
            historyItems.length === 0 ? (
              <div className="glass-panel p-6 rounded-2xl border border-slate-800/60 text-center text-xs text-slate-500 font-sans">
                Ажлын бүртгэлийн түүх байхгүй байна.
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {historyItems.map((item) => (
                  <div key={item.id} className="glass-card p-4 rounded-xl border border-slate-800/60 hover:border-slate-700/60 space-y-2 relative overflow-hidden group">
                    <div className="glow-blob bg-cyan-500 w-[50px] h-[50px] -top-5 -right-5 opacity-5 group-hover:scale-150 transition-all duration-700"></div>
                    <div className="flex justify-between items-start">
                      <h4 className="text-xs font-bold text-white block max-w-[70%] truncate group-hover:text-cyan-400 transition-colors">{item.title}</h4>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold font-mono tracking-wide uppercase ${
                        item.status === 'completed' ? 'bg-emerald-950/20 text-emerald-400 border border-emerald-900/30' : 'bg-amber-950/20 text-amber-400 border border-amber-900/30'
                      }`}>
                        {item.status === 'completed' ? 'Гүйцэтгэсэн' : 'Идэвхтэй'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                      <span>Хамтарсан тал:</span>
                      <span className="text-slate-305 font-sans font-medium">{item.partnerName}</span>
                    </div>

                    <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                      <span>Хугацаа:</span>
                      <span className="text-slate-400">{item.dateRange}</span>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="glass-panel p-6 rounded-2xl border border-slate-800/60 text-center text-xs text-slate-500 italic font-sans">
              Хэрэглэгч ажлын түүхийн мэдээллээ нууцалсан байна.
            </div>
          )}
        </div>

        {/* Uncensored reviews written for this user */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-850 pb-2.5 flex items-center space-x-2">
            <Star className="w-4.5 h-4.5 text-amber-400 drop-shadow-[0_0_5px_rgba(245,158,11,0.2)]" />
            <span>Хамтран ажиллагсдын сэтгэгдэл ({profileUser.reviewsVisible !== false || isOwnProfile ? displayReviews.length : 0})</span>
            {isOwnProfile && profileUser.reviewsVisible === false && (
              <span className="text-[9px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded font-normal normal-case ml-2 shrink-0">Бусдад харагдахгүй</span>
            )}
          </h3>

          {(profileUser.reviewsVisible !== false || isOwnProfile) ? (
            displayReviews.length === 0 ? (
              <div className="glass-panel p-6 rounded-2xl border border-slate-800/60 text-center text-xs text-slate-500 font-sans">
                Хэрэглэгчид одоогоор үнэлгээ бичигдээгүй байна.
              </div>
            ) : (
              <div className="space-y-3.5 max-h-96 overflow-y-auto pr-1">
                {displayReviews.map((rev) => (
                  <div key={rev.id} className="glass-card p-4 rounded-xl border border-slate-800/60 hover:border-slate-700/60 space-y-3 relative overflow-hidden group">
                    <div className="glow-blob bg-emerald-500 w-[50px] h-[50px] -top-5 -right-5 opacity-5 group-hover:scale-150 transition-all duration-700"></div>
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-bold block text-emerald-400 group-hover:text-emerald-350 transition-colors">
                          {(() => {
                            const parts = rev.reviewerName.trim().split(/\s+/);
                            return parts[parts.length - 1] || rev.reviewerName;
                          })()}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono block mt-0.5">Төсөл: {rev.jobTitle}</span>
                      </div>
                      {/* Stars indicator */}
                      <div className="flex items-center space-x-0.5 bg-[#080d1a] px-2 py-1 rounded-lg border border-slate-850 shadow-sm shrink-0">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={`w-2.5 h-2.5 ${s <= rev.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}`} />
                        ))}
                        <span className="text-[10px] text-white font-bold ml-1 font-mono">{rev.rating}.0</span>
                      </div>
                    </div>

                    <p className="text-xs leading-relaxed text-slate-300 italic font-sans bg-[#080d1a]/30 p-2.5 rounded-lg border border-slate-850/60">
                      "{rev.comment}"
                    </p>

                    <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono border-t border-slate-850 pt-2 flex-wrap gap-1">
                      <span>Үүрэг: {rev.reviewerType === 'employer' ? 'Ажил Олгогчийн үнэлгээ' : 'Жолоочийн үнэлгээ'}</span>
                      <span className="text-slate-450">{rev.createdAt}</span>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="glass-panel p-6 rounded-2xl border border-slate-800/60 text-center text-xs text-slate-500 italic font-sans">
              Хэрэглэгч үнэлгээ, сэтгэгдлийн хэсгийг нууцалсан байна.
            </div>
          )}
        </div>

      </div>
        </>
      )}

      {activeTab === 'applications' && (
        <div className="space-y-6 animate-fade-in relative z-10 text-left">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-850 pb-2.5 flex items-center space-x-2">
            <Clock className="w-4.5 h-4.5 text-emerald-450 drop-shadow-[0_0_5px_rgba(16,185,129,0.2)]" />
            <span>
              {profileUser.type === 'operator' 
                ? `Миний илгээсэн хүсэлтүүд & Ажлын явц (${driverJobs.length})` 
                : `Миний байршуулсан зарууд (${driverJobs.length})`}
            </span>
          </h3>

          {isLoading ? (
            <div className="glass-panel p-12 rounded-2xl border border-slate-800/60 text-center text-xs text-slate-400 font-sans flex flex-col items-center justify-center space-y-4">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <span>Мэдээллийг ачаалж байна...</span>
            </div>
          ) : driverJobs.length === 0 ? (
            <div className="glass-panel p-12 rounded-2xl border border-slate-800/60 text-center text-xs text-slate-500 font-sans">
              {profileUser.type === 'operator' 
                ? 'Та одоогоор ямар нэгэн заранд хүсэлт илгээгээгүй байна.' 
                : 'Та одоогоор ямар нэгэн зар оруулаагүй байна.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {driverJobs.map((job) => {
                if (profileUser.type === 'operator') {
                  const isHired = job.hiredOperatorId === profileUser.id;
                  const isPending = !job.hiredOperatorId && job.status === 'open';
                  const isRejected = job.hiredOperatorId && job.hiredOperatorId !== profileUser.id;

                  let statusText = '';
                  let badgeClass = '';
                  let statusDesc = '';

                  if (isHired) {
                    if (job.status === 'in_progress') {
                      statusText = 'Ажилд сонгогдсон • Ажил явагдаж байна';
                      badgeClass = 'bg-emerald-950/20 text-emerald-400 border border-emerald-900/40';
                      statusDesc = '🤝 Баяр хүргэе! Захиалагч таныг ажилд сонгосон байна. Ажлын хариуцлагын гэрээ идэвхтэй байгаа тул хариуцлагатай ажиллана уу.';
                    } else if (job.status === 'completed') {
                      statusText = 'Ажил амжилттай дууссан';
                      badgeClass = 'bg-cyan-950/25 text-cyan-400 border border-cyan-800/40';
                      statusDesc = '✓ Ажил дууссан. Захиалагч ажлын гүйцэтгэлийг баталгаажуулсан байна. Танд ажлын хөлс бүрэн олгогдсон эсэхийг шалгана уу.';
                    }
                  } else if (isPending) {
                    statusText = 'Хүсэлт илгээсэн • Хүлээгдэж буй';
                    badgeClass = 'bg-amber-950/20 text-amber-400 border border-amber-900/30';
                    statusDesc = '⏳ Таны ажилд орох хүсэлтийг захиалагч хянаж байна. Хэрэв та сонгогдвол системд шинэчлэгдэн харагдах болно.';
                  } else if (isRejected) {
                    statusText = 'Өөр жолооч сонгогдсон';
                    badgeClass = 'bg-rose-950/25 text-rose-455 border border-rose-800/30';
                    statusDesc = '❌ Захиалагч энэ заранд өөр жолооч сонгон ажилласан байна. Та дараагийн зар руу хүсэлтээ илгээнэ үү.';
                  }

                  return (
                    <div
                      key={job.id}
                      id={`job-card-${job.id}`}
                      className={`glass-card p-5 rounded-2xl transition-all flex flex-col justify-between space-y-4 ${
                        highlightJobId === job.id
                          ? 'highlighted-job-card'
                          : 'border-slate-800/80 hover:border-slate-700/80'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-start gap-1">
                          <div></div>
                          <span className="text-[10px] text-gray-500 shrink-0 flex items-center space-x-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-500" />
                            <span>{job.location.split(',')[0]}</span>
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-white leading-snug">{job.title}</h4>
                        
                        <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-850 flex justify-between items-center text-[10.5px]">
                          <span className="text-slate-500">Захиалагч:</span>
                          <button
                            type="button"
                            onClick={() => {
                              router.push(`/profile?id=${job.employerId}`);
                            }}
                            className="font-semibold text-emerald-400 hover:text-emerald-350 hover:underline cursor-pointer text-left transition-colors"
                          >
                            {job.employerName}
                          </button>
                        </div>

                        {/* Status badge and description */}
                        <div className="space-y-2 pt-1.5">
                          <span className={`inline-flex px-2.5 py-0.5 rounded text-[9.5px] font-bold font-mono tracking-wide uppercase ${badgeClass}`}>
                            {statusText}
                          </span>
                          <p className="text-[11px] text-gray-400 leading-relaxed bg-[#080d1a]/40 p-3 rounded-lg border border-slate-850/80 font-sans">
                            {statusDesc}
                          </p>
                        </div>

                        {/* Step Indicator for active jobs */}
                        {isHired && job.status === 'in_progress' && (
                          <div className="pt-2">
                            <span className="text-[10px] text-slate-500 block uppercase font-mono tracking-wider mb-2">Ажлын явцын төлөв:</span>
                            <div className="flex items-center space-x-2 text-xs">
                              <div className="flex items-center text-emerald-400">
                                <span className="h-4 w-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-[9px] font-bold mr-1.5">1</span>
                                <span>Сонгогдсон</span>
                              </div>
                              <span className="text-slate-600">➔</span>
                              <div className="flex items-center text-emerald-400 font-bold animate-pulse-soft">
                                <span className="h-4 w-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-[9px] font-bold mr-1.5 animate-ping-slow">2</span>
                                <span>Ажиллаж байна</span>
                              </div>
                              <span className="text-slate-600">➔</span>
                              <div className="flex items-center text-slate-500">
                                <span className="h-4 w-4 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center text-[9px] font-bold mr-1.5">3</span>
                                <span>Үнэлгээ</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Footer / Review action if completed & not reviewed yet */}
                      {isHired && job.status === 'completed' && (
                        <div className="space-y-3 pt-2">
                          {(() => {
                            const receivedReview = displayReviews.find(r => r.jobId === job.id);
                            if (!receivedReview) return null;
                            return (
                              <div className="bg-emerald-950/10 border border-emerald-500/20 p-3 rounded-lg text-xs space-y-1.5 mt-2">
                                <div className="flex justify-between items-center text-[10.5px]">
                                  <span className="font-bold text-emerald-400">Захиалагчийн үнэлгээ:</span>
                                  <div className="flex items-center space-x-0.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star 
                                        key={star} 
                                        className={`w-3 h-3 ${star <= receivedReview.rating ? 'fill-amber-400 text-amber-500' : 'text-slate-700'}`} 
                                      />
                                    ))}
                                    <span className="font-bold font-mono ml-1 text-white">{receivedReview.rating}.0</span>
                                  </div>
                                </div>
                                <p className="text-[11px] text-slate-300 italic">"{receivedReview.comment}"</p>
                              </div>
                            );
                          })()}

                          <div className="border-t border-slate-850/80 pt-3.5 flex items-center justify-between">
                             <div className="flex items-center space-x-1 text-xs">
                              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="font-mono font-bold text-white">
                                {job.salary === 0 ? 'Тохиролцоно' : `${job.salary.toLocaleString()} ₮`}
                              </span>
                            </div>

                            {job.isReviewedByOperator ? (
                              <span className="text-[10px] text-emerald-400 bg-emerald-950/20 px-2 py-1 rounded font-semibold border border-emerald-900/30">
                                ✓ Захиалагчийг үнэлсэн
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setActiveReviewJob(job)}
                                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10.5px] py-1.5 px-3.5 rounded-lg transition-colors cursor-pointer"
                              >
                                Захиалагчийг Үнэлэх
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                } else {
                  // Employer posted jobs tracking
                  let statusText = '';
                  let badgeClass = '';
                  let statusDesc = '';

                  if (job.status === 'open') {
                    statusText = 'Нээлттэй • Жолооч хайж буй';
                    badgeClass = 'bg-amber-950/20 text-amber-400 border border-amber-900/30';
                    statusDesc = `⏳ Хүсэлт ирүүлсэн жолооч нарын тоо: ${job.applicants.length}. Жолооч сонгох буюу ажилд томилох боломжтой.`;
                  } else if (job.status === 'in_progress') {
                    statusText = 'Ажил явагдаж байна';
                    badgeClass = 'bg-emerald-950/20 text-emerald-400 border border-emerald-900/40';
                    statusDesc = `🤝 Томилогдсон жолооч: ${job.hiredOperatorName || 'Оператор'}. Ажил дууссаны дараа гүйцэтгэлийг баталгаажуулж үнэлнэ үү.`;
                  } else if (job.status === 'completed') {
                    statusText = 'Ажил дууссан';
                    badgeClass = 'bg-slate-950 text-slate-400 border border-slate-800';
                    statusDesc = `✓ Ажил амжилттай дууссан. Томилогдож ажилласан жолооч: ${job.hiredOperatorName || 'Оператор'}.`;
                  }

                  return (
                    <div
                      key={job.id}
                      id={`job-card-${job.id}`}
                      className={`glass-card p-5 rounded-2xl transition-all flex flex-col justify-between space-y-4 text-left ${
                        highlightJobId === job.id
                          ? 'highlighted-job-card'
                          : 'border-slate-800/80 hover:border-slate-700/80'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-start gap-1">
                          <div></div>
                          <span className="text-[10px] text-gray-500 shrink-0 flex items-center space-x-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-500" />
                            <span>{job.location.split(',')[0]}</span>
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-white leading-snug">{job.title}</h4>

                        {/* Status badge and description */}
                        <div className="space-y-2 pt-1.5">
                          <span className={`inline-flex px-2.5 py-0.5 rounded text-[9.5px] font-bold font-mono tracking-wide uppercase ${badgeClass}`}>
                            {statusText}
                          </span>
                          <p className="text-[11px] text-gray-400 leading-relaxed bg-[#080d1a]/40 p-3 rounded-lg border border-slate-850/80 font-sans">
                            {statusDesc}
                          </p>
                        </div>

                        {isOwnProfile && (
                          <div className="flex space-x-2.5 pt-1">
                            <button
                              type="button"
                              onClick={() => setEditingJob(job)}
                              className="flex-1 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-[11px] py-1.5 px-3 rounded-lg transition-colors cursor-pointer text-center"
                            >
                              ✍️ Зар Засах
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                if (window.confirm('Та энэ зарыг устгахдаа итгэлтэй байна уу? Устгасны дараа сэргээх боломжгүй.')) {
                                  try {
                                    await deleteJob(job.id);
                                    
                                    const allJobs = await getJobs();
                                    const filteredJobs = allJobs.filter(j => j.employerId === profileUser.id);
                                    setDriverJobs(filteredJobs);
                                    
                                    setSuccess('Зарыг амжилттай устгалаа.');
                                    setTimeout(() => setSuccess(''), 3000);
                                  } catch (err) {
                                    console.error(err);
                                    alert('Зарыг устгахад алдаа гарлаа.');
                                  }
                                }
                              }}
                              className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] py-1.5 px-3 rounded-lg transition-colors cursor-pointer text-center"
                            >
                              🗑️ Зар Устгах
                            </button>
                          </div>
                        )}

                        {job.hiredOperatorId && (
                          <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-850 flex justify-between items-center text-[10.5px] mt-2">
                            <span className="text-slate-500">Томилогдсон жолооч:</span>
                            <button
                              type="button"
                              onClick={() => {
                                router.push(`/profile?id=${job.hiredOperatorId}`);
                              }}
                              className="font-semibold text-emerald-400 hover:text-emerald-350 hover:underline cursor-pointer text-left transition-colors"
                            >
                              {job.hiredOperatorName}
                            </button>
                          </div>
                        )}

                        {/* Applicants rendering for open jobs */}
                        {job.status === 'open' && job.applicants.length > 0 && (
                          <div className="space-y-2 pt-2 border-t border-slate-850">
                            <span className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider flex items-center space-x-1.5">
                              <Users className="w-3.5 h-3.5 text-emerald-500" />
                              <span>Ирүүлсэн хүсэлтүүд ({job.applicants.length}):</span>
                            </span>
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                              {job.applicants.map((opId) => {
                                const op = allUsers.find(u => u.id === opId);
                                if (!op) return null;
                                return (
                                  <div
                                    key={op.id}
                                    className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-850 flex items-center justify-between text-xs"
                                  >
                                    <div
                                      onClick={() => router.push(`/profile?id=${op.id}`)}
                                      className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
                                    >
                                      <img
                                        src={op.profileImage}
                                        alt={op.fullName}
                                        className="w-7 h-7 rounded-full object-cover border border-slate-800"
                                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=U&background=334155&color=fff'; }}
                                      />
                                      <div>
                                        <div className="font-bold text-white hover:text-emerald-400 hover:underline">{op.fullName}</div>
                                        <div className="text-[10px] text-amber-400 flex items-center space-x-0.5">
                                          <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-500" />
                                          <span>{op.rating.toFixed(1)} ({op.experienceYears || 0} жил)</span>
                                        </div>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleHireOperator(job.id, op.id)}
                                      className="bg-emerald-600 hover:bg-emerald-555 text-white font-bold text-[10px] py-1 px-2.5 rounded-lg transition-colors cursor-pointer"
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
                              className="w-full bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs py-2 px-3 rounded-lg transition-colors cursor-pointer flex items-center justify-center space-x-1"
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
                              <div className="bg-emerald-950/10 border border-emerald-500/20 p-3 rounded-lg text-xs space-y-1.5 mt-2">
                                <div className="flex justify-between items-center text-[10.5px]">
                                  <span className="font-bold text-emerald-400">Жолоочийн үнэлгээ:</span>
                                  <div className="flex items-center space-x-0.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star 
                                        key={star} 
                                        className={`w-3 h-3 ${star <= receivedReview.rating ? 'fill-amber-400 text-amber-500' : 'text-slate-700'}`} 
                                      />
                                    ))}
                                    <span className="font-bold font-mono ml-1 text-white">{receivedReview.rating}.0</span>
                                  </div>
                                </div>
                                <p className="text-[11px] text-slate-300 italic">"{receivedReview.comment}"</p>
                              </div>
                            );
                          })()}

                          <div className="border-t border-slate-850/80 pt-3.5 flex items-center justify-between">
                             <div className="flex items-center space-x-1 text-xs">
                              <DollarSign className="w-3.5 h-3.5 text-emerald-455" />
                              <span className="font-mono font-bold text-white">
                                {job.salary === 0 ? 'Тохиролцоно' : `${job.salary.toLocaleString()} ₮`}
                              </span>
                            </div>

                            {job.isReviewedByEmployer ? (
                              <span className="text-[10px] text-emerald-450 bg-emerald-950/20 px-2.5 py-1 rounded font-semibold border border-emerald-900/30">
                                ✓ Жолоочийг үнэлсэн
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setActiveReviewJob(job)}
                                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10.5px] py-1.5 px-3.5 rounded-lg transition-colors cursor-pointer"
                              >
                                Жолоочийг Үнэлэх
                              </button>
                            )}
                          </div>
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
            // Refresh data
            const allJobs = await getJobs();
            const filteredJobs = allJobs.filter(j => 
              j.applicants.includes(profileUser.id) || 
              j.hiredOperatorId === profileUser.id
            );
            setDriverJobs(filteredJobs);

            const allReviews = await getReviews();
            const reviews = allReviews.filter(r => {
              if (profileUser.type === 'operator') {
                return r.reviewerType === 'employer' && (r.jobId.includes('unreliable') ? profileUser.id === 'user_op_unreliable' : profileUser.id !== 'user_op_unreliable');
              } else {
                return r.reviewerType === 'operator';
              }
            });
            const dispReviews = profileUser.id === 'user_op_unreliable' 
              ? allReviews.filter(r => r.id.includes('unreliable'))
              : reviews.filter(r => !r.id.includes('unreliable'));
            setDisplayReviews(dispReviews);

            const allHistory = await getJobHistory();
            const histItems = allHistory.filter(h => {
              if (profileUser.id === 'user_op_unreliable') {
                return h.id.includes('unreliable');
              }
              return h.role === profileUser.type && !h.id.includes('unreliable');
            });
            setHistoryItems(histItems);

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
            
            const allJobs = await getJobs();
            const filteredJobs = allJobs.filter(j => j.employerId === profileUser.id);
            setDriverJobs(filteredJobs);
            
            setSuccess('🎉 Ажлын зар амжилттай засагдаж шинэчлэгдлээ!');
            setTimeout(() => setSuccess(''), 3000);
          }}
        />
      )}



    </div>
  );
}
