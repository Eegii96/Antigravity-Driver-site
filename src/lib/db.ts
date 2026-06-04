import { User, Job, Review, JobHistoryItem, AppNotification } from '../types';
import { db, auth } from './firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  writeBatch,
  orderBy
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updatePassword
} from 'firebase/auth';

// Default mock users for initial database seeding
const DEFAULT_USERS: User[] = [
  {
    id: 'user_op_1',
    email: 'bat_erdene@gmail.com',
    fullName: 'Баатарын Бат-Эрдэнэ',
    lastName: 'Баатар',
    firstName: 'Бат-Эрдэнэ',
    phone: '99112233',
    address: 'Улаанбаатар хот, Баянзүрх дүүрэг, 14-р хороо',
    profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    type: 'operator',
    rating: 4.8,
    ratingCount: 12,
    bio: 'Хүнд даацын экскаватор, ковшоор 8 жил тасралтгүй ажилласан туршлагатай. Архи уудаггүй, хариуцлагатай, цаг баримталдаг. Техникийн өдөр тутмын арчилгааг сайн хийж чадна.',
    experienceYears: 8,
    machineTypes: ['Микро экскаватор', 'CAT 320 Экскаватор', 'Ковш Хьюндай HL770'],
    isPublic: true,
    createdAt: '2024-01-15',
    password: 'Password123!',
    securityQuestion1: 'Таны төрсөн аймаг эсвэл хот юу вэ?',
    securityAnswer1: 'Улаанбаатар',
    securityQuestion2: 'Таны багын хамгийн сайн найзын нэр хэн бэ?',
    securityAnswer2: 'Болд'
  },
  {
    id: 'user_op_2',
    email: 'bold_shacman@gmail.com',
    fullName: 'Мөнхбатын Болдбаатар',
    lastName: 'Мөнхбат',
    firstName: 'Болдбаатар',
    phone: '88085566',
    address: 'Дархан-Уул аймаг, Дархан сум, 5-р баг',
    profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    type: 'operator',
    rating: 4.1,
    ratingCount: 4,
    bio: 'Шахман, Хово өөрөө буулгагч (дамп) ачааны машины жолооч. Уул уурхайн тээвэрт явж байсан. Барилга, шороо тээвэр ба замын ажилд ажиллана.',
    experienceYears: 5,
    machineTypes: ['Shacman F3000', 'Howo 371 Дамп'],
    isPublic: true,
    createdAt: '2024-03-20',
    password: 'Password123!'
  },
  {
    id: 'user_op_3',
    email: 'temur_loader@gmail.com',
    fullName: 'Төмөрбаатарын Төмөр',
    lastName: 'Төмөрбаатар',
    firstName: 'Төмөр',
    phone: '95123456',
    address: 'Өмнөговь аймаг, Цогтцэций сум',
    profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
    type: 'operator',
    rating: 5.0,
    ratingCount: 8,
    bio: 'Бульдозер болон грейдерчин. Авто замын суурь бэлтгэл, шороо тэгшилгээ, зам засах ажилд түлхүү ажилласан. Ажилдаа сэтгэлээсээ ханддаг, ажлаа орхиод явдаггүй тууштай.',
    experienceYears: 12,
    machineTypes: ['Комацу D85 Бульдозер', 'Катерпиллар 140K Грейдер'],
    isPublic: true,
    createdAt: '2023-11-05',
    password: 'Password123!'
  },
  {
    id: 'user_op_unreliable',
    email: 'arhi_zo@gmail.com',
    fullName: 'Зоригтын Гансүх (Орхидог)',
    lastName: 'Зоригт',
    firstName: 'Гансүх (Орхидог)',
    phone: '90807060',
    address: 'Улаанбаатар хот, Сонгинохайрхан дүүрэг',
    profileImage: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&q=80',
    type: 'operator',
    rating: 2.3,
    ratingCount: 3,
    bio: 'Ковш болон ачааны машин жолоодно. Цалин тохирвол хаана ч очно.',
    experienceYears: 4,
    machineTypes: ['Hyundai HL770 Ковш'],
    isPublic: true,
    createdAt: '2025-01-10',
    password: 'Password123!'
  },
  {
    id: 'user_emp_1',
    email: 'naranbaatar_zaluus@gmail.com',
    fullName: 'Сүхбаатарын Наранбаатар',
    lastName: 'Сүхбаатар',
    firstName: 'Наранбаатар',
    companyName: 'Залуус Констракшн ХХК',
    phone: '99001122',
    address: 'Улаанбаатар хот, Сүхбаатар дүүрэг, Залуус Констракшн ХХК',
    profileImage: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150&q=80',
    type: 'employer',
    rating: 4.9,
    ratingCount: 7,
    bio: 'Залуус Констракшны төслийн удирдагч. Барилгын суурь ухалт, замын газар шорооны ажлын гүйцэтгэгч хайна. Ажилчдад байр, хоол бэлтгэж өгдөг, ажлыг нь тухай бүр дүгнээд цалинг цагт нь өгдөг.',
    isPublic: true,
    createdAt: '2024-02-18',
    password: 'Password123!'
  },
  {
    id: 'user_emp_2',
    email: 'altansukh_road@gmail.com',
    fullName: 'Баасангийн Алтансүх',
    lastName: 'Баасан',
    firstName: 'Алтансүх',
    companyName: 'Тэгш Зам ХХК',
    phone: '89117766',
    address: 'Дархан-Уул аймаг, Тэгш Зам ХХК',
    profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    type: 'employer',
    rating: 3.8,
    ratingCount: 5,
    bio: 'Дэд бүтцийн зам барилгын ажил эрхэлдэг. Заримдаа санхүүжилт саатсанаас болж цалин 2-3 хоног хугацаа хэтрэх талтай ч бүх төлбөрийг заавал барагдуулдаг.',
    isPublic: true,
    createdAt: '2024-04-10',
    password: 'Password123!'
  }
];

