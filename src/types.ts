export type UserType = 'operator' | 'employer';

export interface User {
  id: string;
  email: string;
  fullName: string;
  lastName: string;
  firstName: string;
  companyName?: string;
  phone: string;
  address: string;
  profileImage: string;
  type: UserType;
  rating: number;
  ratingCount: number;
  bio: string;
  experienceYears?: number;
  machineTypes?: string[]; // E.g., ['Экскаватор', 'Ковш', 'Бульдозер']
  isPublic: boolean;
  createdAt: string;
  password?: string;
  emailVisible?: boolean;
  phoneVisible?: boolean;
  historyVisible?: boolean;
  reviewsVisible?: boolean;
  securityQuestion1?: string;
  securityAnswer1?: string;
  securityQuestion2?: string;
  securityAnswer2?: string;
  phone2?: string;
  activeSessionId?: string;
  /**
   * Aimag/city names (subset of LOCATION_OPTIONS) an operator wants "new job
   * posted here" notifications for. Opt-in — absent/empty means no pings.
   * Only meaningful for `type === 'operator'` (audit C5).
   */
  notifyLocations?: string[];
}

export interface Review {
  id: string;
  jobId: string;
  jobTitle: string;
  reviewerId: string;
  reviewerName: string;
  reviewerType: UserType; // Type of the person who wrote the review
  rating: number;
  comment: string;
  createdAt: string;
}

export interface JobHistoryItem {
  id: string;
  jobId: string;
  title: string;
  partnerName: string; // Name of employer or operator involved
  role: 'operator' | 'employer'; // User's role in this job
  status: 'completed' | 'in_progress';
  dateRange: string;
  ratingGiven?: number;
  commentGiven?: string;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  employerId: string;
  employerName: string;
  employerRating: number;
  status: 'open' | 'in_progress' | 'completed';
  type: string;
  machineryType: string; // Ex: Экскаватор, Дамп / Өөрөө буулгагч, Ковш
  salary: number;
  // '' = unit deliberately not specified by the poster ("Заагаагүй") — UI
  // hides the unit entirely in that case. Display code must guard with
  // truthiness (job.salaryUnit && ...), never assume one of the named units.
  salaryUnit: 'Өдрөөр' | 'Цагаар' | 'Төслөөр' | '';
  duration: string;
  location: string;
  requirements: string[];
  createdAt: string;
  applicants: string[]; // User IDs of operators who applied
  hiredOperatorId?: string;
  hiredOperatorName?: string;
  isReviewedByEmployer?: boolean; // employer reviewed operator
  isReviewedByOperator?: boolean; // operator reviewed employer
  additionalInfo?: string;
  imageUrl?: string;
  imageUrls?: string[];
  /**
   * 320px thumbnails, index-parallel to `imageUrls` (same length, same order).
   * Collapsed job cards render these instead of the full 800px images they
   * used to load just to display at 144px (audit P3). Optional — jobs posted
   * before this field existed only have `imageUrls`/`imageUrl`, so display
   * code must fall back to those.
   */
  thumbnailUrls?: string[];
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  isRead: boolean;
  createdAt: string;
  relatedId?: string;
  isDeleted?: boolean;
  /**
   * The job this notification is about, used ONLY for Firestore rule
   * authorization (see firestore.rules `isJobParticipant`) — distinct from
   * `relatedId`, which for review notifications points at the review doc
   * instead (used for UI navigation). Job-lifecycle notifications set both
   * fields to the same job id.
   */
  jobId?: string;
}



