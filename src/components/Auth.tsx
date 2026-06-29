'use client';

import { FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { loginUser, registerUser, saveSingleUser } from '../lib/db';
import { User } from '../types';
import { optimizeBio } from '../lib/gemini';
import { db, auth } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { signInWithEmailAndPassword } from 'firebase/auth';
import TermsModal from './auth/TermsModal';
import PrivacyModal from './auth/PrivacyModal';
import RecoveryForm from './auth/RecoveryForm';
import LoginForm from './auth/LoginForm';
import RegisterForm from './auth/RegisterForm';
import { useAuthForm } from './auth/useAuthForm';
import { hashSecret, verifySecret } from '../lib/crypto';

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
    recoveryStep, setRecoveryStep,
    forgotInput, setForgotInput,
    securityQ1, setSecurityQ1,
    securityQ2, setSecurityQ2,
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
    } catch (err: any) {
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
    if (!firstName.trim() || !lastName.trim() || !phone || !address) {
      setError('Шаардлагатай мэдээллүүдийг бүрэн бөглөнө үү.');
      return;
    }
    if (!regPassword) { setError('Нэвтрэх нууц кодыг оруулна уу.'); return; }
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
        password: regPassword,
      }, (status) => {
        setSuccessMsg(status);
      });

      setSuccessMsg('Бүртгэл амжилттай үүслээ! Тавтай морилно уу. 🚀');
      setTimeout(() => { onSuccess(newUser); }, 1500);
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
    if (!inputVal) { setError('Имэйл хаяг эсвэл Утасны дугаарыг оруулна уу.'); return; }

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
          snapshot = await getDocs(query(collection(db, 'users'), where('phone', '==', localPhone)));
        } else if (snapshot.empty && !inputVal.startsWith('+976') && /^\d+$/.test(inputVal)) {
          snapshot = await getDocs(query(collection(db, 'users'), where('phone', '==', '+976' + inputVal)));
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
        matched.securityQuestion1 && matched.securityAnswer1 &&
        matched.securityQuestion2 && matched.securityAnswer2;

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
      setTimeout(() => { setSuccessMsg(''); }, 1500);
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

    // Compare answers against stored PBKDF2 hashes (normalized: trim + lowercase)
    const match1 = await verifySecret(securityA1Input, matchedUserObj.securityAnswer1 || '', true);
    const match2 = await verifySecret(securityA2Input, matchedUserObj.securityAnswer2 || '', true);

    if (!match1 || !match2) {
      setError('Аюулгүй байдлын асуултуудын хариулт таарахгүй байна! Аюулгүй байдлын үүднээс мэдээллээ зөв оруулна уу.');
      return;
    }

    setSuccessMsg('Нууц кодыг шинэчилж байна...');
    setIsSubmitting(true);

    try {
      const targetEmail = matchedUserObj.email || `${matchedUserObj.phone.replace(/[^a-zA-Z0-9]/g, '')}@jolooj.mn`;
      try {
        await signInWithEmailAndPassword(auth, targetEmail, 'Password123!');
      } catch (authErr) {
        console.warn('Temporary sign-in for recovery failed, proceeding with Firestore rules fallback:', authErr);
      }

      // Save new password as a PBKDF2 hash — never store plaintext
      matchedUserObj.password = await hashSecret(newPass);
      await saveSingleUser(matchedUserObj);

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
    } catch (err: any) {
      console.error(err);
      setError('Нууц код сэргээхэд алдаа гарлаа: ' + (err.message || err));
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
          className="text-[var(--muted-foreground)] hover:text-[var(--fg)] text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer bg-[var(--card)] border border-[var(--color-glass-border)] px-3.5 py-2 rounded-md"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Нүүр хуудас</span>
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-xl relative z-10 text-center">
        <div className="flex justify-center mb-3">
          <div className="w-24 h-24 rounded-md bg-[var(--bg2)] border-2 border-[var(--accent)] flex items-center justify-center relative overflow-hidden group hover:border-[var(--accent)] transition-all duration-500 shadow-md">
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