const DEFAULT_REVIEWS: Review[] = [
  {
    id: 'rev_1',
    jobId: 'job_past_1',
    jobTitle: 'Эко-Хорооллын Суурь Ухах Ажил',
    reviewerId: 'user_emp_1',
    reviewerName: 'Сүхбаатарын Наранбаатар',
    reviewerType: 'employer',
    rating: 5,
    comment: 'Ажилдаа маш сайн, ухаалаг залуу байна. Машин техникийг өөрийн юм шиг арчилдаг. Суурийг маш нарийн хэмжээстэй зөв ухсан. Дараа дахин хамтарч ажиллана.',
    createdAt: '2026-04-10'
  },
  {
    id: 'rev_2',
    jobId: 'job_past_2',
    jobTitle: 'Замын Шороо Үржих Ажил',
    reviewerId: 'user_emp_2',
    reviewerName: 'Баасангийн Алтансүх',
    reviewerType: 'employer',
    rating: 4,
    comment: 'Ажлын чанар сайн, машин барих чадвар өндөр. Харин нэг өдөр гэр бүлийн шалтгаанаар 2 цаг хоцорсон. Гэхдээ ажлаа бүрэн дуусгасан.',
    createdAt: '2026-04-28'
  },
  {
    id: 'rev_unreliable_1',
    jobId: 'job_past_unreliable',
    jobTitle: 'Баянзүрх дүүрэгт суваг шуудуу татах',
    reviewerId: 'user_emp_1',
    reviewerName: 'Сүхбаатарын Наранбаатар',
    reviewerType: 'employer',
    rating: 1,
    comment: 'Маш хариуцлагагүй! Ажиллаж эхлээд 2 дахь хоног дээрээ урьдчилгаа цалин 300,000 төгрөг авчихаад маргааш нь ажилдаа ирээгүй, утас нь унтарсан. Сүүлд сонсоход хөдөө явчихсан байсан. Ийм ажилчдаар ажил бүү хийлгэ.',
    createdAt: '2026-05-02'
  },
  {
    id: 'rev_unreliable_2',
    jobId: 'job_past_unreliable2',
    jobTitle: 'Зуслангийн газрын шороо тэгшилгээ',
    reviewerId: 'user_emp_2',
    reviewerName: 'Баасангийн Алтансүх',
    reviewerType: 'employer',
    rating: 2,
    comment: 'Ажил хийх явцад ажлын талбар дээр архи ууж, техник дээрээ согтуу суусан тул шууд ажлаас чөлөөлсөн. Маш аюултай нөхцөл байдал үүсгэсэн.',
    createdAt: '2026-05-15'
  },
  {
    id: 'rev_emp_1',
    jobId: 'job_past_1',
    jobTitle: 'Эко-Хорооллын Суурь Ухах Ажил',
    reviewerId: 'user_op_1',
    reviewerName: 'Баатарын Бат-Эрдэнэ',
    reviewerType: 'operator',
    rating: 5,
    comment: 'Наранбаатар захирал маш өндөр хариуцлагатай. Хоол, унаагаар маш сайн хангасан. Ажил дууссан өдөр цалинг миний дансанд яг тохирсноор бүтэн шилжүүлсэн. Ажил хийхэд маш урамтай сайхан газар.',
    createdAt: '2026-04-10'
  },
  {
    id: 'rev_emp_2',
    jobId: 'job_past_2',
    jobTitle: 'Замын Шороо Үржих Ажил',
    reviewerId: 'user_op_1',
    reviewerName: 'Баатарын Бат-Эрдэнэ',
    reviewerType: 'operator',
    rating: 3,
    comment: 'Ажил бол хэвийн явсан, Тэгш Зам ХХК-ийн ажилтнууд найрсаг. Гэвч ажил дуусаад цалин олгох үед санхүүжилт орж ирээгүй гэдэг шалтгаанаар 4 хоног хоцорч олгосон. Гэхдээ бүрэн өгсөн.',
    createdAt: '2026-04-28'
  }
];

