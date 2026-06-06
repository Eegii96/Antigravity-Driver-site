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
  salaryUnit: 'Өдрөөр' | 'Цагаар' | 'Төслөөр';
  duration: string;
  location: string;
  requirements: string[];
  createdAt: string;
  applicants: string[]; // User IDs of operators who applied
  hiredOperatorId?: string;
  hiredOperatorName?: string;
  isReviewedByEmployer?: boolean; // employer reviewed operator
  isReviewedByOperator?: boolean; // operator reviewed employer
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
}

export interface Ad {
  id: string;
  driverId: string;
  driverName: string;
  driverPhone: string;
  title: string;
  description: string;
  machineryType?: string;
  salary?: number;
  salaryUnit?: 'Өдрөөр' | 'Цагаар' | 'Төслөөр';
  location: string;
  status: 'active' | 'expired';
  createdAt: string;
  expiresAt?: string;
  expiredAt?: string; // set when archived
}

export interface WorkHistoryItem {
  id: string;
  jobId?: string;
  jobTitle: string;
  employerName: string;
  role: 'operator' | 'employer';
  status: 'completed' | 'in_progress';
  dateRange: string;
  completedAt: string; // ISO format string to sort by
  ratingGiven?: number;
  commentGiven?: string;
}


