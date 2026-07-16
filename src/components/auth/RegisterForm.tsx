'use client';

import { FormEvent } from 'react';
import { User as UserIcon, Phone, Truck, Check, AlertCircle, X, Eye, EyeOff } from 'lucide-react';
import type { AuthFormState } from './useAuthForm';
import { AVATAR_PRESETS } from './constants';

interface RegisterFormProps {
  form: AuthFormState;
  onRegister: (e: FormEvent) => void;
}

/**
 * Step 1 of registration — role, name, contact, password only. Address,
 * avatar, bio and machine-type enrichment are deferred to a skippable
 * post-registration step (the reused ProfileEditModal shown from JobBoard —
 * see Auth.tsx/JobBoard.tsx) so creating an account itself stays fast
 * (audit C3).
 */
export default function RegisterForm({ form, onRegister }: RegisterFormProps) {
  const {
    userType, setUserType,
    email, setEmail,
    lastName, setLastName,
    firstName, setFirstName,
    companyName, setCompanyName,
    phone, setPhone,
    regPassword, setRegPassword,
    regConfirmPassword, setRegConfirmPassword,
    showRegPassword, setShowRegPassword,
    showRegConfirmPassword, setShowRegConfirmPassword,
    setSelectedAvatar,
    setBio, setOriginalBio, setHasOptimized,
    isAgreedToTerms, setIsAgreedToTerms,
    isSubmitting,
    successMsg, error,
    setShowTerms, setShowPrivacy,
  } = form;

  // Address is optional and password composition rules (special character)
  // are dropped — see the matching note in Auth.tsx's handleRegister (audit C3).
  const isFormValid =
    firstName.trim() !== '' &&
    lastName.trim() !== '' &&
    (email.trim() === '' || email.includes('@')) &&
    phone.trim() !== '' &&
    phone.trim().length >= 8 &&
    regPassword.length >= 8 &&
    regPassword === regConfirmPassword &&
    isAgreedToTerms;

  return (
    <form onSubmit={onRegister} className="space-y-5">
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

      {/* Name fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1" htmlFor="reg-lastname">Овог</label>
          <input
            id="reg-lastname"
            type="text"
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder=""
            className="block w-full px-3 py-3 input text-base text-[var(--fg)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] font-sans"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1" htmlFor="reg-firstname">Нэр</label>
          <input
            id="reg-firstname"
            type="text"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder=""
            className="block w-full px-3 py-3 input text-base text-[var(--fg)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] font-sans"
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
              className="block w-full px-3 py-3 input text-base text-[var(--fg)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] font-sans"
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
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder=""
            className="block w-full px-3 py-3 input text-base text-[var(--fg)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] font-sans"
          />
        </div>
      </div>

      {/* Contact fields */}
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1" htmlFor="reg-phone">Утасны дугаар</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Phone className="h-4 w-4 text-[var(--muted-foreground)]" />
            </div>
            <input
              id="reg-phone"
              type="tel"
              required
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder=""
              className="block w-full pl-9 pr-3 py-3 input text-base text-[var(--fg)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>
        </div>

        {/* Password fields */}
        <div>
          <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1" htmlFor="reg-password">
            Нэвтрэх нууц код
          </label>
          <div className="relative">
            <input
              id="reg-password"
              type={showRegPassword ? 'text' : 'password'}
              required
              autoComplete="new-password"
              value={regPassword}
              onChange={(e) => setRegPassword(e.target.value)}
              placeholder=""
              className="block w-full pl-3 pr-12 py-3 input text-base text-[var(--fg)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] font-sans"
            />
            <button
              id="toggle-reg-pass-visibility"
              type="button"
              onClick={() => setShowRegPassword(!showRegPassword)}
              aria-label={showRegPassword ? 'Нууц үгийг нуух' : 'Нууц үгийг харах'}
              className="absolute inset-y-0 right-0 w-11 flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--fg)] cursor-pointer"
            >
              {showRegPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
            </button>
          </div>
          {regPassword !== '' && regPassword.length < 8 && (
            <p className="text-sm text-red-700 mt-1 font-sans flex items-center space-x-1">
              <span className="font-bold">✗</span>
              <span>Нууц үг хамгийн багадаа 8 тэмдэгт байх шаардлагатай! (Одоо: {regPassword.length})</span>
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
              autoComplete="new-password"
              value={regConfirmPassword}
              onChange={(e) => setRegConfirmPassword(e.target.value)}
              placeholder=""
              className="block w-full pl-3 pr-12 py-3 input text-base text-[var(--fg)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] font-sans"
            />
            <button
              id="toggle-reg-confirm-pass-visibility"
              type="button"
              onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
              aria-label={showRegConfirmPassword ? 'Нууц үгийг нуух' : 'Нууц үгийг харах'}
              className="absolute inset-y-0 right-0 w-11 flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--fg)] cursor-pointer"
            >
              {showRegConfirmPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
            </button>
          </div>
          {regConfirmPassword !== '' && regPassword !== regConfirmPassword && (
            <p className="text-sm text-red-700 mt-1 font-sans flex items-center space-x-1">
              <span className="font-bold">✗</span>
              <span>Давтан оруулсан нууц үг тохирохгүй байна!</span>
            </p>
          )}
        </div>

        {/* Live Password Checklist */}
        <div className="bg-[var(--card)] p-3 rounded-lg border border-[var(--border)] space-y-1.5 font-sans">
          <span className="text-xs font-semibold text-[var(--muted-foreground)] block mb-1">Нууц үгэнд тавих шаардлага:</span>
          <div className="flex items-center space-x-2 text-sm">
            <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 border ${regPassword.length >= 8
                ? 'bg-[var(--accent-soft)] text-[var(--accent-soft-foreground)] border-[var(--accent)]'
                : 'bg-red-500/10 text-red-700 border-red-500/30'
              }`}>
              {regPassword.length >= 8 ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
            </div>
            <span className={regPassword.length >= 8 ? 'text-[var(--accent-soft-foreground)] font-medium' : 'text-[var(--muted-foreground)]'}>
              Хамгийн багадаа 8 тэмдэгт (Одоогийн урт: {regPassword.length})
            </span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 border ${(regPassword === regConfirmPassword && regConfirmPassword !== '')
                ? 'bg-[var(--accent-soft)] text-[var(--accent-soft-foreground)] border-[var(--accent)]'
                : 'bg-red-500/10 text-red-700 border-red-500/30'
              }`}>
              {(regPassword === regConfirmPassword && regConfirmPassword !== '') ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
            </div>
            <span className={(regPassword === regConfirmPassword && regConfirmPassword !== '') ? 'text-[var(--accent-soft-foreground)] font-medium' : 'text-[var(--muted-foreground)]'}>
              Хоёр нууц үг хоорондоо тохирох
            </span>
          </div>
        </div>
      </div>

      {/* Validation warnings */}
      {!isFormValid && (
        <div className="mt-4 p-3.5 bg-red-500/5 border border-red-500/25 text-red-700 rounded-lg text-xs space-y-1.5 font-sans animate-fade-in leading-relaxed">
          <div className="flex items-center space-x-1.5 font-bold text-red-700 mb-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Бүртгүүлэхийн тулд дараах мэдээллүүдийг гүйцээнэ үү:</span>
          </div>
          <ul className="list-disc pl-4.5 space-y-1 text-sm text-[var(--muted-foreground)]">
            {lastName.trim() === '' && <li>Овгоо оруулна уу.</li>}
            {firstName.trim() === '' && <li>Нэрээ оруулна уу.</li>}
            {email.trim() !== '' && !email.includes('@') && <li>Зөв имэйл хаяг оруулна уу.</li>}
            {phone.trim() === '' && <li>Утасны дугаараа оруулна уу.</li>}
            {phone.trim() !== '' && phone.trim().length < 8 && <li>Утасны дугаар дор хаяж 8 оронтой байх ёстой.</li>}
            {regPassword === '' && <li>Нэвтрэх нууц кодоо оруулна уу.</li>}
            {regPassword !== '' && regPassword.length < 8 && <li>Нууц код хамгийн багадаа 8 тэмдэгт байх шаардлагатай.</li>}
            {regConfirmPassword === '' && <li>Нууц кодоо давтан оруулна уу.</li>}
            {regPassword !== '' && regConfirmPassword !== '' && regPassword !== regConfirmPassword && <li>Хоёр нууц код хоорондоо тохирохгүй байна.</li>}
            {!isAgreedToTerms && <li>Үйлчилгээний нөхцөл болон Нууцлалын бодлогыг хүлээн зөвшөөрөх шаардлагатай.</li>}
          </ul>
        </div>
      )}

      {/* Terms consent */}
      <div className="flex items-start space-x-2.5 bg-[var(--card)] p-3.5 rounded-lg border border-[var(--border)] mt-4 animate-fade-in">
        <input
          id="agree-terms-checkbox"
          type="checkbox"
          checked={isAgreedToTerms}
          onChange={(e) => setIsAgreedToTerms(e.target.checked)}
          className="w-4.5 h-4.5 rounded text-[var(--accent-soft-foreground)] bg-[var(--card)] border-[var(--border)] focus:ring-[var(--accent)] focus:ring-offset-[var(--card)] accent-[var(--accent)] shrink-0 mt-0.5 cursor-pointer"
        />
        <label htmlFor="agree-terms-checkbox" className="text-xs text-[var(--muted-foreground)] leading-normal select-none font-sans">
          Би энэхүү платформын{' '}
          <button type="button" onClick={() => setShowTerms(true)} className="text-[var(--accent-soft-foreground)] hover:text-[var(--accent-soft-foreground)] underline font-semibold transition-colors cursor-pointer bg-transparent border-none p-0">Үйлчилгээний нөхцөл</button>
          {' '}болон{' '}
          <button type="button" onClick={() => setShowPrivacy(true)} className="text-[var(--accent-soft-foreground)] hover:text-[var(--accent-soft-foreground)] underline font-semibold transition-colors cursor-pointer bg-transparent border-none p-0">Нууцлалын бодлого</button>
          -той бүрэн танилцаж, хүлээн зөвшөөрч байна.
        </label>
      </div>

      {/* Submit */}
      <div className="pt-3">
        <p className="text-sm text-[var(--muted-foreground)] text-center mb-2.5 font-sans">
          Профайл зураг, био, туршлагаа дараа нэмж болно — одоохондоо эдгээрийг л бөглөнө үү.
        </p>
        <button
          id="submit-register-btn"
          type="submit"
          disabled={isSubmitting || !isFormValid}
          className={`w-full flex justify-center items-center min-h-12 px-4 border border-transparent rounded-full text-[var(--accent-foreground)] font-semibold text-[15px] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${!isSubmitting && isFormValid
              ? 'bg-[var(--accent)] hover:opacity-90 shadow-lg'
              : 'bg-[var(--bg2)] text-[var(--muted-foreground)] cursor-not-allowed opacity-50'
            }`}
        >
          {isSubmitting ? 'Бүртгэж байна...' : 'Бүртгүүлэх'}
        </button>
        {successMsg && (
          <div className="mt-3.5 bg-[var(--accent-soft)] text-[var(--accent-soft-foreground)] px-4 py-3 rounded-xl text-sm flex items-center justify-center space-x-2 animate-fade-in font-sans">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)] shrink-0"></span>
            <span className="text-left">{successMsg}</span>
          </div>
        )}
        {error && (
          <div className="mt-3.5 bg-red-500/10 border border-red-500/40 text-red-700 px-4 py-2.5 rounded-lg text-xs flex items-center justify-center text-center animate-fade-in font-sans">
            <span>{error}</span>
          </div>
        )}
      </div>
    </form>
  );
}