const DEFAULT_JOB_HISTORY: JobHistoryItem[] = [
  {
    id: 'hist_1',
    jobId: 'job_past_1',
    title: 'Эко-Хорооллын Суурь Ухах Ажил (CAT 320 экскаватор)',
    partnerName: 'Сүхбаатарын Наранбаатар (Залуус Констракшн)',
    role: 'operator',
    status: 'completed',
    dateRange: '2026-04-01 - 2026-04-10',
    ratingGiven: 5,
    commentGiven: 'Наранбаатар захирал маш өндөр хариуцлагатай. Цалингаа цагт нь өгсөн.'
  },
  {
    id: 'hist_2',
    jobId: 'job_past_2',
    title: 'Авто замын чиг суурь, шороо үржих бэлтгэл',
    partnerName: 'Баасангийн Алтансүх (Тэгш Зам ХХК)',
    role: 'operator',
    status: 'completed',
    dateRange: '2026-04-20 - 2026-04-28',
    ratingGiven: 3,
    commentGiven: 'Цалин 4 хоног хоцорч орсон ч бүрэн гүйцэт өгсөн.'
  },
  {
    id: 'hist_unreliable_1',
    jobId: 'job_past_unreliable',
    title: 'Баянзүрх дүүрэгт суваг шуудуу татах',
    partnerName: 'Сүхбаатарын Наранбаатар',
    role: 'operator',
    status: 'completed',
    dateRange: '2026-05-01 - 2026-05-02',
    ratingGiven: 1,
    commentGiven: 'Урьдчилгаа аваад орхиж явсан.'
  }
];

const DEFAULT_JOBS: Job[] = [
  {
    id: 'job_1',
    title: 'Таван Толгой шороон замын тээвэр (Howo/Shacman жолооч хайж байна)',
    description: 'Цогтцэций сумаас уурхайн тээвэрт явах туршлагатай, тогтвортой ажиллах 3 өөрөө буулгагч машины жолооч яаралтай авна. Байр, хоол уурхайн кэмпэд үнэгүй хариуцна. Архи уудаггүй, хариуцлагатай байх шаардлагатай.',
    employerId: 'user_emp_1',
    employerName: 'Сүхбаатарын Наранбаатар',
    employerRating: 4.9,
    status: 'open',
    type: 'operator_hiring',
    machineryType: 'Howo 371 Дамп / Shacman жолооч',
    salary: 120000,
    salaryUnit: 'Өдрөөр',
    duration: '2 сар',
    location: 'Өмнөговь аймаг, Цогтцэций сум',
    requirements: [
      'Хүнд даацын Е ангиллын үнэмлэхтэй байх',
      'Оройн болон шөнийн ээлжинд явах тэсвэртэй байх',
      'Архинаас бүрэн татгалзсан, ажил хаяж явдаггүй байх',
      'Өмнө нь ажиллаж байсан газрын тодорхойлолт/үнэлгээ сайн байх'
    ],
    createdAt: '2026-05-25T08:30:00Z',
    applicants: ['user_op_2', 'user_op_unreliable']
  },
  {
    id: 'job_2',
    title: 'Улаанбаатар хот дотор бохирын суваг ухах Экскаваторчны ажил',
    description: 'Сонгинохайрхан дүүрэгт 5 метрийн гүнтэй бохирын шугамын суваг ухах нарийн ажиллагаатай богино хугацааны ажил. CAT 320 эсвэл түүнтэй дүйцэх экскаваторыг чадварлаг удирдах, аюулгүй байдлыг хангах жолооч шаардлагатай.',
    employerId: 'user_emp_1',
    employerName: 'Сүхбаатарын Наранбаатар',
    employerRating: 4.9,
    status: 'open',
    type: 'operator_hiring',
    machineryType: 'CAT 320 Экскаваторчин',
    salary: 200000,
    salaryUnit: 'Өдрөөр',
    duration: '7 хоног',
    location: 'Улаанбаатар, Сонгинохайрхан дүүрэг',
    requirements: [
      'Механизмын үнэмлэхтэй байх',
      'Улаанбаатар хотод байрлаж ажиллах боломжтой байх',
      'Шугам хоолой, холбооны утсыг таслахгүй маш анхааралтай суваг татах',
      'Бүртгэлтэй ажлын түүхэнд сөрөг үнэлгээ байхгүй байх'
    ],
    createdAt: '2026-05-27T10:15:00Z',
    applicants: ['user_op_1']
  },
  {
    id: 'job_3',
    title: 'Зуны турш ажиллах Комацу D85 опериатор түрээслүүлнэ/хайж байна',
    description: 'Дархан хотоос Сэлэнгэ чиглэлийн авто замын барилгын ажилд Бульдозерчноор ажиллах хүн хайж байна. Сар бүр урамшуулалтай. Цалин тогтмол бодогдоно.',
    employerId: 'user_emp_2',
    employerName: 'Баасангийн Алтансүх',
    employerRating: 3.8,
    status: 'open',
    type: 'operator_hiring',
    machineryType: 'Комацу D85 Бульдозер',
    salary: 3500000,
    salaryUnit: 'Төслөөр',
    duration: '3 сар',
    location: 'Дархан-Уул аймаг, Дархан сум',
    requirements: [
      'Бульдозероор замын далан тэгшлэх дадлага туршлагатай',
      'Байрлах кэмп бэлэн тул хөдөө байрлаж ажиллах боломжтой байх',
      'Техникийн бүрэн бүтэн байдлыг шалгаж мэдээлдэг байх'
    ],
    createdAt: '2026-05-28T14:00:00Z',
    applicants: []
  }
];

