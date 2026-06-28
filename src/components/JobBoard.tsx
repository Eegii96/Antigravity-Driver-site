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
  subscribeToJobs,
  subscribeToUsers,
  subscribeToNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  addNotification,
  deleteNotification,
  deleteAllNotifications,
  addJob,
  deleteJob,
  cancelHiring,
  getReviews,
  getSingleReview,
  setCurrentUser
} from '../lib/db';
import {
  Search,
  Filter,
  Briefcase,
  PlusCircle,
  TrendingUp,
  Star,
  ShieldCheck,
  ChevronDown,
  LogOut,
  User as UserIcon,
  Settings as SettingsIcon,
  CheckCircle,
  Users,
  AlertTriangle,
  Bell,
  X,
  Trash2
} from 'lucide-react';
import JobPostModal from './JobPostModal';
import ReviewModal from './ReviewModal';
import JobCard from './jobboard/JobCard';
import NotificationToasts from './jobboard/NotificationToasts';
import ReviewDetailModal from './jobboard/ReviewDetailModal';
import GuestBlurWarningModal from './jobboard/GuestBlurWarningModal';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { getFirstName, LOCATION_OPTIONS, formatNotificationDate } from '../lib/job-format';

interface JobBoardProps {
  currentUser: User | null;
  onLogout?: () => void;
  onNavigateToProfile?: () => void;
  onNavigateToSettings?: () => void;
  onNavigateToApplications?: (jobId?: string) => void;
  onViewUserProfile?: (user: User) => void;
}


