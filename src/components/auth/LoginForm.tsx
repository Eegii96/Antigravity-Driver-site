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
          className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg bg-[var(--accent)] hover:brightness-95 text-[var(--accent-foreground)] font-semibold text-sm transition-all shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="mt-3.5 bg-red-500/10 border border-red-500/40 text-red-700 px-4 py-2.5 rounded-lg text-xs flex items-center justify-center text-center animate-fade-in font-sans">
            <span>{error}</span>
          </div>
        )}
        <p className="mt-3 text-sm text-[var(--muted-foreground)] text-center font-sans">
          Та нэвтэрснээр манай{' '}
          <button type="button" onClick={() => setShowTerms(true)} className="text-[var(--accent-soft-foreground)] hover:text-[var(--accent-soft-foreground)] underline transition-colors cursor-pointer bg-transparent border-none p-0 font-medium">Үйлчилгээний нөхцөл</button>
          {' '}болон{' '}
          <button type="button" onClick={() => setShowPrivacy(true)} className="text-[var(--verify)] hover:text-[var(--verify)] underline transition-colors cursor-pointer bg-transparent border-none p-0 font-medium">Нууцлалын бодлого</button>
          -ыг зөвшөөрсөнд тооцогдоно.
        </p>
      </div>
    </form>
  );
}