// Helper to seed Firestore if empty
export async function initializeDB(): Promise<void> {
  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    if (usersSnap.empty) {
      console.log('Seeding Firestore database with default mock data...');
      
      const batch = writeBatch(db);
      
      // 1. Seed Users
      for (const u of DEFAULT_USERS) {
        // Create in Firebase Auth under synthetic email to make auth real
        try {
          const email = `${u.phone.replace(/[^a-zA-Z0-9]/g, '')}@jolooj.mn`;
          await createUserWithEmailAndPassword(auth, email, u.password || 'Password123!');
        } catch (authErr) {
          // If already exists in Auth, ignore
        }
        // Exclude the password field before writing to Firestore
        const { password, ...userWithoutPassword } = u;
        batch.set(doc(db, 'users', u.id), userWithoutPassword);
      }
      
      // 2. Seed Jobs
      for (const j of DEFAULT_JOBS) {
        batch.set(doc(db, 'jobs', j.id), j);
      }
      
      // 3. Seed Reviews
      for (const r of DEFAULT_REVIEWS) {
        batch.set(doc(db, 'reviews', r.id), r);
      }
      
      // 4. Seed Job History
      for (const h of DEFAULT_JOB_HISTORY) {
        batch.set(doc(db, 'jobHistory', h.id), h);
      }
      
      await batch.commit();
      console.log('Firestore Database successfully seeded!');
    }
  } catch (err) {
    console.error('Error seeding Firestore database:', err);
  }
}

// ----------------------------------------------------
// READ STATE OPERATIONS (Asynchronous Firestore Layer)
// ----------------------------------------------------

export async function getUsers(): Promise<User[]> {
  try {
    const snap = await getDocs(collection(db, 'users'));
    return snap.docs.map(d => d.data() as User);
  } catch (err) {
    console.error('Error fetching users from Firestore:', err);
    return [];
  }
}

export async function saveUsers(users: User[]): Promise<void> {
  // Deprecated since Firestore manages individual documents, 
  // but kept for compatibility and writes all of them back.
  try {
    const batch = writeBatch(db);
    for (const u of users) {
      // Clean up any undefined properties to prevent Firestore "Unsupported field value: undefined" error
      const cleanUser = Object.fromEntries(
        Object.entries(u).filter(([_, v]) => v !== undefined)
      ) as unknown as User;
      batch.set(doc(db, 'users', u.id), cleanUser);
    }
    await batch.commit();
  } catch (err) {
    console.error('Error batch saving users to Firestore:', err);
  }
}

export async function saveSingleUser(user: User): Promise<void> {
  try {
    // Clean up any undefined properties to prevent Firestore "Unsupported field value: undefined" error
    const cleanUser = Object.fromEntries(
      Object.entries(user).filter(([_, v]) => v !== undefined)
    ) as unknown as User;
    await setDoc(doc(db, 'users', user.id), cleanUser);
  } catch (err) {
    console.error('Error saving single user to Firestore:', err);
    throw err;
  }
}

export async function getReviews(): Promise<Review[]> {
  try {
    const snap = await getDocs(collection(db, 'reviews'));
    return snap.docs.map(d => d.data() as Review);
  } catch (err) {
    console.error('Error fetching reviews from Firestore:', err);
    return [];
  }
}

export async function saveReviews(reviews: Review[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    for (const r of reviews) {
      batch.set(doc(db, 'reviews', r.id), r);
    }
    await batch.commit();
  } catch (err) {
    console.error('Error batch saving reviews to Firestore:', err);
  }
}

export async function getJobs(): Promise<Job[]> {
  try {
    const snap = await getDocs(collection(db, 'jobs'));
    return snap.docs.map(d => d.data() as Job);
  } catch (err) {
    console.error('Error fetching jobs from Firestore:', err);
    return [];
  }
}

export async function saveJobs(jobs: Job[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    for (const j of jobs) {
      batch.set(doc(db, 'jobs', j.id), j);
    }
    await batch.commit();
  } catch (err) {
    console.error('Error batch saving jobs to Firestore:', err);
  }
}

export async function getJobHistory(): Promise<JobHistoryItem[]> {
  try {
    const snap = await getDocs(collection(db, 'jobHistory'));
    return snap.docs.map(d => d.data() as JobHistoryItem);
  } catch (err) {
    console.error('Error fetching jobHistory from Firestore:', err);
    return [];
  }
}

export async function saveJobHistory(history: JobHistoryItem[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    for (const h of history) {
      batch.set(doc(db, 'jobHistory', h.id), h);
    }
    await batch.commit();
  } catch (err) {
    console.error('Error batch saving jobHistory to Firestore:', err);
  }
}

