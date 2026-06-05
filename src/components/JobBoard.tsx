'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { User, Job, Review, AppNotification } from '../types';
import {
  getJobs,
  saveJobs,
  applyForJob,
  hireOperator,
  completeJob,
  getUsers,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  addNotification,
  deleteNotification,
  deleteAllNotifications,
  addJob,
  getReviews,
  getSingleReview,
  setCurrentUser
} from '../lib/db';
import {
  Search,
  Filter,
  Briefcase,
  MapPin,
  Calendar,
  DollarSign,
  PlusCircle,
  TrendingUp,
  Award,
  Star,
  ShieldCheck,
  ChevronDown,
  LogOut,
  User as UserIcon,
  Settings as SettingsIcon,
  CheckCircle,
  Users,
  Clock,
  AlertTriangle,
  Bell,
  X,
  Trash2
} from 'lucide-react';
import JobPostModal from './JobPostModal';
import ReviewModal from './ReviewModal';

interface JobBoardProps {
  currentUser: User;
  onLogout?: () => void;
  onNavigateToProfile?: () => void;
  onNavigateToSettings?: () => void;
  onNavigateToApplications?: (jobId?: string) => void;
  onViewUserProfile?: (user: User) => void;
}

const getFirstName = (userOrName?: any): string => {
  if (!userOrName) return '';
  if (typeof userOrName === 'string') {
    const parts = userOrName.trim().split(/\s+/);
    return parts[parts.length - 1] || userOrName;
  }
  if (userOrName.type === 'employer' && userOrName.companyName && userOrName.companyName.trim()) {
    return userOrName.companyName.trim();
  }
  if (userOrName.firstName && userOrName.firstName.trim()) {
    return userOrName.firstName.trim();
  }
  if (userOrName.fullName) {
    const parts = userOrName.fullName.trim().split(/\s+/);
    return parts[parts.length - 1] || userOrName.fullName;
  }
  return '';
};
const LOCATION_OPTIONS = [
  'Бүгд',
  'Улаанбаатар хот',
  'Архангай аймаг',
  'Баян-Өлгий аймаг',
  'Баянхонгор аймаг',
  'Булган аймаг',
  'Говь-Алтай аймаг',
  'Говьсүмбэр аймаг',
  'Дархан-Уул аймаг',
  'Дорноговь аймаг',
  'Дорнод аймаг',
  'Дундговь аймаг',
  'Завхан аймаг',
  'Орхон аймаг',
  'Өвөрхангай аймаг',
  'Өмнөговь аймаг',
  'Сүхбаатар аймаг',
  'Сэлэнгэ аймаг',
  'Төв аймаг',
  'Увс аймаг',
  'Ховд аймаг',
  'Хөвсгөл аймаг',
  'Хэнтий аймаг'
];

