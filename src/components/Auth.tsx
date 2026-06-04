import { useState, FormEvent, ChangeEvent } from 'react';
import { User as UserIcon, Phone, Mail, MapPin, Truck, Check, Wrench, Key, AlertCircle, ArrowLeft, Sparkles, X, Eye, EyeOff, FileText, Lock } from 'lucide-react';
import { loginUser, registerUser, saveSingleUser } from '../lib/db';
import { User, UserType } from '../types';
import { optimizeBio } from '../lib/gemini';
import { db, auth } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { signInWithEmailAndPassword } from 'firebase/auth';



interface AuthProps {
  onSuccess: (user: User) => void;
}

const AVATAR_PRESETS = [
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23f4f2ec"/><circle cx="50" cy="50" r="47" fill="none" stroke="%23d4af37" stroke-width="2" opacity="0.6"/><circle cx="50" cy="40" r="16" fill="%23ffffff"/><path d="M32 36c0-11 8-18 18-18s18 7 18 18c0 1.5-.2 3-.5 4.5C64 36 58 34 50 34s-14 2-17.5 6.5c-.3-1.5-.5-3-.5-4.5z" fill="%230f172a"/><path d="M24 80c0-12 10-18 26-18s26 6 26 18z" fill="%231e293b"/><path d="M50 62v18" stroke="%23d4af37" stroke-width="3"/><path d="M42 62l8 8 8-8" stroke="%23ffffff" stroke-width="2" fill="none"/></svg>', // High-Contrast Minimal Luxury Male
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23f4f2ec"/><circle cx="50" cy="50" r="47" fill="none" stroke="%23d4af37" stroke-width="2" opacity="0.6"/><path d="M32 38v24c0 4 3 8 8 8s8-4 8-8V38zM52 38v24c0 4 3 8 8 8s8-4 8-8V38z" fill="%230f172a"/><circle cx="50" cy="40" r="16" fill="%23ffffff"/><path d="M32 36c0-11 8-18 18-18s18 7 18 18c0 2 0 4-.5 6C64 33 58 32 50 32s-14 1-17.5 10c-.5-2-.5-4-.5-4z" fill="%230f172a"/><path d="M24 80c0-12 10-18 26-18s26 6 26 18z" fill="%231e293b"/><circle cx="50" cy="62" r="6" fill="none" stroke="%23d4af37" stroke-width="2"/><circle cx="50" cy="68" r="1.5" fill="%23d4af37"/></svg>' // High-Contrast Minimal Luxury Female
];

const MACHINE_OPTIONS = [
  'Экскаватор',
  'Дамп',
  'Хово',
  'Ковш',
  'Бульдозер',
  'Авто грейдер',
  'Кран',
  'Бетон зуурагч машин',
  'Трейлэр'
];