// ----------------------------------------------------
// AUTHENTICATION AND PERSISTENCE (localStorage is used ONLY for local Session)
// ----------------------------------------------------

export function getCurrentUser(): User | null {
  const userJson = localStorage.getItem('currentUser');
  if (!userJson) return null;
  return JSON.parse(userJson);
}

// Keep local session updated in localStorage for UX, but fetch fresh data from Firestore asynchronously when needed.
export async function getFreshCurrentUser(): Promise<User | null> {
  const current = getCurrentUser();
  if (!current) return null;
  try {
    let targetUid = current.id;
    if (auth.currentUser && auth.currentUser.uid && auth.currentUser.uid !== current.id) {
      targetUid = auth.currentUser.uid;
    }
    const freshDoc = await getDoc(doc(db, 'users', targetUid));
    if (freshDoc.exists()) {
      const freshUser = freshDoc.data() as User;
      freshUser.id = targetUid;
      setCurrentUser(freshUser);
      return freshUser;
    }
  } catch (err) {
    console.error('Error getting fresh current user:', err);
  }
  return current;
}

export function setCurrentUser(user: User | null) {
  if (user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
  } else {
    localStorage.removeItem('currentUser');
  }
}

export async function loginUser(email: string, phone: string, password?: string): Promise<User | null> {
  try {
    const cleanEmail = email ? email.trim().toLowerCase() : '';
    const cleanPhone = phone ? phone.trim() : '';
    
    let targetEmail = '';
    let userData: User | null = null;
    
    // 1. Find the user in Firestore first to get the correct email/phone mapping
    let snapshot;
    if (cleanEmail) {
      const q = query(collection(db, 'users'), where('email', '==', cleanEmail));
      snapshot = await getDocs(q);
    } else if (cleanPhone) {
      let q = query(collection(db, 'users'), where('phone', '==', cleanPhone));
      snapshot = await getDocs(q);
      
      if (snapshot.empty && cleanPhone.startsWith('+976')) {
        const localPhone = cleanPhone.replace('+976', '');
        q = query(collection(db, 'users'), where('phone', '==', localPhone));
        snapshot = await getDocs(q);
      }
    }
    
    if (snapshot && !snapshot.empty) {
      const userDoc = snapshot.docs[0];
      userData = userDoc.data() as User;
      userData.id = userDoc.id;
      
      // Determine the Firebase Auth email registered for this user
      targetEmail = userData.email || `${userData.phone.replace(/[^a-zA-Z0-9]/g, '')}@jolooj.mn`;
    } else {
      // If user not found in Firestore, try logging in with the entered email directly
      if (cleanEmail) {
        targetEmail = cleanEmail;
      } else {
        return null; // No user found
      }
    }

    // Validate the actual password against Firestore first if it exists in the document
    if (userData && userData.password) {
      if (userData.password !== password) {
        console.warn('Firestore password mismatch');
        return null;
      }
    }
    
    // 2. Authenticate using Firebase Auth
    let authUser = null;
    try {
      // Try signing in with the fixed password first (for accounts created/unified under this system)
      const userCredential = await signInWithEmailAndPassword(auth, targetEmail, 'Password123!');
      authUser = userCredential.user;
    } catch (authErr) {
      // Fallback: Try signing in with the typed password (for older accounts not yet unified)
      try {
        const userCredential = await signInWithEmailAndPassword(auth, targetEmail, password || 'Password123!');
        authUser = userCredential.user;
        
        // Since login succeeded with their custom password, let's unify their Firebase Auth password to 'Password123!'
        // and cache the password in Firestore for future logins.
        if (authUser && userData) {
          try {
            await updatePassword(authUser, 'Password123!');
            userData.password = password;
            await saveSingleUser(userData);
          } catch (unifyErr) {
            console.warn('Could not unify password in Auth:', unifyErr);
          }
        }
      } catch (authErr2) {
        console.warn('Firebase Auth sign-in failed with both passwords:', authErr2);
        return null; // Login failed! Incorrect password or auth issue.
      }
    }
    
    if (authUser) {
      // Fetch fresh Firestore user data using the authenticated UID
      const docSnap = await getDoc(doc(db, 'users', authUser.uid));
      if (docSnap.exists()) {
        userData = docSnap.data() as User;
        userData.id = authUser.uid;
      }
    }
    
    if (userData) {
      // Security: Remove raw password field from session object
      const sessionUser = { ...userData };
      if ('password' in sessionUser) {
        delete sessionUser.password;
      }
      setCurrentUser(sessionUser);
      return sessionUser;
    }
    return null;
  } catch (err) {
    console.error('Error logging in user:', err);
    return null;
  }
}

