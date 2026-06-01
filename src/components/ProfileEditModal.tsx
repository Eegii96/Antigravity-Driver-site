import { useState, useEffect, FormEvent } from 'react';
import { X, Check, Save, Sparkles, Lock } from 'lucide-react';
import { User } from '../types';
import { saveSingleUser } from '../lib/db';
import { optimizeBio } from '../lib/gemini';

interface ProfileEditModalProps {
  user: User;
  onClose: () => void;
  onSave: (updatedUser: User) => void;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150&q=80',
];

const MACHINE_OPTIONS = [
  'Экскаватор',
  'Дамп',
  'Хово',
  'Ковш',
  'Бульдозер',
  'Авто грейдер',
  'Кран',
  'Бетон зуурагч машин',
  'Трейлэр'
];

const SECURITY_QUESTIONS = [
  'Таны хамгийн анхны тэжээвэр амьтны нэр юу вэ?',
  'Таны төрсөн аймаг эсвэл хот юу вэ?',
  'Таны ээжийн төрсөн сум эсвэл аймаг юу вэ?',
  'Таны хамгийн анх орсон сургуулийн нэр юу вэ?',
  'Таны багын хамгийн сайн найзын нэр хэн бэ?',
  'Таны хамгийн анхны унаж сурсан машины загвар юу вэ?'
];

