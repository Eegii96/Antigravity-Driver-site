'use client';

import { FormEvent } from 'react';
import { User as UserIcon, Eye, EyeOff } from 'lucide-react';
import type { AuthFormState } from './useAuthForm';

interface RecoveryFormProps {
  form: AuthFormState;
  /** Step 1 submit — verify the account and load its security questions. */
  onVerifyAccount: (e: FormEvent) => void;
  /** Step 2 submit — check answers and set the new password. */
  onResetPassword: (e: FormEvent) => void;
}

/** Password-recovery flow (step 1: find account, step 2: answer questions + reset). */
export default function RecoveryForm({ form, onVerifyAccount, onResetPassword }: RecoveryFormProps) {
  const {
    recoveryStep,
    forgotInput, setForgotInput,
    securityQ1, securityQ2,
    securityA1Input, setSecurityA1Input,
    securityA2Input, setSecurityA2Input,
    forgotNewPassword, setForgotNewPassword,
    forgotConfirmNewPassword, setForgotConfirmNewPassword,
    showForgotNewPassword, setShowForgotNewPassword,
    showForgotConfirmNewPassword, setShowForgotConfirmNewPassword,
    isSubmitting, successMsg, error,
    setIsForgotMode, setRecoveryStep, setSecurityQ1, setSecurityQ2,
    setMatchedUserObj, setError, setSuccessMsg,
  } = form;

  return (
              <form onSubmit={recoveryStep === 1 ? onVerifyAccount : onResetPassword} className="space-y-4 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-[var(--border)]">
                  <span className="font-semibold text-[var(--accent-soft-foreground)] text-xs">Нууц үг сэргээх цэс</span>
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
                    className="text-[var(--muted-foreground)] hover:text-[var(--fg)] underline cursor-pointer"
                  >
                    Буцах
                  </button>
                </div>

                {recoveryStep === 1 ? (
                  /* STEP 1: Email or Phone Search */
                  <div className="animate-fade-in space-y-3.5">
                    <div>
                      <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                        Бүртгэлтэй имэйл хаяг эсвэл Утасны дугаар
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <UserIcon className="h-4 w-4 text-[var(--muted-foreground)]" />
                        </div>
                        <input
                          id="forgot-input"
                          type="text"
                          required
                          value={forgotInput}
                          onChange={(e) => setForgotInput(e.target.value)}
                          placeholder=""
                          className="block w-full pl-9 pr-3 py-2 input text-xs text-[var(--accent-foreground)] focus:ring-1 focus:ring-[var(--accent)] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* STEP 2: Answer Questions and Reset Password */
                  <div className="space-y-3.5 animate-fade-in">
                    {/* Security Question 1 */}
                    <div className="bg-[var(--card)] p-3 rounded-lg border border-[var(--border)] font-sans space-y-2 text-left">
                      <span className="text-xs font-semibold text-[var(--accent-soft-foreground)] block">🔒 Аюулгүй байдлын асуулт 1:</span>
                      <p className="text-xs text-[var(--fg)] leading-relaxed font-sans">{securityQ1}</p>
                      <input
                        id="security-a1-input"
                        type="text"
                        required
                        value={securityA1Input}
                        onChange={(e) => setSecurityA1Input(e.target.value)}
                        placeholder="Асуулт 1-ийн хариулт"
                        className="block w-full px-3 py-1.5 input text-xs text-[var(--accent-foreground)] focus:ring-1 focus:ring-[var(--accent)] focus:outline-none font-sans"
                      />
                    </div>

                    {/* Security Question 2 */}
                    <div className="bg-[var(--card)] p-3 rounded-lg border border-[var(--border)] font-sans space-y-2 text-left">
                      <span className="text-xs font-semibold text-[var(--accent-soft-foreground)] block">🔒 Аюулгүй байдлын асуулт 2:</span>
                      <p className="text-xs text-[var(--fg)] leading-relaxed font-sans">{securityQ2}</p>
                      <input
                        id="security-a2-input"
                        type="text"
                        required
                        value={securityA2Input}
                        onChange={(e) => setSecurityA2Input(e.target.value)}
                        placeholder="Асуулт 2-ийн хариулт"
                        className="block w-full px-3 py-1.5 input text-xs text-[var(--accent-foreground)] focus:ring-1 focus:ring-[var(--accent)] focus:outline-none font-sans"
                      />
                    </div>

                    {/* Password Inputs */}
                    <div className="border-t border-[var(--border)] pt-3.5 space-y-3.5 text-left">
                      <div>
                        <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
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
                            className="block w-full pl-3 pr-10 py-2 input text-xs text-[var(--accent-foreground)] focus:ring-1 focus:ring-[var(--accent)] focus:outline-none font-sans"
                          />
                          <span
                            onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--muted-foreground)] hover:text-[var(--fg)] cursor-pointer"
                          >
                            {showForgotNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </span>
                        </div>
                        {forgotNewPassword !== '' && forgotNewPassword.length < 8 && (
                          <p className="text-sm text-red-700 mt-1 font-sans flex items-center space-x-1">
                            <span className="font-bold">✗</span>
                            <span>Нууц код хамгийн багадаа 8 тэмдэгт байх шаардлагатай! (Одоо: {forgotNewPassword.length})</span>
                          </p>
                        )}
                        {forgotNewPassword !== '' && forgotNewPassword.length >= 8 && !/[!@#$%^&*(),.?":{}|<>_\-+=]/.test(forgotNewPassword) && (
                          <p className="text-sm text-red-700 mt-1 font-sans flex items-center space-x-1">
                            <span className="font-bold">✗</span>
                            <span>Нууц үгэнд дор хаяж нэг тусгай тэмдэгт (!@#$%^&* гэх мэт) орох шаардлагатай!</span>
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
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
                            className="block w-full pl-3 pr-10 py-2 input text-xs text-[var(--accent-foreground)] focus:ring-1 focus:ring-[var(--accent)] focus:outline-none font-sans"
                          />
                          <span
                            onClick={() => setShowForgotConfirmNewPassword(!showForgotConfirmNewPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--muted-foreground)] hover:text-[var(--accent-foreground)] cursor-pointer"
                          >
                            {showForgotConfirmNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </span>
                        </div>
                        {forgotConfirmNewPassword !== '' && forgotNewPassword !== forgotConfirmNewPassword && (
                          <p className="text-sm text-red-700 mt-1 font-sans flex items-center space-x-1">
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
                    className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg bg-[var(--accent)] hover:brightness-95 text-[var(--accent-foreground)] font-semibold text-sm transition-all shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Түр хүлээнэ үү...' : (recoveryStep === 1 ? 'Шалгах' : 'Нууц кодыг шинэчлэх')}
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
                </div>
              </form>
  );
}
