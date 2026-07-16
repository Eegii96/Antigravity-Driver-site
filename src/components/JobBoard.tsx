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
  Trash2,
  Menu
} from 'lucide-react';
const JobPostModal = dynamic(() => import('./JobPostModal'), { ssr: false });
const ReviewModal = dynamic(() => import('./ReviewModal'), { ssr: false });
const ProfileEditModal = dynamic(() => import('./ProfileEditModal'), { ssr: false });
import ConfirmModal from './ConfirmModal';
import JobCard from './jobboard/JobCard';
import NotificationToasts from './jobboard/NotificationToasts';
import ReviewDetailModal from './jobboard/ReviewDetailModal';
import GuestBlurWarningModal from './jobboard/GuestBlurWarningModal';
import BoardHero from './jobboard/BoardHero';
import BoardInfoSections from './jobboard/BoardInfoSections';
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
  /**
   * Build-time job snapshot from the server page component. Seeds the first
   * render so the board isn't empty while the real-time listener spins up —
   * without it, `jobs` started at `[]` and the whole page (footer included)
   * jumped in height once Firestore data arrived, which measured as a CLS
   * score of 1 in production (PageSpeed Insights, 2026-07-05).
   */
  initialJobs?: Job[];
}

export default function JobBoard({
  currentUser,
  initialJobId,
  initialJobs = []
}: JobBoardProps) {
  const router = useRouter();
  const { logout, setCurrentUser } = useAuth();
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [users, setUsers] = useState<User[]>([]);
  const [registeredUserCount, setRegisteredUserCount] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('Бүгд');
  const [selectedType, setSelectedType] = useState<string>('Бүгд');
  const [statusFilter, setStatusFilter] = useState<'open' | 'completed'>('open');
  
  // Modals & States
  const [showPostModal, setShowPostModal] = useState<boolean>(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState<boolean>(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  
  // Custom Review triggers
  const [activeReviewJob, setActiveReviewJob] = useState<Job | null>(null);

  // Share menu — which job's share dropdown is open
  const [shareMenuJob, setShareMenuJob] = useState<string | null>(null);

  // Dropdown hover state emulator
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);
  const [showBlurWarningModal, setShowBlurWarningModal] = useState<boolean>(false);

  // Guest mobile menu — section anchors (+ login on the narrowest screens)
  // live behind a hamburger below lg (review 2026-07-14).
  const [showMobileNav, setShowMobileNav] = useState<boolean>(false);
  const mobileNavRef = useRef<HTMLDivElement>(null);

  // Notifications States
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotificationsMenu, setShowNotificationsMenu] = useState<boolean>(false);
  const [toasts, setToasts] = useState<AppNotification[]>([]);

  const [successMessage, setSuccessMessage] = useState<string>('');
  const [lastClickPos, setLastClickPos] = useState<{ x: number; y: number } | null>(null);
  const [viewingReview, setViewingReview] = useState<Review | null>(null);

  // Deep-link arrival: which job card gets the temporary highlight ring.
  const [deepLinkHighlightId, setDeepLinkHighlightId] = useState<string | null>(null);

  // Design-system confirmation dialog state — replaces window.confirm (AGENTS.md §4).
  const [confirmState, setConfirmState] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    danger?: boolean;
    action: () => Promise<void> | void;
  } | null>(null);

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

  // Skippable profile-completion prompt right after registration (audit C3).
  // AuthClient.tsx redirects to `/` the moment Firebase Auth reports a signed-in
  // user — before Auth.tsx's own onSuccess callback would ever get a chance to
  // show a step-2 UI on the /auth page itself — so the flag set in
  // Auth.tsx's handleRegister is consumed here, on first landing, instead.
  useEffect(() => {
    if (currentUser && sessionStorage.getItem('justRegistered') === '1') {
      sessionStorage.removeItem('justRegistered');
      setShowOnboardingModal(true);
    }
  }, [currentUser]);

  // Deep-link support: auto-expand a specific job when arriving via ?jobId=.
  // This is the redirect target for the jobMeta Cloud Function (jobs posted
  // after the last static build have no prerendered /jobs/<id> page, so
  // Facebook/Google get correct metadata from the function while real
  // browsers bounce here) and doubles as a general shareable deep link
  // (audit P1).
  useEffect(() => {
    if (!initialJobId) return;

    // Scroll the freshly-expanded card into view and flash the highlight ring —
    // without this, a shared link landed on the hero and the promised job sat
    // ~2000px below the fold, never seen (review 2026-07-14). The expanded
    // card renders a few frames after the state update (and later still when
    // the job arrives via getSingleJob), so poll briefly until it exists.
    const revealJob = (jobId: string) => {
      setDeepLinkHighlightId(jobId);
      let attempts = 0;
      const tryScroll = () => {
        const el = document.getElementById(`job-card-expanded-${jobId}`);
        if (el) {
          const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          el.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
          // Some in-app browsers (e.g. the Facebook webview most shared links
          // open in) silently ignore smooth programmatic scrolling — if the
          // card still isn't near the top shortly after, jump instantly.
          setTimeout(() => {
            const rect = el.getBoundingClientRect();
            if (Math.abs(rect.top) > 200) {
              el.scrollIntoView({ behavior: 'auto', block: 'start' });
            }
          }, 700);
        } else if (attempts < 16) {
          attempts += 1;
          setTimeout(tryScroll, 250);
        }
      };
      setTimeout(tryScroll, 150);
      setTimeout(() => setDeepLinkHighlightId(null), 4500);
    };

    const existing = jobs.find(j => j.id === initialJobId);
    if (existing) {
      setStatusFilter(existing.status === 'completed' ? 'completed' : 'open');
      setSelectedJob(existing);
      revealJob(existing.id);
      return;
    }
    let cancelled = false;
    getSingleJob(initialJobId).then(job => {
      if (cancelled || !job) return;
      setJobs(prev => (prev.some(j => j.id === job.id) ? prev : [job, ...prev]));
      setStatusFilter(job.status === 'completed' ? 'completed' : 'open');
      setSelectedJob(job);
      revealJob(job.id);
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

  // Click outside to close the guest mobile menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (mobileNavRef.current && !mobileNavRef.current.contains(event.target as Node)) {
        setShowMobileNav(false);
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

    // Local transient toasts (error/success feedback) are not navigable
    // notifications — clicking one used to route to /profile, which made no
    // sense for an error message. Just dismiss it.
    if (notif.id.startsWith('err_') || notif.id.startsWith('success_')) {
      setToasts(prev => prev.filter(t => t.id !== notif.id));
      return;
    }

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
        const msg = 'Таны ажилд орох хүсэлт, ажлын түүх ба үнэлгээний хамт захиалагчид амжилттай илгээгдлээ.';
        setSuccessMessage(msg);
        addSuccessToast('Хүсэлт илгээгдлээ', msg);
        setTimeout(() => setSuccessMessage(''), 4500);
        trackApplySubmit(jobId);
        await refreshJobs();
      }
    } catch (err) {
      console.error(err);
      addErrorToast('Үйлдэл гүйцэтгэхэд алдаа гарлаа. Дахин оролдоно уу.');
    }
  };

  const executeHire = async (jobId: string, operatorId: string) => {
    try {
      const success = await hireOperator(jobId, operatorId);
      if (success) {
        const msg = 'Жолоочийг ажилд амжилттай томиллоо.';
        setSuccessMessage(msg);
        addSuccessToast('Ажилд сонгогдлоо', msg);
        setTimeout(() => setSuccessMessage(''), 4500);
        await refreshJobs();
      }
    } catch (err) {
      console.error(err);
      addErrorToast('Үйлдэл гүйцэтгэхэд алдаа гарлаа. Дахин оролдоно уу.');
    }
  };

  // Hiring is the single biggest state change in the system (open → completed,
  // other applicants dropped) — it gets a confirmation step like delete does.
  const handleHire = (jobId: string, operatorId: string) => {
    const op = users.find(u => u.id === operatorId);
    setConfirmState({
      title: 'Жолоочийг ажилд сонгох уу?',
      message: `${op ? `«${op.fullName}»-ийг` : 'Энэ жолоочийг'} сонгосноор зар нээлттэй жагсаалтаас хасагдаж, бусад хүсэлтүүд хүчингүй болно.`,
      confirmLabel: 'Тийм, сонгох',
      action: async () => {
        await executeHire(jobId, operatorId);
        setConfirmState(null);
      },
    });
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

  const handleDeleteJob = (job: Job) => {
    setConfirmState({
      title: 'Зарыг устгах уу?',
      message: `«${job.title}» зарыг устгасны дараа сэргээх боломжгүй.`,
      confirmLabel: 'Устгах',
      danger: true,
      action: async () => {
        try {
          await deleteJob(job.id);
          setSelectedJob(null);
          addSuccessToast('Устгагдлаа', 'Зарыг амжилттай устгалаа.');
        } catch (err) {
          console.error(err);
          addErrorToast('Зарыг устгахад алдаа гарлаа.');
        } finally {
          setConfirmState(null);
        }
      },
    });
  };

  const handleCancelHiring = (job: Job) => {
    setConfirmState({
      title: 'Сонгосон жолоочийг цуцлах уу?',
      message: 'Сонголт цуцлагдаж, зар буцаад нээлттэй төлөвт шилжинэ.',
      confirmLabel: 'Тийм, цуцлах',
      danger: true,
      action: async () => {
        try {
          // Jobs list and the selected card re-sync automatically via the jobs subscription.
          await cancelHiring(job.id);
        } catch (err) {
          console.error(err);
          addErrorToast('Үйлдэл гүйцэтгэхэд алдаа гарлаа. Дахин оролдоно уу.');
        } finally {
          setConfirmState(null);
        }
      },
    });
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
      {/* Compliance notice — quiet cream strip; the blacklist warning stays
          visible but no longer screams at every visitor as the first thing
          on the page (redesign 2026-07-13). */}
      <div className="bg-[var(--bg2)] border-b border-[var(--border)] text-[var(--muted-foreground)] px-4 py-2.5 text-center text-[13px] leading-snug flex items-center justify-center gap-2 z-50">
        <AlertTriangle className="w-4 h-4 text-[var(--alert)] shrink-0" />
        <span>
          <span className="font-semibold text-[var(--fg)]">Анхаар:</span> Ноцтой зөрчил гаргасан хэрэглэгч хар дансанд бүртгэгдэж, системийн эрх хаагдаж болзошгүй.
        </span>
      </div>

      {/* Nav bar — slim nameplate header; the long descriptor copy lives in the hero now */}
      <header className="bg-[var(--bg)] border-b border-[var(--border)] sticky top-0 z-40 px-3 sm:px-4 md:px-6 py-3.5 flex items-center justify-between gap-2 sm:gap-3">
        <a href="/" className="flex items-center space-x-2 sm:space-x-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-[var(--bg2)] border border-[var(--border)] flex items-center justify-center relative overflow-hidden shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="w-full h-full object-cover" src="/logo.jpg" alt="Жолооч Монголиа лого" loading="eager" width="40" height="40" />
          </div>
          <div className="min-w-0">
            <span className="font-display font-bold tracking-tight text-[var(--fg)] block text-sm sm:text-base md:text-lg leading-none truncate">
              Жолооч Монголиа
            </span>
            <span className="hidden sm:block text-xs text-[var(--muted-foreground)] font-sans mt-1.5 leading-none">
              Хүнд машин, механизм ба газар шорооны ажлын зах зээл
            </span>
          </div>
        </a>

        {/* Primary site navigation (semantic, crawlable) */}
        <nav aria-label="Үндсэн цэс" className="hidden lg:flex items-center gap-1 text-sm font-semibold text-[var(--muted-foreground)]">
          <a href="#job-board" className="px-4 py-2 rounded-full hover:bg-[var(--bg2)] hover:text-[var(--fg)] transition-colors">Ажлын зар</a>
          <a href="#how-it-works" className="px-4 py-2 rounded-full hover:bg-[var(--bg2)] hover:text-[var(--fg)] transition-colors">Хэрхэн ажилладаг</a>
          <a href="#faq" className="px-4 py-2 rounded-full hover:bg-[var(--bg2)] hover:text-[var(--fg)] transition-colors">Түгээмэл асуулт</a>
        </nav>

        {/* Profile and Notifications triggers */}
        <div className="flex items-center space-x-3.5">
          {currentUser ? (
            <>
              {currentUser && (
                <button
                  id="header-post-job-btn"
                  onClick={() => { trackPostStarted(); setShowPostModal(true); }}
                  className="bg-[var(--accent)] hover:opacity-90 text-[var(--accent-foreground)] font-semibold text-[13px] px-4 py-2.5 rounded-full flex items-center space-x-1.5 transition-all cursor-pointer"
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
                    <span className="absolute -top-1 -right-1 bg-[var(--alert)] text-white text-[10px] leading-none font-bold h-4 min-w-4 px-1 rounded-full flex items-center justify-center border border-[var(--card)] tabular-nums">
                      {unreadNotifs.length > 9 ? '9+' : unreadNotifs.length}
                    </span>
                  )}
                </button>

                {showNotificationsMenu && (
                  <div
                    id="notifications-dropdown-menu"
                    ref={notificationsMenuRef}
                    className="absolute right-0 mt-2.5 w-[min(360px,calc(100vw-2rem))] bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-md z-50 py-2 animate-fade-in overflow-hidden"
                  >
                    <div className="px-4 py-2.5 border-b border-[var(--border)] flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--muted-foreground)] font-sans">Системийн мэдэгдлүүд</span>
                      {unreadNotifs.length > 0 && (
                        <button
                          type="button"
                          onClick={handleMarkAllAsRead}
                          className="text-xs bg-[var(--accent-soft)] hover:brightness-95 text-[var(--accent-soft-foreground)] px-3 py-2 rounded-full font-bold transition-all cursor-pointer"
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
                              <span className="absolute left-2 top-[18px] inline-flex rounded-full h-2 w-2 bg-[var(--accent)]"></span>
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
                                <span className={`text-xs font-sans tabular-nums shrink-0 transition-colors duration-200 ${
                                  notif.isRead
                                    ? 'text-[var(--muted-foreground)]'
                                    : 'text-[var(--accent-soft-foreground)] font-bold'
                                }`}>
                                  {formatNotificationDate(notif.createdAt)}
                                </span>
                              </div>
                              <p className={`text-sm leading-relaxed mt-1 font-sans transition-colors duration-200 ${
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
                                  className="min-h-11 bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-600 hover:text-rose-700 border border-rose-200 px-3 rounded-full text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
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
                          className="w-full bg-rose-50 hover:bg-rose-100 active:scale-98 border border-rose-200 hover:border-rose-300 text-rose-600 hover:text-rose-700 py-2.5 rounded-full text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer font-sans"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Бүх мэдэгдлийг устгах</span>
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
                    <span className="text-xs text-[var(--muted-foreground)] font-sans">
                      {currentUser.type === 'operator' ? 'Жолооч' : 'Ажил олгогч'} · {currentUser.rating}★
                    </span>
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={currentUser.profileImage}
                    alt="user avatar"
                    className="w-8 h-8 rounded-full object-cover border border-[var(--border)]"
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
                    <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-md py-2 overflow-hidden">
                      <div className="px-3.5 py-2 border-b border-[var(--border)] text-xs text-[var(--muted-foreground)] font-semibold font-sans">
                        Сонголтууд
                      </div>

                      <button
                        id="menu-goto-profile"
                        onClick={() => { router.push('/profile'); setShowProfileMenu(false); }}
                        className="w-full text-left px-4 py-2.5 text-[13px] hover:bg-[var(--bg2)] text-[var(--fg)] flex items-center space-x-2.5 transition-colors cursor-pointer"
                      >
                        <UserIcon className="w-4 h-4 text-[var(--muted-foreground)]" />
                        <span>Миний профайл</span>
                      </button>

                      <button
                        id="menu-goto-applications"
                        onClick={() => { router.push('/applications'); setShowProfileMenu(false); }}
                        className="w-full text-left px-4 py-2.5 text-[13px] hover:bg-[var(--bg2)] text-[var(--fg)] flex items-center space-x-2.5 transition-colors cursor-pointer"
                      >
                        <Briefcase className="w-4 h-4 text-[var(--muted-foreground)]" />
                        <span>Миний зарууд, хүсэлтүүд</span>
                      </button>

                      <button
                        id="menu-goto-settings"
                        onClick={() => { router.push('/settings'); setShowProfileMenu(false); }}
                        className="w-full text-left px-4 py-2.5 text-[13px] hover:bg-[var(--bg2)] text-[var(--fg)] flex items-center space-x-2.5 transition-colors cursor-pointer"
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
                        className="w-full text-left px-4 py-2.5 text-[13px] hover:bg-rose-50 text-rose-600 hover:text-rose-700 flex items-center space-x-2.5 transition-colors cursor-pointer"
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
            <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
              {/* Login stays reachable from the header on phones too — it used
                  to be hidden below `sm`, leaving mobile guests only the hero
                  link (review 2026-07-14). On the narrowest screens (<420px)
                  it moves into the hamburger menu so the brand doesn't truncate. */}
              <a
                href="/auth?tab=login"
                className="hidden min-[420px]:block text-[13px] sm:text-sm text-[var(--muted-foreground)] hover:text-[var(--fg)] font-semibold px-2 sm:px-4 py-2.5 transition-all cursor-pointer hover:bg-[var(--bg2)] rounded-full whitespace-nowrap"
              >
                Нэвтрэх
              </a>
              <a
                href="/auth?tab=register"
                className="bg-[var(--accent)] hover:opacity-90 text-[var(--accent-foreground)] font-semibold text-[13px] sm:text-sm px-3 sm:px-5 py-2.5 rounded-full transition-all cursor-pointer whitespace-nowrap"
              >
                Бүртгүүлэх
              </a>

              {/* Guest mobile menu — the section anchors are lg-only in the
                  main nav; below lg they live here (review 2026-07-14). */}
              <div ref={mobileNavRef} className="relative lg:hidden">
                <button
                  type="button"
                  onClick={() => setShowMobileNav(prev => !prev)}
                  aria-label="Цэс"
                  aria-expanded={showMobileNav}
                  className="min-w-11 min-h-11 flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--fg)] hover:bg-[var(--bg2)] rounded-full transition-colors cursor-pointer"
                >
                  {showMobileNav ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>

                {showMobileNav && (
                  <div className="absolute right-0 top-full mt-2 w-60 bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-md py-2 z-50 animate-fade-in overflow-hidden">
                    <a href="#job-board" onClick={() => setShowMobileNav(false)} className="block px-4 py-3 text-sm font-semibold text-[var(--fg)] hover:bg-[var(--bg2)] transition-colors">
                      Ажлын зар
                    </a>
                    <a href="#how-it-works" onClick={() => setShowMobileNav(false)} className="block px-4 py-3 text-sm font-semibold text-[var(--fg)] hover:bg-[var(--bg2)] transition-colors">
                      Хэрхэн ажилладаг
                    </a>
                    <a href="#faq" onClick={() => setShowMobileNav(false)} className="block px-4 py-3 text-sm font-semibold text-[var(--fg)] hover:bg-[var(--bg2)] transition-colors">
                      Түгээмэл асуулт
                    </a>
                    <div className="border-t border-[var(--border)] my-1 min-[420px]:hidden"></div>
                    <a href="/auth?tab=login" className="block px-4 py-3 text-sm font-semibold text-[var(--muted-foreground)] hover:bg-[var(--bg2)] hover:text-[var(--fg)] transition-colors min-[420px]:hidden">
                      Нэвтрэх
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </header>

      <BoardHero
        isLoggedIn={!!currentUser}
        jobsCount={jobs.length}
        userCount={registeredUserCount}
        onPostJob={() => { trackPostStarted(); setShowPostModal(true); }}
      />

      {/* <section>, not <main> — layout.tsx already provides the single page <main> landmark */}
      <section id="job-board" aria-label="Ажлын зарууд" className="flex-1 max-w-4xl mx-auto w-full px-4 md:px-6 py-8 space-y-6 scroll-mt-16">

        {/* Top Success Banner removed to prevent out-of-view notifications. Inline success alerts & floating mouse-anchored toasts are used instead. */}

        {/* Section heading — proper h1→h2 document outline (audit: heading skip) */}
        <div className="flex items-end justify-between gap-3">
          <h2 className="text-[22px] md:text-[28px] font-display font-bold tracking-tight text-[var(--fg)]">
            Ажлын зарууд
          </h2>
          <span className="text-[13px] text-[var(--muted-foreground)] pb-1.5">
            {jobs.length} зар · шинэ нь эхэндээ
          </span>
        </div>

        {/* Category quick-filter chips — one-tap filtering for mobile users */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap overscroll-contain" role="group" aria-label="Зарын төрлөөр шүүх">
          {getUniqueJobTypes().map((t) => (
            <button
              key={t.value}
              onClick={() => setSelectedType(t.value)}
              className={`shrink-0 text-sm font-medium px-4.5 py-2.5 rounded-full border transition-all cursor-pointer ${
                selectedType === t.value
                  ? 'bg-[var(--fg)] text-[var(--bg)] border-[var(--fg)]'
                  : 'bg-[var(--card)] text-[var(--muted-foreground)] border-[var(--border)] hover:border-[var(--border-strong)] hover:text-[var(--fg)]'
              }`}
            >
              {t.value === 'Бүгд' ? 'Бүгд' : t.label}
            </button>
          ))}
        </div>

        {/* Search bar & filter buttons */}
        <div className="bg-[var(--card)] p-4 md:p-5 border border-[var(--border)] rounded-2xl space-y-4 shadow-sm">

          {/* Search inputs */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-[var(--muted-foreground)]" />
            <input
              id="board-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Экскаватор, Шакман жолооч, Дамп, Өмнөговь гэж хайх..."
              className="w-full pl-10 pr-10 py-3.5 bg-[var(--bg)] border border-[var(--border)] hover:border-[var(--border-strong)] rounded-xl text-base text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)] focus:border-[var(--fg)] transition-all placeholder-[var(--concrete)] font-sans"
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

          {/* Location filter — the job-type filter lives only in the quick
              chips above; a second identical dropdown was duplicated control
              noise (review 2026-07-14). */}
          <div className="grid grid-cols-1 gap-4">
            {/* Aimag location */}
            <div className="flex flex-col space-y-1.5">
              <label htmlFor="filter-location" className="text-[13px] text-[var(--muted-foreground)] font-medium text-left">Аймаг / Байршил</label>
              <div className="relative">
                <select
                  id="filter-location"
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] hover:border-[var(--border-strong)] text-[var(--fg)] text-[15px] px-3.5 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)] focus:border-[var(--fg)] transition-all cursor-pointer appearance-none"
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
            <div className="flex items-center justify-between text-[13px] bg-[var(--accent-soft)] p-3 rounded-xl animate-fade-in">
              <div className="flex flex-wrap items-center gap-1.5 text-[var(--accent-soft-foreground)]">
                <Filter className="w-3.5 h-3.5" />
                <span>Шүүлтүүр:</span>
                {searchQuery && <span className="bg-[var(--card)] px-2.5 py-0.5 rounded-full text-[var(--fg)] font-medium">&ldquo;{searchQuery}&rdquo;</span>}
                {selectedLocation !== 'Бүгд' && <span className="bg-[var(--card)] px-2.5 py-0.5 rounded-full text-[var(--fg)] font-medium">{selectedLocation}</span>}
                {selectedType !== 'Бүгд' && (
                  <span className="bg-[var(--card)] px-2.5 py-0.5 rounded-full text-[var(--fg)] font-medium">
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
                className="text-[var(--accent-soft-foreground)] hover:underline font-semibold transition-all cursor-pointer flex items-center gap-1 shrink-0 ml-2"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Арилгах</span>
              </button>
            </div>
          )}

        </div>

        {/* Job listings container */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 border-b border-[var(--border)]">
            <button
              onClick={() => setStatusFilter('open')}
              className={`text-[15px] font-semibold px-3.5 py-3 -mb-px transition-all cursor-pointer border-b-2 ${
                statusFilter === 'open'
                  ? 'text-[var(--fg)] border-[var(--fg)]'
                  : 'text-[var(--muted-foreground)] border-transparent hover:text-[var(--fg)]'
              }`}
            >
              Идэвхтэй зар ({openFilteredJobs.length})
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`text-[15px] font-semibold px-3.5 py-3 -mb-px transition-all cursor-pointer border-b-2 ${
                statusFilter === 'completed'
                  ? 'text-[var(--fg)] border-[var(--verify)]'
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
              <div className="bg-[var(--card)] border border-[var(--border)] p-12 text-center rounded-2xl space-y-3">
                <p className="text-[15px] font-semibold text-[var(--fg)]">Одоогоор идэвхтэй зар алга байна</p>
                <p className="text-sm text-[var(--muted-foreground)]">Анхны зараа үнэгүй тавьж, системийг амьдруулаарай!</p>
                <button
                  id="empty-board-post-job-btn"
                  onClick={() => {
                    if (currentUser) { trackPostStarted(); setShowPostModal(true); }
                    else router.push('/auth?tab=register');
                  }}
                  className="mt-2 bg-[var(--accent)] hover:opacity-90 text-[var(--accent-foreground)] font-semibold text-sm px-6 py-3 rounded-full transition-all cursor-pointer"
                >
                  {currentUser ? 'Зар нэмэх' : 'Бүртгүүлээд зар тавих'}
                </button>
              </div>
            ) : (
              <div className="bg-[var(--card)] border border-[var(--border)] p-12 text-center rounded-2xl">
                <p className="text-[15px] text-[var(--muted-foreground)]">Хайлтанд нийцэх ажил олдсонгүй.</p>
                <button
                  id="reset-filters-btn"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedLocation('Бүгд');
                    setSelectedType('Бүгд');
                  }}
                  className="mt-3 text-sm font-medium text-[var(--accent-soft-foreground)] hover:underline cursor-pointer"
                >
                  Бүх шүүлтүүрийг арилгах
                </button>
              </div>
            )
          ) : (
            /* Masonry: on md+ the collapsed cards flow into two independently-
               stacked columns, so a short text-only card packs tightly under
               the previous one instead of stretching its grid row to match a
               tall image card. Below md the column wrappers become
               `display: contents` and the per-card `order` (original index)
               restores chronological order in the single-column flow.

               The EXPANDED card is rendered as its own full-width row between
               two masonry segments (the jobs before it / after it) — a detail
               view squeezed into a 50% column was a cramped reading experience
               on desktop (review 2026-07-14). Every card still exists exactly
               once in the DOM, which the click-outside collapse logic
               (getElementById) relies on. */
            (() => {
              const jobCardFor = (job: Job, isExpanded: boolean) => (
                <JobCard
                  job={job}
                  isExpanded={isExpanded}
                  isHighlighted={deepLinkHighlightId === job.id}
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
              );

              const renderMasonry = (segment: Job[]) =>
                segment.length === 0 ? null : (
                  <div className="flex flex-col gap-4 md:flex-row md:items-start">
                    {[0, 1].map((column) => (
                      <div key={column} className="contents md:flex md:min-w-0 md:flex-1 md:flex-col md:gap-4">
                        {segment
                          .map((job, index) => ({ job, index }))
                          .filter(({ index }) => index % 2 === column)
                          .map(({ job, index }) => (
                            <div key={job.id} style={{ order: index }} className="min-w-0">
                              {jobCardFor(job, false)}
                            </div>
                          ))}
                      </div>
                    ))}
                  </div>
                );

              const expandedIndex = selectedJob
                ? displayJobs.findIndex(j => j.id === selectedJob.id)
                : -1;

              if (expandedIndex === -1) {
                return renderMasonry(displayJobs);
              }
              return (
                <div className="space-y-4">
                  {renderMasonry(displayJobs.slice(0, expandedIndex))}
                  {jobCardFor(displayJobs[expandedIndex], true)}
                  {renderMasonry(displayJobs.slice(expandedIndex + 1))}
                </div>
              );
            })()
          )}
        </div>

      </section>

      {/* Copy/conversion sections — how it works, trust, FAQ, CTA band (audit: COPY 48, CONVERSION 15) */}
      <BoardInfoSections isLoggedIn={!!currentUser} onPostJob={() => { trackPostStarted(); setShowPostModal(true); }} />

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
            const msg = 'Ажлын зар амжилттай нийтлэгдэж, систем дэх нээлттэй жолооч нарын үзүүрт орлоо!';
            setSuccessMessage(msg);
            addSuccessToast('Амжилттай', msg);
            setTimeout(() => setSuccessMessage(''), 4500);
          }}
        />
      )}

      {showOnboardingModal && currentUser && (
        <ProfileEditModal
          user={currentUser}
          isOnboarding
          onClose={() => setShowOnboardingModal(false)}
          onSave={(updated) => {
            setCurrentUser(updated);
            setShowOnboardingModal(false);
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
            const msg = 'Ажлын зар амжилттай засагдаж шинэчлэгдлээ!';
            setSuccessMessage(msg);
            addSuccessToast('Амжилттай', msg);
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
            const msg = 'Сэтгэгдэл, үнэлгээ амжилттай бүртгэгдэж тухайн хэрэглэгчийн албан ёсны ажлын түүхэнд шинэчлэгдлээ. Хамтын оролцоонд баярлалаа.';
            setSuccessMessage(msg);
            addSuccessToast('Амжилттай', msg);
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

      {/* Design-system confirmation dialog (delete / cancel-hiring / hire) */}
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
