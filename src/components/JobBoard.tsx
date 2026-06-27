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
  parseNotificationDateString,
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
  Trash2,
  Phone,
  ChevronLeft,
  Share2,
  Copy,
  Link
} from 'lucide-react';
import JobPostModal from './JobPostModal';
import ReviewModal from './ReviewModal';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';

interface JobBoardProps {
  currentUser: User | null;
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

  const getEmployerDisplayName = (job: Job) => {
    const emp = users.find(u => u.id === job.employerId);
    if (emp) {
      return emp.companyName && emp.companyName.trim() ? emp.companyName.trim() : emp.fullName;
    }
    return job.employerName;
  };

  const getEmployerPhone = (job: Job) => {
    const emp = users.find(u => u.id === job.employerId);
    return emp ? emp.phone : '';
  };

  const getMockEmployerName = (jobId: string) => {
    const mockNames = ['Бат-Эрдэнэ', 'Лхагвасүрэн', 'Энхбат', 'Ганзориг', 'Мөнх-Эрдэнэ', 'Болдбаатар', 'Төмөрхүү', 'Алтанхуяг'];
    const charCodeSum = jobId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return mockNames[charCodeSum % mockNames.length];
  };

  const getMockEmployerPhone = (jobId: string) => {
    const prefixes = ['9911', '8811', '9909', '8010', '9511', '9400', '8515', '9922'];
    const charCodeSum = jobId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const prefix = prefixes[charCodeSum % prefixes.length];
    const lastFour = (charCodeSum * 17) % 9000 + 1000;
    return `${prefix}${lastFour}`;
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}.${month}.${day}`;
    } catch (e) {
      return isoString || '';
    }
  };

  const formatNotificationDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const ms = parseNotificationDateString(isoString);
      if (ms === 0) return isoString;
      const d = new Date(ms);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${year}.${month}.${day} ${hours}:${minutes}`;
    } catch (e) {
      return isoString || '';
    }
  };
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

  useEffect(() => {
    const load = async () => {
      await Promise.all([refreshJobs(), refreshUsers(), refreshNotifications()]);
    };
    load();
  }, []);

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

  // Polling for real-time feel (4 seconds)
  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        if (currentUser) {
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
              {displayJobs.map((job) => {
                const isExpanded = selectedJob?.id === job.id;

                if (isExpanded) {
                  return (
                    <div
                      id={`job-card-expanded-${job.id}`}
                      key={`expanded-${job.id}`}
                      className="bg-[var(--color-glass-bg)] backdrop-blur-md border-2 border-violet-600 p-5 rounded-2xl text-left space-y-4 shadow-2xl transition-all duration-300 w-full self-start"
                    >
                      {/* ── HEADER: back button + date ── */}
                      <div className="flex items-center justify-between pb-3 border-b border-[var(--color-glass-border)]">
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedJob(null); }}
                          className="p-1.5 -ml-1 rounded-lg hover:bg-white/10 text-[#9aa3b5] hover:text-[#f1f3f8] transition-colors cursor-pointer flex items-center space-x-1"
                          title="Буцах"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          <span className="text-xs text-[#9aa3b5]">Буцах</span>
                        </button>
                        <span className="font-mono text-[10px] text-[#9aa3b5]">{formatDate(job.createdAt)}</span>
                      </div>

                      {/* ── CREATOR INFO ROW (Name on left, Phone on right) ── */}
                      <div className="flex justify-between items-center pb-2 border-b border-[var(--color-glass-border)]" onClick={(e) => e.stopPropagation()}>
                        {/* Creator name */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!currentUser) { setShowBlurWarningModal(true); return; }
                            const employerUser = users.find(u => u.id === job.employerId);
                            if (employerUser) router.push(`/profile?id=${employerUser.id}`);
                          }}
                          className="flex items-center space-x-2 text-left focus:outline-none hover:opacity-80 transition-opacity bg-transparent border-0 p-0 cursor-pointer"
                        >
                          <UserIcon className="w-4 h-4 text-violet-400 shrink-0" />
                          <span className={`text-xs font-bold font-sans ${
                            !currentUser ? 'text-violet-400 filter blur-[5px] select-none cursor-pointer' : 'text-violet-400 hover:underline'
                          }`}>
                            {!currentUser ? getMockEmployerName(job.id) : getEmployerDisplayName(job)}
                          </span>
                        </button>

                        {/* Phone number */}
                        <div
                          onClick={(e) => {
                            if (!currentUser) { e.stopPropagation(); setShowBlurWarningModal(true); }
                          }}
                          className={`flex items-center space-x-1.5 ${ !currentUser ? 'cursor-pointer' : '' }`}
                        >
                          <Phone className="w-3.5 h-3.5 text-violet-400" />
                          <span className={`font-mono text-xs font-bold text-violet-400 ${
                            !currentUser ? 'filter blur-[5px] select-none' : ''
                          }`}>
                            {!currentUser ? getMockEmployerPhone(job.id) : (getEmployerPhone(job) || 'Утасгүй')}
                          </span>
                        </div>
                      </div>

                      {/* ── TITLE + DESCRIPTION ── */}
                      <div className="space-y-2">
                        <h3 className="text-base font-extrabold text-[#f1f3f8] leading-snug">{job.title}</h3>
                        <p className="text-[12px] text-[#9aa3b5] leading-relaxed">{job.description}</p>
                        {job.additionalInfo && (
                          <p className="text-[11px] text-[#9aa3b5] italic bg-white/5 p-2.5 rounded-lg border border-[var(--color-glass-border)] leading-relaxed">
                            {job.additionalInfo}
                          </p>
                        )}
                      </div>

                      {/* ── IMAGES ── */}
                      {job.imageUrls && job.imageUrls.length > 0 ? (
                        <div className="w-full space-y-1">
                          <div className="flex overflow-x-auto gap-2 snap-x snap-mandatory scrollbar-none py-1">
                            {job.imageUrls.map((url, idx) => (
                              <div key={idx} className="shrink-0 w-full snap-center h-48 md:h-64 overflow-hidden rounded-xl border border-[var(--color-glass-border)] bg-white/5 flex items-center justify-center relative">
                                <img
                                  src={url}
                                  alt={`Slide ${idx + 1}`}
                                  className="w-full h-full object-contain"
                                />
                                <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md text-white text-[9px] font-bold px-2 py-0.5 rounded-full border border-white/10 font-sans">
                                  {idx + 1} / {job.imageUrls?.length}
                                </div>
                              </div>
                            ))}
                          </div>
                          {job.imageUrls.length > 1 && (
                            <p className="text-[9px] text-[#9aa3b5] text-center font-sans select-none">
                              ↔️ Хажуу тийш гүйлгэж үзнэ үү
                            </p>
                          )}
                        </div>
                      ) : (job.imageUrl && (
                        <div className="w-full h-48 md:h-64 overflow-hidden rounded-xl border border-[var(--color-glass-border)] bg-white/5 flex items-center justify-center">
                          <img
                            src={job.imageUrl}
                            alt={job.title}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ))}

                      {/* ── SALARY + LOCATION 2-column grid ── */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/5 p-3.5 rounded-xl border border-[var(--color-glass-border)]">
                          <span className="text-[9.5px] text-[#9aa3b5] uppercase tracking-wider font-bold block mb-1">Цалин / Төлбөр</span>
                          <span className="font-mono font-bold text-teal-300 text-sm">
                            {job.salary === 0 ? 'Тохиролцоно' : `${job.salary.toLocaleString()} ₮`}
                          </span>
                          {job.salaryUnit && job.salaryUnit !== 'Өдрөөр' && (
                            <span className="text-[9px] text-[#9aa3b5] block mt-0.5">{job.salaryUnit}</span>
                          )}
                        </div>
                        <div className="bg-white/5 p-3.5 rounded-xl border border-[var(--color-glass-border)]">
                          <span className="text-[9.5px] text-[#9aa3b5] uppercase tracking-wider font-bold block mb-1">Байршил</span>
                          <span className="font-semibold text-[#f1f3f8] text-xs flex items-start gap-1">
                            <MapPin className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5" />
                            {job.location}
                          </span>
                        </div>
                      </div>

                      {/* ── STATUS BADGE ── */}
                      <div>
                        {(() => {
                          if (job.status === 'open') {
                            return (
                              <span className="inline-flex items-center text-[10.5px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full border-2 border-violet-500/40 bg-violet-500/10 text-violet-300">
                                <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-violet-400 animate-pulse" />
                                Нээлттэй (Идэвхтэй)
                              </span>
                            );
                          } else if (job.status === 'in_progress') {
                            return (
                              <span className="inline-flex items-center text-[10.5px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full border-2 border-amber-500/40 bg-amber-500/10 text-amber-400">
                                <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-amber-400 animate-pulse" />
                                Ажиллаж байгаа
                              </span>
                            );
                          } else {
                            const isReviewed = job.isReviewedByEmployer;
                            if (isReviewed) {
                              return (
                                <span className="inline-flex items-center text-[10.5px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full border-2 border-teal-500/40 bg-teal-500/10 text-teal-300">
                                  Үнэлэгдсэн • Хаагдсан ✓
                                </span>
                              );
                            } else {
                              return (
                                <span className="inline-flex items-center text-[10.5px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full border-2 border-amber-500/40 bg-amber-500/10 text-amber-400 animate-pulse">
                                  <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-amber-400" />
                                  Ажил дууссан • Үнэлэх шаардлагатай ⚠️
                                </span>
                              );
                            }
                          }
                        })()}
                      </div>



                      {/* ── WORKFLOW ACTIONS ── */}
                      <div className="border-t border-[var(--color-glass-border)] pt-3 space-y-3" onClick={(e) => e.stopPropagation()}>
                        {!currentUser ? (
                          <div className="bg-white/5 p-4 border border-[var(--color-glass-border)] rounded-xl text-center space-y-3">
                            <p className="text-xs text-[#c8cbe0] font-sans">
                              Та энэхүү заранд хүсэлт илгээх эсвэл зар тавихын тулд системд нэвтэрсэн байх шаардлагатай.
                            </p>
                            <div className="flex justify-center space-x-3">
                              <button onClick={() => router.push('/auth?tab=login')} className="bg-white/10 hover:bg-white/20 text-white font-semibold text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer">
                                Нэвтрэх
                              </button>
                              <button onClick={() => router.push('/auth?tab=register')} className="bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer">
                                Бүртгүүлэх
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {job.status === 'open' && (
                              <>
                                {currentUser.id === job.employerId ? (
                                  <div className="space-y-3">
                                    <div className="bg-white/5 p-3.5 rounded-xl border border-[var(--color-glass-border)] space-y-3">
                                      <span className="text-[10px] text-[#9aa3b5] block uppercase font-mono tracking-wider">Зарын Тохиргоо:</span>
                                      <div className="flex space-x-2.5">
                                        <button type="button" onClick={() => setEditingJob(job)} className="flex-1 border border-[var(--color-glass-border)] hover:border-white/20 bg-white/5 hover:bg-white/10 text-[#9aa3b5] hover:text-[#f1f3f8] font-semibold text-[10.5px] py-1.5 px-2.5 rounded-lg transition-colors cursor-pointer text-center">
                                          Засах
                                        </button>
                                        <button
                                          type="button"
                                          onClick={async () => {
                                            if (window.confirm('Та энэ зарыг устгахдаа итгэлтэй байна уу? Устгасны дараа сэргээх боломжгүй.')) {
                                              try {
                                                await deleteJob(job.id);
                                                setSelectedJob(null);
                                                await refreshJobs();
                                                addSuccessToast('Устгагдлаа', 'Зарыг амжилттай устгалаа.');
                                              } catch (err) {
                                                console.error(err);
                                                addErrorToast('Зарыг устгахад алдаа гарлаа.');
                                              }
                                            }
                                          }}
                                          className="flex-1 border border-[var(--color-glass-border)] hover:border-white/20 bg-white/5 hover:bg-white/10 text-[#9aa3b5] hover:text-[#f1f3f8] font-semibold text-[10.5px] py-1.5 px-2.5 rounded-lg transition-colors cursor-pointer text-center"
                                        >
                                          Устгах
                                        </button>
                                      </div>
                                    </div>
                                    <div className="flex items-center justify-between text-xs border-b border-[var(--color-glass-border)] pb-2">
                                      <span className="font-bold text-[#e3e6ee]">Хүсэлт ирүүлсэн харилцагч ({job.applicants.length})</span>
                                    </div>
                                    {job.applicants.length === 0 ? (
                                      <p className="text-[11px] text-[#9aa3b5] text-center py-2">Ирүүлсэн хүсэлт байхгүй байна.</p>
                                    ) : (
                                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                        {job.applicants.map((opId) => {
                                          const op = users.find(u => u.id === opId);
                                          if (!op) return null;
                                          return (
                                            <div key={opId} className="flex items-center justify-between bg-white/5 p-2.5 rounded-lg border border-[var(--color-glass-border)]">
                                              <button type="button" onClick={() => router.push(`/profile?id=${op.id}`)} className="text-xs text-[#f1f3f8] font-medium hover:underline hover:text-violet-400 text-left focus:outline-none">
                                                {op.fullName} {op.type === 'operator' && `(${op.experienceYears || 0} жил)`}
                                              </button>
                                              <button onClick={() => handleHire(job.id, op.id)} className="bg-violet-600 hover:bg-violet-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer">
                                                Сонгох
                                              </button>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  job.applicants.includes(currentUser.id) ? (
                                    <div className="space-y-2.5">
                                      <button disabled className="w-full bg-white/5 text-[#9aa3b5] text-xs font-bold py-3 px-4 rounded-xl cursor-not-allowed border border-[var(--color-glass-border)] text-center">
                                        Хүсэлт илгээсэн
                                      </button>
                                      {successMessage && successMessage.includes('хүсэлт') && (
                                        <div className="bg-violet-500/10 border border-violet-500/30 text-violet-300 p-3.5 rounded-xl text-xs flex items-start space-x-2 animate-fade-in text-left">
                                          <CheckCircle className="w-4 h-4 text-teal-300 shrink-0 mt-0.5" />
                                          <span className="font-sans leading-normal text-[11px]">{successMessage}</span>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <button onClick={() => handleApply(job.id)} className="w-full bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold py-3 px-4 rounded-xl transition-all shadow-md shadow-violet-600/10 cursor-pointer text-center">
                                      Хүсэлт илгээх
                                    </button>
                                  )
                                )}
                              </>
                            )}

                            {job.status === 'in_progress' && (
                              <div className="bg-white/5 p-3.5 rounded-xl border border-[var(--color-glass-border)] space-y-3">
                                <div className="text-xs text-[#c8cbe0] flex items-center justify-between">
                                  <span>Хамтран ажиллаж буй оператор:</span>
                                  <span className="font-bold text-[#f1f3f8]">
                                    {(() => {
                                      const op = users.find(u => u.id === job.hiredOperatorId);
                                      return op ? getFirstName(op) : getFirstName(job.hiredOperatorName);
                                    })()}
                                  </span>
                                </div>
                                {successMessage && successMessage.includes('томиллоо') && (
                                  <div className="bg-violet-500/10 border border-violet-500/30 text-violet-300 p-3 rounded-xl text-[11px] flex items-start space-x-2 animate-fade-in text-left">
                                    <CheckCircle className="w-4 h-4 text-teal-300 shrink-0 mt-0.5" />
                                    <span className="font-sans leading-normal">{successMessage}</span>
                                  </div>
                                )}
                                {currentUser.id === job.employerId && (
                                  <button id="employer-complete-job-btn" onClick={() => handleCompleteAndReviewTrigger(job)} className="w-full bg-violet-600 hover:bg-violet-700 text-white py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer text-center">
                                    ✓ Ажил дууссаныг баталгаажуулж үнэлэх
                                  </button>
                                )}
                                {currentUser.id !== job.employerId && (
                                  <p className="text-[10px] text-[#9aa3b5]">Ажил олгогч ажлыг дууссаныг тэмдэглэсний дараа та үнэлгээ өгөх боломжтой болно.</p>
                                )}
                              </div>
                            )}

                            {job.status === 'completed' && (
                              <div className="bg-white/5 p-4 border border-[var(--color-glass-border)] rounded-xl space-y-3">
                                <div className="flex items-center space-x-1.5 text-xs text-teal-300 font-bold">
                                  <CheckCircle className="w-4 h-4" />
                                  <span>ЭНЭХҮҮ АЖИЛ АМЖИЛТТАЙ ГҮЙЦЭТГЭГДЭЖ ДУУССАН</span>
                                </div>

                                {currentUser.type === 'operator' && job.hiredOperatorId === currentUser.id && !job.isReviewedByOperator && (
                                  <button id="op-review-employer-btn" onClick={() => setActiveReviewJob(job)} className="w-full bg-violet-600 hover:bg-violet-500 text-white py-1.5 px-3 rounded-lg text-xs font-bold cursor-pointer transition-colors">
                                    Захиалагчийг Үнэлэх (Цалингийн мурилт эсвэл харилцаа)
                                  </button>
                                )}

                                {currentUser.type === 'employer' && job.employerId === currentUser.id && !job.isReviewedByEmployer && (
                                  <div className="space-y-2">
                                    <button id="emp-review-operator-btn" onClick={() => setActiveReviewJob(job)} className="w-full bg-violet-600 hover:bg-violet-500 text-white py-1.5 px-3 rounded-lg text-xs font-bold cursor-pointer transition-colors">
                                      Жолоочийг Үнэлэх (Согтууруулах ундаа, Ажилдаа эзэн болсон байдал)
                                    </button>
                                    <button
                                      type="button"
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        if (window.confirm('Та сонгосон жолоочийг цуцалж, зарыг буцааж нээлттэй болгохдоо итгэлтэй байна уу?')) {
                                          const success = await cancelHiring(job.id);
                                          if (success) {
                                            const allJobs = await getJobs();
                                            setJobs(allJobs);
                                            const updated = allJobs.find(j => j.id === job.id);
                                            setSelectedJob(updated || null);
                                          }
                                        }
                                      }}
                                      className="w-full text-center py-1.5 text-xs border border-[var(--color-glass-border)] hover:border-white/20 bg-white/5 hover:bg-white/10 text-[#9aa3b5] hover:text-[#f1f3f8] rounded-lg transition-colors cursor-pointer font-bold"
                                    >
                                      Сонгосон жолоочийг болих
                                    </button>
                                  </div>
                                )}

                                {((currentUser.type === 'operator' && job.isReviewedByOperator) ||
                                  (currentUser.type === 'employer' && job.isReviewedByEmployer)) && (
                                  <div className="text-[11px] text-[#9aa3b5] text-center italic">
                                    Таны үнэлгээ системд хэдийн бүртгэгдсэн байна. Таны хариуцлагатай оролцоонд баярлалаа!
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* ── SHARE BUTTON ── */}
                      <div className="relative border-t border-[var(--color-glass-border)] pt-3">
                        <button
                          type="button"
                          onClick={async (e) => {
                            e.stopPropagation();
                            const jobUrl = `${window.location.origin}/jobs/${job.id}`;
                            const shareText = `${job.title} — ${job.location}\nЦалин: ${job.salary.toLocaleString()}₮ (${job.salaryUnit})\n\n${jobUrl}`;

                            // Mobile: use native OS share sheet (Web Share API)
                            if (navigator.share) {
                              try {
                                await navigator.share({
                                  title: job.title,
                                  text: shareText,
                                  url: jobUrl,
                                });
                              } catch (_) {
                                // User cancelled share — do nothing
                              }
                            } else {
                              // Desktop fallback: open dropdown
                              setShareMenuJob(shareMenuJob === job.id ? null : job.id);
                            }
                          }}
                          className="flex items-center space-x-1.5 text-[11px] text-[#9aa3b5] hover:text-violet-400 transition-colors cursor-pointer"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>Хуваалцах</span>
                        </button>

                        {/* Desktop-only dropdown (shown only when Web Share API is not available) */}
                        {shareMenuJob === job.id && (
                          <div
                            className="absolute bottom-full left-0 mb-2 bg-[var(--color-brand-bg2)] border border-[var(--color-glass-border)] rounded-xl shadow-2xl p-3 z-50 w-64 animate-fade-in"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <p className="text-[9.5px] text-[#9aa3b5] uppercase font-bold tracking-wider mb-2">Хуваалцах платформ</p>
                            <div className="grid grid-cols-3 gap-2">
                              {(() => {
                                const jobUrl = typeof window !== 'undefined' ? `${window.location.origin}/jobs/${job.id}` : '';
                                const shareMsg = encodeURIComponent(`${job.title}\n${jobUrl}`);
                                return [
                                  {
                                    label: 'Facebook',
                                    emoji: '📘',
                                    action: () => {
                                      // Try native FB app deep link first, fallback to web sharer
                                      const fbAppUrl = `fb://share?href=${encodeURIComponent(jobUrl)}`;
                                      const fbWebUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(jobUrl)}`;
                                      const a = document.createElement('a');
                                      a.href = fbAppUrl;
                                      a.click();
                                      // Fallback after delay if app didn't open
                                      setTimeout(() => {
                                        if (!document.hidden) window.open(fbWebUrl, '_blank');
                                      }, 1500);
                                    },
                                  },
                                  {
                                    label: 'Messenger',
                                    emoji: '💬',
                                    action: () => {
                                      // Direct Messenger deep link — opens Messenger app with share dialog
                                      window.location.href = `fb-messenger://share/?link=${encodeURIComponent(jobUrl)}&app_id=966242223397117`;
                                    },
                                  },
                                  {
                                    label: 'Telegram',
                                    emoji: '✈️',
                                    action: () => {
                                      // tg:// deep link opens Telegram app directly
                                      window.location.href = `tg://msg_url?url=${encodeURIComponent(jobUrl)}&text=${encodeURIComponent(job.title)}`;
                                    },
                                  },
                                  {
                                    label: 'WhatsApp',
                                    emoji: '💚',
                                    action: () => {
                                      window.open(`https://api.whatsapp.com/send?text=${shareMsg}`, '_blank');
                                    },
                                  },
                                  {
                                    label: 'Gmail',
                                    emoji: '📧',
                                    action: () => {
                                      window.open(`mailto:?subject=${encodeURIComponent(job.title)}&body=${encodeURIComponent(jobUrl)}`, '_blank');
                                    },
                                  },
                                  {
                                    label: 'Хуулах',
                                    emoji: '🔗',
                                    action: async () => {
                                      await navigator.clipboard.writeText(jobUrl);
                                      addSuccessToast('Хуулагдлаа', 'Холбоос clipboard-д хуулагдлаа.');
                                    },
                                  },
                                ];
                              })().map(({ label, emoji, action }) => (
                                <button
                                  key={label}
                                  type="button"
                                  onClick={async () => {
                                    await action();
                                    setShareMenuJob(null);
                                  }}
                                  className="flex flex-col items-center justify-center bg-white/5 hover:bg-white/10 border border-[var(--color-glass-border)] hover:border-white/20 rounded-lg p-2 text-[10px] text-[#c8cbe0] hover:text-[#f1f3f8] transition-colors cursor-pointer gap-1"
                                >
                                  <span className="text-base">{emoji}</span>
                                  <span>{label}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div
                      id={`job-card-collapsed-${job.id}`}
                      key={`collapsed-${job.id}`}
                      onClick={() => setSelectedJob(job)}
                      className="w-full bg-[var(--color-glass-bg)] hover:bg-white/[0.06] backdrop-blur-md transition-all border border-[var(--color-glass-border)] hover:border-violet-500/40 border-l-4 border-l-violet-500 p-5 rounded-2xl cursor-pointer flex flex-col justify-between space-y-4 text-left group shadow-sm hover:shadow-md self-start"
                    >
                      <div className="space-y-3">
                        {/* Employer name and Date */}
                        <div className="flex justify-between items-center text-[11px] text-[#9aa3b5]">
                          {!currentUser ? (
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowBlurWarningModal(true);
                              }}
                              className="font-semibold text-violet-400 font-sans filter blur-[5px] select-none cursor-pointer"
                              title="Дэлгэрэнгүйг нэвтэрч харна уу"
                            >
                              {getMockEmployerName(job.id)}
                            </span>
                          ) : (
                            <span className="font-semibold text-violet-400 font-sans">
                              {getEmployerDisplayName(job)}
                            </span>
                          )}
                          <span className="font-mono text-[#9aa3b5]">
                            {formatDate(job.createdAt)}
                          </span>
                        </div>

                        {/* Title */}
                        <h4 className="text-sm font-bold text-[#f1f3f8] group-hover:text-violet-300 transition-colors leading-snug">
                          {job.title}
                        </h4>

                        {/* Job Image Thumbnail */}
                        {((job.imageUrls && job.imageUrls.length > 0) || job.imageUrl) && (
                          <div className="w-full h-36 rounded-xl overflow-hidden bg-white/5 border border-[var(--color-glass-border)] relative shrink-0">
                            <img
                              src={job.imageUrls && job.imageUrls.length > 0 ? job.imageUrls[0] : job.imageUrl}
                              alt={job.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        {/* Short description preview */}
                        <p className="text-xs text-[#9aa3b5] line-clamp-2 leading-relaxed">
                          {job.description}
                        </p>
                      </div>

                      <div className="border-t border-[var(--color-glass-border)] pt-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                        {/* Phone Number */}
                        <div
                          onClick={(e) => {
                            if (!currentUser) {
                              e.stopPropagation();
                              setShowBlurWarningModal(true);
                            }
                          }}
                          className={`flex items-center space-x-1.5 text-[#9aa3b5] ${!currentUser ? 'cursor-pointer' : ''}`}
                        >
                          <Phone className="w-3.5 h-3.5 text-[#9aa3b5]" />
                          <span className={`font-mono font-medium text-[#9aa3b5] ${!currentUser ? 'filter blur-[5px] select-none' : ''}`}>
                            {!currentUser ? getMockEmployerPhone(job.id) : (getEmployerPhone(job) || 'Утасгүй')}
                          </span>
                        </div>

                        {/* Salary and Status */}
                        <div className="flex flex-col items-end space-y-2 shrink-0">
                          <span className="font-sans font-bold text-[#f1f3f8] flex items-center gap-1.5">
                            <span className="text-[9px] text-[#9aa3b5] font-semibold uppercase tracking-wider">Цалин / Төлбөр:</span>
                            <span className="font-mono text-xs text-teal-300">{job.salary === 0 ? 'Тохиролцоно' : `${job.salary.toLocaleString()} ₮`}</span>
                          </span>

                          {(() => {
                            if (job.status === 'open') {
                              return (
                                <span className="inline-flex items-center text-[9.5px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border border-violet-500/40 bg-violet-500/10 text-violet-300">
                                  <span className="w-1 h-1 rounded-full mr-1 bg-violet-400 animate-pulse" />
                                  <span>Нээлттэй</span>
                                </span>
                              );
                            } else if (job.status === 'in_progress') {
                              return (
                                <span className="inline-flex items-center text-[9.5px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-400">
                                  <span className="w-1 h-1 rounded-full mr-1 bg-amber-400 animate-pulse" />
                                  <span>Ажиллаж байгаа</span>
                                </span>
                              );
                            } else {
                              const isReviewed = job.isReviewedByEmployer;
                              if (isReviewed) {
                                return (
                                  <span className="inline-flex items-center text-[9.5px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border border-teal-500/40 bg-teal-500/10 text-teal-300">
                                    <span>Хаагдсан ✓</span>
                                  </span>
                                );
                              } else {
                                return (
                                  <span className="inline-flex items-center text-[9.5px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-400 animate-pulse">
                                    <span className="w-1 h-1 rounded-full mr-1 bg-amber-400" />
                                    <span>Ажил дууссан ⚠️</span>
                                  </span>
                                );
                              }
                            }
                          })()}
                        </div>
                      </div>
                    </div>
                  );
                }
              })}
            </div>
          )}
        </div>

      </main>

      {/* Floating Toast Notification Containers */}
      <div id="toast-alerts-container" className="fixed top-24 right-6 flex flex-col gap-3 pointer-events-none z-[9999] max-w-sm w-80">
        {toasts.map((t) => (
          <div
            key={t.id}
            onClick={() => handleNotificationClick(t)}
            className={`pointer-events-auto bg-[var(--color-brand-bg2)] backdrop-blur-md border-l-4 ${
              t.type === 'alert' ? 'border-rose-500' : 'border-teal-400'
            } text-[#f1f3f8] px-5 py-4 rounded-xl shadow-2xl border border-[var(--color-glass-border)] flex items-start space-x-3 w-full animate-slide-in relative cursor-pointer hover:bg-white/5 transition-colors`}
          >
            <div className="flex-1 text-left pr-4">
              <div className="flex justify-between items-start">
                <span className={`text-xs font-bold ${
                  t.type === 'alert' ? 'text-rose-400' : 'text-teal-300'
                } font-mono`}>
                  {t.type === 'alert' ? 'Алдаа ⚠️' : 'Амжилттай 🎉'}
                </span>
                <span className="text-[9px] text-[#9aa3b5] font-mono mr-2">{formatNotificationDate(t.createdAt)}</span>
              </div>
              <h4 className="text-xs font-bold text-[#f1f3f8] mt-1 leading-snug">{t.title}</h4>
              <p className="text-[10px] text-[#c8cbe0] leading-relaxed mt-0.5">{t.message}</p>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setToasts(prev => prev.filter(toast => toast.id !== t.id));
              }}
              className="absolute top-3 right-3 text-[#9aa3b5] hover:text-[#f1f3f8] transition-colors cursor-pointer p-0.5 rounded-full hover:bg-white/10 flex items-center justify-center"
              aria-label="Хаах"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

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
        <div
          id="view-review-detail-modal-backdrop"
          onClick={() => setViewingReview(null)}
          className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in"
        >
          <div
            id="view-review-detail-modal-container"
            onClick={(e) => e.stopPropagation()}
            className="bg-[var(--color-brand-bg2)] border border-[var(--color-glass-border)] max-w-md w-full rounded-2xl overflow-hidden shadow-2xl relative"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-violet-600/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-500/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>

            {/* Header */}
            <div className="flex justify-between items-center border-b border-[var(--color-glass-border)] px-6 py-4.5">
              <div className="flex items-center space-x-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-violet-500 animate-pulse"></span>
                <h3 className="text-sm font-semibold text-[#f1f3f8] tracking-wide">Шинэ үнэлгээний дэлгэрэнгүй</h3>
              </div>
              <button
                id="close-view-review-modal"
                onClick={() => setViewingReview(null)}
                className="text-[#9aa3b5] hover:text-[#f1f3f8] transition-colors cursor-pointer p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content body */}
            <div className="p-6 space-y-5">
              {/* Rating Big Circle */}
              <div className="flex flex-col items-center justify-center py-4 bg-white/5 rounded-2xl border border-[var(--color-glass-border)]">
                <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-teal-500/10 border border-teal-500/20 mb-3 shadow-[0_0_15px_rgba(34,211,238,0.15)]">
                  <Star className="w-8 h-8 text-teal-300 fill-teal-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]" />
                </div>
                <span className="text-2xl font-bold font-mono text-[#f1f3f8] tracking-tight">{viewingReview.rating}.0 / 5.0</span>
                <div className="flex items-center space-x-1 mt-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${star <= viewingReview.rating ? 'fill-teal-300 text-teal-400' : 'text-white/15'}`}
                    />
                  ))}
                </div>
                <span className="text-[10px] text-[#9aa3b5] font-mono mt-2 uppercase tracking-widest">Үнэлгээний оноо</span>
              </div>

              {/* Reviewer & Job info */}
              <div className="space-y-3 bg-white/5 p-4 rounded-xl border border-[var(--color-glass-border)] text-xs text-left">
                <div className="flex justify-between items-center pb-2 border-b border-[var(--color-glass-border)]">
                  <span className="text-[#9aa3b5]">Үнэлгээ өгсөн хүн:</span>
                  <span className="font-semibold text-violet-400 font-sans">{viewingReview.reviewerName}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-[var(--color-glass-border)]">
                  <span className="text-[#9aa3b5]">Төсөл / Ажлын нэр:</span>
                  <span className="font-semibold text-[#e3e6ee] font-sans text-right truncate max-w-[60%]">{viewingReview.jobTitle}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#9aa3b5]">Огноо:</span>
                  <span className="font-mono text-[#9aa3b5]">{viewingReview.createdAt}</span>
                </div>
              </div>

              {/* Comment text block */}
              <div className="space-y-2 text-left">
                <span className="text-[10px] text-[#9aa3b5] uppercase font-mono tracking-wider block">Бичсэн сэтгэгдэл:</span>
                <div className="relative bg-white/5 p-4.5 rounded-xl border border-[var(--color-glass-border)] italic text-xs text-[#e3e6ee] leading-relaxed font-sans shadow-inner">
                  <span className="absolute -top-1 left-2 text-3xl text-violet-400/20 font-serif pointer-events-none">“</span>
                  <p className="relative z-10 px-2">"{viewingReview.comment}"</p>
                  <span className="absolute -bottom-4 right-3 text-3xl text-violet-400/20 font-serif pointer-events-none">”</span>
                </div>
              </div>

              {/* Footer info/warning */}
              <p className="text-[9.5px] text-[#9aa3b5] leading-normal text-center bg-white/5 p-2 rounded-lg border border-[var(--color-glass-border)]">
                🛡️ Энэхүү үнэлгээ нь таны профайлын дундаж үнэлгээ болон ажилчны түүхэнд шууд нөлөөлж, бусад хэрэглэгчдэд харагдах болно.
              </p>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-1">
                <button
                  id="close-review-detail-btn"
                  type="button"
                  onClick={() => setViewingReview(null)}
                  className="flex-1 py-2.5 border border-[var(--color-glass-border)] text-[#c8cbe0] hover:text-[#f1f3f8] text-xs font-medium rounded-xl hover:bg-white/10 transition-colors cursor-pointer font-sans"
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
                  className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-teal-600 hover:from-violet-500 hover:to-teal-500 text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-violet-600/25 cursor-pointer font-sans"
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--color-brand-bg2)] border border-[var(--color-glass-border)] p-6 rounded-xl shadow-2xl flex flex-col items-center space-y-3">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs text-[#c8cbe0] font-mono">Үнэлгээг ачаалж байна...</span>
          </div>
        </div>
      )}

      {/* Guest Blur Warning Modal */}
      {showBlurWarningModal && (
        <div
          id="blur-warning-modal-backdrop"
          onClick={() => setShowBlurWarningModal(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
        >
          <div
            id="blur-warning-modal-container"
            onClick={(e) => e.stopPropagation()}
            className="bg-[var(--color-brand-bg2)] border border-[var(--color-glass-border)] max-w-sm w-full rounded-2xl overflow-hidden shadow-2xl relative p-6 space-y-4"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>

            {/* Header */}
            <div className="flex justify-between items-center pb-2 border-b border-[var(--color-glass-border)]">
              <div className="flex items-center space-x-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-violet-500 animate-pulse"></span>
                <h3 className="text-sm font-semibold text-[#f1f3f8] tracking-wide">Дэлгэрэнгүй харах</h3>
              </div>
              <button
                onClick={() => setShowBlurWarningModal(false)}
                className="text-[#9aa3b5] hover:text-[#f1f3f8] transition-colors cursor-pointer p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Description */}
            <div className="space-y-3 text-left">
              <p className="text-xs text-[#e3e6ee] leading-relaxed font-sans">
                Ажлын зар байршуулсан хэрэглэгч болон утасны дугаар зэрэг дэлгэрэнгүй мэдээлэл нь зөвхөн системд нэвтэрсэн хэрэглэгчдэд харагдах боломжтой.
              </p>
              <p className="text-xs text-[#9aa3b5] leading-relaxed font-sans">
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
                className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-violet-950/25 cursor-pointer font-sans text-center"
              >
                Нэвтрэх хэсэг рүү очих
              </button>
              <button
                type="button"
                onClick={() => setShowBlurWarningModal(false)}
                className="w-full py-2.5 border border-[var(--color-glass-border)] text-[#c8cbe0] hover:text-[#f1f3f8] text-xs font-medium rounded-xl hover:bg-white/10 transition-colors cursor-pointer font-sans"
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