export default function ProfileEditModal({ user, onClose, onSave }: ProfileEditModalProps) {
  const getInitialNames = () => {
    let ln = user.lastName || '';
    let fn = user.firstName || '';
    if (!ln && !fn && user.fullName) {
      const parts = user.fullName.trim().split(/\s+/);
      if (parts.length > 1) {
        ln = parts[0];
        fn = parts.slice(1).join(' ');
      } else {
        fn = parts[0] || '';
      }
    }
    return { lastName: ln, firstName: fn };
  };

  const initialNames = getInitialNames();
  const [lastName, setLastName] = useState<string>(initialNames.lastName);
  const [firstName, setFirstName] = useState<string>(initialNames.firstName);
  const [companyName, setCompanyName] = useState<string>(user.companyName || '');
  const [phone, setPhone] = useState<string>(user.phone);
  const [address, setAddress] = useState<string>(user.address);
  const [avatar, setAvatar] = useState<string>(user.profileImage);
  const [email, setEmail] = useState<string>(user.email);
  const [bio, setBio] = useState<string>(user.bio);
  const [isPublic, setIsPublic] = useState<boolean>(user.isPublic);
  const [experienceYears, setExperienceYears] = useState<number | ''>(user.experienceYears || 0);
  const [machineTypes, setMachineTypes] = useState<string[]>(user.machineTypes || []);
  const [customMachine, setCustomMachine] = useState<string>('');
  const [securityQuestion1, setSecurityQuestion1] = useState<string>(user.securityQuestion1 || '');
  const [securityAnswer1, setSecurityAnswer1] = useState<string>(user.securityAnswer1 || '');
  const [securityQuestion2, setSecurityQuestion2] = useState<string>(user.securityQuestion2 || '');
  const [securityAnswer2, setSecurityAnswer2] = useState<string>(user.securityAnswer2 || '');
  const [error, setError] = useState<string>('');
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [hasOptimized, setHasOptimized] = useState<boolean>(false);
  const [originalBio, setOriginalBio] = useState<string>(user.bio);

  useEffect(() => {
    // Disable body scroll when modal is open to prevent background scrolling
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      // Restore body scroll when modal is closed
      document.body.style.overflow = originalStyle;
    };
  }, []);

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
        experienceYears: typeof experienceYears === 'number' ? experienceYears : 0,
        machineTypes,
        rawBio: rawToOptimize,
        currentBio: bio,
        userType: user.type
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

  const toggleMachine = (machine: string) => {
    if (machineTypes.includes(machine)) {
      setMachineTypes(machineTypes.filter(m => m !== machine));
    } else {
      setMachineTypes([...machineTypes, machine]);
    }
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    const isNameValid = firstName.trim() !== '' && lastName.trim() !== '';
    if (!isNameValid || !phone || !address) {
      setError('Шаардлагатай мэдээллүүдийг бүрэн бөглөнө үү. (Овог, Нэр, Утас, Хаяг)');
      return;
    }

    if (securityQuestion1 && securityQuestion2 && securityQuestion1 === securityQuestion2) {
      setError('Аюулгүй байдлын хоёр асуулт хоорондоо ижил байж болохгүй. Өөр асуултууд сонгоно уу.');
      return;
    }

    const computedFullName = lastName.trim() + ' ' + firstName.trim();

    const updated: User = {
      ...user,
      fullName: computedFullName,
      lastName: lastName.trim(),
      firstName: firstName.trim(),
      companyName: user.type === 'employer' && companyName.trim() !== '' ? companyName.trim() : undefined,
      phone,
      address,
      profileImage: avatar,
      email,
      bio,
      isPublic,
      experienceYears: user.type === 'operator' ? (experienceYears === '' ? 0 : experienceYears) : undefined,
      machineTypes: user.type === 'operator' ? machineTypes : undefined,
      securityQuestion1: securityQuestion1 || undefined,
      securityAnswer1: securityAnswer1.trim() || undefined,
      securityQuestion2: securityQuestion2 || undefined,
      securityAnswer2: securityAnswer2.trim() || undefined,
    };

    try {
      // Save database state directly for this user document
      await saveSingleUser(updated);

      onSave(updated);
    } catch (err) {
      setError('Мэдээллийг хадгалахад алдаа гарлаа.');
    }
  };

  const isSecured = !!(securityQuestion1.trim() && securityAnswer1.trim() && securityQuestion2.trim() && securityAnswer2.trim());

  return (
    <div id="profile-edit-modal-backdrop" className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div id="profile-edit-content-container" className="bg-slate-900 border border-slate-700/80 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-850 px-6 py-4">
          <h3 className="text-base font-semibold text-white">Хувийн мэдээлэл засварлах</h3>
          <button id="close-profile-edit-btn" onClick={onClose} className="text-gray-400 hover:text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500 text-rose-300 px-4 py-2 rounded text-xs">
              {error}
            </div>
          )}

          {/* Edit form fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Овог
              </label>
              <input
                id="edit-lastname"
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="block w-full px-3 py-1.5 border border-slate-700 rounded bg-slate-850 text-white text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none font-sans"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Нэр
              </label>
              <input
                id="edit-firstname"
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="block w-full px-3 py-1.5 border border-slate-700 rounded bg-slate-850 text-white text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none font-sans"
              />
            </div>
          </div>

          {user.type === 'employer' && (
            <div className="grid grid-cols-1">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Компанийн нэр (Заавал биш)
                </label>
                <input
                  id="edit-companyname"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder=""
                  className="block w-full px-3 py-1.5 border border-slate-700 rounded bg-slate-850 text-white text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none font-sans"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Утасны дугаар</label>
              <input
                id="edit-phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="block w-full px-3 py-1.5 border border-slate-700 rounded bg-slate-850 text-white text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none font-sans"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Имэйл хаяг</label>
              <input
                id="edit-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full px-3 py-1.5 border border-slate-700 rounded bg-slate-850 text-white text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none font-sans"
              />
            </div>
          </div>

          <div className="grid grid-cols-1">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Гэрийн хаяг</label>
              <input
                id="edit-address"
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="block w-full px-3 py-1.5 border border-slate-700 rounded bg-slate-850 text-white text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none font-sans"
              />
            </div>
          </div>

          {/* Custom profile picture uploader */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5 flex justify-between">
              <span>Профайл зураг солих</span>
              <span className="text-[10px] text-gray-500 font-sans">(компьютер эсвэл утаснаас зураг сонгож оруулна уу)</span>
            </label>
            <div className="space-y-3">
              {/* File upload input */}
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-16 border border-slate-700 border-dashed rounded-lg cursor-pointer bg-slate-850 hover:bg-slate-800 transition-all">
                  <div className="flex flex-col items-center justify-center py-1">
                    <span className="text-xs text-emerald-400 font-semibold">Шинэ зураг хуулах (Upload)</span>
                    <span className="text-[10px] text-gray-500 font-sans">PNG, JPG, JPEG формат</span>
                  </div>
                  <input
                    id="upload-avatar-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 2 * 1024 * 1024) {
                          alert('Зураг 2MB-аас бага хэмжээтэй байх ёстой.');
                          return;
                        }
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setAvatar(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              </div>
              
              {/* Display the current profile picture below */}
              <div className="flex items-center space-x-3.5 bg-slate-850 p-2.5 rounded-lg border border-slate-700">
                <img
                  src={avatar}
                  alt="Current Avatar"
                  className="w-12 h-12 rounded-full border-2 border-slate-700 object-cover"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <span className="text-xs font-bold text-white block">Идэвхтэй зураг</span>
                  <span className="text-[10px] text-emerald-400 font-medium font-sans mt-0.5 block flex items-center space-x-1">
                    <span>✓ Одоогоор сонгогдсон байна</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bio edit */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-medium text-gray-300">Таны тухай, нэмэлт мэдээлэл</label>
              <button
                type="button"
                onClick={handleOptimizeBio}
                disabled={isOptimizing}
                className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 border border-emerald-500/30 bg-emerald-500/5 px-2.5 py-1 rounded cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-sans"
              >
                <Sparkles className={`w-3 h-3 ${isOptimizing ? 'animate-spin' : ''}`} />
                <span>{isOptimizing ? 'AI сайжруулж байна...' : (hasOptimized ? 'Өөр загвар гаргах' : 'AI-аар сайжруулах')}</span>
              </button>
            </div>



            <textarea
              id="edit-bio"
              rows={7}
              value={bio}
              onChange={(e) => {
                const val = e.target.value;
                setBio(val);
                setOriginalBio(val);
                setHasOptimized(false);
              }}
              className="block w-full px-3 py-2.5 border border-slate-700 rounded bg-slate-850 text-white text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none font-sans min-h-[160px] leading-relaxed"
            />
          </div>

          {/* Operator Specific Info */}
          {user.type === 'operator' && (
            <div className="border-t border-slate-800 pt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Ажилласан туршлага (Жилээр)</label>
                <input
                  id="edit-experience"
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
                  className="block w-[80px] px-2 py-1 border border-slate-700 rounded bg-slate-850 text-white text-xs focus:ring-1"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">Мэргэшсэн Хүнд Машин Механизмууд</label>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  {MACHINE_OPTIONS.map((item, idx) => (
                    <button
                      id={`edit-machine-option-${idx}`}
                      type="button"
                      key={idx}
                      onClick={() => toggleMachine(item)}
                      className={`flex items-center space-x-1.5 py-1 px-2.5 rounded transition-colors text-left border cursor-pointer ${
                        machineTypes.includes(item)
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                          : 'border-slate-800 bg-slate-850/30 text-gray-400 hover:border-slate-700'
                      }`}
                    >
                      <span>{item}</span>
                    </button>
                  ))}
                </div>

                {/* Hand-written custom machine entry box */}
                <div className="mt-3.5 pt-3 border-t border-slate-800/80">
                  <label className="block text-[11px] font-medium text-gray-400 mb-1">
                    Бусад машин механизм нэмэх (Гараар бичих)
                  </label>
                  <div className="flex space-x-2">
                    <input
                      id="custom-machine-edit-input"
                      type="text"
                      placeholder=""
                      value={customMachine}
                      onChange={(e) => setCustomMachine(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const trimmed = customMachine.trim();
                          if (trimmed) {
                            if (!machineTypes.includes(trimmed)) {
                              setMachineTypes([...machineTypes, trimmed]);
                            }
                            setCustomMachine('');
                          }
                        }
                      }}
                      className="flex-1 px-2.5 py-1.5 border border-slate-700 bg-slate-850 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-slate-500 font-sans"
                    />
                    <button
                      id="add-custom-machine-edit-btn"
                      type="button"
                      onClick={() => {
                        const trimmed = customMachine.trim();
                        if (trimmed) {
                          if (!machineTypes.includes(trimmed)) {
                            setMachineTypes([...machineTypes, trimmed]);
                          }
                          setCustomMachine('');
                        }
                      }}
                      className="px-3 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-emerald-400 rounded text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Нэмэх
                    </button>
                  </div>
                </div>

                {/* Selected machines not in standard MACHINE_OPTIONS */}
                {machineTypes.some(m => !MACHINE_OPTIONS.includes(m)) && (
                  <div className="mt-2.5 space-y-1">
                    <span className="text-[10px] text-gray-400 block font-sans">Нэмэлтээр оруулсан хүнд техникүүд:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {machineTypes.filter(m => !MACHINE_OPTIONS.includes(m)).map((item, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center space-x-1.5 py-1 px-2 rounded-md bg-emerald-500/10 border border-emerald-550/40 text-emerald-300 text-[10.5px]"
                        >
                          <span>{item}</span>
                          <button
                            type="button"
                            onClick={() => toggleMachine(item)}
                            className="text-gray-400 hover:text-rose-400 font-bold ml-1 text-xs cursor-pointer focus:outline-none"
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

          {/* Security Questions Section with Premium Banner */}
          <div className="border-t border-slate-800 pt-4 space-y-4 font-sans text-left">
            <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800 space-y-3 relative overflow-hidden">
              {/* Glow element */}
              <div className={`absolute top-0 right-0 w-24 h-24 rounded-full bg-emerald-500/10 blur-xl transition-opacity duration-500 ${isSecured ? 'opacity-100' : 'opacity-0'}`}></div>
              
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                  <Lock className={`w-3.5 h-3.5 ${isSecured ? 'text-emerald-400' : 'text-amber-450'}`} />
                  <span>Бүртгэлийн аюулгүй байдал</span>
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold transition-all ${
                  isSecured 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}>
                  {isSecured ? '100% Хамгаалагдсан' : '75% Хамгаалалт (Дутуу)'}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${isSecured ? 'bg-emerald-500 w-full' : 'bg-amber-500 w-[75%]'}`}></div>
              </div>

              <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
                💡 <strong className="font-semibold text-slate-300">Нууц асуултын ач холбогдол:</strong> Нууц үгээ утасны дугаараар мартсан үед сэргээхэд энэхүү асуултуудыг асуух болно. Зөвхөн та хариулж чадах тул бусад хүмүүс таны хаягийг хулгайлахаас 100% сэргийлнэ. Заавал тохируулах шаардлагагүй боловч таны хаяг аюулгүй үлдэхэд маш чухал юм.
              </p>
            </div>

            <div className="space-y-3.5">
              {/* Question 1 */}
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Аюулгүй байдлын асуулт 1</label>
                <select
                  value={securityQuestion1}
                  onChange={(e) => setSecurityQuestion1(e.target.value)}
                  className="block w-full px-3 py-1.5 border border-slate-700 rounded bg-slate-900 text-white text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="" className="bg-slate-900 text-white">-- Асуулт сонгох --</option>
                  {SECURITY_QUESTIONS.map((q, idx) => (
                    <option key={idx} value={q} className="bg-slate-900 text-white">{q}</option>
                  ))}
                </select>
                {securityQuestion1 && (
                  <input
                    type="text"
                    value={securityAnswer1}
                    onChange={(e) => setSecurityAnswer1(e.target.value)}
                    placeholder="Асуулт 1-ийн хариулт"
                    className="block w-full mt-1.5 px-3 py-1.5 border border-slate-700 rounded bg-slate-850 text-white text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none font-sans"
                  />
                )}
              </div>

              {/* Question 2 */}
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Аюулгүй байдлын асуулт 2</label>
                <select
                  value={securityQuestion2}
                  onChange={(e) => setSecurityQuestion2(e.target.value)}
                  className="block w-full px-3 py-1.5 border border-slate-700 rounded bg-slate-900 text-white text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="" className="bg-slate-900 text-white">-- Асуулт сонгох --</option>
                  {SECURITY_QUESTIONS.map((q, idx) => (
                    <option key={idx} value={q} className="bg-slate-900 text-white">{q}</option>
                  ))}
                </select>
                {securityQuestion2 && (
                  <input
                    type="text"
                    value={securityAnswer2}
                    onChange={(e) => setSecurityAnswer2(e.target.value)}
                    placeholder="Асуулт 2-ийн хариулт"
                    className="block w-full mt-1.5 px-3 py-1.5 border border-slate-700 rounded bg-slate-850 text-white text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none font-sans"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex space-x-3 pt-4 border-t border-slate-800">
            <button
              id="cancel-profile-edit-btn"
              type="button"
              onClick={onClose}
              className="flex-1 py-1.5 px-4 border border-slate-700 text-gray-300 text-xs font-medium rounded hover:bg-slate-850 transition-colors cursor-pointer"
            >
              Буцах
            </button>
            <button
              id="submit-profile-edit-btn"
              type="submit"
              className="flex-1 py-1.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded transition-colors flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Шинэчлэх</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
