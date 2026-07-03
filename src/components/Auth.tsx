'use client';

import { FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { loginUser, registerUser } from '../lib/db';
import { User } from '../types';
import { optimizeBio } from '../lib/gemini';
import { trackSignUpStarted, trackSignUpCompleted } from '../lib/analytics';
import { getFunctions, httpsCallable } from 'firebase/functions';
import TermsModal from './auth/TermsModal';
import PrivacyModal from './auth/PrivacyModal';
import RecoveryForm from './auth/RecoveryForm';
import LoginForm from './auth/LoginForm';
import RegisterForm from './auth/RegisterForm';
import { useAuthForm } from './auth/useAuthForm';

interface AuthProps {
  onSuccess: (user: User) => void;
  defaultIsLogin?: boolean;
}

export default function Auth({ onSuccess, defaultIsLogin }: AuthProps) {
  const router = useRouter();
  const form = useAuthForm(defaultIsLogin);
  const {
    isLogin, setIsLogin,
    isForgotMode, setIsForgotMode,
    setRecoveryStep,
    forgotInput, setForgotInput,
    setSecurityQ1,
    setSecurityQ2,
    securityA1Input, setSecurityA1Input,
    securityA2Input, setSecurityA2Input,
    matchedUserObj, setMatchedUserObj,
    forgotNewPassword, forgotConfirmNewPassword,
    setForgotNewPassword, setForgotConfirmNewPassword,
    email, password,
    lastName, firstName, companyName, phone, address,
    selectedAvatar,
    bio, setBio, originalBio, setOriginalBio,
    experienceYears,
    selectedMachines,
    regPassword, regConfirmPassword,
    isAgreedToTerms,
    userType,
    setError, setSuccessMsg, setIsSubmitting,
    setIsOptimizing, setHasOptimized,
    showTerms, setShowTerms,
    showPrivacy, setShowPrivacy,
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
    if (!originalBio) setOriginalBio(bio);
    const computedFullName = lastName.trim() ? lastName.trim() + ' ' + firstName.trim() : firstName.trim();
    try {
      const optimized = await optimizeBio({
        fullName: computedFullName,
        experienceYears: userType === 'operator' ? (experienceYears === '' ? 0 : experienceYears) : 0,
        machineTypes: userType === 'operator' ? selectedMachines : [],
        rawBio: rawToOptimize,
        currentBio: bio,
        userType: userType,
      });
      setBio(optimized);
      setHasOptimized(true);
    } catch (err: unknown) {
      console.error(err);
      setError('AI намтар сайжруулахад алдаа гарлаа. Та дахин оролдоно уу.');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) { setError('Имэйл хаягийг оруулна уу.'); return; }
    if (!password) { setError('Нууц кодыг оруулна уу.'); return; }

    setError('');
    setSuccessMsg('Нэвтэрч байна, түр хүлээнэ үү...');
    setIsSubmitting(true);

    try {
      let user;
      if (email.includes('@')) {
        user = await loginUser(email.trim().toLowerCase(), '', password);
      } else {
        user = await loginUser('', email, password);
      }
      if (user) {
        setSuccessMsg('Амжилттай нэвтэрлээ!');
        setTimeout(() => { onSuccess(user); }, 1000);
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
    if (!isAgreedToTerms) { setError('Үйлчилгээний нөхцлийг зөвшөөрнө үү.'); return; }
    // Address is no longer required — a mandatory home/office address was
    // pure friction for a marketplace where contact happens by phone, and it
    // was costing signups (audit C3). Special-character password composition
    // rules are dropped too: NIST 800-63B recommends against them (they push
    // users toward predictable substitutions without adding real entropy),
    // and this audience skews toward users who'd abandon over it. Length
    // (>=8) is what actually matters.
    if (!firstName.trim() || !lastName.trim() || !phone) {
      setError('Шаардлагатай мэдээллүүдийг бүрэн бөглөнө үү.');
      return;
    }
    if (!regPassword) { setError('Нэвтрэх нууц кодыг оруулна уу.'); return; }
    if (regPassword.length < 8) {
      setError('Нууц үг шаардлага хангахгүй байна: Нууц үгийн урт хамгийн багадаа 8 тэмдэгт байх ёстой.');
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
      trackSignUpStarted(userType);

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
        password: regPassword,
      }, (status) => {
        setSuccessMsg(status);
      });

      trackSignUpCompleted(userType);
      setSuccessMsg('Бүртгэл амжилттай үүслээ! Тавтай морилно уу. 🚀');
      setTimeout(() => { onSuccess(newUser); }, 1500);
    } catch (err: unknown) {
      console.error(err);
      setError('Бүртгэл үүсгэхэд алдаа гарлаа: ' + (err instanceof Error ? err.message : 'Дахин оролдоно уу.'));
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
    if (!inputVal) { setError('Имэйл хаяг эсвэл Утасны дугаарыг оруулна уу.'); return; }

    setSuccessMsg('Бүртгэлийг шалгаж байна...');
    setIsSubmitting(true);

    try {
      // Resolve the account server-side (Admin SDK) — the users collection now requires
      // auth to read, so this lookup can no longer happen directly from the client.
      const functions = getFunctions();
      const resolveFn = httpsCallable(functions, 'resolveAccountForRecovery');
      const result = await resolveFn(
        inputVal.includes('@')
          ? { email: inputVal.toLowerCase() }
          : { phone: inputVal }
      );
      const matched = result.data as { userId: string; securityQuestion1: string; securityQuestion2: string };

      setSecurityQ1(matched.securityQuestion1);
      setSecurityQ2(matched.securityQuestion2);
      setMatchedUserObj({ id: matched.userId });
      setRecoveryStep(2);
      setSuccessMsg('Аюулгүй байдлын асуултууд амжилттай ачаалагдлаа.');
      setTimeout(() => { setSuccessMsg(''); }, 1500);
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : String(err);
      setError(message.replace(/^\w+\/[\w-]+:\s*/, '') || 'Алдаа гарлаа. Дахин оролдоно уу.');
      setSuccessMsg('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!matchedUserObj) { setError('Сэргээх үйлдэл хүчингүй байна.'); return; }

    const ans1 = securityA1Input.trim().toLowerCase();
    const ans2 = securityA2Input.trim().toLowerCase();
    const newPass = forgotNewPassword;
    const confirmPass = forgotConfirmNewPassword;

    if (!ans1 || !ans2) { setError('Аюулгүй байдлын асуултуудын хариултыг оруулна уу.'); return; }
    if (!newPass) { setError('Шинэ нууц код оруулна уу.'); return; }
    if (newPass.length < 8) { setError('Нууц код хамгийн багадаа 8 тэмдэгт байх шаардлагатай.'); return; }
    if (!/[!@#$%^&*(),.?":{}|<>_\-+=]/.test(newPass)) {
      setError('Нууц код дор хаяж нэг тусгай тэмдэгт (!@#$%^&* гэх мэт) агуулсан байх шаардлагатай.');
      return;
    }
    if (newPass !== confirmPass) { setError('Хоёр нууц код хоорондоо тохирохгүй байна.'); return; }

    // Security answers are verified server-side (Admin SDK) inside resetPasswordWithAnswers below.

    setSuccessMsg('Нууц кодыг шинэчилж байна...');
    setIsSubmitting(true);

    try {
      const functions = getFunctions();
      const resetFn = httpsCallable(functions, 'resetPasswordWithAnswers');
      await resetFn({
        userId: matchedUserObj.id,
        answer1: securityA1Input,
        answer2: securityA2Input,
        newPassword: newPass,
      });

      setSuccessMsg('Нууц код амжилттай сэргээгдлээ! Та шинэ нууц кодоор нэвтэрнэ үү. 🔑');

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
    } catch (err: unknown) {
      console.error(err);
      setError('Нууц код сэргээхэд алдаа гарлаа: ' + (err instanceof Error ? err.message : String(err)));
      setSuccessMsg('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-grow bg-[var(--bg)] relative overflow-hidden flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      {/* Back to Homepage */}
      <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-20">
        <button
          onClick={() => router.push('/')}
          className="text-[var(--muted-foreground)] hover:text-[var(--fg)] text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer bg-[var(--card)] border border-[var(--border)] px-3.5 py-2 rounded-md"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Нүүр хуудас</span>
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-xl relative z-10 text-center">
        <div className="flex justify-center mb-3">
          <div className="w-24 h-24 rounded-md bg-[var(--bg2)] border-2 border-[var(--accent)] flex items-center justify-center relative overflow-hidden group hover:border-[var(--accent)] transition-all duration-500 shadow-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="w-full h-full object-cover" src="/logo.jpg" alt="Logo" loading="eager" />
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
        <div className="panel py-8 px-4 shadow-md rounded-md sm:px-10 border border-[var(--border)]">
          {!isForgotMode && (
            <div className="flex border-b border-[var(--border)] mb-6 pb-1">
              <button
                id="switch-login-tab"
                onClick={() => { setIsLogin(true); setError(''); setSuccessMsg(''); }}
                className={`flex-1 text-center py-2.5 font-medium text-sm transition-all border-b-2 cursor-pointer ${isLogin
                    ? 'text-[var(--accent-soft-foreground)] border-[var(--accent)] font-semibold'
                    : 'text-[var(--muted-foreground)] border-transparent hover:text-[var(--fg)]'
                  }`}
              >
                Нэвтрэх хэсэг
              </button>
              <button
                id="switch-register-tab"
                onClick={() => { setIsLogin(false); setError(''); setSuccessMsg(''); }}
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
              <RecoveryForm
                form={form}
                onVerifyAccount={handleVerifyAccount}
                onResetPassword={handleForgotPasswordSubmit}
              />
            ) : (
              <LoginForm form={form} onLogin={handleLogin} />
            )
          ) : (
            <RegisterForm
              form={form}
              onRegister={handleRegister}
              onOptimizeBio={handleOptimizeBio}
            />
          )}
        </div>
      </div>

      {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}
      {showPrivacy && <PrivacyModal onClose={() => setShowPrivacy(false)} />}
    </div>
  );
}
