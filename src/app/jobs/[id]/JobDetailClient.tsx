'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, MapPin, DollarSign, Briefcase, Clock, 
  CheckCircle, Star, Users, User as UserIcon, Loader2, AlertCircle, ChevronDown, LogOut, Settings as SettingsIcon
} from 'lucide-react';
import { getCurrentUser, setCurrentUser, getSingleJob, getSingleUser, saveSingleUser } from '../../../lib/db';
import { Job, User } from '../../../types';
import { db } from '../../../lib/firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';

interface JobDetailClientProps {
  jobId: string;
}

export default function JobDetailClient({ jobId }: JobDetailClientProps) {
  const router = useRouter();
  const [currentUser, setLocalCurrentUser] = useState<User | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [employer, setEmployer] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);

  useEffect(() => {
    // 1. Get current user session if it exists (Optional for viewing, required for actions)
    const user = getCurrentUser();
    if (user) {
      setLocalCurrentUser(user);
    }

    // 2. Fetch job details
    const fetchJobData = async () => {
      try {
        const jobData = await getSingleJob(jobId);
        if (jobData) {
          setJob(jobData);
          // Fetch employer info
          const empData = await getSingleUser(jobData.employerId);
          if (empData) {
            setEmployer(empData);
          }
        } else {
          setError('Уучлаарай, ажлын зар олдсонгүй эсвэл устгагдсан байна.');
        }
      } catch (err) {
        console.error(err);
        setError('Өгөгдөл уншихад алдаа гарлаа.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobData();
  }, [jobId]);

  const handleApply = async () => {
    if (!currentUser) {
      router.push('/auth');
      return;
    }
    if (!job) return;

    setIsApplying(true);
    try {
      const jobRef = doc(db, 'jobs', job.id);
      await updateDoc(jobRef, {
        applicants: arrayUnion(currentUser.id)
      });

      // Update local state
      const updatedJob = { ...job, applicants: [...job.applicants, currentUser.id] };
      setJob(updatedJob);
      setSuccessMessage('Ажилд орох хүсэлт амжилттай илгээгдлээ! Захиалагч хянах болно. 🎉');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      console.error(err);
      setError('Хүсэлт илгээхэд алдаа гарлаа.');
    } finally {
      setIsApplying(false);
    }
  };

  const getFirstName = (userObj: User | string | null): string => {
    if (!userObj) return 'Хэрэглэгч';
    if (typeof userObj === 'string') {
      const parts = userObj.trim().split(/\s+/);
      return parts[parts.length - 1];
    }
    if (userObj.firstName) return userObj.firstName;
    const parts = userObj.fullName.trim().split(/\s+/);
    return parts[parts.length - 1];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070a13] flex items-center justify-center text-white font-sans">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
          <p className="text-slate-400 text-sm">Уншиж байна...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow bg-[#070a13] text-white font-sans flex flex-col justify-between relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="glow-blob bg-emerald-500 w-[400px] h-[400px] -top-40 -left-40 opacity-10"></div>
      <div className="glow-blob bg-cyan-500 w-[500px] h-[500px] -bottom-60 -right-40 opacity-10"></div>

      {/* Premium Header */}
      <header className="sticky top-0 z-40 bg-[#070a13]/85 backdrop-blur-md border-b border-slate-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => router.push('/board')}
            className="p-2 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400" />
          </button>
          <div>
            <h1 className="text-sm font-black tracking-wide text-white uppercase text-left">Antigravity Driver</h1>
            <p className="text-[10px] text-gray-500 font-medium">Хүнд машин, механизм & Газар шорооны ажлын сайт</p>
          </div>
        </div>

        {currentUser ? (
          <div 
            className="relative"
            onMouseEnter={() => setShowProfileMenu(true)}
            onMouseLeave={() => setShowProfileMenu(false)}
          >
            <button
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
                onError={(e) => { (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=U&background=334155&color=fff'; }}
              />
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 top-full pt-1.5 w-48 z-50 animate-fade-in">
                <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-2">
                  <button
                    onClick={() => router.push('/profile')}
                    className="w-full text-left px-4 py-2 text-xs hover:bg-slate-800 text-gray-300 hover:text-white flex items-center space-x-2.5 cursor-pointer"
                  >
                    <UserIcon className="w-4 h-4 text-emerald-400" />
                    <span>Миний профайл</span>
                  </button>
                  <button
                    onClick={() => router.push('/applications')}
                    className="w-full text-left px-4 py-2 text-xs hover:bg-slate-800 text-gray-300 hover:text-white flex items-center space-x-2.5 cursor-pointer"
                  >
                    <Briefcase className="w-4 h-4 text-emerald-400" />
                    <span>{currentUser.type === 'operator' ? 'Миний хүсэлтүүд' : 'Миний зарууд'}</span>
                  </button>
                  <button
                    onClick={() => router.push('/settings')}
                    className="w-full text-left px-4 py-2 text-xs hover:bg-slate-800 text-gray-300 hover:text-white flex items-center space-x-2.5 cursor-pointer"
                  >
                    <SettingsIcon className="w-4 h-4 text-emerald-400" />
                    <span>Тохиргоо</span>
                  </button>
                  <div className="border-t border-slate-800 my-1"></div>
                  <button
                    onClick={() => {
                      setCurrentUser(null);
                      setLocalCurrentUser(null);
                      router.push('/auth');
                    }}
                    className="w-full text-left px-4 py-2 text-xs hover:bg-slate-800 text-rose-400 flex items-center space-x-2.5 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Системээс гарах</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button 
            onClick={() => router.push('/auth')}
            className="text-xs bg-emerald-600 hover:bg-emerald-550 text-white font-bold px-4 py-2 rounded-xl transition-all shadow-md cursor-pointer"
          >
            Нэвтрэх / Бүртгүүлэх
          </button>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-3xl mx-auto w-full px-6 py-10 relative z-10">
        {error && (
          <div className="bg-rose-500/10 border border-rose-500 text-rose-350 p-4 rounded-xl text-xs flex items-center space-x-2.5 mb-6 text-left">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="bg-emerald-500/10 border border-emerald-500 text-emerald-300 p-4 rounded-xl text-xs flex items-center space-x-2.5 mb-6 text-left animate-fade-in">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {job && (
          <div className="bg-slate-900/60 border border-slate-800 p-6 md:p-8 rounded-2xl space-y-6 shadow-2xl backdrop-blur-sm">
            {/* Header info */}
            <div className="border-b border-slate-800 pb-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div></div>
                <span className="text-xs text-gray-500 flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{job.location}</span>
                </span>
              </div>
              <h2 className="text-lg md:text-xl font-extrabold text-white leading-snug text-left">
                {job.title}
              </h2>

              {/* Employer Preview */}
              {employer && (
                <div 
                  onClick={() => router.push(`/profile?id=${employer.id}`)}
                  className="inline-flex items-center space-x-2 bg-slate-950/50 p-2.5 pr-4 rounded-xl border border-slate-850 hover:bg-slate-800/80 transition-colors text-left cursor-pointer mt-1"
                >
                  <img 
                    src={employer.profileImage} 
                    alt={employer.fullName} 
                    className="w-7 h-7 rounded-full object-cover border border-slate-700"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=E&background=334155&color=fff'; }}
                  />
                  <div>
                    <span className="text-xs text-emerald-400 font-bold hover:underline block leading-tight">
                      {employer.companyName || employer.fullName}
                    </span>
                    <div className="flex items-center space-x-1 font-mono text-[9px] text-amber-400">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                      <span>{employer.rating.toFixed(1)} Захиалагчийн үнэлгээ</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Details Card Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-left">
              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-850">
                <span className="text-[10px] text-gray-500 block font-mono">ТӨЛБӨРИЙН ХЭМЖЭЭ</span>
                <span className="font-bold text-lg text-emerald-450 block font-mono mt-1">
                  {job.salary === 0 ? 'Тохиролцоно' : `${job.salary.toLocaleString('mn-MN')} ₮`}
                </span>
              </div>
              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-850">
                <span className="text-[10px] text-gray-550 block font-mono">АЖЛЫН ХУГАЦАА</span>
                <span className="font-bold text-lg text-white block mt-1">
                  {job.duration}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2 text-left">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Ажлын дэлгэрэнгүй тодорхойлолт</span>
              <p className="text-xs text-gray-300 leading-relaxed bg-slate-950/40 p-4 rounded-xl border border-slate-850 whitespace-pre-wrap">
                {job.description}
              </p>
            </div>

            {/* Requirements */}
            <div className="space-y-3 text-left">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Жолооч, операторт тавигдах шаардлага</span>
              <ul className="space-y-2 text-xs text-gray-300">
                {job.requirements.map((req, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="text-emerald-500 mr-2.5 font-bold">•</span>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions Zone */}
            <div className="border-t border-slate-800/80 pt-6">
              {currentUser ? (
                /* Authenticated User Actions */
                currentUser.type === 'operator' ? (
                  job.applicants.includes(currentUser.id) ? (
                    <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-xl text-center text-xs text-emerald-400 font-semibold flex items-center justify-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-emerald-550" />
                      <span>Та энэ заранд орох хүсэлтээ амжилттай илгээсэн байна. Захиалагчийн хариуг хүлээж байна.</span>
                    </div>
                  ) : (
                    <button
                      onClick={handleApply}
                      disabled={isApplying || job.status !== 'open'}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-3 px-6 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center justify-center space-x-2 shadow-lg"
                    >
                      {isApplying ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Илгээж байна...</span>
                        </>
                      ) : (
                        <>
                          <Briefcase className="w-4 h-4" />
                          <span>АЖИЛД ОРОХ ХҮСЭЛТ ИЛГЭЭХ (Үнэлгээ хавсаргах)</span>
                        </>
                      )}
                    </button>
                  )
                ) : (
                  /* Employer message */
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 text-center text-xs text-gray-400">
                    {currentUser.id === job.employerId ? (
                      <div className="space-y-3">
                        <p className="font-semibold text-white text-left">Таны оруулсан зар байна.</p>
                        <button 
                          onClick={() => router.push(`/profile?id=${currentUser.id}`)}
                          className="w-full bg-slate-800 hover:bg-slate-750 text-emerald-400 border border-slate-700 py-2 px-4 rounded-xl text-xs cursor-pointer transition-colors"
                        >
                          Хүсэлт ирүүлсэн жолооч нарыг хянах
                        </button>
                      </div>
                    ) : (
                      <p>Энэ зарыг өөр ажил олгогч байршуулсан байна. Хүсэлт илгээх үйлдлийг зөвхөн жолооч нар хийнэ.</p>
                    )}
                  </div>
                )
              ) : (
                /* Guest User Call To Action */
                <div className="bg-slate-950 p-5 rounded-xl border border-slate-850/80 text-center space-y-4">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-white">Та энэ заранд хүсэлт илгээх үү?</p>
                    <p className="text-[10.5px] text-gray-400">
                      Жолооч, операторын үнэлгээ, ажлын түүхээ хавсаргаж ажилд орох хүсэлт илгээхийн тулд системд нэвтэрсэн байх шаардлагатай.
                    </p>
                  </div>
                  <button
                    onClick={() => router.push('/auth')}
                    className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-550 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all shadow-md cursor-pointer"
                  >
                    <span>Нэвтэрч ороод хүсэлт илгээх</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
