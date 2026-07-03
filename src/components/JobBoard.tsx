'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { User, Job, Review, AppNotification } from '../types';
import {
  getJobs,
  getSingleJob,
  applyForJob,
  hireOperator,
  completeJob,
  getNotifications,
  subscribeToJobs,
  getUsersByIds,
  getRegisteredUserCount,
  subscribeToNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllNotifications,
  deleteJob,
  cancelHiring,
  getReviews,
  getSingleReview
} from '../lib/db';
import {
  Search,
  Filter,
  Briefcase,
  PlusCircle,
  ChevronDown,
  LogOut,
  User as UserIcon,
  Settings as SettingsIcon,
  CheckCircle,
  AlertTriangle,
  Bell,
  X,
  Trash2
} from 'lucide-react';
const JobPostModal = dynamic(() => import('./JobPostModal'), { ssr: false });
const ReviewModal = dynamic(() => import('./ReviewModal'), { ssr: false });
import JobCard from './jobboard/JobCard';
import NotificationToasts from './jobboard/NotificationToasts';
import ReviewDetailModal from './jobboard/ReviewDetailModal';
import GuestBlurWarningModal from './jobboard/GuestBlurWarningModal';
import BoardHero from './jobboard/BoardHero';
import { useAuth } from '../context/AuthContext';
import { getFirstName, LOCATION_OPTIONS, formatNotificationDate } from '../lib/job-format';
import { trackSearch, trackViewJob, trackApplySubmit, trackPostStarted, trackPostCompleted } from '../lib/analytics';

interface JobBoardProps {
  currentUser: User | null;
  /**
   * Job id to auto-expand on load, e.g. from `/?jobId=xxx`. Used by the
   * `jobMeta` Cloud Function's redirect for jobs posted after the last
   * static build (audit P1) and as a general deep-link target.
   */
  initialJobId?: string;
}