export default function JobBoard({
  currentUser
}: JobBoardProps) {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('Бүгд');
  const [selectedType, setSelectedType] = useState<string>('Бүгд');
  
  // Modals & States
  const [showPostModal, setShowPostModal] = useState<boolean>(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  
  // Custom Review triggers
  const [activeReviewJob, setActiveReviewJob] = useState<Job | null>(null);

  // Dropdown hover state emulator
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);

  // Notifications States
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotificationsMenu, setShowNotificationsMenu] = useState<boolean>(false);
  const [toasts, setToasts] = useState<AppNotification[]>([]);

  const [successMessage, setSuccessMessage] = useState<string>('');
  const [viewingReview, setViewingReview] = useState<Review | null>(null);
  const [isLoadingReview, setIsLoadingReview] = useState<boolean>(false);

  const notificationsRef = useRef<AppNotification[]>([]);
  const notificationsMenuRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const addErrorToast = (message: string) => {
    const newErrNotif: AppNotification = {
      id: 'err_' + Date.now(),
      userId: currentUser.id,
      title: 'Алдаа',
      message,
      type: 'alert',
      isRead: false,
      createdAt: new Date().toLocaleTimeString().slice(0, 5)
    };
    setToasts(prev => [newErrNotif, ...prev]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== newErrNotif.id));
    }, 4500);
  };

  const refreshJobs = async () => {
    const allJobs = await getJobs();
    setJobs(allJobs);
    if (selectedJob) {
      const updated = allJobs.find(j => j.id === selectedJob.id);
      setSelectedJob(updated || null);
    }
  };

  const refreshUsers = async () => {
    const allUsers = await getUsers();
    setUsers(allUsers);
  };

  // Function to load notifications and sync unread count
  const refreshNotifications = async () => {
    const freshNotifs = await getNotifications(currentUser.id);
    
    // Check if there are any new unread notifications that aren't already in the local state,
    // to trigger the toast alert!
    if (notificationsRef.current.length > 0) {
      const freshUnreads = freshNotifs.filter(n => !n.isRead);
      const prevUnreadIds = notificationsRef.current.filter(n => !n.isRead).map(n => n.id);
      
      freshUnreads.forEach(newNotif => {
        if (!prevUnreadIds.includes(newNotif.id)) {
          // Add toast alert!
          setToasts(prev => [newNotif, ...prev]);
          // Remove toast after 4.5 seconds
          setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== newNotif.id));
          }, 4500);
        }
      });
    }
    
    setNotifications(freshNotifs);
  };

  useEffect(() => {
    const load = async () => {
      await Promise.all([refreshJobs(), refreshUsers(), refreshNotifications()]);
    };
    load();
  }, []);

  // Keep notificationsRef updated
  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  // Click outside to close notifications menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationsMenuRef.current && !notificationsMenuRef.current.contains(event.target as Node)) {
        setShowNotificationsMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Polling for real-time feel (4 seconds)
  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        // Sync in background
        const freshNotifs = await getNotifications(currentUser.id);
        const freshUnreads = freshNotifs.filter(n => !n.isRead);
        const prevUnreadIds = notificationsRef.current.filter(n => !n.isRead).map(n => n.id);
        
        let hasNew = false;
        freshUnreads.forEach(newNotif => {
          if (!prevUnreadIds.includes(newNotif.id)) {
            hasNew = true;
            setToasts(prev => [newNotif, ...prev]);
            setTimeout(() => {
              setToasts(prev => prev.filter(t => t.id !== newNotif.id));
            }, 4500);
          }
        });
        
        if (hasNew || freshNotifs.length !== notificationsRef.current.length) {
          setNotifications(freshNotifs);
        }

        // Sync jobs & users in background
        const allJobs = await getJobs();
        setJobs(allJobs);
        const allUsers = await getUsers();
        setUsers(allUsers);
      } catch (err) {
        console.error('Error in polling loop:', err);
      }
    }, 4000);

    return () => clearInterval(timer);
  }, [currentUser.id]);

  const toggleNotificationsMenu = () => {
    setShowNotificationsMenu(prev => {
      const next = !prev;
      if (next) setShowProfileMenu(false);
      return next;
    });
  };

  const toggleProfileMenu = () => {
    setShowProfileMenu(prev => {
      const next = !prev;
      if (next) setShowNotificationsMenu(false);
      return next;
    });
  };

  // Actions with optimistic UI updates for instantaneous responsiveness
  const handleMarkAsRead = async (id: string) => {
    // Optimistically mark as read in local state
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    try {
      await markNotificationAsRead(id);
      const freshNotifs = await getNotifications(currentUser.id);
      setNotifications(freshNotifs);
    } catch (err) {
      console.error(err);
      // Rollback on failure
      const freshNotifs = await getNotifications(currentUser.id);
      setNotifications(freshNotifs);
      addErrorToast('Үйлдэл гүйцэтгэхэд алдаа гарлаа. Дахин оролдоно уу.');
    }
  };

  const handleNotificationClick = async (notif: AppNotification) => {
    // 1. Mark as read if not already read
    if (!notif.isRead) {
      handleMarkAsRead(notif.id);
    }
    
    // 2. Close notifications menu and remove from toasts
    setShowNotificationsMenu(false);
    setToasts(prev => prev.filter(t => t.id !== notif.id));
    
    // 3. Determine target navigation
    const title = notif.title.toLowerCase();
    const msg = notif.message.toLowerCase();
    
    if (title.includes('үнэлгээ')) {
      setIsLoadingReview(true);
      try {
        let reviewToShow: Review | null = null;
        if (notif.relatedId) {
          reviewToShow = await getSingleReview(notif.relatedId);
        }
        
        if (!reviewToShow) {
          // Fallback: fetch all reviews for this user and get the latest one
          const allReviews = await getReviews();
          const allJobs = await getJobs();
          
          const myJobIds = new Set<string>();
          for (const j of allJobs) {
            if (currentUser.type === 'operator' && j.hiredOperatorId === currentUser.id) {
              myJobIds.add(j.id);
            } else if (currentUser.type === 'employer' && j.employerId === currentUser.id) {
              myJobIds.add(j.id);
            }
          }
          
          const myReviews = allReviews.filter(r => 
            myJobIds.has(r.jobId) && 
            r.reviewerType !== currentUser.type && 
            r.reviewerId !== currentUser.id
          );
          
          if (myReviews.length > 0) {
            myReviews.sort((a, b) => b.id.localeCompare(a.id));
            reviewToShow = myReviews[0];
          }
        }
        
        if (reviewToShow) {
          router.push(`/applications?jobId=${reviewToShow.jobId}`);
        } else {
          router.push('/profile');
        }
      } catch (err) {
        console.error('Error loading review details:', err);
        router.push('/profile');
      } finally {
        setIsLoadingReview(false);
      }
    } else if (title.includes('хүсэлт') || title.includes('сонгогдлоо') || title.includes('ажил дууслаа') || title.includes('гүйцэтгэл')) {
      let resolvedJobId: string | null = null;
      if (notif.relatedId) {
        resolvedJobId = notif.relatedId;
      } else {
        // Fallback for old notifications
        try {
          const quoteMatch = notif.message.match(/"([^"]+)"/);
          const jobTitle = quoteMatch ? quoteMatch[1] : null;
          
          const allJobs = await getJobs();
          let candidateJobs = allJobs.filter(j => {
            if (currentUser.type === 'operator') {
              return j.hiredOperatorId === currentUser.id || j.applicants.includes(currentUser.id);
            } else {
              return j.employerId === currentUser.id;
            }
          });
          
          if (jobTitle) {
            candidateJobs = candidateJobs.filter(j => j.title.toLowerCase().includes(jobTitle.toLowerCase()));
          }
          
          // Filter by status matching the notification type
          const titleLower = title.toLowerCase();
          let statusFiltered = [...candidateJobs];
          if (titleLower.includes('дууслаа')) {
            statusFiltered = candidateJobs.filter(j => j.status === 'completed');
          } else if (titleLower.includes('сонгогдлоо')) {
            statusFiltered = candidateJobs.filter(j => j.status === 'in_progress');
          } else if (titleLower.includes('хүсэлт')) {
            statusFiltered = candidateJobs.filter(j => j.status === 'open');
          }
          
          // If status filtering resulted in matches, use them. Otherwise, keep the candidates matching only the title.
          if (statusFiltered.length > 0) {
            candidateJobs = statusFiltered;
          }
          
          if (candidateJobs.length > 0) {
            candidateJobs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
            resolvedJobId = candidateJobs[0].id;
          }
        } catch (err) {
          console.error('Error resolving fallback job ID:', err);
        }
      }
      router.push(resolvedJobId ? `/applications?jobId=${resolvedJobId}` : '/applications');
    } else if (title.includes('аюулгүй байдал') || title.includes('профайл') || msg.includes('миний профайл')) {
      router.push('/profile');
    } else {
      // Default fallbacks based on content
      if (msg.includes('хүсэлт') || msg.includes('ажилд')) {
        let resolvedJobId: string | null = null;
        if (notif.relatedId) {
          resolvedJobId = notif.relatedId;
        }
        router.push(resolvedJobId ? `/applications?jobId=${resolvedJobId}` : '/applications');
      } else {
        router.push('/profile');
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    // Optimistically mark all as read in local state
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    try {
      await markAllNotificationsAsRead(currentUser.id);
      const freshNotifs = await getNotifications(currentUser.id);
      setNotifications(freshNotifs);
    } catch (err) {
      console.error(err);
      // Rollback on failure
      const freshNotifs = await getNotifications(currentUser.id);
      setNotifications(freshNotifs);
      addErrorToast('Үйлдэл гүйцэтгэхэд алдаа гарлаа. Дахин оролдоно уу.');
    }
  };

  const handleDeleteNotification = async (id: string) => {
    // Optimistically remove from local state
    setNotifications(prev => prev.filter(n => n.id !== id));
    try {
      await deleteNotification(id);
      const freshNotifs = await getNotifications(currentUser.id);
      setNotifications(freshNotifs);
    } catch (err) {
      console.error(err);
      // Rollback on failure
      const freshNotifs = await getNotifications(currentUser.id);
      setNotifications(freshNotifs);
      addErrorToast('Үйлдэл гүйцэтгэхэд алдаа гарлаа. Дахин оролдоно уу.');
    }
  };

  const handleDeleteAllNotifications = async () => {
    // Optimistically clear all in local state
    setNotifications([]);
    try {
      await deleteAllNotifications(currentUser.id);
      const freshNotifs = await getNotifications(currentUser.id);
      setNotifications(freshNotifs);
    } catch (err) {
      console.error(err);
      // Rollback on failure
      const freshNotifs = await getNotifications(currentUser.id);
      setNotifications(freshNotifs);
      addErrorToast('Үйлдэл гүйцэтгэхэд алдаа гарлаа. Дахин оролдоно уу.');
    }
  };



  const handleApply = async (jobId: string) => {
    try {
      const success = await applyForJob(jobId, currentUser.id);
      if (success) {
        setSuccessMessage('🔒 Таны ажилд орох хүсэлт, ажлын түүх ба үнэлгээний хамт захиалагчид амжилттай илгээгдлээ.');
        setTimeout(() => setSuccessMessage(''), 4500);
        await refreshJobs();
      }
    } catch (err) {
      console.error(err);
      addErrorToast('Үйлдэл гүйцэтгэхэд алдаа гарлаа. Дахин оролдоно уу.');
    }
  };

  const handleHire = async (jobId: string, operatorId: string) => {
    try {
      const success = await hireOperator(jobId, operatorId);
      if (success) {
        setSuccessMessage('🤝 Жолоочийг ажилд амжилттай томиллоо. Хамтын ажиллагааны гэрээ батлагдсан тул хариуцлагатай ажиллана уу.');
        setTimeout(() => setSuccessMessage(''), 4500);
        await refreshJobs();
      }
    } catch (err) {
      console.error(err);
      addErrorToast('Үйлдэл гүйцэтгэхэд алдаа гарлаа. Дахин оролдоно уу.');
    }
  };

  const handleCompleteAndReviewTrigger = async (job: Job) => {
    try {
      const success = await completeJob(job.id);
      if (success) {
        await refreshJobs();
        const allJobs = await getJobs();
        const updated = allJobs.find(j => j.id === job.id);
        if (updated) setSelectedJob(updated);
        
        // Trigger review popup for the other user!
        setActiveReviewJob(updated || job);
      }
    } catch (err) {
      console.error(err);
      addErrorToast('Үйлдэл гүйцэтгэхэд алдаа гарлаа. Дахин оролдоно уу.');
    }
  };

  // Get all unique job types present in the active jobs
  const getUniqueJobTypes = () => {
    const defaultTypes = [
      { value: 'Бүгд', label: 'Бүх маягт' },
      { value: 'operator_hiring', label: 'Жолооч, оператор хайж байна' },
      { value: 'machinery_rental', label: 'Машин механизмын түрээс' },
      { value: 'earthwork', label: 'Барилга, зам, газар шорооны ажил' }
    ];
    
    const activeTypes = new Set<string>();
    jobs.forEach(j => {
      if (j.type && j.type !== 'operator_hiring' && j.type !== 'machinery_rental' && j.type !== 'earthwork') {
        activeTypes.add(j.type);
      }
    });
    
    const customTypes = Array.from(activeTypes).map(t => ({
      value: t,
      label: t
    }));
    
    return [...defaultTypes, ...customTypes];
  };

  // Filter & Search Logic
  const filteredJobs = jobs.filter(job => {
    const matchesKeyword = 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.machineryType.toLowerCase().includes(searchQuery.toLowerCase());

    const cleanLocation = (loc: string) => {
      return loc
        .toLowerCase()
        .replace(/\s*(аймаг|хот)\b/gi, '')
        .trim();
    };

    const matchesLocation = 
      selectedLocation === 'Бүгд' || 
      cleanLocation(job.location).includes(cleanLocation(selectedLocation));

    const matchesType =
      selectedType === 'Бүгд' ||
      job.type === selectedType;

    return matchesKeyword && matchesLocation && matchesType;
  });

  const unreadNotifs = notifications.filter(n => !n.isRead);

  return (
    <div id="job-board-root" className="min-h-screen bg-slate-950 text-white font-sans flex flex-col relative overflow-x-hidden">
      
      {/* Dynamic Upper Banner alerting users about historical accountability */}
      <div className="bg-amber-500 text-slate-950 px-4 py-2.5 text-center text-xs font-semibold flex items-center justify-center space-x-2 border-b border-amber-600">
        <span>АНХААРУУЛГА: Ажлын хариуцлага алдаж шалтгаангүй ажил хаясан, техникт санаатай хохирол учруулсан, ажлын байранд архидан согтуурсан, цалин хөлс олгоогүй гэх мэт ноцтой зөрчил гаргасан тохиолдолд хэрэглэгчийн мэдээллийг хар дансанд бүртгэж, цаашид системийг ашиглах боломжгүй болох эрсдэлтэйг анхаарна уу.</span>
      </div>

      {/* Nav bar */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-[#080d1a] border border-emerald-500/20 flex items-center justify-center relative overflow-hidden shrink-0 shadow-md">
            <svg className="w-6 h-6 text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.3)]" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              {/* Caterpillar Track base */}
              <rect x="6" y="46" width="36" height="8" rx="4" fill="currentColor" fillOpacity="0.1" />
              <line x1="12" y1="50" x2="36" y2="50" strokeWidth="2" strokeDasharray="4 3" />
              <circle cx="11" cy="50" r="2" fill="currentColor" />
              <circle cx="24" cy="50" r="2" fill="currentColor" />
              <circle cx="37" cy="50" r="2" fill="currentColor" />
              
              {/* Rotating Cabin base structure */}
              <path d="M10 40h28v6H10z" fill="currentColor" fillOpacity="0.2" />
              <path d="M14 26h18v14H14z" fill="currentColor" fillOpacity="0.1" />
              <path d="M16 26h10l4 8H14l2-8z" />
              
              {/* Boom (Main arm) - extending up and right */}
              <path d="M28 34 L44 14" strokeWidth="4.5" className="text-cyan-400" />
              
              {/* Dipper / Stick (Outer arm) - pivoting down from boom tip */}
              <path d="M44 14 L52 30" strokeWidth="3.5" className="text-amber-400" />
              
              {/* Bucket / Scoop - pivoting at the end of the stick */}
              <path d="M52 30 L46 36 L39 33 Z" fill="currentColor" fillOpacity="0.3" strokeWidth="2.5" className="text-amber-500" />
              
              {/* Joint Pins */}
              <circle cx="28" cy="34" r="2" className="fill-white stroke-none" />
              <circle cx="44" cy="14" r="2" className="fill-white stroke-none" />
              <circle cx="52" cy="30" r="2" className="fill-white stroke-none" />
              
              {/* Hydraulic lines */}
              <path d="M26 30 Q36 22 41 16" stroke="currentColor" strokeWidth="1" opacity="0.6" />
            </svg>
          </div>
          <div>
            <span className="font-bold tracking-tight text-white block text-sm font-sans md:text-base">Хүнд машин, механизм & Газар шорооны ажлын сайт</span>
          </div>
        </div>

        {/* Profile and Notifications triggers */}
        <div className="flex items-center space-x-3.5">
          


          {currentUser.type === 'employer' && (
            <button
              id="header-post-job-btn"
              onClick={() => setShowPostModal(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-3.5 py-2 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer shadow-md shadow-emerald-950/20"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Зар нэмэх</span>
            </button>
          )}

          {/* Notifications Bell Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={toggleNotificationsMenu}
              className="relative p-2 bg-slate-800 hover:bg-slate-700/80 active:scale-95 border border-slate-700 hover:border-slate-600 rounded-full transition-all duration-200 cursor-pointer text-slate-350 hover:text-white shadow-inner focus:outline-none"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifs.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white font-mono text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center border border-slate-900 animate-bounce">
                  {unreadNotifs.length}
                </span>
              )}
            </button>

            {showNotificationsMenu && (
              <div
                id="notifications-dropdown-menu"
                ref={notificationsMenuRef}
                className="absolute right-0 mt-2.5 w-[360px] bg-slate-900/95 backdrop-blur-md border border-slate-700/70 rounded-2xl shadow-2xl z-50 py-2 animate-fade-in"
              >
                <div className="px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 tracking-wide uppercase font-sans">Системийн мэдэгдлүүд</span>
                  {unreadNotifs.length > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllAsRead}
                      className="text-[10px] bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-400 border border-emerald-850/40 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer"
                    >
                      Бүгдийг уншсанаар тэмдэглэх
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60 scrollbar-thin">
                  {notifications.length === 0 ? (
                    <div className="py-10 px-4 text-center flex flex-col items-center justify-center space-y-2">
                      <CheckCircle className="w-8 h-8 text-slate-600 animate-pulse-soft" />
                      <p className="text-xs text-slate-500 italic">Мэдэгдэл одоогоор байхгүй байна.</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-3.5 text-left transition-all duration-300 relative flex items-start space-x-3 hover:bg-slate-850/20 cursor-pointer ${
                          notif.isRead ? 'bg-transparent opacity-70 hover:opacity-100' : 'bg-slate-850/40 border-l-3 border-emerald-500'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-1">
                            <h5 className="text-xs font-bold text-white leading-tight font-sans">{notif.title}</h5>
                            <span className="text-[8px] text-slate-500 font-mono shrink-0">{notif.createdAt}</span>
                          </div>
                          <p className="text-[11px] text-slate-300 leading-relaxed mt-1 font-sans">{notif.message}</p>
                          
                          <div className="flex items-center space-x-2 mt-2.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteNotification(notif.id);
                              }}
                              className="bg-rose-950/30 hover:bg-rose-900/50 active:scale-95 text-rose-455 border border-rose-800/30 px-2 py-1 rounded text-[10px] font-bold transition-all flex items-center space-x-1 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Устгах</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {notifications.length > 0 && (
                  <div className="px-4 py-2 border-t border-slate-800 text-center">
                    <button
                      type="button"
                      onClick={handleDeleteAllNotifications}
                      className="w-full bg-rose-950/20 hover:bg-rose-900/40 active:scale-98 border border-rose-800/30 hover:border-rose-700/50 text-rose-400 hover:text-white py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer font-sans"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>БҮХ МЭДЭГДЛИЙГ УСТГАХ</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Profile hover container */}
          <div
            id="profile-hover-trigger"
            className="relative"
            onMouseEnter={() => { setShowProfileMenu(true); setShowNotificationsMenu(false); }}
            onMouseLeave={() => setShowProfileMenu(false)}
          >
            <button
              id="profile-dropdown-btn"
              onClick={toggleProfileMenu}
              className="flex items-center space-x-2 bg-slate-800 p-1.5 pl-3 rounded-full hover:bg-slate-700 transition-colors border border-slate-700 text-left cursor-pointer"
            >
              <div className="hidden md:block">
                <p className="text-xs font-semibold text-white leading-none">{getFirstName(currentUser)}</p>
                <span className="text-[9px] text-emerald-400 font-mono">
                  {currentUser.type === 'operator' ? 'Жолооч' : 'Ажил олгогч'} • {currentUser.rating}⭐
                </span>
              </div>
              <img
                src={currentUser.profileImage}
                alt="user avatar"
                className="w-8 h-8 rounded-full object-cover border-2 border-emerald-500"
                referrerPolicy="no-referrer"
                onError={(e) => { (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=U&background=334155&color=fff'; }}
              />
              <ChevronDown className="w-3.5 h-3.5 text-gray-405" />
            </button>

            {/* Hover Floating Menus WITH tight border logic */}
            {showProfileMenu && (
              <div
                id="profile-hover-menu"
                ref={profileMenuRef}
                className="absolute right-0 top-full pt-1.5 w-48 z-50 animate-fade-in"
                onMouseEnter={() => setShowProfileMenu(true)}
                onMouseLeave={() => setShowProfileMenu(false)}
              >
                <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-2">
                  <div className="px-3.5 py-2 border-b border-slate-800 text-[11px] text-gray-500 font-semibold font-mono">
                    Сонголтууд
                  </div>
                  
                  <button
                    id="menu-goto-profile"
                    onClick={() => { router.push('/profile'); setShowProfileMenu(false); }}
                    className="w-full text-left px-4 py-2 text-xs hover:bg-slate-800 text-gray-300 hover:text-white flex items-center space-x-2.5 transition-colors cursor-pointer"
                  >
                    <UserIcon className="w-4 h-4 text-emerald-400" />
                    <span>Миний профайл</span>
                  </button>

                  <button
                    id="menu-goto-applications"
                    onClick={() => { router.push('/applications'); setShowProfileMenu(false); }}
                    className="w-full text-left px-4 py-2 text-xs hover:bg-slate-800 text-gray-300 hover:text-white flex items-center space-x-2.5 transition-colors cursor-pointer"
                  >
                    <Briefcase className="w-4 h-4 text-emerald-455" />
                    <span>{currentUser.type === 'operator' ? 'Миний хүсэлтүүд' : 'Миний байршуулсан зарууд'}</span>
                  </button>
                  
                  <button
                    id="menu-goto-settings"
                    onClick={() => { router.push('/settings'); setShowProfileMenu(false); }}
                    className="w-full text-left px-4 py-2 text-xs hover:bg-slate-800 text-gray-300 hover:text-white flex items-center space-x-2.5 transition-colors cursor-pointer"
                  >
                    <SettingsIcon className="w-4 h-4 text-emerald-400" />
                    <span>Тохиргооны хэсэг</span>
                  </button>

                  <div className="border-t border-slate-800 my-1"></div>

                  <button
                    id="menu-logout"
                    onClick={() => {
                      setCurrentUser(null);
                      router.push('/auth');
                      setShowProfileMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs hover:bg-slate-800 text-rose-400 hover:text-rose-400 flex items-center space-x-2.5 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Системээс гарах</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Filters & Job Listings */}
        <div className="lg:col-span-2 space-y-6">

          {/* Success Message Banner */}
          {successMessage && (
            <div className="bg-emerald-500/10 border border-emerald-500 text-emerald-300 p-3.5 rounded-xl text-xs flex items-center space-x-2.5 animate-bounce">
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Dashboard Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-900/40 p-3.5 border border-slate-800 rounded-xl">
              <span className="text-[10px] text-gray-500 uppercase block font-mono">Нийт зар</span>
              <span className="text-xl font-black text-white">{jobs.length} зар</span>
            </div>
            <div className="bg-slate-900/40 p-3.5 border border-slate-800 rounded-xl">
              <span className="text-[10px] text-gray-500 uppercase block font-mono">Бүртгэлтэй хэрэглэгч</span>
              <span className="text-xl font-black text-emerald-400">
                {users.length > 0 ? users.length : '...'} хэрэглэгч
              </span>
            </div>
            <div className="bg-slate-900/40 p-3.5 border border-slate-800 rounded-xl">
              <span className="text-[10px] text-gray-500 uppercase block font-mono">Аюулгүй ажиллагаа</span>
              <span className="text-xl font-black text-amber-400">99.4% сайн</span>
            </div>
          </div>

          {/* Search bar & filter buttons */}
          <div className="bg-gradient-to-br from-slate-900/80 to-slate-950/80 backdrop-blur-md p-5 border border-slate-800/80 rounded-2xl space-y-4 shadow-xl shadow-slate-950/40">
            
            {/* Search inputs */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-500" />
              <input
                id="board-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Экскаватор, Шакман жолооч, Дамп, Өмнөговь гэж хайх..."
                className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder-gray-550 font-sans"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Dropdown Filters row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Type Category */}
              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] text-gray-450 font-bold uppercase tracking-wider text-left">Зарын төрөл</label>
                <div className="relative">
                  <select
                    id="filter-type"
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 hover:border-slate-750 text-gray-250 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer appearance-none"
                  >
                    {getUniqueJobTypes().map((t, idx) => (
                      <option key={idx} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>

              {/* Aimag location */}
              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] text-gray-455 font-bold uppercase tracking-wider text-left">Аймаг / Байршил</label>
                <div className="relative">
                  <select
                    id="filter-location"
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 hover:border-slate-750 text-gray-255 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer appearance-none"
                  >
                    <option value="Бүгд">Бүх байршил (21 аймаг + Хот)</option>
                    {LOCATION_OPTIONS.filter(l => l !== 'Бүгд').map((l, id) => (
                      <option key={id} value={l}>{l}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Active Filters Summary */}
            {(searchQuery || selectedLocation !== 'Бүгд' || selectedType !== 'Бүгд') && (
              <div className="flex items-center justify-between text-[10px] bg-emerald-500/5 border border-emerald-500/10 p-2.5 rounded-xl animate-fade-in">
                <div className="flex flex-wrap items-center gap-1.5 text-gray-400">
                  <Filter className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Шүүлтүүр:</span>
                  {searchQuery && <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-850 text-white font-mono font-medium">"{searchQuery}"</span>}
                  {selectedLocation !== 'Бүгд' && <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-855 text-white font-mono font-medium">{selectedLocation}</span>}
                  {selectedType !== 'Бүгд' && (
                    <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-855 text-white font-mono font-medium">
                      {getUniqueJobTypes().find(t => t.value === selectedType)?.label || selectedType}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedLocation('Бүгд');
                    setSelectedType('Бүгд');
                  }}
                  className="text-emerald-500 hover:text-emerald-450 font-bold hover:underline transition-all cursor-pointer flex items-center space-x-1 shrink-0 ml-2"
                >
                  <span>Арилгах ✕</span>
                </button>
              </div>
            )}

          </div>

          {/* Job listings container */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-400 tracking-wider uppercase text-left">
              Шороо замын нээлттэй зарууд ({filteredJobs.length})
            </h3>

            {filteredJobs.length === 0 ? (
              <div className="bg-slate-900/20 border border-slate-800 p-12 text-center rounded-xl">
                <p className="text-sm text-gray-400">Хайлтанд нийцэх ажил олдсонгүй.</p>
                <button
                  id="reset-filters-btn"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedLocation('Бүгд');
                    setSelectedType('Бүгд');
                  }}
                  className="mt-3 text-xs text-emerald-500 hover:underline cursor-pointer"
                >
                  Бүх шүүлтүүрийг арилгах
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredJobs.map((job) => (
                  <div
                    id={`job-card-${job.id}`}
                    key={job.id}
                    onClick={() => setSelectedJob(job)}
                    className={`bg-slate-900/60 hover:bg-slate-900 transition-all border p-4 rounded-xl cursor-pointer flex flex-col justify-between space-y-4 text-left group ${
                      selectedJob?.id === job.id ? 'border-emerald-500 ring-1 ring-emerald-500/20' : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-start gap-1">
                        <span className="font-mono text-[10px] text-emerald-400 bg-emerald-900/10 px-2 py-0.5 rounded border border-emerald-900/25">
                          🚜 {job.machineryType}
                        </span>
                        <span className="text-[10px] text-gray-500 shrink-0 flex items-center space-x-1">
                          <MapPin className="w-3 h-3" />
                          <span>{job.location.split(',')[0]}</span>
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors leading-snug">
                        {job.title}
                      </h4>

                      <p className="text-[11px] text-gray-400 line-clamp-3 leading-relaxed">
                        {job.description}
                      </p>
                    </div>

                    <div className="border-t border-slate-800/80 pt-3 flex items-center justify-between text-xs text-gray-400">
                      <div className="flex items-center space-x-1">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="font-mono font-bold text-white">{job.salary.toLocaleString()} ₮</span>
                        <span className="text-[10px] text-gray-500"> / {job.salaryUnit}</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/20 px-2 py-0.5 rounded">
                        {job.status === 'open' ? 'Нээлттэй' : job.status === 'in_progress' ? 'Гэрээ байгуулсан' : 'Дууссан'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Active detail drawer & Inspection panel */}
        <div id="job-detail-panel" className="lg:col-span-1">
          {selectedJob ? (
            <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl space-y-5 sticky top-28 text-left shadow-2xl">
              
              {/* Header */}
              <div className="border-b border-slate-800 pb-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-mono text-[10px] text-emerald-400 bg-emerald-900/10 px-2.5 py-1 rounded">
                    🚜 {selectedJob.machineryType}
                  </span>
                  <button
                    id="close-detail-panel"
                    onClick={() => setSelectedJob(null)}
                    className="text-gray-400 hover:text-white transition-colors cursor-pointer text-xs"
                  >
                    Хаах [x]
                  </button>
                </div>
                <h3 className="text-sm font-bold text-white leading-snug">{selectedJob.title}</h3>
                
                {/* Employer preview */}
                <button
                  type="button"
                  onClick={() => {
                    const employerUser = users.find(u => u.id === selectedJob.employerId);
                    if (employerUser) {
                      router.push(`/profile/${employerUser.id}`);
                    }
                  }}
                  className="w-full mt-3 flex items-center justify-between bg-slate-850/40 p-2 rounded-lg border border-slate-800/50 hover:bg-slate-800 transition-colors text-left focus:outline-none"
                >
                  <div className="flex items-center space-x-2">
                    <UserIcon className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs text-gray-300 font-medium hover:underline">
                      {(() => {
                        const emp = users.find(u => u.id === selectedJob.employerId);
                        return emp ? getFirstName(emp) : getFirstName(selectedJob.employerName);
                      })()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 font-mono text-xs text-amber-400">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                    <span>{selectedJob.employerRating} Захиалагч</span>
                  </div>
                </button>
              </div>

              {/* Salary & details list */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-gray-500 block font-mono">Төлбөрийн хэмжээ:</span>
                  <span className="font-bold text-emerald-400 block font-mono mt-0.5">{selectedJob.salary.toLocaleString()} ₮</span>
                  <span className="text-[10px] text-gray-500"> / {selectedJob.salaryUnit}</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-gray-500 block font-mono">Ажлын хугацаа:</span>
                  <span className="font-bold text-white block mt-0.5">{selectedJob.duration}</span>
                  <span className="text-[10px] text-emerald-500 flex items-center font-mono">✓ Хариуцлагын гэрээтэй</span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-gray-400 block">Ажлын дэлгэрэнгүй тодорхойлолт:</span>
                <p className="text-xs text-gray-300 leading-relaxed bg-slate-950/40 p-3 rounded-lg border border-slate-800 whitespace-pre-wrap">
                  {selectedJob.description}
                </p>
              </div>

              {/* Requirements list */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-gray-400 block">Операторт тавигдах шаардлага:</span>
                <ul className="space-y-1.5 text-xs text-gray-300">
                  {selectedJob.requirements.map((req, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-emerald-500 mr-2 font-black">•</span>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Location info */}
              <div className="flex items-center space-x-2 text-xs text-gray-300 bg-slate-950/30 p-2.5 rounded border border-slate-800">
                <MapPin className="w-4 h-4 text-emerald-500 hover:scale-110 transition-transform" />
                <span>Байршил:</span>
                <span className="font-semibold text-white">{selectedJob.location}</span>
              </div>

              {/* Workflow Actions */}
              <div className="border-t border-slate-800 pt-4 space-y-3">
                {selectedJob.status === 'open' && (
                  <>
                    {currentUser.type === 'operator' ? (
                      selectedJob.applicants.includes(currentUser.id) ? (
                        <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 text-center text-xs text-emerald-400 font-semibold flex items-center justify-center space-x-1">
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                          <span>Та энэ заранд орох хүсэлт илгээсэн байна.</span>
                        </div>
                      ) : (
                        <button
                          id="apply-job-btn"
                          onClick={() => handleApply(selectedJob.id)}
                          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2 px-4 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center justify-center space-x-2"
                        >
                          <Briefcase className="w-4 h-4" />
                          <span>Ажилд орох хүсэлт илгээх (Түүх ба үнэлгээ хавсаргах)</span>
                        </button>
                      )
                    ) : (
                      /* Employer views their own posted job and applicants */
                      currentUser.id === selectedJob.employerId ? (
                        <div className="space-y-3">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block flex items-center space-x-1.5 border-b border-slate-850 pb-2">
                            <Users className="w-4 h-4 text-emerald-400" />
                            <span>Хүсэлт ирүүлсэн жолооч нар ({selectedJob.applicants.length})</span>
                          </span>

                          {selectedJob.applicants.length === 0 ? (
                            <p className="text-xs text-gray-500 italic pb-1">Энэ заранд одоогоор жолооч хүсэлт ирүүлээгүй байна.</p>
                          ) : (
                            <div className="space-y-2">
                              {selectedJob.applicants.map((opId) => {
                                const op = users.find(u => u.id === opId);
                                if (!op) return null;
                                return (
                                  <div
                                    id={`applicant-card-${op.id}`}
                                    key={op.id}
                                    className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors flex items-center justify-between"
                                  >
                                    <button
                                      id={`view-op-profile-${op.id}`}
                                      type="button"
                                      onClick={() => router.push(`/profile/${op.id}`)}
                                      className="flex items-center space-x-2 text-left hover:underline cursor-pointer focus:outline-none"
                                    >
                                      <img src={op.profileImage} alt={op.fullName} className="w-7 h-7 rounded-full object-cover" referrerPolicy="no-referrer" onError={(e) => { (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=U&background=334155&color=fff'; }} />
                                      <div>
                                        <div className="text-xs font-bold text-emerald-400 flex items-center space-x-1">
                                          <span>{getFirstName(op)}</span>
                                          {op.rating >= 4.5 && <span className="text-[9px] bg-emerald-600 text-white font-mono px-1 rounded">Шилдэг</span>}
                                        </div>
                                        <div className="text-[10px] text-gray-400 flex items-center space-x-1">
                                          <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                                          <span>{op.rating.toFixed(1)} ({op.ratingCount} ажил)</span>
                                        </div>
                                      </div>
                                    </button>

                                    <button
                                      id={`hire-op-btn-${op.id}`}
                                      type="button"
                                      onClick={() => handleHire(selectedJob.id, op.id)}
                                      className="bg-emerald-600 hover:bg-emerald-500 py-1 px-2.5 rounded text-[10px] font-semibold text-white cursor-pointer"
                                    >
                                      Сонгож хөлслөх
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500">Энэ зарыг өөр ажил олгогч нийтэлсэн тул жолооч ажилчин харах боломжтой.</p>
                      )
                    )}
                  </>
                )}

                {/* Job In Progress UI representing accountability state */}
                {selectedJob.status === 'in_progress' && (
                  <div className="bg-emerald-950/20 p-4 border border-emerald-900/40 rounded-xl space-y-3 text-left">
                    <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold">
                      <Clock className="w-4 h-4 animate-spin text-emerald-500" />
                      <span>АЖЛЫН ГЭРЭЭ ДУНД ТҮВШИНД ИДЭВХТЭЙ БАЙНА</span>
                    </div>

                    <p className="text-[11px] text-gray-300">
                      Томилогдсон баталгаат оператор: <strong className="text-white">
                        {(() => {
                          const op = users.find(u => u.id === selectedJob.hiredOperatorId);
                          return op ? getFirstName(op) : getFirstName(selectedJob.hiredOperatorName);
                        })()}
                      </strong>. Талууд аюулгүй байдлыг ханган ажиллана уу.
                    </p>

                    {/* Completion trigger reserved for the publisher */}
                    {currentUser.id === selectedJob.employerId && (
                      <button
                        id="employer-complete-job-btn"
                        onClick={() => handleCompleteAndReviewTrigger(selectedJob)}
                        className="w-full bg-amber-600 hover:bg-amber-500 text-slate-950 py-1.5 px-3 rounded text-xs font-bold transition-all cursor-pointer"
                      >
                        ✓ АЖИЛ БҮРЭН ДУУССАНЫГ БАТАЛГААЖУУЛЖ ҮНЭЛЭХ
                      </button>
                    )}

                    {currentUser.id !== selectedJob.employerId && (
                      <p className="text-[10px] text-slate-500">
                        Ажил олгогч энэхүү ажлыг бүтэн гүйцэтгэснийг тэмдэглэсний дараа та үнэлгээгээ бичих боломжтой болно.
                      </p>
                    )}
                  </div>
                )}

                {/* Completed Job and Review triggers */}
                {selectedJob.status === 'completed' && (
                  <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-3">
                    <div className="flex items-center space-x-1.5 text-xs text-emerald-400 font-bold">
                      <CheckCircle className="w-4 h-4" />
                      <span>ЭНЭХҮҮ АЖИЛ АМЖИЛТТАЙ ГҮЙЦЭТГЭГДЭЖ ДУУССАН</span>
                    </div>

                    {/* Review option for Operator */}
                    {currentUser.type === 'operator' && selectedJob.hiredOperatorId === currentUser.id && !selectedJob.isReviewedByOperator && (
                      <button
                        id="op-review-employer-btn"
                        onClick={() => setActiveReviewJob(selectedJob)}
                        className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 py-1.5 px-3 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                      >
                        Захиалагчийг Үнэлэх (Цалингийн мурилт эсвэл харилцаа)
                      </button>
                    )}

                    {/* Review option for Employer */}
                    {currentUser.type === 'employer' && selectedJob.employerId === currentUser.id && !selectedJob.isReviewedByEmployer && (
                      <button
                        id="emp-review-operator-btn"
                        onClick={() => setActiveReviewJob(selectedJob)}
                        className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 py-1.5 px-3 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                      >
                        Жолоочийг Үнэлэх (Согтууруулах ундаа, Ажилдаа эзэн болсон байдал)
                      </button>
                    )}

                    {((currentUser.type === 'operator' && selectedJob.isReviewedByOperator) || 
                      (currentUser.type === 'employer' && selectedJob.isReviewedByEmployer)) && (
                      <div className="text-[11px] text-gray-500 text-center italic">
                        Таны үнэлгээ системд хэдийн бүртгэгдсэн байна. Таны хариуцлагатай оролцоонд баярлалаа!
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="border-2 border-dashed border-slate-800 p-8 text-center rounded-2xl text-gray-500 text-xs py-16 sticky top-28">
              <Briefcase className="w-8 h-8 mx-auto mb-3 text-gray-600" />
              <p>Зарын жагсаалтаас аль нэг ажил сонгож дарж орсноор дэлгэрэнгүй шаардлага, байршил, төлбөрийн нөхцөлүүдийг харж, ажилд орох хүсэлт илгээх боломжтой болно.</p>
            </div>
          )}
        </div>

      </main>

      {/* Floating Toast Notification Containers */}
      <div id="toast-alerts-container" className="fixed bottom-6 right-6 z-50 flex flex-col space-y-3 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            onClick={() => handleNotificationClick(t)}
            className="pointer-events-auto bg-slate-900/90 backdrop-blur-md border-l-4 border-emerald-500 text-white px-5 py-4 rounded-xl shadow-2xl border border-slate-800 flex items-start space-x-3 w-80 animate-slide-in relative cursor-pointer hover:bg-slate-850/30 transition-colors"
          >
            <div className="flex-1 text-left">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-emerald-400 font-mono">Шинэ мэдэгдэл 🔔</span>
                <span className="text-[9px] text-slate-500 font-mono">{t.createdAt}</span>
              </div>
              <h4 className="text-xs font-bold text-white mt-1 leading-snug">{t.title}</h4>
              <p className="text-[10px] text-slate-350 leading-relaxed mt-0.5">{t.message}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Modals trigger definitions */}
      {showPostModal && (
        <JobPostModal
          employerId={currentUser.id}
          employerName={currentUser.fullName}
          employerRating={currentUser.rating}
          onClose={() => setShowPostModal(false)}
          onSuccess={async (newJob) => {
            setShowPostModal(false);
            await refreshJobs();
            setSelectedJob(newJob);
            setSuccessMessage('🎉 Ажлын зар амжилттай нийтлэгдэж, систем дэх нээлттэй жолооч нарын үзүүрт орлоо!');
            setTimeout(() => setSuccessMessage(''), 4500);
          }}
        />
      )}

      {activeReviewJob && (
        <ReviewModal
          jobId={activeReviewJob.id}
          jobTitle={activeReviewJob.title}
          targetUserId={
            currentUser.type === 'operator' 
              ? activeReviewJob.employerId 
              : activeReviewJob.hiredOperatorId || ''
          }
          targetUserName={
            currentUser.type === 'operator' 
              ? activeReviewJob.employerName 
              : activeReviewJob.hiredOperatorName || 'Жолооч'
          }
          reviewerId={currentUser.id}
          reviewerName={currentUser.fullName}
          reviewerType={currentUser.type}
          onClose={() => setActiveReviewJob(null)}
          onSuccess={async (rev) => {
            setActiveReviewJob(null);
            await refreshJobs();
            setSuccessMessage('🌟 Сэтгэгдэл, үнэлгээ амжилттай бүртгэгдэж тухайн хэрэглэгчийн албан ёсны ажлын түүхэнд шинэчлэгдэж заслаа. Хамтын оролцоонд баярлалаа.');
            setTimeout(() => setSuccessMessage(''), 4500);
          }}
        />
      )}

      {/* Viewing Review Detail Modal */}
      {viewingReview && (
        <div id="view-review-detail-modal-backdrop" className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div id="view-review-detail-modal-container" className="bg-[#0b1329] border border-slate-800 max-w-md w-full rounded-2xl overflow-hidden shadow-2xl relative">
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-850 px-6 py-4.5">
              <div className="flex items-center space-x-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <h3 className="text-sm font-semibold text-white tracking-wide">Шинэ үнэлгээний дэлгэрэнгүй</h3>
              </div>
              <button 
                id="close-view-review-modal" 
                onClick={() => setViewingReview(null)} 
                className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1 rounded-lg hover:bg-slate-850"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content body */}
            <div className="p-6 space-y-5">
              {/* Rating Big Circle */}
              <div className="flex flex-col items-center justify-center py-4 bg-slate-950/40 rounded-2xl border border-slate-850/80">
                <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 mb-3 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                  <Star className="w-8 h-8 text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
                </div>
                <span className="text-2xl font-bold font-mono text-white tracking-tight">{viewingReview.rating}.0 / 5.0</span>
                <div className="flex items-center space-x-1 mt-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star} 
                      className={`w-4 h-4 ${star <= viewingReview.rating ? 'fill-amber-400 text-amber-500' : 'text-slate-700'}`} 
                    />
                  ))}
                </div>
                <span className="text-[10px] text-slate-500 font-mono mt-2 uppercase tracking-widest">Үнэлгээний оноо</span>
              </div>

              {/* Reviewer & Job info */}
              <div className="space-y-3 bg-[#070b19]/60 p-4 rounded-xl border border-slate-850/80 text-xs text-left">
                <div className="flex justify-between items-center pb-2 border-b border-slate-850/40">
                  <span className="text-slate-500">Үнэлгээ өгсөн хүн:</span>
                  <span className="font-semibold text-emerald-400 font-sans">{viewingReview.reviewerName}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-850/40">
                  <span className="text-slate-500">Төсөл / Ажлын нэр:</span>
                  <span className="font-semibold text-slate-250 font-sans text-right truncate max-w-[60%]">{viewingReview.jobTitle}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Огноо:</span>
                  <span className="font-mono text-slate-400">{viewingReview.createdAt}</span>
                </div>
              </div>

              {/* Comment text block */}
              <div className="space-y-2 text-left">
                <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider block">Бичсэн сэтгэгдэл:</span>
                <div className="relative bg-[#070b19]/60 p-4.5 rounded-xl border border-slate-850/80 italic text-xs text-slate-250 leading-relaxed font-sans shadow-inner">
                  <span className="absolute -top-1 left-2 text-3xl text-emerald-500/20 font-serif pointer-events-none">“</span>
                  <p className="relative z-10 px-2">"{viewingReview.comment}"</p>
                  <span className="absolute -bottom-4 right-3 text-3xl text-emerald-500/20 font-serif pointer-events-none">”</span>
                </div>
              </div>

              {/* Footer info/warning */}
              <p className="text-[9.5px] text-slate-500 leading-normal text-center bg-slate-950/20 p-2 rounded-lg border border-slate-850/40">
                🛡️ Энэхүү үнэлгээ нь таны профайлын дундаж үнэлгээ болон ажилчны түүхэнд шууд нөлөөлж, бусад хэрэглэгчдэд харагдах болно.
              </p>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-1">
                <button
                  id="close-review-detail-btn"
                  type="button"
                  onClick={() => setViewingReview(null)}
                  className="flex-1 py-2.5 border border-slate-800 text-slate-350 hover:text-white text-xs font-medium rounded-xl hover:bg-slate-850/40 transition-colors cursor-pointer font-sans"
                >
                  Хаах
                </button>
                <button
                  id="go-to-profile-from-review-btn"
                  type="button"
                  onClick={() => {
                    setViewingReview(null);
                    router.push('/profile');
                  }}
                  className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-emerald-950/25 cursor-pointer font-sans"
                >
                  Миний Профайл руу очих
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading Review Detail Spinner */}
      {isLoadingReview && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-2xl flex flex-col items-center space-y-3">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs text-slate-305 font-mono">Үнэлгээг ачаалж байна...</span>
          </div>
        </div>
      )}

    </div>
  );
}