export async function registerUser(
  userData: Omit<User, 'id' | 'rating' | 'ratingCount' | 'createdAt'>,
  onProgress?: (status: string) => void
): Promise<User> {
  try {
    const tempId = `user_${Date.now()}`;
    const targetEmail = userData.email ? userData.email.trim().toLowerCase() : `${userData.phone.replace(/[^a-zA-Z0-9]/g, '')}@jolooj.mn`;
    let uid = tempId;
    
    // 1. Create Firebase Auth user with a unified/fixed password
    if (onProgress) onProgress('Firebase системд шинэ хэрэглэгч үүсгэж байна...');
    try {
      const authUser = await createUserWithEmailAndPassword(auth, targetEmail, 'Password123!');
      uid = authUser.user.uid;
    } catch (authErr: any) {
      console.error('Firebase Auth user registration failed:', authErr);
      let userFriendlyMsg = authErr.message || 'Бүртгэл үүсгэхэд алдаа гарлаа.';
      if (authErr.code === 'auth/email-already-in-use') {
        userFriendlyMsg = 'Энэ имэйл хаяг аль хэдийн бүртгэгдсэн байна.';
      } else if (authErr.code === 'auth/invalid-email') {
        userFriendlyMsg = 'Имэйл хаяг буруу форматтай байна.';
      } else if (authErr.code === 'auth/operation-not-allowed') {
        userFriendlyMsg = 'Имэйлээр бүртгүүлэх хаалттай байна. Та Firebase консол дээрээ орон "Authentication -> Sign-in method" цэс рүү орж Email/Password нэвтрэх аргыг Идэвхжүүлэх (Enable) шаардлагатай.';
      } else if (authErr.code === 'auth/weak-password') {
        userFriendlyMsg = 'Нууц үг хэтэрхий сул байна.';
      }
      throw new Error(userFriendlyMsg);
    }
    
    // 3. Store profile in Firestore
    if (onProgress) onProgress('Хэрэглэгчийн профайлыг өгөгдлийн санд (Firestore) хадгалж байна...');
    const newUser: User = {
      ...userData,
      id: uid,
      rating: 5.0,
      ratingCount: 0,
      createdAt: new Date().toISOString().split('T')[0]
    };

    // Clean up any undefined properties to prevent Firestore "Unsupported field value: undefined" error
    const cleanUser = Object.fromEntries(
      Object.entries(newUser).filter(([_, v]) => v !== undefined)
    ) as User;
    
    // Create a 12-second timeout for Firestore write
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Өгөгдлийн сантай холбогдоход хугацаа хэтэрлээ. Сүлжээний холболт муу эсвэл Firestore өгөгдлийн сангийн дүрмийн зөвшөөрлийг шалгана уу.')), 12000)
    );
    
    const writePromise = setDoc(doc(db, 'users', uid), cleanUser);
    
    // Race setDoc against timeout
    await Promise.race([writePromise, timeoutPromise]);
    
    // Security: Remove password from the session user before setting local state
    const sessionUser = { ...newUser };
    if ('password' in sessionUser) {
      delete sessionUser.password;
    }
    setCurrentUser(sessionUser);
    return sessionUser;
  } catch (err) {
    console.error('Error registering user:', err);
    throw err;
  }
}

// ----------------------------------------------------
// WORKFLOW LOGIC
// ----------------------------------------------------

export async function addJob(jobData: Omit<Job, 'id' | 'status' | 'createdAt' | 'applicants'>): Promise<Job> {
  try {
    const id = `job_${Date.now()}`;
    const newJob: Job = {
      ...jobData,
      id: id,
      status: 'open',
      createdAt: new Date().toISOString(),
      applicants: []
    };
    
    await setDoc(doc(db, 'jobs', id), newJob);
    return newJob;
  } catch (err) {
    console.error('Error adding job to Firestore:', err);
    throw err;
  }
}

export async function applyForJob(jobId: string, operatorId: string): Promise<boolean> {
  try {
    const jobRef = doc(db, 'jobs', jobId);
    const jobDoc = await getDoc(jobRef);
    if (!jobDoc.exists()) return false;
    
    const job = jobDoc.data() as Job;
    
    // Зөвхөн нээлттэй ажилд хүсэлт илгээх боломжтой
    if (job.status !== 'open') return false;
    
    // Ажил олгогч өөрийн заранд хүсэлт илгээх боломжгүй
    if (job.employerId === operatorId) return false;
    
    if (!job.applicants.includes(operatorId)) {
      const updatedApplicants = [...job.applicants, operatorId];
      await updateDoc(jobRef, { applicants: updatedApplicants });
      
      // Get operator name for notification
      const opDoc = await getDoc(doc(db, 'users', operatorId));
      const opName = opDoc.exists() ? (opDoc.data() as User).fullName : 'Жолооч';
      
      await addNotification(
        job.employerId,
        'Шинэ хүсэлт ирлээ 🚜',
        `Оператор ${opName} таны "${job.title}" заранд ажиллах хүсэлт ирүүлж, ажлын түүхээ илгээлээ.`,
        'info'
      );
      
      return true;
    }
    return false;
  } catch (err) {
    console.error('Error applying for job in Firestore:', err);
    return false;
  }
}