export default function JobBoard({
  currentUser,
  initialJobId
}: JobBoardProps) {
  const router = useRouter();
  const { logout } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [registeredUserCount, setRegisteredUserCount] = useState<number | null>(null);
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

  // eslint-disable-next-line react-hooks/purity
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

  // eslint-disable-next-line react-hooks/purity
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

  // Users are fetched by known id only — Firestore rules deny collection-wide
  // `list` reads on `users` (prevents bulk PII scraping), so there is no
  // subscribeToUsers()/getUsers() equivalent any more. Guests skip this
  // entirely (they see mock data). Only ids referenced by the currently
  // displayed jobs (+ the expanded job's applicants, if it's the viewer's own)
  // are fetched.
  const neededUserIds = useMemo(() => {
    const ids = new Set<string>();
    jobs.forEach(j => {
      ids.add(j.employerId);
      if (j.hiredOperatorId) ids.add(j.hiredOperatorId);
    });
    if (selectedJob && currentUser && selectedJob.employerId === currentUser.id) {
      selectedJob.applicants.forEach(id => ids.add(id));
    }
    return Array.from(ids).sort();
  }, [jobs, selectedJob, currentUser]);

  useEffect(() => {
    if (!currentUser || neededUserIds.length === 0) {
      setUsers([]);
      return;
    }
    let cancelled = false;
    getUsersByIds(neededUserIds).then(result => {
      if (!cancelled) setUsers(result);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, neededUserIds.join(',')]);

  // Total registered user count for the homepage stat — fetched once via a
  // Cloud Function count aggregation (no PII, safe for guests too).
  useEffect(() => {
    getRegisteredUserCount().then(setRegisteredUserCount);
  }, []);

  // Deep-link support: auto-expand a specific job when arriving via ?jobId=.
  // This is the redirect target for the jobMeta Cloud Function (jobs posted
  // after the last static build have no prerendered /jobs/<id> page, so
  // Facebook/Google get correct metadata from the function while real
  // browsers bounce here) and doubles as a general shareable deep link
  // (audit P1).
  useEffect(() => {
    if (!initialJobId) return;
    const existing = jobs.find(j => j.id === initialJobId);
    if (existing) {
      setStatusFilter(existing.status === 'completed' ? 'completed' : 'open');
      setSelectedJob(existing);
      return;
    }
    let cancelled = false;
    getSingleJob(initialJobId).then(job => {
      if (cancelled || !job) return;
      setJobs(prev => (prev.some(j => j.id === job.id) ? prev : [job, ...prev]));
      setStatusFilter(job.status === 'completed' ? 'completed' : 'open');
      setSelectedJob(job);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialJobId]);

  // Debounced search/filter tracking (audit C2) — fires once ~600ms after the
  // user stops typing/changing filters, not on every keystroke.
  useEffect(() => {
    if (!searchQuery && selectedLocation === 'Бүгд' && selectedType === 'Бүгд') return;
    const timer = setTimeout(() => {
      trackSearch(searchQuery, selectedLocation, selectedType);
    }, 600);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedLocation, selectedType]);

  // One-time notification seeding/migration (welcome & security). Live updates
  // arrive via the subscribeToNotifications listener below.
  // eslint-disable-next-line react-hooks/set-state-in-effect
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
  // eslint-disable-next-line react-hooks/set-state-in-effect
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

  // Actions with optimistic UI updates for instantaneous responsiveness.
  // No re-fetch on success — the realtime subscribeToNotifications listener
  // (above) already reconciles state once the write lands, and re-calling
  // getNotifications() here was redundant (it also re-runs the welcome/
  // security-notification seeding check on every single mark-read/delete —
  // pure wasted reads+writes, audit S11). On failure we just revert to the
  // last known-good snapshot instead of doing another full fetch.
  const handleMarkAsRead = async (id: string) => {
    if (!currentUser) return;
    const previous = notificationsRef.current;
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    try {
      await markNotificationAsRead(id);
    } catch (err) {
      console.error(err);
      setNotifications(previous);
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
    const previous = notificationsRef.current;
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    try {
      await markAllNotificationsAsRead(currentUser.id);
    } catch (err) {
      console.error(err);
      setNotifications(previous);
      addErrorToast('Үйлдэл гүйцэтгэхэд алдаа гарлаа. Дахин оролдоно уу.');
    }
  };

  const handleDeleteNotification = async (id: string) => {
    if (!currentUser) return;
    const previous = notificationsRef.current;
    setNotifications(prev => prev.filter(n => n.id !== id));
    try {
      await deleteNotification(id);
    } catch (err) {
      console.error(err);
      setNotifications(previous);
      addErrorToast('Үйлдэл гүйцэтгэхэд алдаа гарлаа. Дахин оролдоно уу.');
    }
  };

  const handleDeleteAllNotifications = async () => {
    if (!currentUser) return;
    const previous = notificationsRef.current;
    setNotifications([]);
    try {
      await deleteAllNotifications(currentUser.id);
    } catch (err) {
      console.error(err);
      setNotifications(previous);
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
        trackApplySubmit(jobId);
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
    <div id="job-board-root" className="flex-grow bg-[var(--bg)] text-[var(--fg)] font-sans flex flex-col relative overflow-x-hidden">
      {/* Warning Banner — safety-orange alert strip (blacklist compliance warning) */}
      <div className="bg-[rgba(255,92,40,0.1)] border-b border-[rgba(255,92,40,0.25)] text-[var(--alert)] px-4 py-2 text-center text-[10px] md:text-xs font-medium flex items-center justify-center gap-2 z-50">
        <AlertTriangle className="w-3.5 h-3.5 md:w-4 md:h-4 text-[var(--alert)] shrink-0" />
        <span>
          <span className="font-bold text-[var(--alert)]">Анхаар:</span> Ажил таслах, цалин олгохгүй байх, согтуу ажиллах зэрэг ноцтой зөрчил гаргасан хэрэглэгч хар дансанд бүртгэгдэж, системийн эрх хаагдаж болзошгүй.
        </span>
      </div>

      {/* Nav bar */}
      <header className="bg-[var(--card)] border-b border-[var(--border)] sticky top-0 z-40 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-md bg-[var(--bg2)] border border-[var(--border-strong)] flex items-center justify-center relative overflow-hidden shrink-0 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="w-full h-full object-cover" src="/logo.jpg" alt="Logo" loading="eager" width="40" height="40" />
          </div>
          <div>
            <span className="font-display font-bold uppercase tracking-tight text-[var(--fg)] block text-sm md:text-base">Хүнд машин, механизм & Газар шорооны ажлын сайт</span>
            <p className="text-[10.5px] md:text-[11px] text-[var(--muted-foreground)] font-sans tracking-wide leading-relaxed mt-0.5 max-w-xs md:max-w-xl">
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
                  onClick={() => { trackPostStarted(); setShowPostModal(true); }}
                  className="bg-[var(--accent)] hover:brightness-95 text-[var(--accent-foreground)] font-bold text-xs px-3.5 py-2 rounded flex items-center space-x-1.5 transition-all cursor-pointer shadow-sm"
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
                  className="relative p-2 bg-[var(--card)] hover:bg-[var(--bg2)] active:scale-95 border border-[var(--border)] hover:border-[var(--border-strong)] rounded-full transition-all duration-200 cursor-pointer text-[var(--muted-foreground)] hover:text-[var(--fg)] focus:outline-none"
                >
                  <Bell className="w-4 h-4" />
                  {unreadNotifs.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[var(--alert)] text-white font-mono text-[10.5px] font-bold h-4 w-4 rounded-full flex items-center justify-center border border-[var(--card)] animate-bounce">
                      {unreadNotifs.length}
                    </span>
                  )}
                </button>

                {showNotificationsMenu && (
                  <div
                    id="notifications-dropdown-menu"
                    ref={notificationsMenuRef}
                    className="absolute right-0 mt-2.5 w-[min(360px,calc(100vw-2rem))] bg-[var(--card)] border border-[var(--border)] rounded-md shadow-md z-50 py-2 animate-fade-in"
                  >
                    <div className="px-4 py-2.5 border-b border-[var(--border)] flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--muted-foreground)] tracking-wide uppercase font-sans">Системийн мэдэгдлүүд</span>
                      {unreadNotifs.length > 0 && (
                        <button
                          type="button"
                          onClick={handleMarkAllAsRead}
                          className="text-[10px] bg-[var(--accent-soft)] hover:brightness-95 text-[var(--accent-soft-foreground)] border border-[var(--accent)] px-2.5 py-1 rounded font-bold transition-all cursor-pointer"
                        >
                          Бүгдийг уншсанаар тэмдэглэх
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto overscroll-contain divide-y divide-[var(--border)] scrollbar-thin">
                      {notifications.length === 0 ? (
                        <div className="py-10 px-4 text-center flex flex-col items-center justify-center space-y-2">
                          <CheckCircle className="w-8 h-8 text-[var(--muted-foreground)] animate-pulse-soft" />
                          <p className="text-xs text-[var(--muted-foreground)] italic">Мэдэгдэл одоогоор байхгүй байна.</p>
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif)}
                            className={`p-3.5 pl-6 text-left transition-all duration-200 relative flex items-start space-x-3 border-l-4 cursor-pointer group ${
                              notif.isRead
                                ? 'bg-transparent border-transparent hover:bg-[var(--bg2)]'
                                : 'bg-[var(--accent-soft)] border-[var(--accent)]'
                            }`}
                          >
                            {!notif.isRead && (
                              <span className="absolute left-2 top-[18px] flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent)]"></span>
                              </span>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start gap-1">
                                <p className={`text-xs font-bold leading-tight font-sans transition-colors duration-200 ${
                                  notif.isRead
                                    ? 'text-[var(--muted-foreground)] group-hover:text-[var(--fg)] font-medium'
                                    : 'text-[var(--fg)] font-extrabold'
                                }`}>
                                  {notif.title}
                                </p>
                                <span className={`text-[10px] font-mono shrink-0 transition-colors duration-200 ${
                                  notif.isRead
                                    ? 'text-[var(--muted-foreground)]'
                                    : 'text-[var(--accent-soft-foreground)] font-bold'
                                }`}>
                                  {formatNotificationDate(notif.createdAt)}
                                </span>
                              </div>
                              <p className={`text-[11px] leading-relaxed mt-1 font-sans transition-colors duration-200 ${
                                notif.isRead
                                  ? 'text-[var(--muted-foreground)]'
                                  : 'text-[var(--fg)]'
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
                                  className="min-h-11 bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-600 hover:text-rose-700 border border-rose-300 px-2 rounded text-[10px] font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
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
                      <div className="px-4 py-2 border-t border-[var(--border)] text-center">
                        <button
                          type="button"
                          onClick={handleDeleteAllNotifications}
                          className="w-full bg-rose-50 hover:bg-rose-100 active:scale-98 border border-rose-300 hover:border-rose-400 text-rose-600 hover:text-rose-700 py-1.5 rounded text-[10px] font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer font-sans"
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
                  className="flex items-center space-x-2 bg-[var(--card)] p-1.5 pl-3 rounded-full hover:bg-[var(--bg2)] transition-colors border border-[var(--border)] text-left cursor-pointer"
                >
                  <div className="hidden md:block">
                    <p className="text-xs font-semibold text-[var(--fg)] leading-none">{getFirstName(currentUser)}</p>
                    <span className="text-[10.5px] text-[var(--muted-foreground)] font-mono">
                      {currentUser.type === 'operator' ? 'Жолооч' : 'Ажил олгогч'} • {currentUser.rating}⭐
                    </span>
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={currentUser.profileImage}
                    alt="user avatar"
                    className="w-8 h-8 rounded-full object-cover border-2 border-[var(--accent)]"
                    referrerPolicy="no-referrer"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=U&background=334155&color=fff'; }}
                  />
                  <ChevronDown className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
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
                    <div className="bg-[var(--card)] border border-[var(--border)] rounded-md shadow-md py-2">
                      <div className="px-3.5 py-2 border-b border-[var(--border)] text-[11px] text-[var(--muted-foreground)] font-semibold font-mono">
                        Сонголтууд
                      </div>

                      <button
                        id="menu-goto-profile"
                        onClick={() => { router.push('/profile'); setShowProfileMenu(false); }}
                        className="w-full text-left px-4 py-2 text-xs hover:bg-[var(--bg2)] text-[var(--fg)] flex items-center space-x-2.5 transition-colors cursor-pointer"
                      >
                        <UserIcon className="w-4 h-4 text-[var(--muted-foreground)]" />
                        <span>Миний профайл</span>
                      </button>

                      <button
                        id="menu-goto-applications"
                        onClick={() => { router.push('/applications'); setShowProfileMenu(false); }}
                        className="w-full text-left px-4 py-2 text-xs hover:bg-[var(--bg2)] text-[var(--fg)] flex items-center space-x-2.5 transition-colors cursor-pointer"
                      >
                        <Briefcase className="w-4 h-4 text-[var(--muted-foreground)]" />
                        <span>Миний зарууд, хүсэлтүүд</span>
                      </button>

                      <button
                        id="menu-goto-settings"
                        onClick={() => { router.push('/settings'); setShowProfileMenu(false); }}
                        className="w-full text-left px-4 py-2 text-xs hover:bg-[var(--bg2)] text-[var(--fg)] flex items-center space-x-2.5 transition-colors cursor-pointer"
                      >
                        <SettingsIcon className="w-4 h-4 text-[var(--muted-foreground)]" />
                        <span>Тохиргооны хэсэг</span>
                      </button>

                      <div className="border-t border-[var(--border)] my-1"></div>

                      <button
                        id="menu-logout"
                        onClick={async () => {
                          // Always go through useAuth().logout() — it's the single place that
                          // clears session state consistently (AGENTS.md §1). A direct
                          // signOut(auth) call here used to skip that and only clear the
                          // localStorage-backed session, not the AuthContext state (audit S11).
                          await logout();
                          router.push('/auth');
                          setShowProfileMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs hover:bg-rose-50 text-rose-600 hover:text-rose-700 flex items-center space-x-2.5 transition-colors cursor-pointer"
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
                className="text-xs text-[var(--muted-foreground)] hover:text-[var(--fg)] font-semibold px-3.5 py-2 transition-all cursor-pointer hover:bg-[var(--bg2)] rounded"
              >
                Нэвтрэх
              </button>
              <button
                onClick={() => router.push('/auth?tab=register')}
                className="bg-[var(--accent)] hover:brightness-95 text-[var(--accent-foreground)] font-bold text-xs px-3.5 py-2 rounded transition-all cursor-pointer shadow-sm"
              >
                Бүртгүүлэх
              </button>
            </div>
          )}

        </div>
      </header>

      <BoardHero isLoggedIn={!!currentUser} />

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-8 space-y-6">
        
        {/* Top Success Banner removed to prevent out-of-view notifications. Inline success alerts & floating mouse-anchored toasts are used instead. */}



        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[var(--card)] p-3.5 border border-[var(--border)] rounded-md shadow-sm">
            <span className="text-[10px] uppercase block font-mono font-semibold text-[var(--muted-foreground)]">Нийт зар</span>
            <span className="text-xl font-display font-black text-[var(--fg)]">{jobs.length} зар</span>
          </div>
          <div className="bg-[var(--accent-soft)] p-3.5 border border-[var(--accent)] rounded-md shadow-sm">
            <span className="text-[10px] uppercase block font-mono font-semibold text-[var(--accent-soft-foreground)]">Бүртгэлтэй хэрэглэгч</span>
            <span className="text-xl font-display font-black text-[var(--accent-soft-foreground)]">
              {registeredUserCount !== null ? registeredUserCount : '...'} хэрэглэгч
            </span>
          </div>
        </div>

        {/* Search bar & filter buttons */}
        <div className="bg-[var(--card)] p-5 border border-[var(--border)] rounded-md space-y-4 shadow-sm">

          {/* Search inputs */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-[var(--muted-foreground)]" />
            <input
              id="board-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Экскаватор, Шакман жолооч, Дамп, Өмнөговь гэж хайх..."
              className="w-full pl-10 pr-10 py-2.5 bg-[var(--bg2)] border border-[var(--border)] hover:border-[var(--border-strong)] rounded-md text-xs text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)] focus:border-[var(--accent)] transition-all placeholder-[var(--muted-foreground)] font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--fg)] p-1 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Dropdown Filters row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Type Category */}
            <div className="flex flex-col space-y-1.5">
              <label htmlFor="filter-type" className="text-[10px] text-[var(--muted-foreground)] font-bold uppercase tracking-wider text-left">Зарын төрөл</label>
              <div className="relative">
                <select
                  id="filter-type"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full bg-[var(--bg2)] border border-[var(--border)] hover:border-[var(--border-strong)] text-[var(--fg)] text-xs px-3.5 py-2.5 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)] focus:border-[var(--accent)] transition-all cursor-pointer appearance-none"
                >
                  {getUniqueJobTypes().map((t, idx) => (
                    <option key={idx} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)] pointer-events-none" />
              </div>
            </div>

            {/* Aimag location */}
            <div className="flex flex-col space-y-1.5">
              <label htmlFor="filter-location" className="text-[10px] text-[var(--muted-foreground)] font-bold uppercase tracking-wider text-left">Аймаг / Байршил</label>
              <div className="relative">
                <select
                  id="filter-location"
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full bg-[var(--bg2)] border border-[var(--border)] hover:border-[var(--border-strong)] text-[var(--fg)] text-xs px-3.5 py-2.5 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)] focus:border-[var(--accent)] transition-all cursor-pointer appearance-none"
                >
                  <option value="Бүгд">Бүх байршил (21 аймаг + Хот)</option>
                  {LOCATION_OPTIONS.filter(l => l !== 'Бүгд').map((l, id) => (
                    <option key={id} value={l}>{l}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)] pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Active Filters Summary */}
          {(searchQuery || selectedLocation !== 'Бүгд' || selectedType !== 'Бүгд') && (
            <div className="flex items-center justify-between text-[10px] bg-[var(--accent-soft)] border border-[var(--accent)] p-2.5 rounded-md animate-fade-in">
              <div className="flex flex-wrap items-center gap-1.5 text-[var(--muted-foreground)]">
                <Filter className="w-3.5 h-3.5 text-[var(--accent-soft-foreground)]" />
                <span>Шүүлтүүр:</span>
                {searchQuery && <span className="bg-[var(--card)] px-2 py-0.5 rounded border border-[var(--border)] text-[var(--fg)] font-mono font-medium">&ldquo;{searchQuery}&rdquo;</span>}
                {selectedLocation !== 'Бүгд' && <span className="bg-[var(--card)] px-2 py-0.5 rounded border border-[var(--border)] text-[var(--fg)] font-mono font-medium">{selectedLocation}</span>}
                {selectedType !== 'Бүгд' && (
                  <span className="bg-[var(--card)] px-2 py-0.5 rounded border border-[var(--border)] text-[var(--fg)] font-mono font-medium">
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
                className="text-[var(--accent-soft-foreground)] hover:underline font-bold transition-all cursor-pointer flex items-center space-x-1 shrink-0 ml-2"
              >
                <span>Арилгах ✕</span>
              </button>
            </div>
          )}

        </div>

        {/* Job listings container */}
        <div className="space-y-4">
          <div className="flex items-center space-x-4 border-b border-[var(--border)] pb-2">
            <button
              onClick={() => setStatusFilter('open')}
              className={`text-xs font-display font-bold tracking-wider uppercase pb-1 transition-all cursor-pointer border-b-2 ${
                statusFilter === 'open'
                  ? 'text-[var(--fg)] border-[var(--accent)] font-extrabold'
                  : 'text-[var(--muted-foreground)] border-transparent hover:text-[var(--fg)]'
              }`}
            >
              Идэвхтэй зар ({openFilteredJobs.length})
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`text-xs font-display font-bold tracking-wider uppercase pb-1 transition-all cursor-pointer border-b-2 ${
                statusFilter === 'completed'
                  ? 'text-[var(--fg)] border-[var(--verify)] font-extrabold'
                  : 'text-[var(--muted-foreground)] border-transparent hover:text-[var(--fg)]'
              }`}
            >
              Дууссан зар ({completedFilteredJobs.length})
            </button>
          </div>

          {displayJobs.length === 0 ? (
            !searchQuery && selectedLocation === 'Бүгд' && selectedType === 'Бүгд' && statusFilter === 'open' ? (
              // No filters applied and genuinely zero open jobs — a new/quiet
              // marketplace section used to just show "no results", which reads
              // as broken rather than inviting the first listing (audit U7).
              <div className="bg-[var(--card)] border border-[var(--border)] p-12 text-center rounded-md space-y-3">
                <p className="text-sm font-semibold text-[var(--fg)]">Одоогоор идэвхтэй зар алга байна 🚜</p>
                <p className="text-xs text-[var(--muted-foreground)]">Анхны зараа үнэгүй тавьж, системийг амьдруулаарай!</p>
                <button
                  id="empty-board-post-job-btn"
                  onClick={() => {
                    if (currentUser) { trackPostStarted(); setShowPostModal(true); }
                    else router.push('/auth?tab=register');
                  }}
                  className="mt-2 bg-[var(--accent)] hover:brightness-95 text-[var(--accent-foreground)] font-bold text-xs px-5 py-2.5 rounded transition-all cursor-pointer shadow-sm"
                >
                  {currentUser ? 'Зар нэмэх' : 'Бүртгүүлээд зар тавих'}
                </button>
              </div>
            ) : (
              <div className="bg-[var(--card)] border border-[var(--border)] p-12 text-center rounded-md">
                <p className="text-sm text-[var(--muted-foreground)]">Хайлтанд нийцэх ажил олдсонгүй.</p>
                <button
                  id="reset-filters-btn"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedLocation('Бүгд');
                    setSelectedType('Бүгд');
                  }}
                  className="mt-3 text-xs text-[var(--accent-soft-foreground)] hover:underline cursor-pointer"
                >
                  Бүх шүүлтүүрийг арилгах
                </button>
              </div>
            )
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
                  onSelect={(j) => { trackViewJob(j.id, j.status); setSelectedJob(j); }}
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
            trackPostCompleted(newJob.id, newJob.type);
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
          onSuccess={async () => {
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
        <div className="fixed inset-0 bg-[var(--fg)]/40 flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--card)] border border-[var(--border)] p-6 rounded-md shadow-md flex flex-col items-center space-y-3">
            <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs text-[var(--muted-foreground)] font-mono">Үнэлгээг ачаалж байна...</span>
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
