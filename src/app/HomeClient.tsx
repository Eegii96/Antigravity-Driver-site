'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getJobs, getUsers } from '../lib/db';
import { Job, User } from '../types';
import { 
  Briefcase, 
  Users, 
  ShieldAlert, 
  MapPin, 
  Award, 
  ChevronRight, 
  Star, 
  DollarSign, 
  Clock, 
  Sparkles, 
  Menu, 
  X, 
  CheckCircle,
  ShieldCheck,
  Zap
} from 'lucide-react';

export default function HomeClient() {
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState<boolean>(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingJobs, setLoadingJobs] = useState<boolean>(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    // Check if user is already logged in
    const user = getCurrentUser();
    if (user) {
      router.replace('/board');
    } else {
      setIsRedirecting(false);
    }
  }, [router]);

  useEffect(() => {
    if (isRedirecting) return;

    const fetchLandingData = async () => {
      try {
        setLoadingJobs(true);
        // Fetch jobs and users concurrently
        const [allJobs, allUsers] = await Promise.all([getJobs(), getUsers()]);
        
        // Filter only open jobs, and sort by createdAt descending, limit to 3
        const openJobs = allJobs
          .filter(j => j.status === 'open')
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .slice(0, 3);
          
        setJobs(openJobs);
        setUsers(allUsers);
      } catch (err) {
        console.error('Error loading landing page data:', err);
      } finally {
        setLoadingJobs(false);
      }
    };

    fetchLandingData();
  }, [isRedirecting]);

  // Redirect to auth with specific tab if needed
  const handleNavToAuth = (tab?: 'login' | 'register') => {
    if (tab) {
      router.push(`/auth?tab=${tab}`);
    } else {
      router.push('/auth');
    }
  };

  // Helper function to format salary according to design_guide.md
  const formatSalary = (amount: number): string => {
    if (amount >= 1000000) {
      const millions = amount / 1000000;
      return `${millions % 1 === 0 ? millions : millions.toFixed(1)} сая`;
    } else if (amount >= 1000) {
      const thousands = amount / 1000;
      return `${thousands % 1 === 0 ? thousands : thousands.toFixed(1)} мянга`;
    }
    return `${amount}`;
  };

  // Helper function to format location according to design_guide.md
  const formatLocationSuffix = (loc: string): string => {
    if (loc.includes('аймаг')) {
      return loc.replace('аймаг', 'аймагт ажиллах');
    }
    if (loc.includes('дүүрэг')) {
      return loc.replace('дүүрэг', 'дүүрэгт ажиллах');
    }
    if (loc.includes('сум')) {
      return loc.replace('сум', 'суманд ажиллах');
    }
    if (loc.includes('хот')) {
      return loc.replace('хот', 'хотод ажиллах');
    }
    return `${loc}-д ажиллах`;
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString.split('T')[0] || isoString;
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}.${month}.${day}`;
    } catch (e) {
      return isoString.split('T')[0] || isoString || '';
    }
  };

  const getEmployerDisplayName = (job: Job) => {
    const emp = users.find(u => u.id === job.employerId);
    if (emp) {
      return emp.companyName && emp.companyName.trim() ? emp.companyName.trim() : emp.fullName;
    }
    return job.employerName;
  };

  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-[#070a13] flex items-center justify-center text-white font-sans">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm">Нэвтрэлтийг шалгаж байна...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#070a13] text-slate-100 min-h-screen font-sans relative overflow-x-hidden flex flex-col justify-between">
      
      {/* Background Ambient Glow Blobs */}
      <div className="glow-blob w-[500px] h-[500px] bg-emerald-500/10 top-[-100px] left-[-100px]" />
      <div className="glow-blob w-[600px] h-[600px] bg-cyan-500/10 bottom-[20%] right-[-200px]" />
      <div className="glow-blob w-[400px] h-[400px] bg-violet-500/5 top-[40%] left-[20%]" />

      {/* Main Container */}
      <div className="flex-grow flex flex-col">
        


        {/* Navbar */}
        <nav className="glass-panel sticky top-0 z-40 px-6 py-4 transition-all duration-300">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => router.push('/')}>
              <div className="w-9 h-9 rounded-lg bg-[#26282d] border border-[#caa03d]/30 flex items-center justify-center relative overflow-hidden shrink-0 shadow-md">
                <img className="w-full h-full object-cover" src="/logo.jpg" alt="Logo" />
              </div>
              <span className="font-bold tracking-tight text-white text-sm md:text-base font-sans text-neon-emerald">
                Хүнд машин, механизм & Газар шорооны ажлын сайт
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-8 text-xs font-semibold">
              <a href="#benefits" className="text-slate-300 hover:text-emerald-400 transition-colors">Давуу тал</a>
              <a href="#jobs" className="text-slate-300 hover:text-emerald-400 transition-colors">Нээлттэй зарууд</a>
              <a href="#how-it-works" className="text-slate-300 hover:text-emerald-400 transition-colors">Хэрхэн ажилладаг вэ?</a>
              <a href="#footer-section" className="text-slate-300 hover:text-emerald-400 transition-colors">Холбоо барих</a>
            </div>

            {/* Desktop Action Buttons */}
            <div className="hidden lg:flex items-center space-x-3">
              <button 
                onClick={() => handleNavToAuth('login')}
                className="px-4 py-2 border border-slate-700 hover:border-slate-500 rounded-xl text-xs font-bold transition-all hover:bg-slate-800/50 cursor-pointer"
              >
                Нэвтрэх
              </button>
              <button 
                onClick={() => handleNavToAuth('register')}
                className="glow-btn-emerald bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-950/20 cursor-pointer"
              >
                Бүртгүүлэх
              </button>
            </div>

            {/* Mobile Menu Trigger */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Mobile Dropdown Navigation */}
          {mobileMenuOpen && (
            <div className="lg:hidden mt-4 pt-4 border-t border-slate-800/60 flex flex-col space-y-4 text-xs font-semibold pb-2 animate-fade-in">
              <a 
                href="#benefits" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-slate-300 hover:text-emerald-400 transition-colors py-1.5"
              >
                Давуу тал
              </a>
              <a 
                href="#jobs" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-slate-300 hover:text-emerald-400 transition-colors py-1.5"
              >
                Нээлттэй зарууд
              </a>
              <a 
                href="#how-it-works" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-slate-300 hover:text-emerald-400 transition-colors py-1.5"
              >
                Хэрхэн ажилладаг вэ?
              </a>
              <a 
                href="#footer-section" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-slate-300 hover:text-emerald-400 transition-colors py-1.5"
              >
                Холбоо барих
              </a>
              <div className="pt-3 flex items-center gap-3">
                <button 
                  onClick={() => { setMobileMenuOpen(false); handleNavToAuth('login'); }}
                  className="flex-1 py-2 text-center border border-slate-700 rounded-xl text-xs font-bold transition-all hover:bg-slate-800/50 cursor-pointer"
                >
                  Нэвтрэх
                </button>
                <button 
                  onClick={() => { setMobileMenuOpen(false); handleNavToAuth('register'); }}
                  className="flex-1 py-2 text-center bg-emerald-600 rounded-xl text-xs font-bold text-white transition-all hover:bg-emerald-500 cursor-pointer"
                >
                  Бүртгүүлэх
                </button>
              </div>
            </div>
          )}
        </nav>

        {/* Hero Section */}
        <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 px-6 overflow-hidden">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7 text-center flex flex-col items-center justify-center space-y-6 md:space-y-8">
              <h1 className="text-sm md:text-base lg:text-[17px] font-medium text-slate-300 leading-relaxed max-w-xl font-sans text-center mx-auto">
                Хүнд машин механизм, газар шорооны ажил, түрээсийн салбарт ажиллаж буй жолооч, оператор болон ажил олгогчдыг <span className="text-emerald-400 font-semibold">ажлын түүх</span>, <span className="text-cyan-400 font-semibold">үнэлгээний системээр</span> хариуцлагатай орчныг бүрдүүлнэ.
              </h1>
              
              <div className="flex flex-col sm:flex-row gap-3 pt-2 justify-center w-full">
                <a 
                  href="#jobs"
                  className="glow-btn-emerald bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-6 py-3 rounded-xl transition-all shadow-lg shadow-emerald-950/30 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Briefcase className="w-4 h-4" />
                  <span>Ажлын зар харах</span>
                </a>
                <button 
                  onClick={() => handleNavToAuth('register')}
                  className="px-6 py-3 border border-slate-700 hover:border-slate-500 rounded-xl text-xs font-bold text-white transition-all hover:bg-slate-800/50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Ажилд орох / Зар тавих</span>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              {/* Stats Counters */}
              <div className="grid grid-cols-3 gap-4 md:gap-8 pt-8 border-t border-slate-800/80 max-w-md w-full font-sans justify-items-center">
                <div className="text-center">
                  <h3 className="text-xl md:text-2xl font-extrabold text-white">500+</h3>
                  <p className="text-[10px] md:text-xs text-slate-500 font-medium mt-1">Идэвхтэй оператор</p>
                </div>
                <div className="text-center">
                  <h3 className="text-xl md:text-2xl font-extrabold text-white">1,200+</h3>
                  <p className="text-[10px] md:text-xs text-slate-500 font-medium mt-1">Хамтарсан захиалга</p>
                </div>
                <div className="text-center">
                  <h3 className="text-xl md:text-2xl font-extrabold text-white">98%</h3>
                  <p className="text-[10px] md:text-xs text-slate-500 font-medium mt-1">Сэтгэл ханамж</p>
                </div>
              </div>
            </div>

            {/* Right Graphics */}
            <div className="lg:col-span-5 relative mt-6 lg:mt-0 flex justify-center">
              <div className="relative w-full max-w-[420px] aspect-square rounded-2xl overflow-hidden glass-panel border border-slate-800/60 p-6 flex flex-col justify-between shadow-2xl">
                
                {/* Simulated Floating App Preview */}
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-emerald-400">
                      Б
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Бат-Эрдэнэ</p>
                      <span className="text-[9px] text-emerald-400 font-mono">CAT 320 Экскаваторчин</span>
                    </div>
                  </div>
                  <div className="flex items-center bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold text-emerald-400">
                    5.0 ★
                  </div>
                </div>

                <div className="space-y-3.5 my-6">
                  <div className="flex items-start space-x-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                      "Ажилдаа маш хариуцлагатай, газар шорооны нарийн ухалт хийхдээ хамгийн чадварлаг жолооч."
                    </p>
                  </div>
                  <div className="bg-slate-950/40 border border-slate-850 p-3 rounded-xl space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 font-sans">Сүүлийн гүйцэтгэлүүд</p>
                    <div className="flex justify-between text-[9px] text-slate-500 font-sans">
                      <span>Эко хоорооллын суурь ухалт</span>
                      <span className="text-emerald-400 font-bold">Амжилттай</span>
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-500 font-sans">
                      <span>Замын суурь далан тэгшилгээ</span>
                      <span className="text-emerald-400 font-bold">Амжилттай</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-800/80 pt-4 flex items-center justify-between text-[10px] text-slate-500 font-sans">
                  <span>Туршлага: 8 жил</span>
                  <span>Үнэлгээний тоо: 15+ удаа</span>
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-[20%] right-[-10px] w-20 h-20 bg-emerald-500/10 rounded-full blur-xl animate-pulse" />
                <div className="absolute bottom-[20%] left-[-10px] w-16 h-16 bg-cyan-500/10 rounded-full blur-xl animate-pulse" />
              </div>
            </div>

          </div>
        </section>

        {/* Benefits Section */}
        <section id="benefits" className="py-20 px-6 border-t border-slate-900 bg-slate-950/30">
          <div className="max-w-7xl mx-auto text-center space-y-12">
            <div className="space-y-4 max-w-2xl mx-auto">
              <h2 className="text-2xl md:text-4xl font-extrabold text-white font-sans">
                Бидний олгож буй <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Давуу Талууд</span>
              </h2>
              <p className="text-xs md:text-sm text-slate-500 font-sans leading-relaxed">
                Залилан болон ажил хаях, цалин олгохгүй зугтах зэрэг салбарын хүндрэлүүдийг технологийн боломжоор хянах нэгдсэн шийдэл.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Card 1 */}
              <div className="glass-card p-6 rounded-2xl text-left space-y-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white font-sans">Бодит үнэлгээ, түүх</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                  Жолооч бүрийн өмнөх ажил олгогчоос авсан үнэлгээ, ажлын бодит түүх хуудсан дээр нь хадгалагдаж, итгэлцлийг бүрдүүлнэ.
                </p>
              </div>

              {/* Card 2 */}
              <div className="glass-card p-6 rounded-2xl text-left space-y-4">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white font-sans">Шуурхай холболт</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                  Ажлын шаардлагад тохирох мэргэжлийн оператор, жолооч нартай хэдхэн минутын дотор холбогдох боломжтой.
                </p>
              </div>

              {/* Card 3 */}
              <div className="glass-card p-6 rounded-2xl text-left space-y-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white font-sans">Хариуцлагагүй байдлыг хянах</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                  Ажил хаясан эсвэл цалин олгоогүй залилангийн үйлдлийг системд хар жагсаалтаар тэмдэглэж, аюулгүй байдлыг хангана.
                </p>
              </div>

              {/* Card 4 */}
              <div className="glass-card p-6 rounded-2xl text-left space-y-4">
                <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white font-sans">AI Намтар үүсгэгч</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                  Жолооч нар өөрийн мэдээллээ оруулснаар Gemini AI-аар үгсийн сонголт сайтай, цэгцтэй намтар үгсийг автоматаар бэлдүүлнэ.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* Featured Jobs Section */}
        <section id="jobs" className="py-20 px-6 max-w-7xl mx-auto space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4 text-left">
              <h2 className="text-2xl md:text-4xl font-extrabold text-white font-sans">
                Сүүлийн үеийн <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Нээлттэй Зарууд</span>
              </h2>
              <p className="text-xs md:text-sm text-slate-500 font-sans">
                Firestore өгөгдлийн сангаас хамгийн сүүлд нэмэгдсэн идэвхтэй ажлын саналуудыг динамикаар уншиж байна.
              </p>
            </div>
            <button 
              onClick={() => handleNavToAuth('login')}
              className="inline-flex items-center text-emerald-400 hover:text-emerald-350 text-xs font-bold gap-1 transition-colors group shrink-0 cursor-pointer"
            >
              <span>Бүх ажлын зарыг харах</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {loadingJobs ? (
            /* Skeleton Loading Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-card p-6 rounded-2xl space-y-5 animate-pulse border-slate-800">
                  <div className="h-5 bg-slate-800 rounded-lg w-3/4" />
                  <div className="space-y-2">
                    <div className="h-3.5 bg-slate-800 rounded w-full" />
                    <div className="h-3.5 bg-slate-800 rounded w-5/6" />
                  </div>
                  <div className="pt-4 border-t border-slate-900 flex justify-between">
                    <div className="h-4 bg-slate-800 rounded w-1/3" />
                    <div className="h-4 bg-slate-800 rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : jobs.length === 0 ? (
            /* No Jobs State */
            <div className="glass-panel py-16 px-6 rounded-2xl text-center space-y-4">
              <Briefcase className="w-12 h-12 text-slate-600 mx-auto animate-pulse-soft" />
              <p className="text-xs text-slate-500 italic font-sans">Одоогоор идэвхтэй нээлттэй ажлын зар байхгүй байна.</p>
              <button 
                onClick={() => handleNavToAuth('login')}
                className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/20 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Зар тавих
              </button>
            </div>
          ) : (
            /* Jobs Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.map((job) => (
                <div 
                  key={job.id} 
                  className="glass-card glass-card-emerald p-6 rounded-2xl flex flex-col justify-between text-left relative overflow-hidden shadow-lg border border-slate-800/50 hover:border-emerald-500/30"
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-sm font-bold text-white leading-snug line-clamp-2 font-sans hover:text-emerald-400 transition-colors">
                        {job.title}
                      </h3>
                    </div>

                    {/* Meta information */}
                    <div className="grid grid-cols-2 gap-y-2.5 text-[10px] text-slate-400 font-sans border-b border-slate-900 pb-3">
                      <div className="flex items-center space-x-1.5 min-w-0">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">{formatLocationSuffix(job.location)}</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="font-bold text-slate-200">
                          {formatSalary(job.salary)} ({job.salaryUnit})
                        </span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">{job.machineryType}</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Хугацаа: {job.duration}</span>
                      </div>
                    </div>

                    {/* Requirements list */}
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold text-slate-500 font-sans uppercase">Тавигдах шаардлага</p>
                      <ul className="space-y-1">
                        {job.requirements && job.requirements.slice(0, 2).map((req, idx) => (
                          <li key={idx} className="flex items-start space-x-1 text-[10px] text-slate-400 leading-normal font-sans">
                            <span className="text-emerald-400 shrink-0 mt-0.5">•</span>
                            <span className="line-clamp-1">{req}</span>
                          </li>
                        ))}
                        {job.requirements && job.requirements.length > 2 && (
                          <li className="text-[9px] text-slate-500 font-sans pl-2.5 italic">
                            + өөр {job.requirements.length - 2} шаардлага бий
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>

                  {/* Card bottom actions */}
                  <div className="mt-5 pt-4 border-t border-slate-900 flex items-center justify-between">
                    <div>
                      <p className="text-[9px] text-slate-500 font-sans leading-tight">Нийтэлсэн</p>
                      <p className="text-[10px] font-bold text-slate-350 truncate max-w-[120px] font-sans">
                        {getEmployerDisplayName(job)}
                      </p>
                    </div>
                    
                    <button 
                      onClick={() => handleNavToAuth('login')}
                      className="bg-emerald-600/10 hover:bg-emerald-600 hover:text-white border border-emerald-500/20 hover:border-emerald-500 text-emerald-400 font-bold text-[10px] px-3.5 py-1.5 rounded-lg transition-all cursor-pointer font-sans"
                    >
                      Ажилд орох хүсэлт
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* How it works Section */}
        <section id="how-it-works" className="py-20 px-6 border-t border-slate-900 bg-slate-950/20">
          <div className="max-w-7xl mx-auto text-center space-y-12">
            <div className="space-y-4 max-w-2xl mx-auto">
              <h2 className="text-2xl md:text-4xl font-extrabold text-white font-sans">
                Манай систем <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Хэрхэн ажилладаг вэ?</span>
              </h2>
              <p className="text-xs md:text-sm text-slate-500 font-sans">
                Салбарын итгэлцэл, чанарыг бэхжүүлэхэд хэрэглэгч бүрийн оролцоо чухал.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 text-left font-sans">
              
              {/* Operator steps */}
              <div className="glass-panel p-8 rounded-2xl space-y-6">
                <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-lg text-emerald-400 text-xs font-bold uppercase">
                  <span>Жолооч, Оператор нарт</span>
                </div>
                <div className="space-y-6 relative pl-4 border-l-2 border-slate-800">
                  <div className="relative">
                    <div className="absolute left-[-25px] top-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#070a13]" />
                    <h4 className="text-sm font-bold text-white">1. Профайл & Намтар үүсгэх</h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Утасны дугаараараа бүртгүүлж, барьдаг техник, ажлын туршлагаа оруулна. Gemini AI ашиглан намтараа гоёмсог бэлдэнэ.
                    </p>
                  </div>
                  <div className="relative">
                    <div className="absolute left-[-25px] top-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#070a13]" />
                    <h4 className="text-sm font-bold text-white">2. Ажлын зард хүсэлт илгээх</h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Сул зарлагдсан ажлын саналуудыг шалган, өөрийн үнэлгээ, ажлын түүхийн хамт ганц товчлуураар ажилд орох хүсэлт явуулна.
                    </p>
                  </div>
                  <div className="relative">
                    <div className="absolute left-[-25px] top-0.5 w-4 h-4 rounded-full bg-slate-800 border-2 border-slate-700" />
                    <h4 className="text-sm font-bold text-white">3. Хамтын ажиллагаа & Үнэлгээ авах</h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Ажил амжилттай дууссаны дараа ажил олгогчоос 1-5 одтой тоон үнэлгээ, ажлын гүйцэтгэлийн сэтгэгдлийг өөрийн профайлын түүхэнд нэмүүлнэ.
                    </p>
                  </div>
                </div>
              </div>

              {/* Employer steps */}
              <div className="glass-panel p-8 rounded-2xl space-y-6">
                <div className="inline-flex items-center space-x-2 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-lg text-cyan-400 text-xs font-bold uppercase">
                  <span>Ажил олгогчдод</span>
                </div>
                <div className="space-y-6 relative pl-4 border-l-2 border-slate-800">
                  <div className="relative">
                    <div className="absolute left-[-25px] top-0.5 w-4 h-4 rounded-full bg-cyan-500 border-2 border-[#070a13]" />
                    <h4 className="text-sm font-bold text-white">1. Ажлын шаардлага бүхий зар тавих</h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Шаардлагатай техник, ажиллах байршил, цалин болон хугацааг тодорхойлон ажлын шинэ зар үүсгэнэ.
                    </p>
                  </div>
                  <div className="relative">
                    <div className="absolute left-[-25px] top-0.5 w-4 h-4 rounded-full bg-cyan-500 border-2 border-[#070a13]" />
                    <h4 className="text-sm font-bold text-white">2. Жолоочийн түүх & Үнэлгээг шалгах</h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Ажилд орох хүсэлт ирүүлсэн жолооч нарын өмнөх гүйцэтгэлийн түүх, сэтгэгдлийг шалгаж, хариуцлагатай жолоочийг сонгон ажиллуулна.
                    </p>
                  </div>
                  <div className="relative">
                    <div className="absolute left-[-25px] top-0.5 w-4 h-4 rounded-full bg-slate-800 border-2 border-slate-700" />
                    <h4 className="text-sm font-bold text-white">3. Ажлыг дүгнэж бодит үнэлгээ өгөх</h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Ажлын дараа жолоочийн гүйцэтгэл, хариуцлагыг тоонон үнэлгээгээр үнэлж сэтгэгдэл үлдээнэ. Жолооч мөн ажил олгогчийг үнэлнэ.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* CTA section */}
        <section className="py-20 px-6 max-w-5xl mx-auto text-center space-y-8 font-sans">
          <div className="space-y-4">
            <h2 className="text-3xl md:text-5xl font-extrabold text-white leading-tight">
              Хариуцлагатай жолооч, Найдвартай ажил олгогчдыг <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Нэгтгэж байна</span>
            </h2>
            <p className="text-slate-400 text-xs md:text-sm max-w-xl mx-auto leading-relaxed">
              Та жолоочоор ажилд орох эсвэл өөрийн ажилд механизмын оператор хайж байгаа бол одооноос бодит үнэлгээтэйгээр хамтын ажиллагаагаа эхлүүлээрэй.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <button 
              onClick={() => handleNavToAuth('register')}
              className="w-full sm:w-auto glow-btn-emerald bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs md:text-sm px-8 py-4 rounded-xl transition-all shadow-lg shadow-emerald-950/20 cursor-pointer"
            >
              Одоо үнэгүй бүртгүүлэх
            </button>
            <button 
              onClick={() => handleNavToAuth('login')}
              className="w-full sm:w-auto px-8 py-4 border border-slate-800 hover:border-slate-650 rounded-xl text-xs md:text-sm font-bold text-white transition-all hover:bg-slate-800/40 cursor-pointer"
            >
              Самбарт нэвтрэх
            </button>
          </div>
        </section>

      </div>
    </div>
  );
}
