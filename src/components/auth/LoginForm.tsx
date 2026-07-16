'use client';

import { FormEvent } from 'react';
import { Mail, Eye, EyeOff } from 'lucide-react';
import type { AuthFormState } from './useAuthForm';

interface LoginFormProps {
  form: AuthFormState;
  onLogin: (e: FormEvent) => void;
}

/** Login form — email/password inputs, forgot-password link, submit button. */
export default function LoginForm({ form, onLogin }: LoginFormProps) {
  const {
    email, setEmail,
    password, setPassword,
    showLoginPassword, setShowLoginPassword,
    isSubmitting,
    successMsg, error,
    setIsForgotMode, setError, setSuccessMsg,
    setShowTerms, setShowPrivacy,
  } = form;

  return (
    <form onSubmit={onLogin} className="space-y-5">
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
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder=""
            className="block w-full pl-10 pr-3 py-3 input text-base text-[var(--fg)] placeholder-[var(--muted-foreground)] focus:outline-none"
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
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder=""
            className="block w-full pl-10 pr-12 py-3 input text-base text-[var(--fg)] placeholder-[var(--muted-foreground)] focus:outline-none"
          />
          <button
            id="toggle-login-pass-visibility"
            type="button"
            onClick={() => setShowLoginPassword(!showLoginPassword)}
            aria-label={showLoginPassword ? 'Нууц үгийг нуух' : 'Нууц үгийг харах'}
            className="absolute inset-y-0 right-0 w-11 flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--fg)] cursor-pointer"
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
          className="text-[13px] py-2.5 text-[var(--muted-foreground)] hover:text-[var(--accent-soft-foreground)] transition-colors underline cursor-pointer font-sans"
        >
          Нууц үг сэргээх холбоос
        </button>
      </div>

      <div className="pt-2">
        <button
          id="submit-login-btn"
          type="submit"
          disabled={isSubmitting}
          className="w-full flex justify-center items-center min-h-12 px-4 border border-transparent rounded-full bg-[var(--accent)] hover:opacity-90 text-[var(--accent-foreground)] font-semibold text-[15px] transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Нэвтэрч байна...' : 'Нэвтрэх'}
        </button>
        {successMsg && (
          <div className="mt-3.5 bg-[var(--accent-soft)] text-[var(--accent-soft-foreground)] px-4 py-3 rounded-xl text-sm flex items-center justify-center space-x-2 animate-fade-in font-sans">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)] shrink-0"></span>
            <span className="text-left">{successMsg}</span>
          </div>
        )}
        {error && (
          <div className="mt-3.5 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm flex items-center justify-center text-center animate-fade-in font-sans">
            <span>{error}</span>
          </div>
        )}
        <p className="mt-3 text-sm text-[var(--muted-foreground)] text-center font-sans">
          Та нэвтэрснээр манай{' '}
          <button type="button" onClick={() => setShowTerms(true)} className="text-[var(--accent-soft-foreground)] hover:text-[var(--accent-soft-foreground)] underline transition-colors cursor-pointer bg-transparent border-none p-0 font-medium">Үйлчилгээний нөхцөл</button>
          {' '}болон{' '}
          <button type="button" onClick={() => setShowPrivacy(true)} className="text-[var(--accent-soft-foreground)] hover:text-[var(--accent-soft-foreground)] underline transition-colors cursor-pointer bg-transparent border-none p-0 font-medium">Нууцлалын бодлого</button>
          -ыг зөвшөөрсөнд тооцогдоно.
        </p>
      </div>
    </form>
  );
}
