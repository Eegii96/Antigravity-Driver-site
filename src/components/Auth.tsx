'use client';

import { FormEvent, ChangeEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User as UserIcon, Phone, Mail, MapPin, Truck, Check, Wrench, Key, AlertCircle, ArrowLeft, Sparkles, X, Eye, EyeOff } from 'lucide-react';
import { loginUser, registerUser, saveSingleUser } from '../lib/db';
import { User, UserType } from '../types';
import { optimizeBio } from '../lib/gemini';
import { db, auth } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { signInWithEmailAndPassword } from 'firebase/auth';
import TermsModal from './auth/TermsModal';
import PrivacyModal from './auth/PrivacyModal';
import RecoveryForm from './auth/RecoveryForm';
import { useAuthForm } from './auth/useAuthForm';
import { AVATAR_PRESETS, MACHINE_OPTIONS } from './auth/constants';

interface AuthProps {
  onSuccess: (user: User) => void;
  defaultIsLogin?: boolean;
}

export default function Auth({ onSuccess, defaultIsLogin }: AuthProps) {
  const router = useRouter();
  const form = useAuthForm(defaultIsLogin);
  const {
    isLogin, setIsLogin, userType, setUserType, email, setEmail, lastName, setLastName,
    firstName, setFirstName, companyName, setCompanyName, phone, setPhone, password, setPassword,
    address, setAddress, selectedAvatar, setSelectedAvatar, bio, setBio, experienceYears, setExperienceYears,
    selectedMachines, setSelectedMachines, customRegMachine, setCustomRegMachine,
    regPassword, setRegPassword, regConfirmPassword, setRegConfirmPassword,
    showRegPassword, setShowRegPassword, showRegConfirmPassword, setShowRegConfirmPassword,
    isForgotMode, setIsForgotMode, recoveryStep, setRecoveryStep, forgotInput, setForgotInput,
    securityQ1, setSecurityQ1, securityQ2, setSecurityQ2, securityA1Input, setSecurityA1Input,
    securityA2Input, setSecurityA2Input, matchedUserObj, setMatchedUserObj,
    forgotNewPassword, setForgotNewPassword, forgotConfirmNewPassword, setForgotConfirmNewPassword,
    showForgotNewPassword, setShowForgotNewPassword, showForgotConfirmNewPassword, setShowForgotConfirmNewPassword,
    showLoginPassword, setShowLoginPassword, showTerms, setShowTerms, showPrivacy, setShowPrivacy,
    isAgreedToTerms, setIsAgreedToTerms, error, setError, successMsg, setSuccessMsg,
    isOptimizing, setIsOptimizing, hasOptimized, setHasOptimized, originalBio, setOriginalBio,
    isSubmitting, setIsSubmitting,
  } = form;

  useEffect(() => {
    if (showTerms || showPrivacy) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [showTerms, showPrivacy]);

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

      setSecurityQ1(matched.securityQuestion1 || '');
      setSecurityQ2(matched.securityQuestion2 || '');
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
    <div className="flex-grow bg-[var(--bg)] relative overflow-hidden flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      {/* Back to Homepage Button */}
      <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-20">
        <button
          onClick={() => router.push('/')}
          className="text-[var(--muted-foreground)] hover:text-[var(--fg)] text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer bg-[var(--card)] border border-[var(--color-glass-border)] px-3.5 py-2 rounded-md"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Нүүр хуудас</span>
        </button>
      </div>

      {/* Ambient background glow blobs */}

      <div className="sm:mx-auto sm:w-full sm:max-w-xl relative z-10 text-center">
        {/* Premium Custom Excavator SVG Icon */}
        <div className="flex justify-center mb-3">
          <div className="w-24 h-24 rounded-md bg-[var(--bg2)] border-2 border-[var(--accent)] flex items-center justify-center relative overflow-hidden group hover:border-[var(--accent)] transition-all duration-500 shadow-md ">
            <img className="w-full h-full object-cover" src="/logo.jpg" alt="Logo" />
          </div>
        </div>

        <h2 className="mt-4 text-center text-3xl font-black tracking-tight text-[var(--fg)] font-sans">
          Хүнд машин, механизм & Газар шорооны ажлын сайт
        </h2>
        <p className="mt-2.5 text-center text-sm text-[var(--muted-foreground)] font-sans tracking-wide max-w-md mx-auto leading-relaxed">
          Үнэлгээ өгөх, ажлын түүх үүсгэх системээр хариуцлагатай жолооч, оператор болон найдвартай ажил олгогчдыг үүсгэх платформ
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl relative z-10">
        <div className="panel py-8 px-4 shadow-md rounded-md sm:px-10 border border-[var(--color-glass-border)]">
          {/* Alerts are now rendered locally below form action buttons for optimal mobile UX */}

          {/* Tab buttons for Login / Register */}
          {!isForgotMode && (
            <div className="flex border-b border-[var(--border)] mb-6 pb-1">
              <button
                id="switch-login-tab"
                onClick={() => {
                  setIsLogin(true);
                  setError('');
                  setSuccessMsg('');
                }}
                className={`flex-1 text-center py-2.5 font-medium text-sm transition-all border-b-2 cursor-pointer ${isLogin
                    ? 'text-[var(--accent-soft-foreground)] border-[var(--accent)] font-semibold'
                    : 'text-[var(--muted-foreground)] border-transparent hover:text-[var(--fg)]'
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
                className={`flex-1 text-center py-2.5 font-medium text-sm transition-all border-b-2 cursor-pointer ${!isLogin
                    ? 'text-[var(--accent-soft-foreground)] border-[var(--accent)] font-semibold'
                    : 'text-[var(--muted-foreground)] border-transparent hover:text-[var(--fg)]'
                  }`}
              >
                Бүртгүүлэх хэсэг
              </button>
            </div>
          )}

          {isLogin ? (
            isForgotMode ? (
              /* PASSWORD RECOVERY FORM IN LOGIN */
              <RecoveryForm
                form={form}
                onVerifyAccount={handleVerifyAccount}
                onResetPassword={handleForgotPasswordSubmit}
              />
            ) : (
              /* LOGIN FORM */
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1" htmlFor="login-email">
                    Имэйл хаяг эсвэл Утасны дугаар
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4.5 w-4.5 text-[var(--muted-foreground)]" />
                    </div>
                    <input
                      id="login-email"
                      type="text"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder=""
                      className="block w-full pl-10 pr-3 py-2.5 input text-sm text-[var(--accent-foreground)] placeholder-[var(--muted-foreground)] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1" htmlFor="login-password">
                    Нууц код
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none font-sans text-[var(--muted-foreground)] font-extrabold text-xs">
                      ***
                    </div>
                    <input
                      id="login-password"
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder=""
                      className="block w-full pl-10 pr-10 py-2.5 input text-sm text-[var(--accent-foreground)] placeholder-[var(--muted-foreground)] focus:outline-none"
                    />
                    <span
                      id="toggle-login-pass-visibility"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--muted-foreground)] hover:text-[var(--accent-foreground)] cursor-pointer"
                    >
                      {showLoginPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </span>
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
                    className="text-xs text-[var(--muted-foreground)] hover:text-[var(--accent-soft-foreground)] transition-colors underline cursor-pointer font-sans"
                  >
                    Нууц үг сэргээх холбоос
                  </button>
                </div>

                <div className="pt-2">
                  <button
                    id="submit-login-btn"
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg bg-[var(--accent)] hover:brightness-95 text-[var(--accent-foreground)] font-semibold text-sm transition-all shadow-lg  cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Нэвтэрч байна...' : 'Нэвтрэх'}
                  </button>
                  {successMsg && (
                    <div className="mt-3.5 bg-[var(--accent-soft)] border border-[var(--accent)] text-[var(--accent-soft-foreground)] px-4 py-2.5 rounded-lg text-xs flex items-center justify-center space-x-2 animate-fade-in font-sans">
                      <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-ping shrink-0"></span>
                      <span className="text-left">{successMsg}</span>
                    </div>
                  )}
                  {error && (
                    <div className="mt-3.5 bg-red-500/10 border border-red-500/40 text-red-300 px-4 py-2.5 rounded-lg text-xs flex items-center justify-center text-center animate-fade-in font-sans">
                      <span>{error}</span>
                    </div>
                  )}
                  <p className="mt-3 text-[10.5px] text-[var(--muted-foreground)] text-center font-sans">
                    Та нэвтэрснээр манай{' '}
                    <button type="button" onClick={() => setShowTerms(true)} className="text-[var(--accent-soft-foreground)] hover:text-[var(--accent-soft-foreground)] underline transition-colors cursor-pointer bg-transparent border-none p-0 font-medium">Үйлчилгээний нөхцөл</button>
                    {' '}болон{' '}
                    <button type="button" onClick={() => setShowPrivacy(true)} className="text-[var(--verify)] hover:text-[var(--verify)] underline transition-colors cursor-pointer bg-transparent border-none p-0 font-medium">Нууцлалын бодлого</button>
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
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-2">Хэрэглэгчийн тохиргоо сонгох</label>
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
                    className={`flex items-center justify-center space-x-2 py-2.5 px-3 border rounded text-xs transition-colors cursor-pointer ${userType === 'operator'
                        ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-soft-foreground)] font-semibold'
                        : 'border-[var(--border)] hover:border-[var(--border)] text-[var(--muted-foreground)]'
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
                    className={`flex items-center justify-center space-x-2 py-2.5 px-3 border rounded text-xs transition-colors cursor-pointer ${userType === 'employer'
                        ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-soft-foreground)] font-semibold'
                        : 'border-[var(--border)] hover:border-[var(--border)] text-[var(--muted-foreground)]'
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
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1" htmlFor="reg-lastname">
                    Овог
                  </label>
                  <input
                    id="reg-lastname"
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder=""
                    className="block w-full px-3 py-1.5 input text-xs text-[var(--accent-foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] font-sans"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1" htmlFor="reg-firstname">
                    Нэр
                  </label>
                  <input
                    id="reg-firstname"
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder=""
                    className="block w-full px-3 py-1.5 input text-xs text-[var(--accent-foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] font-sans"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userType === 'employer' ? (
                  <div>
                    <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1" htmlFor="reg-companyname">
                      Компанийн нэр (Заавал биш)
                    </label>
                    <input
                      id="reg-companyname"
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder=""
                      className="block w-full px-3 py-1.5 input text-xs text-[var(--accent-foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] font-sans"
                    />
                  </div>
                ) : null}
                <div className={userType === 'employer' ? '' : 'md:col-span-2'}>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1" htmlFor="reg-email">
                    Имэйл хаяг (Заавал биш)
                  </label>
                  <input
                    id="reg-email"
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder=""
                    className="block w-full px-3 py-1.5 input text-xs text-[var(--accent-foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] font-sans"
                  />
                </div>
              </div>

              {/* Phone field */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1" htmlFor="reg-phone">
                    Утасны дугаар
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-4 w-4 text-[var(--muted-foreground)]" />
                    </div>
                    <input
                      id="reg-phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder=""
                      className="block w-full pl-9 pr-3 py-1.5 input text-xs text-[var(--accent-foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1" htmlFor="reg-address">
                    Гэрийн/Байгууллагын хаяг
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-4 w-4 text-[var(--muted-foreground)]" />
                    </div>
                    <input
                      id="reg-address"
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder=""
                      className="block w-full pl-9 pr-3 py-1.5 input text-xs text-[var(--accent-foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1" htmlFor="reg-password">
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
                      className="block w-full pl-3 pr-10 py-1.5 input text-xs text-[var(--accent-foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] font-sans"
                    />
                    <span
                      id="toggle-reg-pass-visibility"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--muted-foreground)] hover:text-[var(--accent-foreground)] cursor-pointer"
                    >
                      {showRegPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </span>
                  </div>
                  {regPassword !== '' && regPassword.length < 8 && (
                    <p className="text-[10px] text-red-400 mt-1 font-sans flex items-center space-x-1">
                      <span className="font-bold">✗</span>
                      <span>Нууц үг хамгийн багадаа 8 тэмдэгт байх шаардлагатай! (Одоо: {regPassword.length})</span>
                    </p>
                  )}
                  {regPassword !== '' && regPassword.length >= 8 && !/[!@#$%^&*(),.?":{}|<>_\-+=]/.test(regPassword) && (
                    <p className="text-[10px] text-red-400 mt-1 font-sans flex items-center space-x-1">
                      <span className="font-bold">✗</span>
                      <span>Нууц үгэнд дор хаяж нэг тусгай тэмдэгт (!@#$%^&* гэх мэт) орох шаардлагатай!</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1" htmlFor="reg-confirm-password">
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
                      className="block w-full pl-3 pr-10 py-1.5 input text-xs text-[var(--accent-foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] font-sans"
                    />
                    <span
                      id="toggle-reg-confirm-pass-visibility"
                      onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--muted-foreground)] hover:text-[var(--fg)] cursor-pointer"
                    >
                      {showRegConfirmPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </span>
                  </div>
                  {regConfirmPassword !== '' && regPassword !== regConfirmPassword && (
                    <p className="text-[10px] text-red-400 mt-1 font-sans flex items-center space-x-1">
                      <span className="font-bold">✗</span>
                      <span>Давтан оруулсан нууц үг тохирохгүй байна!</span>
                    </p>
                  )}
                </div>

                {/* Live Password Checklist */}
                <div className="bg-[var(--color-glass-bg)] p-3 rounded-lg border border-[var(--color-glass-border)] space-y-1.5 font-sans">
                  <span className="text-[10px] font-semibold text-[var(--muted-foreground)] block mb-1">Нууц үгэнд тавих шаардлага:</span>

                  {/* Rule 1: Min length 8 */}
                  <div className="flex items-center space-x-2 text-[10.5px]">
                    <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 border ${regPassword.length >= 8
                        ? 'bg-[var(--accent-soft)] text-[var(--accent-soft-foreground)] border-[var(--accent)]'
                        : 'bg-red-500/10 text-red-400 border-red-500/30'
                      }`}>
                      {regPassword.length >= 8 ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
                    </div>
                    <span className={regPassword.length >= 8 ? 'text-[var(--accent-soft-foreground)] font-medium' : 'text-[var(--muted-foreground)]'}>
                      Хамгийн багадаа 8 тэмдэгт (Одоогийн урт: {regPassword.length})
                    </span>
                  </div>

                  {/* Rule 2: Special character */}
                  <div className="flex items-center space-x-2 text-[10.5px]">
                    <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 border ${/[!@#$%^&*(),.?":{}|<>_\-+=]/.test(regPassword)
                        ? 'bg-[var(--accent-soft)] text-[var(--accent-soft-foreground)] border-[var(--accent)]'
                        : 'bg-red-500/10 text-red-400 border-red-500/30'
                      }`}>
                      {/[!@#$%^&*(),.?":{}|<>_\-+=]/.test(regPassword) ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
                    </div>
                    <span className={/[!@#$%^&*(),.?":{}|<>_\-+=]/.test(regPassword) ? 'text-[var(--accent-soft-foreground)] font-medium' : 'text-[var(--muted-foreground)]'}>
                      Дор хаяж нэг тусгай тэмдэгт (!@#$%^&* гэх мэт)
                    </span>
                  </div>

                  {/* Rule 3: Passwords match */}
                  <div className="flex items-center space-x-2 text-[10.5px]">
                    <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 border ${(regPassword === regConfirmPassword && regConfirmPassword !== '')
                        ? 'bg-[var(--accent-soft)] text-[var(--accent-soft-foreground)] border-[var(--accent)]'
                        : 'bg-red-500/10 text-red-400 border-red-500/30'
                      }`}>
                      {(regPassword === regConfirmPassword && regConfirmPassword !== '') ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
                    </div>
                    <span className={(regPassword === regConfirmPassword && regConfirmPassword !== '') ? 'text-[var(--accent-soft-foreground)] font-medium' : 'text-[var(--muted-foreground)]'}>
                      Хоёр нууц үг хоорондоо тохирох
                    </span>
                  </div>
                </div>
              </div>

              {/* Avatar Picker */}
              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1.5 font-sans">Профайл зураг сонгох</label>
                <div className="flex items-center space-x-6">
                  <div className="flex space-x-3 items-center">
                    {AVATAR_PRESETS.map((avatar, idx) => (
                      <button
                        id={`preset-avatar-${idx}`}
                        key={idx}
                        type="button"
                        onClick={() => { setSelectedAvatar(avatar); }}
                        className={`relative rounded-full overflow-hidden w-12 h-12 border-2 transition-colors cursor-pointer ${selectedAvatar === avatar ? 'border-[var(--accent)]' : 'border-transparent'
                          }`}
                      >
                        <img src={avatar} alt={`Avatar Preset ${idx + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        {selectedAvatar === avatar && (
                          <div className="absolute inset-0 bg-[var(--accent-soft)] flex items-center justify-center">
                            <Check className="w-4 h-4 text-[var(--accent-soft-foreground)]" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="border-l border-[var(--border)] pl-4 py-1.5 flex flex-col justify-center">
                    <label className="text-xs text-[var(--accent-soft-foreground)] hover:text-[var(--accent-soft-foreground)] underline cursor-pointer font-sans inline-flex items-center space-x-1">
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
                        <img src={selectedAvatar} alt="Custom upload" className="w-7 h-7 rounded-full object-cover border border-[var(--accent)]" referrerPolicy="no-referrer" />
                        <span className="text-[10px] text-[var(--accent-soft-foreground)]">Зургийг сонголоо!</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-medium text-[var(--muted-foreground)]" htmlFor="reg-bio">
                    Нэмэлт Мэдээлэл / Био (Туршлага, ажлын чиглэл, товч танилцуулга г.м)
                  </label>
                  <button
                    type="button"
                    onClick={handleOptimizeBio}
                    disabled={isOptimizing}
                    className="text-[10px] text-[var(--accent-soft-foreground)] hover:text-[var(--accent-soft-foreground)] flex items-center space-x-1 border border-[var(--accent)] bg-[var(--accent-soft)] px-2.5 py-0.5 rounded cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-sans"
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
                  className="block w-full px-3 py-2.5 input text-xs text-[var(--accent-foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] font-sans min-h-[140px] leading-relaxed"
                />
              </div>

              {/* Operator specific fields */}
              {userType === 'operator' && (
                <div className="border-t border-[var(--border)] pt-4 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1" htmlFor="reg-experience">
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
                      className="block w-[100px] px-3 py-1.5 input text-xs text-[var(--accent-foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1.5">
                      Мэргэшсэн Хүнд Машин Механизмууд (Сонгоно уу)
                    </label>
                    <div className="grid grid-cols-2 gap-2 text-xs font-sans">
                      {MACHINE_OPTIONS.map((item, id) => (
                        <button
                          id={`machine-option-${id}`}
                          type="button"
                          key={id}
                          onClick={() => toggleMachine(item)}
                          className={`flex items-center space-x-1.5 py-1 px-2.5 rounded transition-colors text-left border cursor-pointer ${selectedMachines.includes(item)
                              ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-soft-foreground)]'
                              : 'border-[var(--color-glass-border)] bg-[var(--color-glass-bg)] text-[var(--muted-foreground)] hover:border-[var(--border)]'
                            }`}
                        >
                          <span className="text-xs">{item}</span>
                        </button>
                      ))}
                    </div>

                    {/* Hand-written custom machine entry box */}
                    <div className="mt-3.5 pt-3 border-t border-[var(--border)]">
                      <label className="block text-[11px] font-medium text-[var(--muted-foreground)] mb-1">
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
                          className="flex-1 px-2.5 py-1.5 input text-xs text-[var(--accent-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] placeholder-[var(--muted-foreground)] font-sans"
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
                          className="px-3 bg-[var(--color-glass-bg)] border border-[var(--color-glass-border)] hover:bg-[var(--bg2)] text-[var(--accent-soft-foreground)] rounded text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Нэмэх
                        </button>
                      </div>
                    </div>

                    {/* Selected machines not in standard MACHINE_OPTIONS */}
                    {selectedMachines.some(m => !MACHINE_OPTIONS.includes(m)) && (
                      <div className="mt-2.5 space-y-1">
                        <span className="text-[10px] text-[var(--muted-foreground)] block font-sans">Нэмэлтээр оруулсан хүнд техникүүд:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedMachines.filter(m => !MACHINE_OPTIONS.includes(m)).map((item, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center space-x-1.5 py-1 px-2 rounded-md bg-[var(--accent-soft)] border border-[var(--accent)] text-[var(--accent-soft-foreground)] text-[10.5px]"
                            >
                              <span>{item}</span>
                              <button
                                type="button"
                                onClick={() => toggleMachine(item)}
                                className="text-[var(--muted-foreground)] hover:text-red-400 font-bold ml-1 text-xs cursor-pointer focus:outline-none"
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
                <div className="mt-4 p-3.5 bg-red-500/5 border border-red-500/25 text-red-300 rounded-lg text-xs space-y-1.5 font-sans animate-fade-in leading-relaxed">
                  <div className="flex items-center space-x-1.5 font-bold text-red-400 mb-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Бүртгүүлэхийн тулд дараах мэдээллүүдийг гүйцээнэ үү:</span>
                  </div>
                  <ul className="list-disc pl-4.5 space-y-1 text-[10.5px] text-[var(--muted-foreground)]">
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
              <div className="flex items-start space-x-2.5 bg-[var(--color-glass-bg)] p-3.5 rounded-lg border border-[var(--color-glass-border)] mt-4 animate-fade-in">
                <input
                  id="agree-terms-checkbox"
                  type="checkbox"
                  checked={isAgreedToTerms}
                  onChange={(e) => setIsAgreedToTerms(e.target.checked)}
                  className="w-4.5 h-4.5 rounded text-[var(--accent-soft-foreground)] bg-[var(--color-glass-bg)] border-[var(--color-glass-border)] focus:ring-[var(--accent)] focus:ring-offset-[var(--card)] accent-[var(--accent)] shrink-0 mt-0.5 cursor-pointer"
                />
                <label htmlFor="agree-terms-checkbox" className="text-xs text-[var(--muted-foreground)] leading-normal select-none font-sans">
                  Би энэхүү платформын{' '}
                  <button type="button" onClick={() => setShowTerms(true)} className="text-[var(--accent-soft-foreground)] hover:text-[var(--accent-soft-foreground)] underline font-semibold transition-colors cursor-pointer bg-transparent border-none p-0">Үйлчилгээний нөхцөл</button>
                  {' '}болон{' '}
                  <button type="button" onClick={() => setShowPrivacy(true)} className="text-[var(--verify)] hover:text-[var(--verify)] underline font-semibold transition-colors cursor-pointer bg-transparent border-none p-0">Нууцлалын бодлого</button>
                  -той бүрэн танилцаж, хүлээн зөвшөөрч байна.
                </label>
              </div>

              <div className="pt-3">
                <button
                  id="submit-register-btn"
                  type="submit"
                  disabled={isSubmitting || firstName.trim() === '' || lastName.trim() === '' || (email.trim() !== '' && !email.includes('@')) || phone.trim() === '' || phone.trim().length < 8 || address.trim() === '' || regPassword.length < 8 || !/[!@#$%^&*(),.?":{}|<>_\-+=]/.test(regPassword) || regPassword !== regConfirmPassword || !isAgreedToTerms}
                  className={`w-full flex justify-center py-2.5 px-4 border border-transparent rounded text-[var(--accent-foreground)] font-medium text-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${!isSubmitting && firstName.trim() !== '' && lastName.trim() !== '' && (email.trim() === '' || email.includes('@')) && phone.trim() !== '' && phone.trim().length >= 8 && address.trim() !== '' && regPassword.length >= 8 && /[!@#$%^&*(),.?":{}|<>_\-+=]/.test(regPassword) && regPassword === regConfirmPassword && isAgreedToTerms
                      ? 'bg-[var(--accent)] hover:brightness-95 shadow-lg '
                      : 'bg-[var(--bg2)] text-[var(--muted-foreground)] cursor-not-allowed opacity-50'
                    }`}
                >
                  {isSubmitting ? 'Бүртгэж байна...' : 'Бүртгүүлэх'}
                </button>
                {successMsg && (
                  <div className="mt-3.5 bg-[var(--accent-soft)] border border-[var(--accent)] text-[var(--accent-soft-foreground)] px-4 py-2.5 rounded-lg text-xs flex items-center justify-center space-x-2 animate-fade-in font-sans">
                    <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-ping shrink-0"></span>
                    <span className="text-left">{successMsg}</span>
                  </div>
                )}
                {error && (
                  <div className="mt-3.5 bg-red-500/10 border border-red-500/40 text-red-300 px-4 py-2.5 rounded-lg text-xs flex items-center justify-center text-center animate-fade-in font-sans">
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
      {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}

      {showPrivacy && <PrivacyModal onClose={() => setShowPrivacy(false)} />}
    </div>
  );
}
