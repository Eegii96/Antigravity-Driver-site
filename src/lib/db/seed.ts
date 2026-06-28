// Default seed data + one-time DB initialization.
// NOTE: The DEFAULT_* arrays are reference/sample data; live seeding is disabled
// in production (see initializeDB). Kept here to document the expected shape.
import { User, Job, Review, JobHistoryItem } from '../../types';


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

// Helper to seed Firestore if empty (Disabled in production)
export async function initializeDB(): Promise<void> {
  // Seeding disabled in production to keep databases clean and prevent automatic creation of mock users.
  console.log('Database initialization check skipped.');
}