export default function JobBoard({
  currentUser
}: JobBoardProps) {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('Бүгд');
  const [selectedType, setSelectedType] = useState<string>('Бүгд');
  const [statusFilter, setStatusFilter] = useState<'open' | 'completed'>('open');
  
  // Modals & States
  const [showPostModal, setShowPostModal] = useState<boolean>(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  
  // Custom Review triggers
  const [activeReviewJob, setActiveReviewJob] = useState<Job | null>(null);

  // Share menu — which job's share dropdown is open
  const [shareMenuJob, setShareMenuJob] = useState<string | null>(null);

  // Dropdown hover state emulator
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);
  const [showBlurWarningModal, setShowBlurWarningModal] = useState<boolean>(false);

  // Notifications States
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotificationsMenu, setShowNotificationsMenu] = useState<boolean>(false);
  const [toasts, setToasts] = useState<AppNotification[]>([]);

  const [successMessage, setSuccessMessage] = useState<string>('');
  const [lastClickPos, setLastClickPos] = useState<{ x: number; y: number } | null>(null);
  const [viewingReview, setViewingReview] = useState<Review | null>(null);

  useEffect(() => {
    if (showBlurWarningModal || viewingReview || showNotificationsMenu) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [showBlurWarningModal, viewingReview, showNotificationsMenu]);


  const [isLoadingReview, setIsLoadingReview] = useState<boolean>(false);

  const notificationsRef = useRef<AppNotification[]>([]);
  const notificationsMenuRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const addErrorToast = (message: string) => {
    const newErrNotif: AppNotification & { x?: number; y?: number } = {
      id: 'err_' + Date.now(),
      userId: currentUser?.id || 'guest',
      title: 'Алдаа',
      message,
      type: 'alert',
      isRead: false,
      createdAt: new Date().toLocaleTimeString().slice(0, 5),
      x: lastClickPos?.x,
      y: lastClickPos?.y
    };
    setToasts(prev => [newErrNotif, ...prev]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== newErrNotif.id));
    }, 4500);
  };

  const addSuccessToast = (title: string, message: string) => {
    const newSuccessNotif: AppNotification & { x?: number; y?: number } = {
      id: 'success_' + Date.now(),
      userId: currentUser?.id || 'guest',
      title,
      message,
      type: 'success',
      isRead: false,
      createdAt: new Date().toLocaleTimeString().slice(0, 5),
      x: lastClickPos?.x,
      y: lastClickPos?.y
    };
    setToasts(prev => [newSuccessNotif, ...prev]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== newSuccessNotif.id));
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
    if (!currentUser) return;
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

  // Real-time subscription to jobs — replaces full-collection polling.
  useEffect(() => {
    const unsub = subscribeToJobs((allJobs) => {
      setJobs(allJobs);
      // Keep an expanded/selected job card in sync (or collapse it if removed).
      setSelectedJob(prev => prev ? (allJobs.find(j => j.id === prev.id) || null) : prev);
    });
    return () => unsub();
  }, []);

  // Real-time subscription to users — replaces full-collection polling.
  useEffect(() => {
    const unsub = subscribeToUsers(setUsers);
    return () => unsub();
  }, []);

  // One-time notification seeding/migration (welcome & security). Live updates
  // arrive via the subscribeToNotifications listener below.
  useEffect(() => {
    if (currentUser) {
      refreshNotifications().catch(err => console.error('Error seeding notifications:', err));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  // Track the mouse coordinates of the last click to position toasts locally
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      setLastClickPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
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

  // Click outside to collapse expanded job card
  useEffect(() => {
    if (!selectedJob) return;
    const currentJobId = selectedJob.id;
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (!target) return;

      const expandedCard = document.getElementById(`job-card-expanded-${currentJobId}`);
      if (!expandedCard) return;

      // Check if click is inside the expanded card
      if (expandedCard.contains(target)) return;

      // Check if click is inside another collapsed card
      if (target.closest('[id^="job-card-collapsed-"]')) return;

      // Check if click is inside any modal or toast notification
      if (target.closest('[id*="-modal-"]') || target.closest('#toast-alerts-container')) return;

      setSelectedJob(null);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedJob]);

  // Real-time subscription to the current user's notifications — replaces the
  // 4-second polling loop. Newly-arrived unread notifications still raise a toast.
  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      return;
    }
    const unsub = subscribeToNotifications(currentUser.id, (freshNotifs) => {
      // Only toast once we already have a baseline, so the initial load is silent.
      if (notificationsRef.current.length > 0) {
        const prevUnreadIds = notificationsRef.current.filter(n => !n.isRead).map(n => n.id);
        freshNotifs.filter(n => !n.isRead).forEach(newNotif => {
          if (!prevUnreadIds.includes(newNotif.id)) {
            setToasts(prev => [newNotif, ...prev]);
            setTimeout(() => {
              setToasts(prev => prev.filter(t => t.id !== newNotif.id));
            }, 4500);
          }
        });
      }
      setNotifications(freshNotifs);
    });
    return () => unsub();
  }, [currentUser?.id]);

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
    if (!currentUser) return;
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
    if (!currentUser) return;
    const title = notif.title.toLowerCase();
    const msg = notif.message.toLowerCase();
    
    // Welcome notification - mark as read but do NOT navigate and do NOT close menu
    if (title.includes('тавтай морил') || title.includes('тавтай морилно')) {
      if (!notif.isRead) {
        handleMarkAsRead(notif.id); // Call without await!
      }
      setToasts(prev => prev.filter(t => t.id !== notif.id));
      return;
    }
    
    // 1. Mark other notifications as read if not already read (awaiting to prevent race conditions on navigation)
    if (!notif.isRead) {
      await handleMarkAsRead(notif.id);
    }
    
    // 2. Close notifications menu and remove from toasts for other notifications that navigate
    setShowNotificationsMenu(false);
    setToasts(prev => prev.filter(t => t.id !== notif.id));
    
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
            if (j.hiredOperatorId === currentUser.id || j.employerId === currentUser.id || j.applicants.includes(currentUser.id)) {
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
            return j.hiredOperatorId === currentUser.id || j.applicants.includes(currentUser.id) || j.employerId === currentUser.id;
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
    if (!currentUser) return;
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
    if (!currentUser) return;
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
    if (!currentUser) return;
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
    if (!currentUser) return;
    try {
      const success = await applyForJob(jobId, currentUser.id);
      if (success) {
        const msg = '🔒 Таны ажилд орох хүсэлт, ажлын түүх ба үнэлгээний хамт захиалагчид амжилттай илгээгдлээ.';
        setSuccessMessage(msg);
        addSuccessToast('Хүсэлт илгээгдлээ 🎉', msg);
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
        const msg = '🤝 Жолоочийг ажилд амжилттай томиллоо.';
        setSuccessMessage(msg);
        addSuccessToast('Ажилд сонгогдлоо 🎉', msg);
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

  const handleDeleteJob = async (job: Job) => {
    if (!window.confirm('Та энэ зарыг устгахдаа итгэлтэй байна уу? Устгасны дараа сэргээх боломжгүй.')) return;
    try {
      await deleteJob(job.id);
      setSelectedJob(null);
      addSuccessToast('Устгагдлаа', 'Зарыг амжилттай устгалаа.');
    } catch (err) {
      console.error(err);
      addErrorToast('Зарыг устгахад алдаа гарлаа.');
    }
  };

  const handleCancelHiring = async (job: Job) => {
    if (!window.confirm('Та сонгосон жолоочийг цуцалж, зарыг буцааж нээлттэй болгохдоо итгэлтэй байна уу?')) return;
    // Jobs list and the selected card re-sync automatically via the jobs subscription.
    await cancelHiring(job.id);
  };

  // Get all unique job types present in the active jobs
  const getUniqueJobTypes = () => {
    const defaultTypes = [
      { value: 'Бүгд', label: 'Бүх маягт' },
      { value: 'operator_hiring', label: 'Жолооч, оператор хайж байна' },
      { value: 'operator_job_seeking', label: 'Жолооч, операторын ажил хайж байна' },
      { value: 'machinery_rental', label: 'Машин механизмын түрээс' },
      { value: 'earthwork', label: 'Барилга, зам, газар шорооны ажил' }
    ];
    
    const activeTypes = new Set<string>();
    jobs.forEach(j => {
      if (j.type && j.type !== 'operator_hiring' && j.type !== 'operator_job_seeking' && j.type !== 'machinery_rental' && j.type !== 'earthwork') {
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

  const sortedFilteredJobs = [...filteredJobs].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const openFilteredJobs = sortedFilteredJobs.filter(j => j.status === 'open');
  const completedFilteredJobs = sortedFilteredJobs.filter(j => j.status === 'completed');
  const displayJobs = statusFilter === 'open' ? openFilteredJobs : completedFilteredJobs;

  const unreadNotifs = notifications.filter(n => !n.isRead);

  return (
    <div id="job-board-root" className="flex-grow bg-[var(--color-brand-bg)] text-[#f1f3f8] font-sans flex flex-col relative overflow-x-hidden">
      {/* Warning Banner — alert semantic strip (genuine warning, kept amber) */}
      <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-200 px-4 py-2 text-center text-[10px] md:text-xs font-medium flex items-center justify-center gap-2 z-50">
        <AlertTriangle className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-400 shrink-0" />
        <span>
          <span className="font-semibold text-amber-100">Анхаар:</span> Ажил таслах, цалин олгохгүй байх, согтуу ажиллах зэрэг ноцтой зөрчил гаргасан хэрэглэгч хар дансанд бүртгэгдэж, системийн эрх хаагдаж болзошгүй.
        </span>
      </div>

      {/* Nav bar */}
      <header className="bg-[var(--color-glass-bg)] backdrop-blur-xl border-b border-[var(--color-glass-border)] sticky top-0 z-40 px-6 py-4 flex items-center justify-between shadow-sm shadow-black/20">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-[#26282d] border border-violet-500/30 flex items-center justify-center relative overflow-hidden shrink-0 shadow-md">
            <img className="w-full h-full object-cover" src="/logo.jpg" alt="Logo" />
          </div>
          <div>
            <span className="font-bold tracking-tight text-[#f1f3f8] block text-sm font-sans md:text-base">Хүнд машин, механизм & Газар шорооны ажлын сайт</span>
            <p className="text-[9px] md:text-[11px] text-[#9aa3b5] font-sans tracking-wide leading-relaxed mt-0.5 max-w-xs md:max-w-xl">
              Үнэлгээ өгөх, ажлын түүх үүсгэх системээр хариуцлагатай жолооч, оператор болон найдвартай ажил олгогчдыг үүсгэх платформ
            </p>
          </div>
        </div>

        {/* Profile and Notifications triggers */}
        <div className="flex items-center space-x-3.5">
          {currentUser ? (
            <>
              {currentUser && (
                <button
                  id="header-post-job-btn"
                  onClick={() => setShowPostModal(true)}
                  className="bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs px-3.5 py-2 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer shadow-md shadow-violet-600/25"
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
                  className="relative p-2 bg-[var(--color-glass-bg)] hover:bg-white/10 active:scale-95 border border-[var(--color-glass-border)] hover:border-white/20 rounded-full transition-all duration-200 cursor-pointer text-[#9aa3b5] hover:text-[#f1f3f8] focus:outline-none"
                >
                  <Bell className="w-4 h-4" />
                  {unreadNotifs.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-rose-500 text-white font-mono text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center border border-[var(--color-brand-bg)] animate-bounce">
                      {unreadNotifs.length}
                    </span>
                  )}
                </button>

                {showNotificationsMenu && (
                  <div
                    id="notifications-dropdown-menu"
                    ref={notificationsMenuRef}
                    className="absolute right-0 mt-2.5 w-[360px] bg-[var(--color-brand-bg2)] backdrop-blur-md border border-[var(--color-glass-border)] rounded-2xl shadow-2xl z-50 py-2 animate-fade-in"
                  >
                    <div className="px-4 py-2.5 border-b border-[var(--color-glass-border)] flex items-center justify-between">
                      <span className="text-xs font-bold text-[#9aa3b5] tracking-wide uppercase font-sans">Системийн мэдэгдлүүд</span>
                      {unreadNotifs.length > 0 && (
                        <button
                          type="button"
                          onClick={handleMarkAllAsRead}
                          className="text-[10px] bg-violet-500/15 hover:bg-violet-500/25 text-[#c4b5fd] border border-violet-500/30 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer"
                        >
                          Бүгдийг уншсанаар тэмдэглэх
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto overscroll-contain divide-y divide-[var(--color-glass-border)] scrollbar-thin">
                      {notifications.length === 0 ? (
                        <div className="py-10 px-4 text-center flex flex-col items-center justify-center space-y-2">
                          <CheckCircle className="w-8 h-8 text-[#9aa3b5] animate-pulse-soft" />
                          <p className="text-xs text-[#9aa3b5] italic">Мэдэгдэл одоогоор байхгүй байна.</p>
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif)}
                            className={`p-3.5 pl-6 text-left transition-all duration-300 relative flex items-start space-x-3 border-l-4 cursor-pointer group ${
                              notif.isRead
                                ? 'bg-transparent border-transparent hover:bg-white/5'
                                : 'bg-violet-500/10 border-violet-500 shadow-[inset_4px_0_16px_rgba(139,92,246,0.12),0_1px_2px_rgba(0,0,0,0.2)]'
                            }`}
                          >
                            {!notif.isRead && (
                              <span className="absolute left-2 top-[18px] flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-500 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500 shadow-[0_0_8px_#8b5cf6]"></span>
                              </span>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start gap-1">
                                <h5 className={`text-xs font-bold leading-tight font-sans transition-colors duration-200 ${
                                  notif.isRead
                                    ? 'text-[#9aa3b5] group-hover:text-[#f1f3f8] font-medium'
                                    : 'text-[#f1f3f8] font-extrabold'
                                }`}>
                                  {notif.title}
                                </h5>
                                <span className={`text-[8px] font-mono shrink-0 transition-colors duration-200 ${
                                  notif.isRead
                                    ? 'text-[#9aa3b5] group-hover:text-[#9aa3b5]'
                                    : 'text-violet-400 font-bold'
                                }`}>
                                  {formatNotificationDate(notif.createdAt)}
                                </span>
                              </div>
                              <p className={`text-[11px] leading-relaxed mt-1 font-sans transition-colors duration-200 ${
                                notif.isRead
                                  ? 'text-[#9aa3b5] group-hover:text-[#9aa3b5]'
                                  : 'text-[#f1f3f8]'
                              }`}>
                                {notif.message}
                              </p>

                              <div className="flex items-center space-x-2 mt-2.5">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteNotification(notif.id);
                                  }}
                                  className="bg-rose-950/30 hover:bg-rose-900/50 active:scale-95 text-rose-400 hover:text-rose-300 border border-rose-800/30 px-2 py-1 rounded text-[10px] font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Устгах</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {notifications.length > 0 && (
                      <div className="px-4 py-2 border-t border-[var(--color-glass-border)] text-center">
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
                  className="flex items-center space-x-2 bg-[var(--color-glass-bg)] p-1.5 pl-3 rounded-full hover:bg-white/10 transition-colors border border-[var(--color-glass-border)] text-left cursor-pointer"
                >
                  <div className="hidden md:block">
                    <p className="text-xs font-semibold text-[#f1f3f8] leading-none">{getFirstName(currentUser)}</p>
                    <span className="text-[9px] text-violet-400 font-mono">
                      {currentUser.type === 'operator' ? 'Жолооч' : 'Ажил олгогч'} • {currentUser.rating}⭐
                    </span>
                  </div>
                  <img
                    src={currentUser.profileImage}
                    alt="user avatar"
                    className="w-8 h-8 rounded-full object-cover border-2 border-violet-500"
                    referrerPolicy="no-referrer"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=U&background=334155&color=fff'; }}
                  />
                  <ChevronDown className="w-3.5 h-3.5 text-[#9aa3b5]" />
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
                    <div className="bg-[var(--color-brand-bg2)] border border-[var(--color-glass-border)] rounded-xl shadow-2xl py-2">
                      <div className="px-3.5 py-2 border-b border-[var(--color-glass-border)] text-[11px] text-[#9aa3b5] font-semibold font-mono">
                        Сонголтууд
                      </div>

                      <button
                        id="menu-goto-profile"
                        onClick={() => { router.push('/profile'); setShowProfileMenu(false); }}
                        className="w-full text-left px-4 py-2 text-xs hover:bg-white/10 text-[#e3e6ee] hover:text-[#f1f3f8] flex items-center space-x-2.5 transition-colors cursor-pointer"
                      >
                        <UserIcon className="w-4 h-4 text-violet-400" />
                        <span>Миний профайл</span>
                      </button>

                      <button
                        id="menu-goto-applications"
                        onClick={() => { router.push('/applications'); setShowProfileMenu(false); }}
                        className="w-full text-left px-4 py-2 text-xs hover:bg-white/10 text-[#e3e6ee] hover:text-[#f1f3f8] flex items-center space-x-2.5 transition-colors cursor-pointer"
                      >
                        <Briefcase className="w-4 h-4 text-violet-400" />
                        <span>Миний зарууд, хүсэлтүүд</span>
                      </button>

                      <button
                        id="menu-goto-settings"
                        onClick={() => { router.push('/settings'); setShowProfileMenu(false); }}
                        className="w-full text-left px-4 py-2 text-xs hover:bg-white/10 text-[#e3e6ee] hover:text-[#f1f3f8] flex items-center space-x-2.5 transition-colors cursor-pointer"
                      >
                        <SettingsIcon className="w-4 h-4 text-violet-400" />
                        <span>Тохиргооны хэсэг</span>
                      </button>

                      <div className="border-t border-[var(--color-glass-border)] my-1"></div>

                      <button
                        id="menu-logout"
                        onClick={async () => {
                          try {
                            await signOut(auth);
                          } catch (err) {
                            console.error('Error signing out:', err);
                          }
                          setCurrentUser(null);
                          router.push('/auth');
                          setShowProfileMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs hover:bg-white/10 text-rose-400 hover:text-rose-300 flex items-center space-x-2.5 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Системээс гарах</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => router.push('/auth?tab=login')}
                className="text-xs text-[#9aa3b5] hover:text-[#f1f3f8] font-semibold px-3.5 py-2 transition-all cursor-pointer hover:bg-white/10 rounded-lg"
              >
                Нэвтрэх
              </button>
              <button
                onClick={() => router.push('/auth?tab=register')}
                className="bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs px-3.5 py-2 rounded-lg transition-all cursor-pointer shadow-md shadow-violet-600/25"
              >
                Бүртгүүлэх
              </button>
            </div>
          )}

        </div>
      </header>

      {/* Hero — Glass Premium Violet gradient */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[var(--color-brand-bg2)] via-violet-950 to-[var(--color-brand-bg)]">
        <div className="absolute -top-16 -right-10 w-72 h-72 rounded-full bg-violet-500/30 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-16 w-72 h-72 rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />
        <div className="max-w-4xl mx-auto w-full px-6 py-9 md:py-12 relative">
          <span className="inline-block text-[10px] md:text-xs font-semibold text-[#c4b5fd] bg-violet-500/15 px-3 py-1 rounded-full">
            Газар шорооны ажлын зах зээл
          </span>
          <h1 className="mt-3 text-2xl md:text-4xl font-black tracking-tight text-white leading-tight">
            Найдвартай хамтрагчаа{' '}
            <span className="text-violet-300">үнэлгээгээр</span> нь ол
          </h1>
          <p className="mt-2.5 text-xs md:text-sm text-[#c8cbe0] max-w-2xl leading-relaxed">
            Жолооч, оператор болон ажил олгогч бүрийн ажлын түүх, бодит үнэлгээ ил тод. Хэн хариуцлагатай,
            хэн шударга — өмнөх түүх нь хэлнэ.
          </p>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-start gap-2.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3.5">
              <ShieldCheck className="w-5 h-5 text-teal-300 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-white">Баталгаат түүх</div>
                <div className="text-[11px] text-[#c8cbe0] leading-snug mt-0.5">Хийсэн ажил бүр бүртгэгдэж, хариуцлагыг өсгөнө</div>
              </div>
            </div>
            <div className="flex items-start gap-2.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3.5">
              <Star className="w-5 h-5 text-teal-300 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-white">Бодит үнэлгээ</div>
                <div className="text-[11px] text-[#c8cbe0] leading-snug mt-0.5">Хоёр тал бие биедээ үнэлгээ өгч итгэл бий болно</div>
              </div>
            </div>
            <div className="flex items-start gap-2.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3.5">
              <TrendingUp className="w-5 h-5 text-teal-300 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-white">Найдвартай сонголт</div>
                <div className="text-[11px] text-[#c8cbe0] leading-snug mt-0.5">Сайн ажилтан, шударга ажил олгогчийг ялгана</div>
              </div>
            </div>
          </div>

          {!currentUser && (
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                onClick={() => router.push('/auth?tab=register')}
                className="bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white font-bold text-xs md:text-sm px-5 py-2.5 rounded-lg transition-all cursor-pointer shadow-lg shadow-violet-600/40"
              >
                Үнэгүй бүртгүүлэх
              </button>
              <button
                onClick={() => router.push('/auth?tab=login')}
                className="text-xs md:text-sm text-white font-semibold px-3 py-2.5 rounded-lg hover:bg-white/10 transition-all cursor-pointer"
              >
                Нэвтрэх
              </button>
            </div>
          )}
        </div>
      </section>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-8 space-y-6">
        
        {/* Top Success Banner removed to prevent out-of-view notifications. Inline success alerts & floating mouse-anchored toasts are used instead. */}



        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[var(--color-glass-bg)] backdrop-blur-md p-3.5 border border-[var(--color-glass-border)] rounded-xl shadow-sm">
            <span className="text-[10px] uppercase block font-mono font-semibold text-[#9aa3b5]">Нийт зар</span>
            <span className="text-xl font-black text-[#f1f3f8]">{jobs.length} зар</span>
          </div>
          <div className="bg-gradient-to-br from-violet-500/10 to-violet-600/10 backdrop-blur-md p-3.5 border border-violet-500/20 rounded-xl shadow-sm">
            <span className="text-[10px] uppercase block font-mono font-semibold text-violet-300">Бүртгэлтэй хэрэглэгч</span>
            <span className="text-xl font-black text-violet-300">
              {users.length > 0 ? users.length : '...'} хэрэглэгч
            </span>
          </div>
        </div>

        {/* Search bar & filter buttons */}
        <div className="bg-[var(--color-glass-bg)] backdrop-blur-md p-5 border border-[var(--color-glass-border)] rounded-2xl space-y-4 shadow-sm">

          {/* Search inputs */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-[#9aa3b5]" />
            <input
              id="board-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Экскаватор, Шакман жолооч, Дамп, Өмнөговь гэж хайх..."
              className="w-full pl-10 pr-10 py-2.5 bg-white/5 border border-[var(--color-glass-border)] hover:border-white/20 rounded-xl text-xs text-[#f1f3f8] focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all placeholder-[#9aa3b5] font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9aa3b5] hover:text-[#f1f3f8] p-1 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Dropdown Filters row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Type Category */}
            <div className="flex flex-col space-y-1.5">
              <label className="text-[10px] text-[#9aa3b5] font-bold uppercase tracking-wider text-left">Зарын төрөл</label>
              <div className="relative">
                <select
                  id="filter-type"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full bg-white/5 border border-[var(--color-glass-border)] hover:border-white/20 text-[#e3e6ee] text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all cursor-pointer appearance-none"
                >
                  {getUniqueJobTypes().map((t, idx) => (
                    <option key={idx} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9aa3b5] pointer-events-none" />
              </div>
            </div>

            {/* Aimag location */}
            <div className="flex flex-col space-y-1.5">
              <label className="text-[10px] text-[#9aa3b5] font-bold uppercase tracking-wider text-left">Аймаг / Байршил</label>
              <div className="relative">
                <select
                  id="filter-location"
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full bg-white/5 border border-[var(--color-glass-border)] hover:border-white/20 text-[#e3e6ee] text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all cursor-pointer appearance-none"
                >
                  <option value="Бүгд">Бүх байршил (21 аймаг + Хот)</option>
                  {LOCATION_OPTIONS.filter(l => l !== 'Бүгд').map((l, id) => (
                    <option key={id} value={l}>{l}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9aa3b5] pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Active Filters Summary */}
          {(searchQuery || selectedLocation !== 'Бүгд' || selectedType !== 'Бүгд') && (
            <div className="flex items-center justify-between text-[10px] bg-violet-500/10 border border-violet-500/20 p-2.5 rounded-xl animate-fade-in">
              <div className="flex flex-wrap items-center gap-1.5 text-[#9aa3b5]">
                <Filter className="w-3.5 h-3.5 text-violet-400" />
                <span>Шүүлтүүр:</span>
                {searchQuery && <span className="bg-white/10 px-2 py-0.5 rounded border border-[var(--color-glass-border)] text-[#e3e6ee] font-mono font-medium">"{searchQuery}"</span>}
                {selectedLocation !== 'Бүгд' && <span className="bg-white/10 px-2 py-0.5 rounded border border-[var(--color-glass-border)] text-[#e3e6ee] font-mono font-medium">{selectedLocation}</span>}
                {selectedType !== 'Бүгд' && (
                  <span className="bg-white/10 px-2 py-0.5 rounded border border-[var(--color-glass-border)] text-[#e3e6ee] font-mono font-medium">
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
                className="text-violet-600 hover:text-violet-700 font-bold hover:underline transition-all cursor-pointer flex items-center space-x-1 shrink-0 ml-2"
              >
                <span>Арилгах ✕</span>
              </button>
            </div>
          )}

        </div>

        {/* Job listings container */}
        <div className="space-y-4">
          <div className="flex items-center space-x-4 border-b border-[var(--color-glass-border)] pb-2">
            <button
              onClick={() => setStatusFilter('open')}
              className={`text-xs font-bold tracking-wider uppercase pb-1 transition-all cursor-pointer border-b-2 ${
                statusFilter === 'open'
                  ? 'text-violet-400 border-violet-500 font-extrabold'
                  : 'text-[#9aa3b5] border-transparent hover:text-[#c8cbe0]'
              }`}
            >
              Идэвхтэй зар ({openFilteredJobs.length})
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`text-xs font-bold tracking-wider uppercase pb-1 transition-all cursor-pointer border-b-2 ${
                statusFilter === 'completed'
                  ? 'text-violet-400 border-violet-500 font-extrabold'
                  : 'text-[#9aa3b5] border-transparent hover:text-[#c8cbe0]'
              }`}
            >
              Дууссан зар ({completedFilteredJobs.length})
            </button>
          </div>

          {displayJobs.length === 0 ? (
            <div className="bg-[var(--color-glass-bg)] backdrop-blur-md border border-[var(--color-glass-border)] p-12 text-center rounded-xl">
              <p className="text-sm text-[#9aa3b5]">Хайлтанд нийцэх ажил олдсонгүй.</p>
              <button
                id="reset-filters-btn"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedLocation('Бүгд');
                  setSelectedType('Бүгд');
                }}
                className="mt-3 text-xs text-violet-400 hover:underline cursor-pointer"
              >
                Бүх шүүлтүүрийг арилгах
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  isExpanded={selectedJob?.id === job.id}
                  currentUser={currentUser}
                  users={users}
                  successMessage={successMessage}
                  shareMenuJob={shareMenuJob}
                  onSelect={setSelectedJob}
                  onCollapse={() => setSelectedJob(null)}
                  onShowBlurWarning={() => setShowBlurWarningModal(true)}
                  onEdit={setEditingJob}
                  onReview={setActiveReviewJob}
                  onHire={handleHire}
                  onApply={handleApply}
                  onCompleteAndReview={handleCompleteAndReviewTrigger}
                  onDelete={handleDeleteJob}
                  onCancelHiring={handleCancelHiring}
                  onToggleShareMenu={setShareMenuJob}
                  onCopied={() => addSuccessToast('Хуулагдлаа', 'Холбоос clipboard-д хуулагдлаа.')}
                  onNavigate={(path) => router.push(path)}
                />
              ))}
            </div>
          )}
        </div>

      </main>

      {/* Floating Toast Notification Containers */}
      <NotificationToasts
        toasts={toasts}
        onToastClick={handleNotificationClick}
        onDismiss={(id) => setToasts(prev => prev.filter(toast => toast.id !== id))}
      />

      {/* Modals trigger definitions */}
      {showPostModal && currentUser && (
        <JobPostModal
          employerId={currentUser.id}
          employerName={currentUser.fullName}
          employerRating={currentUser.rating}
          onClose={() => setShowPostModal(false)}
          onSuccess={async (newJob) => {
            setShowPostModal(false);
            await refreshJobs();
            setSelectedJob(newJob);
            const msg = '🎉 Ажлын зар амжилттай нийтлэгдэж, систем дэх нээлттэй жолооч нарын үзүүрт орлоо!';
            setSuccessMessage(msg);
            addSuccessToast('Амжилттай 🎉', msg);
            setTimeout(() => setSuccessMessage(''), 4500);
          }}
        />
      )}

      {editingJob && currentUser && (
        <JobPostModal
          employerId={currentUser.id}
          employerName={currentUser.fullName}
          employerRating={currentUser.rating}
          jobToEdit={editingJob}
          onClose={() => setEditingJob(null)}
          onSuccess={async (updatedJob) => {
            setEditingJob(null);
            await refreshJobs();
            if (selectedJob?.id === updatedJob.id) {
              setSelectedJob(updatedJob);
            }
            const msg = '🎉 Ажлын зар амжилттай засагдаж шинэчлэгдлээ!';
            setSuccessMessage(msg);
            addSuccessToast('Амжилттай 🎉', msg);
            setTimeout(() => setSuccessMessage(''), 4500);
          }}
        />
      )}

      {activeReviewJob && currentUser && (
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
            const msg = '🌟 Сэтгэгдэл, үнэлгээ амжилттай бүртгэгдэж тухайн хэрэглэгчийн албан ёсны ажлын түүхэнд шинэчлэгдэж заслаа. Хамтын оролцоонд баярлалаа.';
            setSuccessMessage(msg);
            addSuccessToast('Амжилттай 🎉', msg);
            setTimeout(() => setSuccessMessage(''), 4500);
          }}
        />
      )}

      {/* Viewing Review Detail Modal */}
      {viewingReview && (
        <ReviewDetailModal
          review={viewingReview}
          onClose={() => setViewingReview(null)}
          onGoToProfile={() => {
            setViewingReview(null);
            router.push('/profile');
          }}
        />
      )}

      {/* Loading Review Detail Spinner */}
      {isLoadingReview && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--color-brand-bg2)] border border-[var(--color-glass-border)] p-6 rounded-xl shadow-2xl flex flex-col items-center space-y-3">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs text-[#c8cbe0] font-mono">Үнэлгээг ачаалж байна...</span>
          </div>
        </div>
      )}

      {/* Guest Blur Warning Modal */}
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
