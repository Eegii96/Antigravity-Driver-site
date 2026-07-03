'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Key, Trash2, Eye, EyeOff, Check, AlertCircle, X } from 'lucide-react';
import { saveSingleUser, getFreshCurrentUser, requestAccountDeletion } from '../lib/db';
import { User } from '../types';
import { auth } from '../lib/firebase';
import { reauthenticateWithCredential, EmailAuthProvider, updatePassword } from 'firebase/auth';
import { useAuth } from '../context/AuthContext';

export default function SettingsView() {
  const router = useRouter();
  const { currentUser, setCurrentUser } = useAuth();
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const [success, setSuccess] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Dynamic connection details
  const [deviceInfo, setDeviceInfo] = useState({ os: 'Уншиж байна...', browser: 'Уншиж байна...' });
  const [ipAddress, setIpAddress] = useState<string>('Ачаалж байна...');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent;
      let os = 'Бусад OS';
      let browser = 'Бусад хөтөч';
      
      // Detect OS
      if (ua.indexOf('Win') !== -1) os = 'Windows';
      else if (ua.indexOf('Mac') !== -1) os = 'macOS';
      else if (/Android/.test(ua)) os = 'Android';
      else if (/iPhone|iPad|iPod/.test(ua)) os = 'iOS';
      else if (ua.indexOf('Linux') !== -1) os = 'Linux';
      
      // Detect Browser
      if (ua.indexOf('Chrome') !== -1 && ua.indexOf('Edg') === -1) browser = 'Chrome';
      else if (ua.indexOf('Safari') !== -1 && ua.indexOf('Chrome') === -1) browser = 'Safari';
      else if (ua.indexOf('Firefox') !== -1) browser = 'Firefox';
      else if (ua.indexOf('Edg') !== -1) browser = 'Edge';
      
      setDeviceInfo({ os, browser });

      // Fetch actual IP address dynamically
      fetch('https://api.ipify.org?format=json')
        .then(res => res.json())
        .then(data => setIpAddress(data.ip))
        .catch(() => setIpAddress('103.9.90.11'));
    }
  }, []);

  // Account deletion modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (isDeleteModalOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isDeleteModalOpen]);

  const [deleteReason, setDeleteReason] = useState<string>('');
  const [otherReasonText, setOtherReasonText] = useState<string>('');
  const [deleteSuccess, setDeleteSuccess] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string>('');
  const [isSubmittingDeleteRequest, setIsSubmittingDeleteRequest] = useState<boolean>(false);

  const deleteReasons = [
    'Ажлын санал хангалтгүй байна',
    'Ашиглахад хэт төвөгтэй байна',
    'Системд алдаа, доголдол их гарч байна',
    'Шаардлагагүй болсон (Өөр бусад үйлчилгээ ашиглаж байгаа)',
    'Бусад (Учрыг доор бичих)',
  ];

  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault();
    
    // Fetch fresh user to change pass
    const currentLoggedUser = currentUser;
    if (!currentLoggedUser) {
      setError('Та нэвтэрсэн байх шаардлагатай.');
      return;
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Бүх нууц үгийн талбарыг бөглөнө үү.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Шинэ нууц үгнүүд хоорондоо таарахгүй байна.');
      return;
    }
    if (newPassword.length < 8 || !/[!@#$%^&*(),.?":{}|<>_\-+=]/.test(newPassword)) {
      setError('Шинэ нууц үг хамгийн багадаа 8 тэмдэгт урттай, мөн дор хаяж нэг тусгай тэмдэгт агуулсан байх ёстой.');
      return;
    }

    try {
      const freshUser = await getFreshCurrentUser();
      if (!freshUser) {
        setError('Хэрэглэгч олдсонгүй.');
        return;
      }

      // Verify the current password AND change it via Firebase Auth reauthentication —
      // Auth already owns the password, so this is the sole check needed. (A PBKDF2
      // hash used to be duplicated into the Firestore user doc and checked here too,
      // but that just gave anyone who could read the doc a second, weaker target to
      // crack — audit S7. Firestore never stores a password hash any more.)
      if (auth.currentUser && auth.currentUser.email) {
        const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
        try {
          await reauthenticateWithCredential(auth.currentUser, credential);
        } catch {
          setError('Одоогийн нууц үг буруу байна.');
          return;
        }
        await updatePassword(auth.currentUser, newPassword);
      }

      // Persist the profile as-is (no password field) — also opportunistically
      // strips any legacy password hash still sitting on older accounts.
      const updatedUser: User = { ...freshUser };
      delete updatedUser.password;
      await saveSingleUser(updatedUser);
      setCurrentUser(updatedUser);

      setSuccess('Нууц үг амжилттай солигдлоо. Таны холболт шинэчлэгдсэн.');
      setError('');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error(err);
      setError('Нууц үг солиход алдаа гарлаа.');
    }
  };

  return (
    <div id="settings-view-container" className="max-w-4xl mx-auto p-6 text-[var(--accent-foreground)] font-sans space-y-8">
      
      {/* Back link */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[var(--accent-foreground)] flex items-center space-x-2">
            <ShieldCheck className="w-6 h-6 text-[var(--accent-soft-foreground)]" />
            <span>Аюулгүй байдал & Тохиргооны Цэс</span>
          </h2>
          <p className="text-xs text-[var(--muted-foreground)]">Таны бүртгэл, холболт болон системийн хандалттай холбоотой тохиргоонууд</p>
        </div>
        <button
          id="back-to-jobs-from-settings"
          onClick={() => router.push('/')}
          className="text-xs bg-[var(--bg2)] hover:bg-[var(--bg2)] text-[var(--accent-soft-foreground)] border border-[var(--border)] px-3 py-1.5 rounded transition-colors cursor-pointer"
        >
          Зарын хэсэг рүү буцах
        </button>
      </div>

      {success && (
        <div className="bg-[var(--accent-soft)] border border-[var(--accent)] text-[var(--accent-soft-foreground)] p-3 rounded text-xs flex items-center space-x-2">
          <Check className="w-4 h-4" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="bg-rose-500/10 border border-rose-500 text-rose-300 p-3 rounded text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left column Settings Navigator */}
        <div className="md:col-span-1 space-y-4 font-sans">
          <div className="bg-[var(--bg2)] border border-[var(--border)] p-5 rounded-xl space-y-4 shadow-xl relative overflow-hidden text-left font-sans">
            {/* Ambient background glow inside card */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-[var(--accent-soft)] rounded-full blur-2xl pointer-events-none"></div>

            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
              <span className="text-xs font-semibold text-[var(--muted-foreground)]">Холболтын төлөв</span>
              <div className="flex items-center space-x-1.5 bg-[var(--accent-soft)] px-2 py-0.5 rounded-full border border-[var(--accent)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-ping"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] absolute"></span>
                <span className="text-[10.5px] text-[var(--accent-soft-foreground)] font-bold tracking-wider uppercase font-mono">ONLINE</span>
              </div>
            </div>

            <div className="text-xs space-y-2.5">
              <div className="flex justify-between items-center text-[var(--muted-foreground)]">
                <span className="font-medium text-[var(--muted-foreground)]">Холбогдсон хаяг:</span>
                <span className="text-[11px] text-[var(--accent-foreground)] font-mono font-medium max-w-[130px] truncate" title={currentUser?.email || currentUser?.phone}>
                  {currentUser?.email || currentUser?.phone || 'Тодорхойгүй'}
                </span>
              </div>
              <div className="flex justify-between items-center text-[var(--muted-foreground)]">
                <span className="font-medium text-[var(--muted-foreground)]">Төхөөрөмж / OS:</span>
                <span className="text-[11px] text-[var(--accent-foreground)] font-medium text-right">
                  {deviceInfo.browser} ({deviceInfo.os})
                </span>
              </div>
              <div className="flex justify-between items-center text-[var(--muted-foreground)]">
                <span className="font-medium text-[var(--muted-foreground)]">IP Хаяг:</span>
                <span className="text-[11px] text-[var(--accent-soft-foreground)] font-mono font-bold">
                  {ipAddress}
                </span>
              </div>
              <div className="flex justify-between items-center text-[var(--muted-foreground)]">
                <span className="font-medium text-[var(--muted-foreground)]">Хамгаалалт:</span>
                <span className="text-[11px] text-[var(--verify)] font-bold flex items-center space-x-1 bg-[rgba(31,138,76,0.1)] px-2 py-0.5 rounded border border-[var(--verify)] font-mono">
                  <span>SSL (HTTPS)</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column Form options */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Change Password Panel */}
          <div className="bg-[var(--bg2)] border border-[var(--border)] p-6 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-[var(--accent-foreground)] flex items-center space-x-2 border-b border-[var(--border)] pb-2">
              <Key className="w-4 h-4 text-[var(--accent-soft-foreground)]" />
              <span>Нууц үг шинэчлэх цэс</span>
            </h3>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Одоо ашиглаж буй нууц үг</label>
                <div className="relative">
                  <input
                    id="current-password-input"
                    type={showPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="******"
                    className="block w-full px-3 py-1.5 border border-[var(--border)] rounded bg-[var(--bg2)] text-[var(--fg)] text-xs focus:ring-1 focus:ring-[var(--accent)] focus:outline-none"
                  />
                  <span
                    id="toggle-pass-visibility-1"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--muted-foreground)] hover:text-[var(--accent-foreground)] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Шинэ нууц үг</label>
                  <input
                    id="new-password-input"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Шинэ нууц үгээ оруулах"
                    className="block w-full px-3 py-1.5 border border-[var(--border)] rounded bg-[var(--bg2)] text-[var(--fg)] text-xs focus:ring-1 focus:ring-[var(--accent)] focus:outline-none"
                  />
                  <p className="mt-1 text-[10px] text-[var(--muted-foreground)] font-sans">
                    * Хамгийн багадаа 8 тэмдэгт, тусгай тэмдэгт (!@#$%^&* u.g) багтсан байна.
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Шинэ нууц үг давтах</label>
                  <input
                    id="confirm-password-input"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="давтан оруулна уу"
                    className="block w-full px-3 py-1.5 border border-[var(--border)] rounded bg-[var(--bg2)] text-[var(--fg)] text-xs focus:ring-1 focus:ring-[var(--accent)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  id="submit-password-change-btn"
                  type="submit"
                  className="bg-[var(--accent)] hover:brightness-95 text-[var(--accent-foreground)] px-4 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer"
                >
                  Нууц үгийг баталгаажуулж солих
                </button>
              </div>
            </form>
          </div>

          {/* Dangerous accounts zone */}
          <div className="bg-rose-950/10 border border-rose-900/40 p-6 rounded-xl space-y-3">
            <h3 className="text-xs font-bold text-rose-300 uppercase tracking-widest flex items-center space-x-2">
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>Бүртгэлийг устгах</span>
            </h3>
            <p className="text-[10px] text-[var(--muted-foreground)] leading-relaxed">
              Хэрэв та өөрийн бүртгэлийг системээс устгах гэж байгаа бол таны түүхэнд бичигдсэн ажлын тайлан болон эерэг/сөрөг үнэлгээний түүх архив болон үлдэхийг анхаарна уу. Зорилго нь харилцагч дахин бүртгүүлэх үед сайтад үнэлгээ, ажлын түүх шинээр бүртгэгдэхээс сэргийлэхэд оршино.
            </p>
            <div className="pt-2">
              <button
                id="danger-deactivate-btn"
                onClick={() => {
                  setDeleteReason('');
                  setOtherReasonText('');
                  setDeleteSuccess(false);
                  setDeleteError('');
                  setIsDeleteModalOpen(true);
                }}
                className="bg-transparent hover:bg-rose-900/20 text-rose-400 border border-rose-900/60 px-3 py-1.5 rounded text-[11px] font-medium transition-colors cursor-pointer"
              >
                Бүртгэл устгах хүсэлт өгөх
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Account Deletion Modal */}
      {isDeleteModalOpen && (
        <div 
          id="delete-account-modal-backdrop" 
          onClick={() => setIsDeleteModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg2)] p-4 animate-fade-in"
        >
          <div 
            id="delete-account-modal-container" 
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm bg-[var(--bg2)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden font-sans"
          >
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-[var(--border)] px-5 py-4 bg-[var(--bg2)]">
              <h3 className="text-xs font-bold text-[var(--accent-foreground)] flex items-center space-x-2 uppercase tracking-wide">
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>Бүртгэл устгах хүсэлт</span>
              </h3>
              <button 
                id="close-delete-modal-btn" 
                onClick={() => setIsDeleteModalOpen(false)} 
                className="min-w-11 min-h-11 flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--accent-foreground)] transition-colors cursor-pointer rounded hover:bg-[var(--bg2)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            {deleteSuccess ? (
              <div className="p-5 text-center space-y-4 animate-fade-in">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[var(--accent-soft)] text-[var(--accent-soft-foreground)]">
                  <Check className="w-5 h-5" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-[var(--accent-soft-foreground)]">Хүсэлтийг хүлээн авлаа</h4>
                  <p className="text-[11px] text-[var(--muted-foreground)] leading-relaxed font-sans">
                    Таны бүртгэл устгах хүсэлтийг амжилттай бүртгэж авлаа. Бид таны хүсэлтийг холбогдох ажилтантай хамт хянаж, 24 цагийн дотор шийдвэрлэх болно.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="w-full bg-[var(--bg2)] hover:bg-[var(--border)] text-[var(--accent-foreground)] py-1.5 rounded text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Хаах
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-5 space-y-4">
                <p className="text-[11px] text-[var(--muted-foreground)] leading-relaxed font-sans">
                  Та системээс бүртгэлээ устгах болсон шалтгаанаа сонгоно уу. Энэ нь биднийг үйлчилгээгээ сайжруулахад туслах болно:
                </p>

                <div className="space-y-2">
                  {deleteReasons.map((reason, idx) => (
                    <label 
                      key={idx}
                      className={`flex items-start space-x-2.5 p-2 rounded border transition-all cursor-pointer ${
                        deleteReason === reason 
                          ? 'bg-rose-500/15 border-rose-500/35 text-rose-700'
                          : 'bg-[var(--bg2)] border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--border)] hover:bg-[var(--bg2)]'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="delete-reason" 
                        value={reason} 
                        checked={deleteReason === reason}
                        onChange={() => {
                          setDeleteReason(reason);
                          setDeleteError('');
                        }}
                        className="mt-0.5 text-rose-500 focus:ring-rose-500 bg-[var(--bg2)] border-[var(--border)]" 
                      />
                      <span className="text-xs font-sans text-[var(--muted-foreground)]">{reason}</span>
                    </label>
                  ))}
                </div>

                {deleteReason === 'Бусад (Учрыг доор бичих)' && (
                  <div className="space-y-1.5 animate-fade-in">
                    <label className="block text-[10px] font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Шалтгаанаа тайлбарлана уу:</label>
                    <textarea
                      id="other-delete-reason-input"
                      rows={2.5}
                      value={otherReasonText}
                      onChange={(e) => {
                        setOtherReasonText(e.target.value);
                        setDeleteError('');
                      }}
                      placeholder="Энд дэлгэрэнгүй бичнэ үү..."
                      className="block w-full px-2.5 py-1.5 border border-[var(--border)] rounded bg-[var(--bg2)] text-[var(--fg)] text-xs focus:ring-1 focus:ring-rose-500 focus:outline-none focus:border-rose-500"
                    />
                  </div>
                )}

                {deleteError && (
                  <div className="p-2 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[10px] rounded flex items-center space-x-1.5 animate-fade-in">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                    <span>{deleteError}</span>
                  </div>
                )}

                <div className="pt-1.5 flex space-x-2.5">
                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="w-1/2 bg-[var(--bg2)] hover:bg-[var(--border)] text-[var(--fg)] py-1.5 rounded text-xs font-semibold cursor-pointer transition-colors border border-[var(--border)]"
                  >
                    Буцах
                  </button>
                  <button
                    type="button"
                    disabled={isSubmittingDeleteRequest}
                    onClick={async () => {
                      if (!deleteReason) {
                        setDeleteError('Устгах шалтгаанаа сонгоно уу.');
                        return;
                      }
                      if (deleteReason === 'Бусад (Учрыг доор бичих)' && !otherReasonText.trim()) {
                        setDeleteError('Нэмэлт шалтгаанаа тодорхойлж бичнэ үү.');
                        return;
                      }
                      if (!currentUser) {
                        setDeleteError('Хэрэглэгч олдсонгүй.');
                        return;
                      }
                      const resolvedReason = deleteReason === 'Бусад (Учрыг доор бичих)'
                        ? `${deleteReason}: ${otherReasonText.trim()}`
                        : deleteReason;
                      setIsSubmittingDeleteRequest(true);
                      try {
                        await requestAccountDeletion(currentUser.id, resolvedReason);
                        setDeleteSuccess(true);
                      } catch (err) {
                        console.error('Error submitting account deletion request:', err);
                        setDeleteError('Хүсэлт илгээхэд алдаа гарлаа. Дахин оролдоно уу.');
                      } finally {
                        setIsSubmittingDeleteRequest(false);
                      }
                    }}
                    className="w-1/2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed text-[var(--accent-foreground)] py-1.5 rounded text-xs font-semibold cursor-pointer transition-colors shadow-md shadow-rose-950/30"
                  >
                    {isSubmittingDeleteRequest ? 'Илгээж байна...' : 'Илгээх'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
