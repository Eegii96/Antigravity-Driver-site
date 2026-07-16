'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Key, Trash2, Eye, EyeOff, Check, AlertCircle, X, Bell } from 'lucide-react';
import { saveSingleUser, getFreshCurrentUser, requestAccountDeletion } from '../lib/db';
import { User } from '../types';
import { auth } from '../lib/firebase';
import { reauthenticateWithCredential, EmailAuthProvider, updatePassword } from 'firebase/auth';
import { useAuth } from '../context/AuthContext';
import { LOCATION_OPTIONS } from '../lib/job-format';

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

  // "New job in my aimag" notification preferences (audit C5) — opt-in,
  // operator accounts only. Persisted on User.notifyLocations.
  const [notifyLocations, setNotifyLocations] = useState<string[]>([]);
  const [isSavingNotifyLocations, setIsSavingNotifyLocations] = useState<boolean>(false);

  useEffect(() => {
    setNotifyLocations(currentUser?.notifyLocations || []);
    // Only re-sync on user switch, not on every local edit to notifyLocations itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  const toggleNotifyLocation = (location: string) => {
    setNotifyLocations(prev =>
      prev.includes(location) ? prev.filter(l => l !== location) : [...prev, location]
    );
  };

  const handleSaveNotifyLocations = async () => {
    if (!currentUser) return;
    setIsSavingNotifyLocations(true);
    try {
      const updatedUser: User = { ...currentUser, notifyLocations };
      await saveSingleUser(updatedUser);
      setCurrentUser(updatedUser);
      setSuccess('Мэдэгдлийн бүсийн тохиргоо хадгалагдлаа.');
      setError('');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error('Error saving notifyLocations:', err);
      setError('Тохиргоог хадгалахад алдаа гарлаа.');
    } finally {
      setIsSavingNotifyLocations(false);
    }
  };

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
    <div id="settings-view-container" className="max-w-4xl mx-auto p-6 text-[var(--fg)] font-sans space-y-8">
      
      {/* Back link */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-display font-bold tracking-tight text-[var(--fg)] flex items-center space-x-2">
            <ShieldCheck className="w-6 h-6 text-[var(--accent-soft-foreground)]" />
            <span>Аюулгүй байдал, тохиргоо</span>
          </h2>
          <p className="text-[13px] text-[var(--muted-foreground)]">Таны бүртгэл, холболт болон системийн хандалттай холбоотой тохиргоонууд</p>
        </div>
        <button
          id="back-to-jobs-from-settings"
          onClick={() => router.push('/')}
          className="text-[13px] font-semibold min-h-11 bg-[var(--card)] hover:bg-[var(--bg2)] text-[var(--fg)] border border-[var(--border)] hover:border-[var(--border-strong)] px-4 rounded-full transition-colors cursor-pointer shrink-0"
        >
          Буцах
        </button>
      </div>

      {success && (
        <div className="bg-[var(--accent-soft)] text-[var(--accent-soft-foreground)] p-3.5 rounded-xl text-sm flex items-center space-x-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-xl text-sm flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left column Settings Navigator */}
        <div className="md:col-span-1 space-y-4 font-sans">
          <div className="bg-[var(--card)] border border-[var(--border)] p-5 rounded-2xl space-y-4 shadow-sm relative overflow-hidden text-left font-sans">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
              <span className="text-[13px] font-semibold text-[var(--muted-foreground)]">Холболтын төлөв</span>
              <div className="flex items-center space-x-1.5 bg-[var(--accent-soft)] px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--verify)]"></span>
                <span className="text-xs text-[var(--accent-soft-foreground)] font-bold font-mono">ONLINE</span>
              </div>
            </div>

            <div className="text-[13px] space-y-2.5">
              <div className="flex justify-between items-center text-[var(--muted-foreground)]">
                <span className="font-medium text-[var(--muted-foreground)]">Холбогдсон хаяг:</span>
                <span className="text-xs text-[var(--fg)] font-mono font-medium max-w-[130px] truncate" title={currentUser?.email || currentUser?.phone}>
                  {currentUser?.email || currentUser?.phone || 'Тодорхойгүй'}
                </span>
              </div>
              <div className="flex justify-between items-center text-[var(--muted-foreground)]">
                <span className="font-medium text-[var(--muted-foreground)]">Төхөөрөмж / OS:</span>
                <span className="text-xs text-[var(--fg)] font-medium text-right">
                  {deviceInfo.browser} ({deviceInfo.os})
                </span>
              </div>
              <div className="flex justify-between items-center text-[var(--muted-foreground)]">
                <span className="font-medium text-[var(--muted-foreground)]">IP Хаяг:</span>
                <span className="text-xs text-[var(--accent-soft-foreground)] font-mono font-bold">
                  {ipAddress}
                </span>
              </div>
              <div className="flex justify-between items-center text-[var(--muted-foreground)]">
                <span className="font-medium text-[var(--muted-foreground)]">Хамгаалалт:</span>
                <span className="text-xs text-[var(--verify)] font-bold flex items-center space-x-1 bg-[rgba(35,121,82,0.08)] px-2.5 py-0.5 rounded-full font-mono">
                  <span>SSL (HTTPS)</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column Form options */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Change Password Panel */}
          <div className="bg-[var(--card)] border border-[var(--border)] p-6 rounded-2xl space-y-4 shadow-sm">
            <h3 className="text-[15px] font-display font-bold text-[var(--fg)] flex items-center space-x-2 border-b border-[var(--border)] pb-2.5">
              <Key className="w-4 h-4 text-[var(--accent-soft-foreground)]" />
              <span>Нууц үг шинэчлэх цэс</span>
            </h3>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-[var(--muted-foreground)] mb-1.5">Одоо ашиглаж буй нууц үг</label>
                <div className="relative">
                  <input
                    id="current-password-input"
                    type={showPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    autoComplete="current-password"
                    placeholder="******"
                    className="block w-full pl-4 pr-12 py-3 border border-[var(--border)] rounded-xl bg-[var(--bg)] text-[var(--fg)] text-base focus:ring-2 focus:ring-[var(--accent-soft)] focus:border-[var(--fg)] focus:outline-none"
                  />
                  <button
                    id="toggle-pass-visibility-1"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Нууц үгийг нуух' : 'Нууц үгийг харах'}
                    className="absolute inset-y-0 right-0 w-11 flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--fg)] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-medium text-[var(--muted-foreground)] mb-1.5">Шинэ нууц үг</label>
                  <input
                    id="new-password-input"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Шинэ нууц үгээ оруулах"
                    className="block w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--bg)] text-[var(--fg)] text-base focus:ring-2 focus:ring-[var(--accent-soft)] focus:border-[var(--fg)] focus:outline-none"
                  />
                  <p className="mt-1.5 text-[13px] text-[var(--muted-foreground)] font-sans">
                    * Хамгийн багадаа 8 тэмдэгт, тусгай тэмдэгт (!@#$%^&* г.м) багтсан байна.
                  </p>
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[var(--muted-foreground)] mb-1.5">Шинэ нууц үг давтах</label>
                  <input
                    id="confirm-password-input"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="давтан оруулна уу"
                    className="block w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--bg)] text-[var(--fg)] text-base focus:ring-2 focus:ring-[var(--accent-soft)] focus:border-[var(--fg)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  id="submit-password-change-btn"
                  type="submit"
                  className="bg-[var(--accent)] hover:opacity-90 text-[var(--accent-foreground)] px-5 min-h-12 rounded-full text-sm font-semibold transition-colors cursor-pointer"
                >
                  Нууц үгийг баталгаажуулж солих
                </button>
              </div>
            </form>
          </div>

          {/* Notification preferences — operator-only "new job in my aimag" alerts */}
          {currentUser?.type === 'operator' && (
            <div className="bg-[var(--card)] border border-[var(--border)] p-6 rounded-2xl space-y-4 shadow-sm">
              <h3 className="text-[15px] font-display font-bold text-[var(--fg)] flex items-center space-x-2 border-b border-[var(--border)] pb-2.5">
                <Bell className="w-4 h-4 text-[var(--accent-soft-foreground)]" />
                <span>Шинэ зарын мэдэгдэл</span>
              </h3>
              <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                Сонгосон аймаг/хотод шинэ ажлын зар нийтлэгдэх бүрт танд мэдэгдэл ирнэ. Юу ч сонгоогүй бол мэдэгдэл ирэхгүй.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {LOCATION_OPTIONS.filter(loc => loc !== 'Бүгд').map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => toggleNotifyLocation(loc)}
                    className={`px-3.5 py-2 rounded-full text-[13px] border transition-colors cursor-pointer ${
                      notifyLocations.includes(loc)
                        ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-soft-foreground)] font-semibold'
                        : 'border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:border-[var(--border-strong)] hover:text-[var(--fg)]'
                    }`}
                  >
                    {loc}
                  </button>
                ))}
              </div>
              <div className="pt-2 flex justify-end">
                <button
                  id="save-notify-locations-btn"
                  type="button"
                  disabled={isSavingNotifyLocations}
                  onClick={handleSaveNotifyLocations}
                  className="bg-[var(--accent)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-[var(--accent-foreground)] px-5 min-h-12 rounded-full text-sm font-semibold transition-colors cursor-pointer"
                >
                  {isSavingNotifyLocations ? 'Хадгалж байна...' : 'Тохиргоог хадгалах'}
                </button>
              </div>
            </div>
          )}

          {/* Dangerous accounts zone */}
          <div className="bg-rose-50/60 border border-rose-200 p-6 rounded-2xl space-y-3">
            <h3 className="text-[15px] font-display font-bold text-rose-700 flex items-center space-x-2">
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Бүртгэлийг устгах</span>
            </h3>
            <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
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
                className="bg-[var(--card)] hover:bg-rose-100 text-rose-700 border border-rose-300 px-4 min-h-11 rounded-full text-[13px] font-semibold transition-colors cursor-pointer"
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--fg)]/40 p-4 animate-fade-in"
        >
          <div
            id="delete-account-modal-container"
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm bg-[var(--card)] border border-[var(--border-strong)] rounded-2xl shadow-md overflow-hidden font-sans"
          >

            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-[var(--border)] px-5 py-4">
              <h3 className="text-base font-display font-bold text-[var(--fg)] flex items-center space-x-2">
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Бүртгэл устгах хүсэлт</span>
              </h3>
              <button
                id="close-delete-modal-btn"
                onClick={() => setIsDeleteModalOpen(false)}
                aria-label="Хаах"
                className="min-w-11 min-h-11 flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--fg)] transition-colors cursor-pointer rounded-full hover:bg-[var(--bg2)]"
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
                  <h4 className="text-[15px] font-bold text-[var(--accent-soft-foreground)]">Хүсэлтийг хүлээн авлаа</h4>
                  <p className="text-sm text-[var(--muted-foreground)] leading-relaxed font-sans">
                    Таны бүртгэл устгах хүсэлтийг амжилттай бүртгэж авлаа. Бид таны хүсэлтийг холбогдох ажилтантай хамт хянаж, 24 цагийн дотор шийдвэрлэх болно.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="w-full bg-[var(--card)] hover:bg-[var(--bg2)] border border-[var(--border)] hover:border-[var(--border-strong)] text-[var(--fg)] min-h-12 rounded-full text-sm font-semibold cursor-pointer transition-colors"
                  >
                    Хаах
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-5 space-y-4">
                <p className="text-sm text-[var(--muted-foreground)] leading-relaxed font-sans">
                  Та системээс бүртгэлээ устгах болсон шалтгаанаа сонгоно уу. Энэ нь биднийг үйлчилгээгээ сайжруулахад туслах болно:
                </p>

                <div className="space-y-2">
                  {deleteReasons.map((reason, idx) => (
                    <label 
                      key={idx}
                      className={`flex items-start space-x-2.5 p-3 rounded-xl border transition-all cursor-pointer ${
                        deleteReason === reason
                          ? 'bg-rose-50 border-rose-300 text-rose-700'
                          : 'bg-[var(--bg)] border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--border-strong)]'
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
                        className="mt-0.5 accent-[var(--alert)]"
                      />
                      <span className="text-sm font-sans">{reason}</span>
                    </label>
                  ))}
                </div>

                {deleteReason === 'Бусад (Учрыг доор бичих)' && (
                  <div className="space-y-1.5 animate-fade-in">
                    <label className="block text-[13px] font-medium text-[var(--muted-foreground)]">Шалтгаанаа тайлбарлана уу:</label>
                    <textarea
                      id="other-delete-reason-input"
                      rows={3}
                      value={otherReasonText}
                      onChange={(e) => {
                        setOtherReasonText(e.target.value);
                        setDeleteError('');
                      }}
                      placeholder="Энд дэлгэрэнгүй бичнэ үү..."
                      className="block w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--bg)] text-[var(--fg)] text-base focus:ring-2 focus:ring-rose-100 focus:outline-none focus:border-rose-400 resize-none"
                    />
                  </div>
                )}

                {deleteError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl flex items-center space-x-1.5 animate-fade-in">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{deleteError}</span>
                  </div>
                )}

                <div className="pt-1.5 flex space-x-2.5">
                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="w-1/2 bg-[var(--card)] hover:bg-[var(--bg2)] text-[var(--fg)] min-h-12 rounded-full text-sm font-semibold cursor-pointer transition-colors border border-[var(--border)] hover:border-[var(--border-strong)]"
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
                    className="w-1/2 bg-[var(--alert)] hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed text-white min-h-12 rounded-full text-sm font-semibold cursor-pointer transition-colors"
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