export async function hireOperator(jobId: string, operatorId: string): Promise<boolean> {
  try {
    const jobRef = doc(db, 'jobs', jobId);
    const jobDoc = await getDoc(jobRef);
    if (!jobDoc.exists()) return false;
    
    const jobData = jobDoc.data() as Job;
    // Зөвхөн нээлттэй ажилд хөлслөх боломжтой — давхар хөлслөлт хориглох
    if (jobData.status !== 'open') return false;
    
    const operatorDoc = await getDoc(doc(db, 'users', operatorId));
    if (!operatorDoc.exists()) return false;
    
    const operator = operatorDoc.data() as User;
    const job = jobDoc.data() as Job;
    
    // Update Job Document in Firestore
    await updateDoc(jobRef, {
      status: 'in_progress',
      hiredOperatorId: operatorId,
      hiredOperatorName: operator.fullName
    });
    
    // Add to Job History Collection in Firestore
    const histId1 = `hist_${Date.now()}_op`;
    const histId2 = `hist_${Date.now()}_emp`;
    
    await setDoc(doc(db, 'jobHistory', histId1), {
      id: histId1,
      jobId: jobId,
      title: job.title,
      partnerName: job.employerName,
      role: 'operator',
      status: 'in_progress',
      dateRange: `${new Date().toLocaleDateString('mn-MN')} - Одоо`
    });
    
    await setDoc(doc(db, 'jobHistory', histId2), {
      id: histId2,
      jobId: jobId,
      title: job.title,
      partnerName: operator.fullName,
      role: 'employer',
      status: 'in_progress',
      dateRange: `${new Date().toLocaleDateString('mn-MN')} - Одоо`
    });
    
    // Create notification for operator
    await addNotification(
      operatorId,
      'Ажилд сонгогдлоо 🎉',
      `Баяр хүргэе! Захиалагч ${job.employerName} таныг "${job.title}" ажилдаа сонгон томиллоо.`,
      'success'
    );
    
    return true;
  } catch (err) {
    console.error('Error hiring operator in Firestore:', err);
    return false;
  }
}

export async function completeJob(jobId: string): Promise<boolean> {
  try {
    const jobRef = doc(db, 'jobs', jobId);
    const jobDoc = await getDoc(jobRef);
    if (!jobDoc.exists()) return false;
    
    const job = jobDoc.data() as Job;
    await updateDoc(jobRef, { status: 'completed' });
    
    // Update Job History records in Firestore
    const histSnap = await getDocs(collection(db, 'jobHistory'));
    const batch = writeBatch(db);
    
    histSnap.docs.forEach(d => {
      const h = d.data() as JobHistoryItem;
      if (h.jobId === jobId) {
        batch.update(doc(db, 'jobHistory', h.id), {
          status: 'completed',
          dateRange: h.dateRange.replace('Одоо', new Date().toLocaleDateString('mn-MN'))
        });
      }
    });
    await batch.commit();
    
    // Notification for operator
    if (job.hiredOperatorId) {
      await addNotification(
        job.hiredOperatorId,
        'Ажил дууслаа ✓',
        `Захиалагч ${job.employerName} ажлыг гүйцэтгэж дууссаныг баталгаажууллаа. Одоо нэвтэрч үнэлгээгээ өгнө үү.`,
        'success'
      );
    }
    
    // Notification for employer
    await addNotification(
      job.employerId,
      'Ажлын гүйцэтгэл дууслаа',
      `"${job.title}" ажил амжилттай дууслаа. Та жолооч ${job.hiredOperatorName || 'оператор'}-д сэтгэгдэл үнэлгээ өгнө үү.`,
      'info'
    );
    
    return true;
  } catch (err) {
    console.error('Error completing job in Firestore:', err);
    return false;
  }
}