export default function Auth({ onSuccess }: AuthProps) {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [userType, setUserType] = useState<UserType>('operator');
  const [email, setEmail] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [firstName, setFirstName] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [selectedAvatar, setSelectedAvatar] = useState<string>(AVATAR_PRESETS[0]);
  const [bio, setBio] = useState<string>('');
  const [experienceYears, setExperienceYears] = useState<number | ''>(3);
  const [selectedMachines, setSelectedMachines] = useState<string[]>([]);
  const [customRegMachine, setCustomRegMachine] = useState<string>('');
  
  const [regPassword, setRegPassword] = useState<string>('');
  const [regConfirmPassword, setRegConfirmPassword] = useState<string>('');
  const [showRegPassword, setShowRegPassword] = useState<boolean>(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState<boolean>(false);

  // Password Recovery States
  const [isForgotMode, setIsForgotMode] = useState<boolean>(false);
  const [recoveryStep, setRecoveryStep] = useState<1 | 2>(1);
  const [forgotInput, setForgotInput] = useState<string>('');
  const [securityQ1, setSecurityQ1] = useState<string>('');
  const [securityQ2, setSecurityQ2] = useState<string>('');
  const [securityA1Input, setSecurityA1Input] = useState<string>('');
  const [securityA2Input, setSecurityA2Input] = useState<string>('');
  const [matchedUserObj, setMatchedUserObj] = useState<User | null>(null);
  const [forgotNewPassword, setForgotNewPassword] = useState<string>('');
  const [forgotConfirmNewPassword, setForgotConfirmNewPassword] = useState<string>('');
  const [showForgotNewPassword, setShowForgotNewPassword] = useState<boolean>(false);
  const [showForgotConfirmNewPassword, setShowForgotConfirmNewPassword] = useState<boolean>(false);
  const [showLoginPassword, setShowLoginPassword] = useState<boolean>(false);
  const [showTerms, setShowTerms] = useState<boolean>(false);
  const [showPrivacy, setShowPrivacy] = useState<boolean>(false);
  const [isAgreedToTerms, setIsAgreedToTerms] = useState<boolean>(false);

  const [error, setError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [hasOptimized, setHasOptimized] = useState<boolean>(false);
  const [originalBio, setOriginalBio] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleOptimizeBio = async () => {
    setIsOptimizing(true);
    setError('');
    const rawToOptimize = originalBio || bio;
    if (!originalBio) {
      setOriginalBio(bio);
    }
    const computedFullName = lastName.trim() ? lastName.trim() + ' ' + firstName.trim() : firstName.trim();
    try {
      const optimized = await optimizeBio({
        fullName: computedFullName,
        experienceYears: userType === 'operator' ? (experienceYears === '' ? 0 : experienceYears) : 0,
        machineTypes: userType === 'operator' ? selectedMachines : [],
        rawBio: rawToOptimize,
        currentBio: bio,
        userType: userType
      });
      setBio(optimized);
      setHasOptimized(true);
    } catch (err: any) {
      console.error(err);
      setError('AI намтар сайжруулахад алдаа гарлаа. Та дахин оролдоно уу.');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Имэйл хаягийг оруулна уу.');
      return;
    }
    if (!password) {
      setError('Нууц кодыг оруулна уу.');
      return;
    }
    
    setError('');
    setSuccessMsg('Нэвтэрч байна, түр хүлээнэ үү...');
    setIsSubmitting(true);

    try {
      let user;
      if (email.includes('@')) {
        user = await loginUser(email.trim().toLowerCase(), '', password);
      } else {
        // Backwards compatibility for phone logins
        user = await loginUser('', email, password);
      }

      if (user) {
        setSuccessMsg('Амжилттай нэвтэрлээ!');
        setTimeout(() => {
          onSuccess(user);
        }, 1000);
      } else {
        setError('Хэрэглэгч олдсонгүй эсвэл нууц код буруу байна. Имэйл болон нууц үгээ шалгана уу.');
        setSuccessMsg('');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Нэвтрэхэд алдаа гарлаа.');
      setSuccessMsg('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    if (!isAgreedToTerms) {
      setError('Үйлчилгээний нөхцлийг зөвшөөрнө үү.');
      return;
    }
    const isNameValid = firstName.trim() !== '' && lastName.trim() !== '';
    if (!isNameValid || !phone || !address) {
      setError('Шаардлагатай мэдээллүүдийг бүрэн бөглөнө үү.');
      return;
    }

    if (!regPassword) {
      setError('Нэвтрэх нууц кодыг оруулна уу.');
      return;
    }

    if (regPassword.length < 8) {
      setError('Нууц үг шаардлага хангахгүй байна: Нууц үгийн урт хамгийн багадаа 8 тэмдэгт байх ёстой.');
      return;
    }

    if (!/[!@#$%^&*(),.?":{}|<>_\-+=]/.test(regPassword)) {
      setError('Нууц үг шаардлага хангахгүй байна: Дор хаяж нэг тусгай тэмдэгт (!@#$%^&* гэх мэт) агуулсан байх ёстой.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setError('Нууц үгний давталт таарахгүй байна. Давтан оруулсан нууц үгээ шалгана уу.');
      return;
    }

    const computedFullName = lastName.trim() + ' ' + firstName.trim();

    try {
      setError('');
      setSuccessMsg('Бүртгэл үүсгэж байна, түр хүлээнэ үү...');
      setIsSubmitting(true);

      const newUser = await registerUser({
        email: email.trim().toLowerCase(),
        fullName: computedFullName,
        lastName: lastName.trim(),
        firstName: firstName.trim(),
        companyName: userType === 'employer' && companyName.trim() !== '' ? companyName.trim() : undefined,
        phone: phone.trim(),
        address,
        profileImage: selectedAvatar,
        type: userType,
        bio: bio || (userType === 'operator' ? 'Туршлагатай мэргэжлийн оператор ажиллана.' : 'Найдвартай барилгын ажил олгогч.'),
        experienceYears: userType === 'operator' ? (experienceYears === '' ? 0 : experienceYears) : undefined,
        machineTypes: userType === 'operator' ? selectedMachines : undefined,
        isPublic: true,
        password: regPassword
      }, (status) => {
        setSuccessMsg(status);
      });

      setSuccessMsg('Бүртгэл амжилттай үүслээ! Тавтай морилно уу. 🚀');
      setTimeout(() => {
        onSuccess(newUser);
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setError('Бүртгэл үүсгэхэд алдаа гарлаа: ' + (err.message || 'Дахин оролдоно уу.'));
      setSuccessMsg('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyAccount = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const inputVal = forgotInput.trim();
    if (!inputVal) {
      setError('Имэйл хаяг эсвэл Утасны дугаарыг оруулна уу.');
      return;
    }

    setSuccessMsg('Бүртгэлийг шалгаж байна...');
    setIsSubmitting(true);

    try {
      let snapshot;
      if (inputVal.includes('@')) {
        const q = query(collection(db, 'users'), where('email', '==', inputVal.toLowerCase()));
        snapshot = await getDocs(q);
      } else {
        const q = query(collection(db, 'users'), where('phone', '==', inputVal));
        snapshot = await getDocs(q);
        
        if (snapshot.empty && inputVal.startsWith('+976')) {
          const localPhone = inputVal.replace('+976', '');
          const qLocal = query(collection(db, 'users'), where('phone', '==', localPhone));
          snapshot = await getDocs(qLocal);
        } else if (snapshot.empty && !inputVal.startsWith('+976') && /^\d+$/.test(inputVal)) {
          const countryPhone = '+976' + inputVal;
          const qCountry = query(collection(db, 'users'), where('phone', '==', countryPhone));
          snapshot = await getDocs(qCountry);
        }
      }

      let matched: User | null = null;
      if (snapshot && !snapshot.empty) {
        const docs = snapshot.docs.map(d => d.data() as User);
        matched = docs.find(u => u.securityQuestion1 && u.securityAnswer1 && u.securityQuestion2 && u.securityAnswer2) || docs[0];
      }

      if (!matched) {
        setError('Энэхүү имэйл эсвэл утасны дугаартай хэрэглэгч системд бүртгэлгүй байна.');
        setSuccessMsg('');
        return;
      }

      const hasSecurityQuestions = 
        matched.securityQuestion1 && 
        matched.securityAnswer1 && 
        matched.securityQuestion2 && 
        matched.securityAnswer2;

      if (!hasSecurityQuestions) {
        setError('Уучлаарай, та аюулгүй байдлын асуулт тохируулаагүй тул автоматаар нууц код сэргээх боломжгүй байна. Та манай холбоо барих хэсгээр хандаж дэмжлэг авна уу.');
        setSuccessMsg('');
        return;
      }

      setSecurityQ1(matched.securityQuestion1);
      setSecurityQ2(matched.securityQuestion2);
      setMatchedUserObj(matched);
      setRecoveryStep(2);
      setSuccessMsg('Аюулгүй байдлын асуултууд амжилттай ачаалагдлаа.');
      setTimeout(() => {
        setSuccessMsg('');
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setError('Алдаа гарлаа: ' + (err.message || err));
      setSuccessMsg('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!matchedUserObj) {
      setError('Сэргээх үйлдэл хүчингүй байна.');
      return;
    }

    const ans1 = securityA1Input.trim().toLowerCase();
    const ans2 = securityA2Input.trim().toLowerCase();
    const newPass = forgotNewPassword;
    const confirmPass = forgotConfirmNewPassword;

    if (!ans1 || !ans2) {
      setError('Аюулгүй байдлын асуултуудын хариултыг оруулна уу.');
      return;
    }
    if (!newPass) {
      setError('Шинэ нууц код оруулна уу.');
      return;
    }
    if (newPass.length < 8) {
      setError('Нууц код хамгийн багадаа 8 тэмдэгт байх шаардлагатай.');
      return;
    }
    if (!/[!@#$%^&*(),.?":{}|<>_\-+=]/.test(newPass)) {
      setError('Нууц код дор хаяж нэг тусгай тэмдэгт (!@#$%^&* гэх мэт) агуулсан байх шаардлагатай.');
      return;
    }
    if (newPass !== confirmPass) {
      setError('Хоёр нууц код хоорондоо тохирохгүй байна.');
      return;
    }

    // Check answers
    const correctAns1 = matchedUserObj.securityAnswer1?.trim().toLowerCase();
    const correctAns2 = matchedUserObj.securityAnswer2?.trim().toLowerCase();

    if (ans1 !== correctAns1 || ans2 !== correctAns2) {
      setError('Аюулгүй байдлын асуултуудын хариулт таарахгүй байна! Аюулгүй байдлын үүднээс мэдээллээ зөв оруулна уу.');
      return;
    }

    setSuccessMsg('Нууц кодыг шинэчилж байна...');
    setIsSubmitting(true);

    try {
      // 1. Authenticate temporarily to satisfy Firestore rules
      const targetEmail = matchedUserObj.email || `${matchedUserObj.phone.replace(/[^a-zA-Z0-9]/g, '')}@jolooj.mn`;
      try {
        await signInWithEmailAndPassword(auth, targetEmail, 'Password123!');
      } catch (authErr) {
        console.warn('Temporary sign-in for recovery failed, proceeding with Firestore rules fallback:', authErr);
      }

      matchedUserObj.password = newPass;
      await saveSingleUser(matchedUserObj);

      setSuccessMsg('Нууц код амжилттай сэргээгдлээ! Та шинэ нууц кодоор нэвтэрнэ үү. 🔑');
      
      // Reset states
      setForgotInput('');
      setSecurityQ1('');
      setSecurityQ2('');
      setSecurityA1Input('');
      setSecurityA2Input('');
      setMatchedUserObj(null);
      setRecoveryStep(1);
      setForgotNewPassword('');
      setForgotConfirmNewPassword('');

      setTimeout(() => {
        setIsForgotMode(false);
        setSuccessMsg('');
      }, 3000);
    } catch (err: any) {
      console.error(err);
      setError('Нууц код сэргээхэд алдаа гарлаа: ' + (err.message || err));
      setSuccessMsg('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Зураг 2MB-аас бага хэмжээтэй байх ёстой.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setSelectedAvatar(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleMachine = (machine: string) => {
    if (selectedMachines.includes(machine)) {
      setSelectedMachines(selectedMachines.filter(m => m !== machine));
    } else {
      setSelectedMachines([...selectedMachines, machine]);
    }
  };

  return (
    <div className="min-h-screen bg-[#070a13] relative overflow-hidden flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      {/* Ambient background glow blobs */}
      <div className="glow-blob bg-emerald-500 w-[400px] h-[400px] -top-40 -left-40 opacity-10"></div>
      <div className="glow-blob bg-cyan-500 w-[500px] h-[500px] -bottom-60 -right-40 opacity-10" style={{ animationDelay: '-5s' }}></div>
      <div className="glow-blob bg-violet-600 w-[300px] h-[300px] top-1/2 left-1/3 opacity-5" style={{ animationDelay: '-10s' }}></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-xl relative z-10 text-center">
        {/* Premium Custom Excavator SVG Icon */}
        <div className="flex justify-center mb-3">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#0c1328] to-[#080d1a] border-2 border-emerald-500/30 flex items-center justify-center relative overflow-hidden group hover:border-emerald-400 transition-all duration-500 shadow-2xl shadow-emerald-950/20 neon-border-emerald">
            <div className="glow-blob bg-emerald-500 w-[60px] h-[60px] opacity-20 -top-5 -right-5"></div>
            <svg className="w-16 h-16 text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.35)]" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              {/* Caterpillar Track base */}
              <rect x="6" y="46" width="36" height="8" rx="4" fill="currentColor" fillOpacity="0.1" />
              <line x1="12" y1="50" x2="36" y2="50" strokeWidth="2" strokeDasharray="4 3" />
              <circle cx="11" cy="50" r="2" fill="currentColor" />
              <circle cx="24" cy="50" r="2" fill="currentColor" />
              <circle cx="37" cy="50" r="2" fill="currentColor" />
              
              {/* Rotating Cabin base structure */}
              <path d="M10 40h28v6H10z" fill="currentColor" fillOpacity="0.2" />
              <path d="M14 26h18v14H14z" fill="currentColor" fillOpacity="0.1" />
              <path d="M16 26h10l4 8H14l2-8z" />
              
              {/* Boom (Main arm) - extending up and right */}
              <path d="M28 34 L44 14" strokeWidth="4.5" className="text-cyan-400" />
              
              {/* Dipper / Stick (Outer arm) - pivoting down from boom tip */}
              <path d="M44 14 L52 30" strokeWidth="3.5" className="text-amber-400" />
              
              {/* Bucket / Scoop - pivoting at the end of the stick */}
              <path d="M52 30 L46 36 L39 33 Z" fill="currentColor" fillOpacity="0.3" strokeWidth="2.5" className="text-amber-500" />
              
              {/* Joint Pins */}
              <circle cx="28" cy="34" r="2" className="fill-white stroke-none" />
              <circle cx="44" cy="14" r="2" className="fill-white stroke-none" />
              <circle cx="52" cy="30" r="2" className="fill-white stroke-none" />
              
              {/* Hydraulic lines */}
              <path d="M26 30 Q36 22 41 16" stroke="currentColor" strokeWidth="1" opacity="0.6" />
            </svg>
          </div>
        </div>

        <h2 className="mt-4 text-center text-3xl font-black tracking-tight text-white font-sans text-neon-emerald">
          Хүнд машин, механизм & Газар шорооны ажлын сайт
        </h2>
        <p className="mt-2.5 text-center text-sm text-slate-400 font-sans tracking-wide max-w-md mx-auto leading-relaxed">
          Үнэлгээ өгөх, ажлын түүх үүсгэх системээр хариуцлагатай жолооч, оператор болон найдвартай ажил олгогчдыг үүсгэх платформ
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl relative z-10">
        <div className="glass-panel py-8 px-4 shadow-2xl rounded-2xl sm:px-10 border border-slate-800/80 neon-border-cyan">
          {/* Alerts are now rendered locally below form action buttons for optimal mobile UX */}

          {/* Tab buttons for Login / Register */}
          {!isForgotMode && (
            <div className="flex border-b border-slate-800 mb-6 pb-1">
              <button
                id="switch-login-tab"
                onClick={() => { 
                  setIsLogin(true); 
                  setError(''); 
                  setSuccessMsg('');
                }}
                className={`flex-1 text-center py-2.5 font-medium text-sm transition-all border-b-2 cursor-pointer ${
                  isLogin
                    ? 'text-emerald-400 border-emerald-400 font-semibold text-neon-emerald'
                    : 'text-slate-400 border-transparent hover:text-white'
                }`}
              >
                Нэвтрэх хэсэг
              </button>
              <button
                id="switch-register-tab"
                onClick={() => { 
                  setIsLogin(false); 
                  setError(''); 
                  setSuccessMsg('');
                }}
                className={`flex-1 text-center py-2.5 font-medium text-sm transition-all border-b-2 cursor-pointer ${
                  !isLogin
                    ? 'text-emerald-400 border-emerald-400 font-semibold text-neon-emerald'
                    : 'text-slate-400 border-transparent hover:text-white'
                }`}
              >
                Бүртгүүлэх хэсэг
              </button>
            </div>
          )}

          {isLogin ? (
            isForgotMode ? (
              /* PASSWORD RECOVERY FORM IN LOGIN */
              <form onSubmit={recoveryStep === 1 ? handleVerifyAccount : handleForgotPasswordSubmit} className="space-y-4 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <span className="font-semibold text-emerald-400 text-xs">Нууц үг сэргээх цэс</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotMode(false);
                      setRecoveryStep(1);
                      setForgotInput('');
                      setSecurityQ1('');
                      setSecurityQ2('');
                      setSecurityA1Input('');
                      setSecurityA2Input('');
                      setMatchedUserObj(null);
                      setError('');
                      setSuccessMsg('');
                    }}
                    className="text-gray-400 hover:text-white underline cursor-pointer"
                  >
                    Буцах
                  </button>
                </div>

                {recoveryStep === 1 ? (
                  /* STEP 1: Email or Phone Search */
                  <div className="animate-fade-in space-y-3.5">
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">
                        Бүртгэлтэй имэйл хаяг эсвэл Утасны дугаар
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <UserIcon className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          id="forgot-input"
                          type="text"
                          required
                          value={forgotInput}
                          onChange={(e) => setForgotInput(e.target.value)}
                          placeholder=""
                          className="block w-full pl-9 pr-3 py-2 border border-slate-600 rounded bg-slate-900/50 text-white text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* STEP 2: Answer Questions and Reset Password */
                  <div className="space-y-3.5 animate-fade-in">
                    {/* Security Question 1 */}
                    <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800 font-sans space-y-2 text-left">
                      <span className="text-[11px] font-semibold text-emerald-405 block">🔒 Аюулгүй байдлын асуулт 1:</span>
                      <p className="text-xs text-white leading-relaxed font-sans">{securityQ1}</p>
                      <input
                        id="security-a1-input"
                        type="text"
                        required
                        value={securityA1Input}
                        onChange={(e) => setSecurityA1Input(e.target.value)}
                        placeholder="Асуулт 1-ийн хариулт"
                        className="block w-full px-3 py-1.5 border border-slate-700 rounded bg-slate-850 text-white text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none font-sans"
                      />
                    </div>

                    {/* Security Question 2 */}
                    <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800 font-sans space-y-2 text-left">
                      <span className="text-[11px] font-semibold text-emerald-405 block">🔒 Аюулгүй байдлын асуулт 2:</span>
                      <p className="text-xs text-white leading-relaxed font-sans">{securityQ2}</p>
                      <input
                        id="security-a2-input"
                        type="text"
                        required
                        value={securityA2Input}
                        onChange={(e) => setSecurityA2Input(e.target.value)}
                        placeholder="Асуулт 2-ийн хариулт"
                        className="block w-full px-3 py-1.5 border border-slate-700 rounded bg-slate-850 text-white text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none font-sans"
                      />
                    </div>

                    {/* Password Inputs */}
                    <div className="border-t border-slate-800/80 pt-3.5 space-y-3.5 text-left">
                      <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">
                          Шинэ нууц код оруулах
                        </label>
                        <div className="relative">
                          <input
                            id="forgot-new-password-input"
                            type={showForgotNewPassword ? 'text' : 'password'}
                            required
                            value={forgotNewPassword}
                            onChange={(e) => setForgotNewPassword(e.target.value)}
                            placeholder=""
                            className="block w-full pl-3 pr-10 py-2 border border-slate-600 rounded bg-slate-900/50 text-white text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none font-sans"
                          />
                          <button
                            type="button"
                            onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white cursor-pointer"
                          >
                            {showForgotNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {forgotNewPassword !== '' && forgotNewPassword.length < 8 && (
                          <p className="text-[10px] text-rose-400 mt-1 font-sans flex items-center space-x-1">
                            <span className="font-bold">✗</span>
                            <span>Нууц код хамгийн багадаа 8 тэмдэгт байх шаардлагатай! (Одоо: {forgotNewPassword.length})</span>
                          </p>
                        )}
                        {forgotNewPassword !== '' && forgotNewPassword.length >= 8 && !/[!@#$%^&*(),.?":{}|<>_\-+=]/.test(forgotNewPassword) && (
                          <p className="text-[10px] text-rose-400 mt-1 font-sans flex items-center space-x-1">
                            <span className="font-bold">✗</span>
                            <span>Нууц үгэнд дор хаяж нэг тусгай тэмдэгт (!@#$%^&* гэх мэт) орох шаардлагатай!</span>
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">
                          Шинэ нууц код давтах
                        </label>
                        <div className="relative">
                          <input
                            id="forgot-confirm-new-password-input"
                            type={showForgotConfirmNewPassword ? 'text' : 'password'}
                            required
                            value={forgotConfirmNewPassword}
                            onChange={(e) => setForgotConfirmNewPassword(e.target.value)}
                            placeholder=""
                            className="block w-full pl-3 pr-10 py-2 border border-slate-600 rounded bg-slate-900/50 text-white text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none font-sans"
                          />
                          <button
                            type="button"
                            onClick={() => setShowForgotConfirmNewPassword(!showForgotConfirmNewPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white cursor-pointer"
                          >
                            {showForgotConfirmNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {forgotConfirmNewPassword !== '' && forgotNewPassword !== forgotConfirmNewPassword && (
                          <p className="text-[10px] text-rose-400 mt-1 font-sans flex items-center space-x-1">
                            <span className="font-bold">✗</span>
                            <span>Давтан оруулсан нууц код тохирохгүй байна!</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    id="submit-forgot-btn"
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg bg-emerald-600 hover:bg-emerald-550 text-white font-semibold text-sm transition-all shadow-lg cursor-pointer glow-btn-emerald disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Түр хүлээнэ үү...' : (recoveryStep === 1 ? 'Шалгах' : 'Нууц кодыг шинэчлэх')}
                  </button>
                  {successMsg && (
                    <div className="mt-3.5 bg-emerald-500/10 border border-emerald-555/40 text-emerald-300 px-4 py-2.5 rounded-lg text-xs flex items-center justify-center space-x-2 animate-fade-in font-sans">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0"></span>
                      <span className="text-left">{successMsg}</span>
                    </div>
                  )}
                  {error && (
                    <div className="mt-3.5 bg-rose-500/10 border border-rose-555/40 text-rose-300 px-4 py-2.5 rounded-lg text-xs flex items-center justify-center text-center animate-fade-in font-sans">
                      <span>{error}</span>
                    </div>
                  )}
                </div>
              </form>
            ) : (
              /* LOGIN FORM */
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1" htmlFor="login-email">
                    Имэйл хаяг эсвэл Утасны дугаар
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4.5 w-4.5 text-gray-404" />
                    </div>
                    <input
                      id="login-email"
                      type="text"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder=""
                      className="block w-full pl-10 pr-3 py-2.5 glass-input text-sm text-white placeholder-slate-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-350 mb-1" htmlFor="login-password">
                    Нууц код
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none font-sans text-slate-500 font-extrabold text-xs">
                      ***
                    </div>
                    <input
                      id="login-password"
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder=""
                      className="block w-full pl-10 pr-10 py-2.5 glass-input text-sm text-white placeholder-slate-600 focus:outline-none"
                    />
                    <button
                      id="toggle-login-pass-visibility"
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white cursor-pointer"
                    >
                      {showLoginPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end pb-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotMode(true);
                      setError('');
                      setSuccessMsg('');
                    }}
                    className="text-xs text-slate-400 hover:text-emerald-450 transition-colors underline cursor-pointer font-sans"
                  >
                    Нууц үг сэргээх холбоос
                  </button>
                </div>

                <div className="pt-2">
                  <button
                    id="submit-login-btn"
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg bg-emerald-600 hover:bg-emerald-550 text-white font-semibold text-sm transition-all shadow-lg shadow-emerald-950/20 cursor-pointer glow-btn-emerald disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Нэвтэрч байна...' : 'Нэвтрэх'}
                  </button>
                  {successMsg && (
                    <div className="mt-3.5 bg-emerald-500/10 border border-emerald-555/40 text-emerald-300 px-4 py-2.5 rounded-lg text-xs flex items-center justify-center space-x-2 animate-fade-in font-sans">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0"></span>
                      <span className="text-left">{successMsg}</span>
                    </div>
                  )}
                  {error && (
                    <div className="mt-3.5 bg-rose-500/10 border border-rose-555/40 text-rose-300 px-4 py-2.5 rounded-lg text-xs flex items-center justify-center text-center animate-fade-in font-sans">
                      <span>{error}</span>
                    </div>
                  )}
                  <p className="mt-3 text-[10.5px] text-gray-500 text-center font-sans">
                    Та нэвтэрснээр манай{' '}
                    <button type="button" onClick={() => setShowTerms(true)} className="text-emerald-400 hover:text-emerald-350 underline transition-colors cursor-pointer bg-transparent border-none p-0 font-medium">Үйлчилгээний нөхцөл</button>
                    {' '}болон{' '}
                    <button type="button" onClick={() => setShowPrivacy(true)} className="text-cyan-400 hover:text-cyan-350 underline transition-colors cursor-pointer bg-transparent border-none p-0 font-medium">Нууцлалын бодлого</button>
                    -ыг зөвшөөрсөнд тооцогдоно.
                  </p>
                </div>
              </form>
            )
          ) : (
            /* REGISTER FORM */
            <form onSubmit={handleRegister} className="space-y-5">
              {/* Role Selector */}
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-2">Хэрэглэгчийн тохиргоо сонгох</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    id="select-role-operator"
                    type="button"
                    onClick={() => {
                      setUserType('operator');
                      setSelectedAvatar(AVATAR_PRESETS[0]);
                      setBio('');
                      setOriginalBio('');
                      setHasOptimized(false);
                    }}
                    className={`flex items-center justify-center space-x-2 py-2.5 px-3 border rounded text-xs transition-colors cursor-pointer ${
                      userType === 'operator'
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-semibold'
                        : 'border-slate-600 hover:border-slate-500 text-gray-400'
                    }`}
                  >
                    <Truck className="w-4 h-4" />
                    <span>Би Жолооч / Оператор</span>
                  </button>
                  <button
                    id="select-role-employer"
                    type="button"
                    onClick={() => {
                      setUserType('employer');
                      setSelectedAvatar(AVATAR_PRESETS[1]);
                      setBio('');
                      setOriginalBio('');
                      setHasOptimized(false);
                    }}
                    className={`flex items-center justify-center space-x-2 py-2.5 px-3 border rounded text-xs transition-colors cursor-pointer ${
                      userType === 'employer'
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-semibold'
                        : 'border-slate-600 hover:border-slate-500 text-gray-400'
                    }`}
                  >
                    <UserIcon className="w-4 h-4" />
                    <span>Би Ажил олгогч / Захиалагч</span>
                  </button>
                </div>
              </div>

              {/* General details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1" htmlFor="reg-lastname">
                    Овог
                  </label>
                  <input
                    id="reg-lastname"
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder=""
                    className="block w-full px-3 py-1.5 border border-slate-600 rounded bg-slate-900/50 text-white placeholder-gray-600 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 font-sans"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1" htmlFor="reg-firstname">
                    Нэр
                  </label>
                  <input
                    id="reg-firstname"
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder=""
                    className="block w-full px-3 py-1.5 border border-slate-600 rounded bg-slate-900/50 text-white placeholder-gray-600 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 font-sans"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userType === 'employer' ? (
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1" htmlFor="reg-companyname">
                      Компанийн нэр (Заавал биш)
                    </label>
                    <input
                      id="reg-companyname"
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder=""
                      className="block w-full px-3 py-1.5 border border-slate-600 rounded bg-slate-900/50 text-white placeholder-gray-600 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 font-sans"
                    />
                  </div>
                ) : null}
                <div className={userType === 'employer' ? '' : 'md:col-span-2'}>
                  <label className="block text-xs font-medium text-gray-300 mb-1" htmlFor="reg-email">
                    Имэйл хаяг (Заавал биш)
                  </label>
                  <input
                    id="reg-email"
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder=""
                    className="block w-full px-3 py-1.5 border border-slate-600 rounded bg-slate-900/50 text-white placeholder-gray-600 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 font-sans"
                  />
                </div>
              </div>

              {/* Phone field */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1" htmlFor="reg-phone">
                    Утасны дугаар
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      id="reg-phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder=""
                      className="block w-full pl-9 pr-3 py-1.5 border border-slate-600 rounded bg-slate-900/50 text-white placeholder-gray-500 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-305 mb-1" htmlFor="reg-address">
                    Гэрийн/Байгууллагын хаяг
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      id="reg-address"
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder=""
                      className="block w-full pl-9 pr-3 py-1.5 border border-slate-600 rounded bg-slate-900/50 text-white placeholder-gray-500 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>

                 <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1" htmlFor="reg-password">
                    Нэвтрэх нууц код
                  </label>
                  <div className="relative">
                    <input
                      id="reg-password"
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder=""
                      className="block w-full pl-3 pr-10 py-1.5 border border-slate-600 rounded bg-slate-900/50 text-white placeholder-gray-500 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 font-sans"
                    />
                    <button
                      id="toggle-reg-pass-visibility"
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white cursor-pointer"
                    >
                      {showRegPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </button>
                  </div>
                  {regPassword !== '' && regPassword.length < 8 && (
                    <p className="text-[10px] text-rose-400 mt-1 font-sans flex items-center space-x-1">
                      <span className="font-bold">✗</span>
                      <span>Нууц үг хамгийн багадаа 8 тэмдэгт байх шаардлагатай! (Одоо: {regPassword.length})</span>
                    </p>
                  )}
                  {regPassword !== '' && regPassword.length >= 8 && !/[!@#$%^&*(),.?":{}|<>_\-+=]/.test(regPassword) && (
                    <p className="text-[10px] text-rose-400 mt-1 font-sans flex items-center space-x-1">
                      <span className="font-bold">✗</span>
                      <span>Нууц үгэнд дор хаяж нэг тусгай тэмдэгт (!@#$%^&* гэх мэт) орох шаардлагатай!</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1" htmlFor="reg-confirm-password">
                    Нэвтрэх нууц код давтах
                  </label>
                  <div className="relative">
                    <input
                      id="reg-confirm-password"
                      type={showRegConfirmPassword ? 'text' : 'password'}
                      required
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder=""
                      className="block w-full pl-3 pr-10 py-1.5 border border-slate-600 rounded bg-slate-900/50 text-white placeholder-gray-500 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 font-sans"
                    />
                    <button
                      id="toggle-reg-confirm-pass-visibility"
                      type="button"
                      onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white cursor-pointer"
                    >
                      {showRegConfirmPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </button>
                  </div>
                  {regConfirmPassword !== '' && regPassword !== regConfirmPassword && (
                    <p className="text-[10px] text-rose-400 mt-1 font-sans flex items-center space-x-1">
                      <span className="font-bold">✗</span>
                      <span>Давтан оруулсан нууц үг тохирохгүй байна!</span>
                    </p>
                  )}
                </div>

                {/* Live Password Checklist */}
                <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800 space-y-1.5 font-sans">
                  <span className="text-[10px] font-semibold text-gray-400 block mb-1">Нууц үгэнд тавих шаардлага:</span>
                  
                  {/* Rule 1: Min length 8 */}
                  <div className="flex items-center space-x-2 text-[10.5px]">
                    <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 border ${
                      regPassword.length >= 8 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-550/30' 
                        : 'bg-rose-500/10 text-rose-400 border-rose-550/30'
                    }`}>
                      {regPassword.length >= 8 ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
                    </div>
                    <span className={regPassword.length >= 8 ? 'text-emerald-400 font-medium' : 'text-slate-400'}>
                      Хамгийн багадаа 8 тэмдэгт (Одоогийн урт: {regPassword.length})
                    </span>
                  </div>
                  
                  {/* Rule 2: Special character */}
                  <div className="flex items-center space-x-2 text-[10.5px]">
                    <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 border ${
                      /[!@#$%^&*(),.?":{}|<>_\-+=]/.test(regPassword) 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-550/30' 
                        : 'bg-rose-500/10 text-rose-400 border-rose-550/30'
                    }`}>
                      {/[!@#$%^&*(),.?":{}|<>_\-+=]/.test(regPassword) ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
                    </div>
                    <span className={/[!@#$%^&*(),.?":{}|<>_\-+=]/.test(regPassword) ? 'text-emerald-400 font-medium' : 'text-slate-400'}>
                      Дор хаяж нэг тусгай тэмдэгт (!@#$%^&* гэх мэт)
                    </span>
                  </div>
                  
                  {/* Rule 3: Passwords match */}
                  <div className="flex items-center space-x-2 text-[10.5px]">
                    <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 border ${
                      (regPassword === regConfirmPassword && regConfirmPassword !== '') 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-550/30' 
                        : 'bg-rose-500/10 text-rose-400 border-rose-550/30'
                    }`}>
                      {(regPassword === regConfirmPassword && regConfirmPassword !== '') ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
                    </div>
                    <span className={(regPassword === regConfirmPassword && regConfirmPassword !== '') ? 'text-emerald-400 font-medium' : 'text-slate-400'}>
                      Хоёр нууц үг хоорондоо тохирох
                    </span>
                  </div>
                </div>
              </div>

              {/* Avatar Picker */}
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5 font-sans">Профайл зураг сонгох</label>
                <div className="flex items-center space-x-6">
                  <div className="flex space-x-3 items-center">
                    {AVATAR_PRESETS.map((avatar, idx) => (
                      <button
                        id={`preset-avatar-${idx}`}
                        key={idx}
                        type="button"
                        onClick={() => { setSelectedAvatar(avatar); }}
                        className={`relative rounded-full overflow-hidden w-12 h-12 border-2 transition-colors cursor-pointer ${
                          selectedAvatar === avatar ? 'border-emerald-500' : 'border-transparent'
                        }`}
                      >
                        <img src={avatar} alt={`Avatar Preset ${idx + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        {selectedAvatar === avatar && (
                          <div className="absolute inset-0 bg-emerald-500/10 flex items-center justify-center">
                            <Check className="w-4 h-4 text-emerald-400" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="border-l border-slate-700 pl-4 py-1.5 flex flex-col justify-center">
                    <label className="text-xs text-emerald-400 hover:text-emerald-300 underline cursor-pointer font-sans inline-flex items-center space-x-1">
                      <span>Эсвэл өөрийн зургийг хуулах (Upload)</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </label>
                    {/* Show a mini preview of uploaded custom image if it is not one of presets */}
                    {!AVATAR_PRESETS.includes(selectedAvatar) && (
                      <div className="mt-1 flex items-center space-x-2">
                        <img src={selectedAvatar} alt="Custom upload" className="w-7 h-7 rounded-full object-cover border border-emerald-500" referrerPolicy="no-referrer" />
                        <span className="text-[10px] text-emerald-400">Зургийг сонголоо!</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-medium text-gray-300" htmlFor="reg-bio">
                    Нэмэлт Мэдээлэл / Био (Туршлага, ажлын чиглэл, товч танилцуулга г.м)
                  </label>
                  <button
                    type="button"
                    onClick={handleOptimizeBio}
                    disabled={isOptimizing}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 border border-emerald-500/30 bg-emerald-500/5 px-2.5 py-0.5 rounded cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-sans"
                  >
                    <Sparkles className={`w-3 h-3 ${isOptimizing ? 'animate-spin' : ''}`} />
                    <span>{isOptimizing ? 'AI сайжруулж байна...' : (hasOptimized ? 'Өөр загвар гаргах' : 'AI-аар сайжруулах')}</span>
                  </button>
                </div>



                <textarea
                  id="reg-bio"
                  rows={6}
                  value={bio}
                  onChange={(e) => {
                    const val = e.target.value;
                    setBio(val);
                    setOriginalBio(val);
                    setHasOptimized(false);
                  }}
                  placeholder=""
                  className="block w-full px-3 py-2.5 border border-slate-600 rounded bg-slate-900/50 text-white placeholder-gray-500 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 font-sans min-h-[140px] leading-relaxed"
                />
              </div>

              {/* Operator specific fields */}
              {userType === 'operator' && (
                <div className="border-t border-slate-700 pt-4 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1" htmlFor="reg-experience">
                      Ажилласан туршлага (Жилээр)
                    </label>
                    <input
                      id="reg-experience"
                      type="number"
                      min={0}
                      max={40}
                      value={experienceYears}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          setExperienceYears('');
                        } else {
                          const parsed = parseInt(val, 10);
                          setExperienceYears(isNaN(parsed) ? '' : parsed);
                        }
                      }}
                      onFocus={(e) => e.target.select()}
                      className="block w-[100px] px-3 py-1.5 border border-slate-600 rounded bg-slate-900/50 text-white placeholder-gray-500 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1.5">
                      Мэргэшсэн Хүнд Машин Механизмууд (Сонгоно уу)
                    </label>
                    <div className="grid grid-cols-2 gap-2 text-xs font-sans">
                      {MACHINE_OPTIONS.map((item, id) => (
                        <button
                          id={`machine-option-${id}`}
                          type="button"
                          key={id}
                          onClick={() => toggleMachine(item)}
                          className={`flex items-center space-x-1.5 py-1 px-2.5 rounded transition-colors text-left border cursor-pointer ${
                            selectedMachines.includes(item)
                              ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                              : 'border-slate-700/80 bg-slate-900/20 text-gray-400 hover:border-slate-600'
                          }`}
                        >
                          <span className="text-xs">{item}</span>
                        </button>
                      ))}
                    </div>

                    {/* Hand-written custom machine entry box */}
                    <div className="mt-3.5 pt-3 border-t border-slate-700/60">
                      <label className="block text-[11px] font-medium text-gray-400 mb-1">
                        Бусад машин механизм нэмэх (Гараар бичих)
                      </label>
                      <div className="flex space-x-2">
                        <input
                          id="custom-machine-reg-input"
                          type="text"
                          placeholder=""
                          value={customRegMachine}
                          onChange={(e) => setCustomRegMachine(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const trimmed = customRegMachine.trim();
                              if (trimmed) {
                                if (!selectedMachines.includes(trimmed)) {
                                  setSelectedMachines([...selectedMachines, trimmed]);
                                }
                                setCustomRegMachine('');
                              }
                            }
                          }}
                          className="flex-1 px-2.5 py-1.5 border border-slate-700 bg-slate-900/50 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-slate-500 font-sans"
                        />
                        <button
                          id="add-custom-machine-reg-btn"
                          type="button"
                          onClick={() => {
                            const trimmed = customRegMachine.trim();
                            if (trimmed) {
                              if (!selectedMachines.includes(trimmed)) {
                                setSelectedMachines([...selectedMachines, trimmed]);
                              }
                              setCustomRegMachine('');
                            }
                          }}
                          className="px-3 bg-slate-800 border border-slate-700 hover:bg-slate-705 text-emerald-400 rounded text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Нэмэх
                        </button>
                      </div>
                    </div>

                    {/* Selected machines not in standard MACHINE_OPTIONS */}
                    {selectedMachines.some(m => !MACHINE_OPTIONS.includes(m)) && (
                      <div className="mt-2.5 space-y-1">
                        <span className="text-[10px] text-gray-400 block font-sans">Нэмэлтээр оруулсан хүнд техникүүд:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedMachines.filter(m => !MACHINE_OPTIONS.includes(m)).map((item, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center space-x-1.5 py-1 px-2 rounded-md bg-emerald-500/10 border border-emerald-550/40 text-emerald-300 text-[10.5px]"
                            >
                              <span>{item}</span>
                              <button
                                type="button"
                                onClick={() => toggleMachine(item)}
                                className="text-gray-400 hover:text-rose-400 font-bold ml-1 text-xs cursor-pointer focus:outline-none"
                                title="Устгах"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Form Validation Warnings (when register button is disabled) */}
              {!((firstName.trim() !== '' && lastName.trim() !== '') && (email.trim() === '' || email.includes('@')) && phone.trim() !== '' && phone.trim().length >= 8 && address.trim() !== '' && regPassword.length >= 8 && /[!@#$%^&*(),.?":{}|<>_\-+=]/.test(regPassword) && regPassword === regConfirmPassword && isAgreedToTerms) && (
                <div className="mt-4 p-3.5 bg-rose-500/5 border border-rose-500/25 text-rose-300 rounded-lg text-xs space-y-1.5 font-sans animate-fade-in leading-relaxed">
                  <div className="flex items-center space-x-1.5 font-bold text-rose-400 mb-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Бүртгүүлэхийн тулд дараах мэдээллүүдийг гүйцээнэ үү:</span>
                  </div>
                  <ul className="list-disc pl-4.5 space-y-1 text-[10.5px] text-gray-400">
                    {lastName.trim() === '' && <li>Овгоо оруулна уу.</li>}
                    {firstName.trim() === '' && <li>Нэрээ оруулна уу.</li>}
                    {email.trim() !== '' && !email.includes('@') && <li>Зөв имэйл хаяг оруулна уу.</li>}
                    {phone.trim() === '' && <li>Утасны дугаараа оруулна уу.</li>}
                    {phone.trim() !== '' && phone.trim().length < 8 && <li>Утасны дугаар дор хаяж 8 оронтой байх ёстой.</li>}
                    {address.trim() === '' && <li>Гэрийн/Байгууллагын хаягаа оруулна уу.</li>}
                    {regPassword === '' && <li>Нэвтрэх нууц кодоо оруулна уу.</li>}
                    {regPassword !== '' && regPassword.length < 8 && <li>Нууц код хамгийн багадаа 8 тэмдэгт байх шаардлагатай.</li>}
                    {regPassword !== '' && !/[!@#$%^&*(),.?":{}|<>_\-+=]/.test(regPassword) && <li>Нууц код дор хаяж нэг тусгай тэмдэгт (!@#$%^&* гэх мэт) агуулсан байх шаардлагатай.</li>}
                    {regConfirmPassword === '' && <li>Нууц кодоо давтан оруулна уу.</li>}
                    {regPassword !== '' && regConfirmPassword !== '' && regPassword !== regConfirmPassword && <li>Хоёр нууц код хоорондоо тохирохгүй байна.</li>}
                    {!isAgreedToTerms && <li>Үйлчилгээний нөхцөл болон Нууцлалын бодлогыг хүлээн зөвшөөрөх шаардлагатай.</li>}
                  </ul>
                </div>
              )}

              {/* Terms and Privacy Policy Consent checkbox */}
              <div className="flex items-start space-x-2.5 bg-slate-950/40 p-3.5 rounded-lg border border-slate-800/80 mt-4 animate-fade-in">
                <input 
                  id="agree-terms-checkbox"
                  type="checkbox"
                  checked={isAgreedToTerms}
                  onChange={(e) => setIsAgreedToTerms(e.target.checked)}
                  className="w-4.5 h-4.5 rounded text-emerald-505 bg-slate-950 border-slate-700 focus:ring-emerald-500 focus:ring-offset-slate-900 accent-emerald-500 shrink-0 mt-0.5 cursor-pointer"
                />
                <label htmlFor="agree-terms-checkbox" className="text-xs text-gray-400 leading-normal select-none font-sans">
                  Би энэхүү платформын{' '}
                  <button type="button" onClick={() => setShowTerms(true)} className="text-emerald-400 hover:text-emerald-355 underline font-semibold transition-colors cursor-pointer bg-transparent border-none p-0">Үйлчилгээний нөхцөл</button>
                  {' '}болон{' '}
                  <button type="button" onClick={() => setShowPrivacy(true)} className="text-cyan-400 hover:text-cyan-355 underline font-semibold transition-colors cursor-pointer bg-transparent border-none p-0">Нууцлалын бодлого</button>
                  -той бүрэн танилцаж, хүлээн зөвшөөрч байна.
                </label>
              </div>

              <div className="pt-3">
                <button
                  id="submit-register-btn"
                  type="submit"
                  disabled={isSubmitting || firstName.trim() === '' || lastName.trim() === '' || (email.trim() !== '' && !email.includes('@')) || phone.trim() === '' || phone.trim().length < 8 || address.trim() === '' || regPassword.length < 8 || !/[!@#$%^&*(),.?":{}|<>_\-+=]/.test(regPassword) || regPassword !== regConfirmPassword || !isAgreedToTerms}
                  className={`w-full flex justify-center py-2.5 px-4 border border-transparent rounded text-white font-medium text-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    !isSubmitting && firstName.trim() !== '' && lastName.trim() !== '' && (email.trim() === '' || email.includes('@')) && phone.trim() !== '' && phone.trim().length >= 8 && address.trim() !== '' && regPassword.length >= 8 && /[!@#$%^&*(),.?":{}|<>_\-+=]/.test(regPassword) && regPassword === regConfirmPassword && isAgreedToTerms
                      ? 'bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-950/20 glow-btn-emerald'
                      : 'bg-slate-700 text-gray-500 cursor-not-allowed opacity-50'
                  }`}
                >
                  {isSubmitting ? 'Бүртгэж байна...' : 'Бүртгүүлэх'}
                </button>
                {successMsg && (
                  <div className="mt-3.5 bg-emerald-500/10 border border-emerald-555/40 text-emerald-300 px-4 py-2.5 rounded-lg text-xs flex items-center justify-center space-x-2 animate-fade-in font-sans">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0"></span>
                    <span className="text-left">{successMsg}</span>
                  </div>
                )}
                {error && (
                  <div className="mt-3.5 bg-rose-500/10 border border-rose-555/40 text-rose-300 px-4 py-2.5 rounded-lg text-xs flex items-center justify-center text-center animate-fade-in font-sans">
                    <span>{error}</span>
                  </div>
                )}
              </div>
            </form>
          )}

        </div>
      </div>

      {/* ============================================================== */}
      {/* TERMS OF SERVICE MODAL */}
      {/* ============================================================== */}
      {showTerms && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in text-left">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl relative">
            {/* Header */}
            <div className="sticky top-0 bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center space-x-2.5">
                <FileText className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white font-sans">Үйлчилгээний нөхцөл (Terms of Service)</h3>
              </div>
              <button 
                onClick={() => setShowTerms(false)}
                className="text-gray-400 hover:text-white transition-colors cursor-pointer p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-6 space-y-5 text-xs text-gray-300 leading-relaxed font-sans">
              <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-xl space-y-1.5">
                <p className="font-bold text-emerald-400 text-sm">Хэрэглэгчийн аюулгүй байдлын баталгаа</p>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Энэхүү үйлчилгээний нөхцөл нь Монгол Улсын Иргэний хууль, Хэрэглэгчийн эрхийг хамгаалах тухай хууль болон бусад холбогдох хууль тогтоомжийн дагуу боловсруулагдсан болно.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white text-sm">1. Ерөнхий нөхцөл</h4>
                <p>1.1. Энэхүү платформ нь хүнд машин механизм, газар шорооны ажлын чиглэлээр ажиллаж буй жолооч, оператор болон ажил олгогч нарыг холбох, ажлын түүх, үнэлгээгээр баталгаажсан найдвартай хамтын ажиллагааг үүсгэх зорилготой.</p>
                <p>1.2. Хэрэглэгч системд бүртгүүлснээр энэхүү үйлчилгээний нөхцөлийг бүрэн хүлээн зөвшөөрсөнд тооцогдоно.</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white text-sm">2. Хэрэглэгчийн хариуцлага ба Үнэлгээний систем</h4>
                <p>2.1. Хэрэглэгч өөрийн бүртгэлийн мэдээлэл (нэр, утас, хаяг г.м)-ийн үнэн зөв байдлыг бүрэн хариуцна.</p>
                <p>2.2. Жолооч болон ажил олгогч нар ажлын гүйцэтгэлийн дараа нөгөө талдаа бодитой, үнэн зөв үнэлгээ өгөх үүрэгтэй.</p>
                <p className="text-amber-400 font-semibold">2.3. Ноцтой зөрчил (Архидан согтуурах, шалтгаангүй ажил хаях, техникт санаатайгаар хохирол учруулах, тохирсон цалин хөлсийг өгөхгүй хуурах зэрэг) гаргасан хэрэглэгчийн мэдээлэл системд Хар Дансанд (Blacklist) бүртгэгдэж, дахин үйлчилгээ авах эрх бүрэн хаагдана.</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white text-sm">3. Платформын хариуцлагын хязгаарлалт</h4>
                <p>3.1. Платформ нь мэдээлэл дамжуулах, зуучлах, баталгаажуулах үүргийг гүйцэтгэх бөгөөд талуудын хоорондох хөдөлмөрийн болон санхүүгийн шууд маргааныг хариуцахгүй. Гэвч маргаан гарсан тохиобдолд ажлын түүх болон үнэлгээний мэдээллээр дэмжлэг үзүүлнэ.</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white text-sm">4. Үйлчилгээний нөхцөлийн өөрчлөлт</h4>
                <p>4.1. Үйлчилгээний нөхцөл шинэчлэгдэх бүрт хэрэглэгчдэд нээлттэй мэдээлэгдэх бөгөөд үйлчилгээг үргэлжлүүлэн ашиглах нь шинэ нөхцөлийг зөвшөөрсөнд тооцогдоно.</p>
              </div>
            </div>
            
            {/* Footer */}
            <div className="border-t border-slate-800 px-6 py-4 flex justify-end bg-slate-950/40">
              <button 
                onClick={() => setShowTerms(false)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-5 py-2 rounded-xl transition-all cursor-pointer text-xs font-sans"
              >
                Ойлголоо, зөвшөөрөв
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* PRIVACY POLICY MODAL */}
      {/* ============================================================== */}
      {showPrivacy && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in text-left">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl relative">
            {/* Header */}
            <div className="sticky top-0 bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center space-x-2.5">
                <Lock className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white font-sans">Нууцлалын бодлого (Privacy Policy)</h3>
              </div>
              <button 
                onClick={() => setShowPrivacy(false)}
                className="text-gray-400 hover:text-white transition-colors cursor-pointer p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-6 space-y-5 text-xs text-gray-300 leading-relaxed font-sans">
              <div className="bg-cyan-500/5 border border-cyan-500/20 p-4 rounded-xl space-y-1.5">
                <p className="font-bold text-cyan-400 text-sm">Хувь хүний мэдээллийн аюулгүй байдал</p>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Энэхүү нууцлалын бодлого нь Монгол Улсын Хувь хүний мэдээлэл хамгаалах тухай хуульд бүрэн нийцсэн бөгөөд таны хувийн мэдээллийг цуглуулах, боловсруулах, хамгаалахад баримтлах үндсэн зарчмыг тодорхойлно.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white text-sm">1. Candy мэдээлэл цуглуулах</h4>
                <p>1.1. Бид хэрэглэгчийн үйлчилгээ авах зорилгоор оруулсан дараах мэдээллүүдийг цуглуулна: Овог нэр / Компанийн нэр, утасны дугаар, хаяг байршил, мэргэшсэн техникийн төрөл, ажлын түүх болон танилцуулга намтар (bio).</p>
                <p>1.2. Нэвтрэх нууц кодыг систем шифрлэн (encrypted) хадгалах бөгөөд ямар ч администратор, гуравдагч этгээд харах боломжгүйгээр хамгаалагдсан болно.</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white text-sm">2. Мэдээллийн ашиглалт ба Зорилго</h4>
                <p>2.1. Таны оруулсан мэдээллийг зөвхөн ажил олгогч болон операторыг холбох, үнэлгээ өгөх, системийн найдвартай ажиллагааг хангахад ашиглана.</p>
                <p className="text-emerald-400">2.2. Систем нь хэрэглэгчийн утасны дугаар болон бусад хувийн мэдээллийг зар сурталчилгаанд худалдах, бусдад зөвшөөрөлгүйгээр шилжүүлэхийг хатуу хориглоно.</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white text-sm">3. Хэрэглэгчийн эрх болон Профайл нууцлал</h4>
                <p>3.1. Хэрэглэгч өөрийн профайлыг бусдад харагдуулахгүй байх (isPublic тохиргоо) эрхтэй.</p>
                <p>3.2. Хэрэглэгч өөрийн мэдээллийг хэдийд ч засах, системээс өөрийн бүртгэлийг бүрэн устгах (Аюулгүй байдлын цэсээр) эрхтэй.</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white text-sm">4. Мэдээллийн аюулгүй байдал</h4>
                <p>4.1. Систем нь таны мэдээллийг хамгаалах сүүлийн үеийн SSL шифрлэлт болон аюулгүй байдлын стандартыг ашиглаж байна.</p>
              </div>
            </div>
            
            {/* Footer */}
            <div className="border-t border-slate-800 px-6 py-4 flex justify-end bg-slate-950/40">
              <button 
                onClick={() => setShowPrivacy(false)}
                className="bg-cyan-600 hover:bg-cyan-550 text-white font-semibold px-5 py-2 rounded-xl transition-all cursor-pointer text-xs font-sans"
              >
                Ойлголоо, хүлээн зөвшөөрөв
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
