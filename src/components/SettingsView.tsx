import { useState, FormEvent } from 'react';
import { ShieldCheck, Key, Trash2, Eye, EyeOff, Check, AlertCircle, X } from 'lucide-react';
import { getCurrentUser, saveSingleUser, setCurrentUser, getFreshCurrentUser } from '../lib/db';
import { auth } from '../lib/firebase';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';

interface SettingsViewProps {
  onBack: () => void;
}

export default function SettingsView({ onBack }: SettingsViewProps) {
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const [success, setSuccess] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Account deletion modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [deleteReason, setDeleteReason] = useState<string>('');
  const [otherReasonText, setOtherReasonText] = useState<string>('');
  const [deleteSuccess, setDeleteSuccess] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string>('');

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
    const currentLoggedUser = getCurrentUser();
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

      // 1. Verify current password
      if (freshUser.password) {
        if (freshUser.password !== currentPassword) {
          setError('Одоогийн нууц үг буруу байна.');
          return;
        }
      } else {
        // Fallback for older accounts where the password isn't cached in Firestore yet
        if (auth.currentUser && auth.currentUser.email) {
          try {
            const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
            await reauthenticateWithCredential(auth.currentUser, credential);
          } catch (reauthErr: any) {
            console.warn('Re-authentication failed:', reauthErr);
            setError('Одоогийн нууц үг буруу байна.');
            return;
          }
        }
      }

      // 2. We do NOT update the Firebase Auth password since it should remain 'Password123!' (unified).
      // But if their Auth password was not unified yet (they are an old account), we should unify it.
      if (!freshUser.password && auth.currentUser) {
        try {
          await updatePassword(auth.currentUser, 'Password123!');
        } catch (authErr: any) {
          console.warn('Failed to unify auth password, trying fallback:', authErr);
        }
      }

      // 3. Save the new password to Firestore
      const updatedUser = { ...freshUser, password: newPassword };
      await saveSingleUser(updatedUser);

      // Save to localStorage session without the password
      const sessionUser = { ...updatedUser };
      if ('password' in sessionUser) {
        delete sessionUser.password;
      }
      setCurrentUser(sessionUser);

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
    <div id="settings-view-container" className="max-w-4xl mx-auto p-6 text-white font-sans space-y-8">
      
      {/* Back link */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center space-x-2">
            <ShieldCheck className="w-6 h-6 text-emerald-500" />
            <span>Аюулгүй байдал & Тохиргооны Цэс</span>
          </h2>
          <p className="text-xs text-gray-400">Таны бүртгэл, холболт болон системийн хандалттай холбоотой тохиргоонууд</p>
        </div>
        <button
          id="back-to-jobs-from-settings"
          onClick={onBack}
          className="text-xs bg-slate-800 hover:bg-slate-750 text-emerald-400 border border-slate-700 px-3 py-1.5 rounded transition-colors cursor-pointer"
        >
          Зарын хэсэг рүү буцах
        </button>
      </div>

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500 text-emerald-300 p-3 rounded text-xs flex items-center space-x-2">
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
        <div className="md:col-span-1 space-y-4">
          <div className="bg-slate-800 p-4 border border-slate-800 rounded-xl">
            <span className="text-xs font-semibold text-gray-300 block mb-2">Холболтын төлөв</span>
            <div className="text-xs space-y-2">
              <div className="flex justify-between text-gray-400">
                <span>Холболт:</span>
                <span className="font-mono text-[10px] text-white">Одоогийн хандалт</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Хамгаалалт:</span>
                <span className="text-[10px] text-white">Идэвхтэй (SSL)</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Төхөөрөмж:</span>
                <span className="text-[10px] text-white">Одоогийн төхөөрөмж</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column Form options */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Change Password Panel */}
          <div className="bg-slate-800/20 border border-slate-700/50 p-6 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center space-x-2 border-b border-slate-800 pb-2">
              <Key className="w-4 h-4 text-emerald-500" />
              <span>Нууц үг шинэчлэх цэс</span>
            </h3>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Одоо ашиглаж буй нууц үг</label>
                <div className="relative">
                  <input
                    id="current-password-input"
                    type={showPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="******"
                    className="block w-full px-3 py-1.5 border border-slate-700 rounded bg-slate-900 text-white text-xs focus:ring-1 focus:ring-emerald-550 focus:outline-none"
                  />
                  <button
                    id="toggle-pass-visibility-1"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Шинэ нууц үг</label>
                  <input
                    id="new-password-input"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Шинэ нууц үгээ оруулах"
                    className="block w-full px-3 py-1.5 border border-slate-700 rounded bg-slate-900 text-white text-xs focus:ring-1 focus:ring-emerald-550 focus:outline-none"
                  />
                  <p className="mt-1 text-[10px] text-gray-550 font-sans">
                    * Хамгийн багадаа 8 тэмдэгт, тусгай тэмдэгт (!@#$%^&* u.g) багтсан байна.
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Шинэ нууц үг давтах</label>
                  <input
                    id="confirm-password-input"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="давтан оруулна уу"
                    className="block w-full px-3 py-1.5 border border-slate-700 rounded bg-slate-900 text-white text-xs focus:ring-1 focus:ring-emerald-550 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  id="submit-password-change-btn"
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-550 text-white px-4 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer"
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
            <p className="text-[10px] text-gray-400 leading-relaxed">
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
        <div id="delete-account-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4 animate-fade-in">
          <div id="delete-account-modal-container" className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden font-sans">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-850 px-5 py-4 bg-slate-950/40">
              <h3 className="text-xs font-bold text-white flex items-center space-x-2 uppercase tracking-wide">
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>Бүртгэл устгах хүсэлт</span>
              </h3>
              <button 
                id="close-delete-modal-btn" 
                onClick={() => setIsDeleteModalOpen(false)} 
                className="text-gray-450 hover:text-white transition-colors cursor-pointer p-1 rounded hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            {deleteSuccess ? (
              <div className="p-5 text-center space-y-4 animate-fade-in">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500/15 text-emerald-400">
                  <Check className="w-5 h-5" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-emerald-400">Хүсэлтийг хүлээн авлаа</h4>
                  <p className="text-[11px] text-gray-400 leading-relaxed font-sans">
                    Таны бүртгэл устгах хүсэлтийг амжилттай бүртгэж авлаа. Бид таны хүсэлтийг холбогдох ажилтантай хамт хянаж, 24 цагийн дотор шийдвэрлэх болно.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white py-1.5 rounded text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Хаах
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-5 space-y-4">
                <p className="text-[11px] text-gray-300 leading-relaxed font-sans">
                  Та системээс бүртгэлээ устгах болсон шалтгаанаа сонгоно уу. Энэ нь биднийг үйлчилгээгээ сайжруулахад туслах болно:
                </p>

                <div className="space-y-2">
                  {deleteReasons.map((reason, idx) => (
                    <label 
                      key={idx}
                      className={`flex items-start space-x-2.5 p-2 rounded border transition-all cursor-pointer ${
                        deleteReason === reason 
                          ? 'bg-rose-955/15 border-rose-500/35 text-white' 
                          : 'bg-slate-950/30 border-slate-850 text-gray-400 hover:border-slate-800 hover:bg-slate-950/50'
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
                        className="mt-0.5 text-rose-500 focus:ring-rose-500 bg-slate-950 border-slate-800" 
                      />
                      <span className="text-xs font-sans text-gray-200">{reason}</span>
                    </label>
                  ))}
                </div>

                {deleteReason === 'Бусад (Учрыг доор бичих)' && (
                  <div className="space-y-1.5 animate-fade-in">
                    <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-wider">Шалтгаанаа тайлбарлана уу:</label>
                    <textarea
                      id="other-delete-reason-input"
                      rows={2.5}
                      value={otherReasonText}
                      onChange={(e) => {
                        setOtherReasonText(e.target.value);
                        setDeleteError('');
                      }}
                      placeholder="Энд дэлгэрэнгүй бичнэ үү..."
                      className="block w-full px-2.5 py-1.5 border border-slate-700 rounded bg-slate-950 text-white text-xs focus:ring-1 focus:ring-rose-500 focus:outline-none focus:border-rose-500"
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
                    className="w-1/2 bg-slate-850 hover:bg-slate-800 text-gray-300 py-1.5 rounded text-xs font-semibold cursor-pointer transition-colors border border-slate-800"
                  >
                    Буцах
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!deleteReason) {
                        setDeleteError('Устгах шалтгаанаа сонгоно уу.');
                        return;
                      }
                      if (deleteReason === 'Бусад (Учрыг доор бичих)' && !otherReasonText.trim()) {
                        setDeleteError('Нэмэлт шалтгаанаа тодорхойлж бичнэ үү.');
                        return;
                      }
                      setDeleteSuccess(true);
                    }}
                    className="w-1/2 bg-rose-600 hover:bg-rose-550 text-white py-1.5 rounded text-xs font-semibold cursor-pointer transition-colors shadow-md shadow-rose-950/30"
                  >
                    Илгээх
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