export async function submitReview(reviewData: Omit<Review, 'id' | 'createdAt'>): Promise<Review> {
  try {
    const id = `rev_${Date.now()}`;
    const newReview: Review = {
      ...reviewData,
      id: id,
      createdAt: new Date().toLocaleDateString('mn-MN')
    };
    
    // Write review in Firestore
    await setDoc(doc(db, 'reviews', id), newReview);
    
    // Recalculate target user's ratings
    const jobDoc = await getDoc(doc(db, 'jobs', reviewData.jobId));
    if (jobDoc.exists()) {
      const job = jobDoc.data() as Job;
      // Reviewer нь operator бол target нь employer, эсрэгээрээ
      const targetUserId = reviewData.reviewerType === 'operator' ? job.employerId : job.hiredOperatorId;
      
      if (targetUserId) {
        // Fetch all reviews and all jobs to correctly identify reviews FOR this target user
        const [allReviews, allJobs] = await Promise.all([getReviews(), getJobs()]);
        
        const targetUserDoc = await getDoc(doc(db, 'users', targetUserId));
        if (targetUserDoc.exists()) {
          const targetUser = targetUserDoc.data() as User;
          
          // Build a Set of jobIds where this target user was a participant
          const targetUserJobIds = new Set<string>();
          for (const j of allJobs) {
            if (targetUser.type === 'operator' && j.hiredOperatorId === targetUserId) {
              targetUserJobIds.add(j.id);
            } else if (targetUser.type === 'employer' && j.employerId === targetUserId) {
              targetUserJobIds.add(j.id);
            }
          }
          
          // Filter reviews that are FOR this target user:
          // - The review must be on a job where target user participated
          // - The reviewer must be the opposite type (employer reviews operator, operator reviews employer)
          // - The reviewer must NOT be the target user themselves
          const relevantReviews = allReviews.filter(r => {
            if (!targetUserJobIds.has(r.jobId)) return false; // Review must be on a job involving target user
            if (r.reviewerType === targetUser.type) return false; // Reviewer must be opposite type
            if (r.reviewerId === targetUserId) return false; // Can't review yourself
            return true;
          });
          
          // Re-calculate average rating
          const totalRating = relevantReviews.reduce((sum, r) => sum + r.rating, 0);
          const avg = relevantReviews.length > 0 ? Number((totalRating / relevantReviews.length).toFixed(1)) : 5.0;
          
          await updateDoc(doc(db, 'users', targetUserId), {
            rating: avg,
            ratingCount: relevantReviews.length
          });
        }
        
        await addNotification(
          targetUserId,
          'Шинэ үнэлгээ ирлээ ⭐',
          `${reviewData.reviewerName} танд ${reviewData.rating}⭐ үнэлгээ болон сэтгэгдэл үлдээлээ.`,
          'success'
        );
      }
      
      // Update job review flag in Firestore
      const jobUpdate: any = {};
      if (reviewData.reviewerType === 'employer') {
        jobUpdate.isReviewedByEmployer = true;
      } else {
        jobUpdate.isReviewedByOperator = true;
      }
      await updateDoc(doc(db, 'jobs', reviewData.jobId), jobUpdate);
    }
    
    return newReview;
  } catch (err) {
    console.error('Error submitting review in Firestore:', err);
    throw err;
  }
}

// ----------------------------------------------------
// NOTIFICATIONS SYSTEM (Firestore-based)
// ----------------------------------------------------

export async function getNotifications(userId: string): Promise<AppNotification[]> {
  try {
    // Firestore query-ээр зөвхөн тухайн хэрэглэгчийн notifications-ыг авна (permission denied алдаа гарахгүй)
    const q = query(collection(db, 'notifications'), where('userId', '==', userId));
    const snap = await getDocs(q);
    const filtered = snap.docs.map(d => d.data() as AppNotification);
    
    // Seed a welcome notification if no notifications exist for this user in Firestore
    if (filtered.length === 0) {
      const welcomeId = `notif_welcome_${userId}`;
      const welcome: AppNotification = {
        id: welcomeId,
        userId: userId,
        title: 'Системд тавтай морилно уу!',
        message: 'Манай платформд нэгдсэнд баярлалаа. Профайлаа гүйцэд бөглөж AI намтар сайжруулагчийг ашиглаарай.',
        type: 'info',
        isRead: false,
        createdAt: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString().slice(0, 5)
      };
      await setDoc(doc(db, 'notifications', welcomeId), welcome);
      return [welcome];
    }
    
    return filtered;
  } catch (err) {
    console.error('Error fetching notifications from Firestore:', err);
    return [];
  }
}

export async function addNotification(
  userId: string,
  title: string,
  message: string,
  type: 'info' | 'success' | 'warning' | 'alert'
): Promise<AppNotification> {
  try {
    const id = 'notif_' + Math.random().toString(36).substr(2, 9);
    const newNotif: AppNotification = {
      id,
      userId,
      title,
      message,
      type,
      isRead: false,
      createdAt: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString().slice(0, 5)
    };
    
    await setDoc(doc(db, 'notifications', id), newNotif);
    return newNotif;
  } catch (err) {
    console.error('Error adding notification to Firestore:', err);
    throw err;
  }
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), { isRead: true });
  } catch (err) {
    console.error('Error marking notification as read in Firestore:', err);
  }
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  try {
    const q = query(collection(db, 'notifications'), where('userId', '==', userId));
    const snap = await getDocs(q);
    const batch = writeBatch(db);
    snap.docs.forEach(d => {
      const n = d.data() as AppNotification;
      if (!n.isRead) {
        batch.update(doc(db, 'notifications', n.id), { isRead: true });
      }
    });
    await batch.commit();
  } catch (err) {
    console.error('Error marking all notifications as read in Firestore:', err);
  }
}

export async function deleteNotification(notificationId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'notifications', notificationId));
  } catch (err) {
    console.error('Error deleting notification in Firestore:', err);
  }
}

export async function deleteAllNotifications(userId: string): Promise<void> {
  try {
    const q = query(collection(db, 'notifications'), where('userId', '==', userId));
    const snap = await getDocs(q);
    const batch = writeBatch(db);
    snap.docs.forEach(d => {
      batch.delete(d.ref);
    });
    await batch.commit();
  } catch (err) {
    console.error('Error deleting all notifications in Firestore:', err);
  }
}
