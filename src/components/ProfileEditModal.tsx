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
  const [phone2, setPhone2] = useState<string>(user.phone2 || '');
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
  const [success, setSuccess] = useState<string>('');
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
    if (success) return; // Prevent double submission when success message is shown

    const isNameValid = firstName.trim() !== '' && lastName.trim() !== '';
    if (!isNameValid || !phone || !address) {
      setError('Шаардлагатай мэдээллүүдийг бүрэн бөглөнө үү. (Овог, Нэр, Утас, Хаяг)');
      return;
    }

    if (securityQuestion1 && securityQuestion2 && securityQuestion1 === securityQuestion2) {
      setError('Аюулгүй байдлын хоёр асуулт хоорондоо ижил байж болохгүй. Өөр асуултууд сонгоно уу.');
      return;
    }

    // Validation for matching security questions and answers
    if ((securityQuestion1 && !securityAnswer1.trim()) || (!securityQuestion1 && securityAnswer1.trim())) {
      setError('Аюулгүй байдлын асуулт 1 болон түүний хариултыг хоёуланг нь бөглөх шаардлагатай.');
      return;
    }
    if ((securityQuestion2 && !securityAnswer2.trim()) || (!securityQuestion2 && securityAnswer2.trim())) {
      setError('Аюулгүй байдлын асуулт 2 болон түүний хариултыг хоёуланг нь бөглөх шаардлагатай.');
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
      phone2: phone2.trim() || undefined,
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

      // Determine what was updated to show a specific message
      const isSecurityUpdated = 
        (securityQuestion1 !== (user.securityQuestion1 || '') || 
         securityAnswer1 !== (user.securityAnswer1 || '') ||
         securityQuestion2 !== (user.securityQuestion2 || '') || 
         securityAnswer2 !== (user.securityAnswer2 || ''));
      
      if (isSecurityUpdated && securityQuestion1 && securityAnswer1 && securityQuestion2 && securityAnswer2) {
        setSuccess('Аюулгүй байдлын асуултууд амжилттай бүртгэгдлээ!');
      } else {
        setSuccess('Мэдээлэл амжилттай шинэчлэгдлээ!');
      }
      
      setError('');
      
      setTimeout(() => {
        onSave(updated);
      }, 2000);
    } catch (err) {
      setError('Мэдээллийг хадгалахад алдаа гарлаа.');
    }
  };

  const isSecured = !!(securityQuestion1.trim() && securityAnswer1.trim() && securityQuestion2.trim() && securityAnswer2.trim());

  return (
    <div 
      id="profile-edit-modal-backdrop" 
      onClick={onClose}
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto"
    >
      <div 
        id="profile-edit-content-container" 
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900/60 backdrop-blur-xl border border-[var(--color-glass-border)] rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-[var(--color-glass-border)] px-6 py-4">
          <h3 className="text-base font-semibold text-[#f1f3f8]">Хувийн мэдээлэл засварлах</h3>
          <button id="close-profile-edit-btn" onClick={onClose} className="text-[#9aa3b5] hover:text-[#f1f3f8] transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-300 px-4 py-2 rounded text-xs animate-fade-in">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-violet-600/10 border border-violet-600 text-violet-400 px-4 py-2 rounded text-xs flex items-center space-x-2 animate-fade-in">
              <Check className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Edit form fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#9aa3b5] mb-1">
                Овог
              </label>
              <input
                id="edit-lastname"
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="block w-full px-3 py-1.5 border border-[var(--color-glass-border)] rounded bg-white/5 text-[#f1f3f8] text-xs focus:ring-1 focus:ring-violet-600 focus:outline-none font-sans"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#9aa3b5] mb-1">
                Нэр
              </label>
              <input
                id="edit-firstname"
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="block w-full px-3 py-1.5 border border-[var(--color-glass-border)] rounded bg-white/5 text-[#f1f3f8] text-xs focus:ring-1 focus:ring-violet-600 focus:outline-none font-sans"
              />
            </div>
          </div>

          {user.type === 'employer' && (
            <div className="grid grid-cols-1">
              <div>
                <label className="block text-xs font-medium text-[#9aa3b5] mb-1">
                  Компанийн нэр (Заавал биш)
                </label>
                <input
                  id="edit-companyname"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder=""
                  className="block w-full px-3 py-1.5 border border-[var(--color-glass-border)] rounded bg-white/5 text-[#f1f3f8] text-xs focus:ring-1 focus:ring-violet-600 focus:outline-none font-sans"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#9aa3b5] mb-1">Утасны дугаар</label>
              <input
                id="edit-phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="block w-full px-3 py-1.5 border border-[var(--color-glass-border)] rounded bg-white/5 text-[#f1f3f8] text-xs focus:ring-1 focus:ring-violet-600 focus:outline-none font-sans"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#9aa3b5] mb-1">Имэйл хаяг</label>
              <input
                id="edit-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full px-3 py-1.5 border border-[var(--color-glass-border)] rounded bg-white/5 text-[#f1f3f8] text-xs focus:ring-1 focus:ring-violet-600 focus:outline-none font-sans"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#9aa3b5] mb-1">Утасны дугаар 2 (Заавал биш)</label>
              <input
                id="edit-phone2"
                type="tel"
                value={phone2}
                onChange={(e) => setPhone2(e.target.value.replace(/[^0-9]/g, ''))}
                className="block w-full px-3 py-1.5 border border-[var(--color-glass-border)] rounded bg-white/5 text-[#f1f3f8] text-xs focus:ring-1 focus:ring-violet-600 focus:outline-none font-sans"
              />
            </div>
            <div></div>
          </div>

          <div className="grid grid-cols-1">
            <div>
              <label className="block text-xs font-medium text-[#9aa3b5] mb-1">Гэрийн хаяг</label>
              <input
                id="edit-address"
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="block w-full px-3 py-1.5 border border-[var(--color-glass-border)] rounded bg-white/5 text-[#f1f3f8] text-xs focus:ring-1 focus:ring-violet-600 focus:outline-none font-sans"
              />
            </div>
          </div>

          {/* Custom profile picture uploader */}
          <div>
            <label className="block text-xs font-medium text-[#9aa3b5] mb-1.5 flex justify-between">
              <span>Профайл зураг солих</span>
              <span className="text-[10px] text-slate-500 font-sans">(компьютер эсвэл утаснаас зураг сонгож оруулна уу)</span>
            </label>
            <div className="space-y-3">
              {/* File upload input */}
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-16 border border-[var(--color-glass-border)] border-dashed rounded-lg cursor-pointer bg-white/5 hover:bg-white/5 transition-all">
                  <div className="flex flex-col items-center justify-center py-1">
                    <span className="text-xs text-violet-600 font-semibold">Шинэ зураг хуулах (Upload)</span>
                    <span className="text-[10px] text-slate-500 font-sans">PNG, JPG, JPEG формат</span>
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
              <div className="flex items-center space-x-3.5 bg-white/5 p-2.5 rounded-lg border border-[var(--color-glass-border)]">
                <img
                  src={avatar}
                  alt="Current Avatar"
                  className="w-12 h-12 rounded-full border-2 border-[var(--color-glass-border)] object-cover"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <span className="text-xs font-bold text-[#f1f3f8] block">Идэвхтэй зураг</span>
                  <span className="text-[10px] text-violet-600 font-medium font-sans mt-0.5 block flex items-center space-x-1">
                    <span>✓ Одоогоор сонгогдсон байна</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bio edit */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-medium text-[#9aa3b5]">Таны тухай, нэмэлт мэдээлэл</label>
              <button
                type="button"
                onClick={handleOptimizeBio}
                disabled={isOptimizing}
                className="text-[10px] text-violet-600 hover:text-violet-400 flex items-center space-x-1 border border-violet-600/30 bg-violet-600/5 px-2.5 py-1 rounded cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-sans"
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
              className="block w-full px-3 py-2.5 border border-[var(--color-glass-border)] rounded bg-white/5 text-[#f1f3f8] text-xs focus:ring-1 focus:ring-violet-600 focus:outline-none font-sans min-h-[160px] leading-relaxed"
            />
          </div>

          {/* Operator Specific Info */}
          {user.type === 'operator' && (
            <div className="border-t border-[var(--color-glass-border)] pt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#9aa3b5] mb-1">Ажилласан туршлага (Жилээр)</label>
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
                  className="block w-[80px] px-2 py-1 border border-[var(--color-glass-border)] rounded bg-white/5 text-[#f1f3f8] text-xs focus:ring-1"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#9aa3b5] mb-1.5">Мэргэшсэн Хүнд Машин Механизмууд</label>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  {MACHINE_OPTIONS.map((item, idx) => (
                    <button
                      id={`edit-machine-option-${idx}`}
                      type="button"
                      key={idx}
                      onClick={() => toggleMachine(item)}
                      className={`flex items-center space-x-1.5 py-1 px-2.5 rounded transition-colors text-left border cursor-pointer ${
                        machineTypes.includes(item)
                          ? 'border-violet-600 bg-violet-600/10 text-violet-400'
                          : 'border-[var(--color-glass-border)] bg-white/5 text-[#9aa3b5] hover:border-[var(--color-glass-border)]'
                      }`}
                    >
                      <span>{item}</span>
                    </button>
                  ))}
                </div>

                {/* Hand-written custom machine entry box */}
                <div className="mt-3.5 pt-3 border-t border-[var(--color-glass-border)]">
                  <label className="block text-[11px] font-medium text-[#9aa3b5] mb-1">
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
                      className="flex-1 px-2.5 py-1.5 border border-[var(--color-glass-border)] bg-white/5 rounded text-xs text-[#f1f3f8] focus:outline-none focus:ring-1 focus:ring-violet-600 placeholder-slate-500 font-sans"
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
                      className="px-3 bg-white/5 border border-[var(--color-glass-border)] hover:bg-white/10 text-violet-600 rounded text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Нэмэх
                    </button>
                  </div>
                </div>

                {/* Selected machines not in standard MACHINE_OPTIONS */}
                {machineTypes.some(m => !MACHINE_OPTIONS.includes(m)) && (
                  <div className="mt-2.5 space-y-1">
                    <span className="text-[10px] text-[#9aa3b5] block font-sans">Нэмэлтээр оруулсан хүнд техникүүд:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {machineTypes.filter(m => !MACHINE_OPTIONS.includes(m)).map((item, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center space-x-1.5 py-1 px-2 rounded-md bg-violet-600/10 border border-violet-600/40 text-violet-400 text-[10.5px]"
                        >
                          <span>{item}</span>
                          <button
                            type="button"
                            onClick={() => toggleMachine(item)}
                            className="text-[#9aa3b5] hover:text-red-400 font-bold ml-1 text-xs cursor-pointer focus:outline-none"
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
          <div className="border-t border-[var(--color-glass-border)] pt-4 space-y-4 font-sans text-left">
            <div className="bg-[var(--color-glass-bg)] p-4 rounded-xl border border-[var(--color-glass-border)] space-y-3 relative overflow-hidden">
              {/* Glow element */}
              <div className={`absolute top-0 right-0 w-24 h-24 rounded-full bg-violet-600/10 blur-xl transition-opacity duration-500 ${isSecured ? 'opacity-100' : 'opacity-0'}`}></div>
              
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-[#f1f3f8] flex items-center space-x-1.5">
                  <Lock className={`w-3.5 h-3.5 ${isSecured ? 'text-[var(--color-neon-teal)]' : 'text-violet-400'}`} />
                  <span>Бүртгэлийн аюулгүй байдал</span>
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold transition-all ${
                  isSecured 
                    ? 'bg-[var(--color-neon-teal)]/10 text-[var(--color-neon-teal)] border border-[var(--color-neon-teal)]/20' 
                    : 'bg-violet-600/10 text-violet-400 border border-violet-600/20'
                }`}>
                  {isSecured ? '100% Хамгаалагдсан' : '75% Хамгаалалт (Дутуу)'}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${isSecured ? 'bg-[var(--color-neon-teal)] w-full' : 'bg-violet-600 w-[75%]'}`}></div>
              </div>

              <p className="text-[10px] text-slate-500 leading-relaxed font-sans">
                💡 <strong className="font-semibold text-[#9aa3b5]">Нууц асуултын ач холбогдол:</strong> Нууц үгээ утасны дугаараар мартсан үед сэргээхэд энэхүү асуултуудыг асуух болно. Зөвхөн та хариулж чадах тул бусад хүмүүс таны хаягийг хулгайлахаас 100% сэргийлнэ. Заавал тохируулах шаардлагагүй боловч таны хаяг аюулгүй үлдэхэд маш чухал юм.
              </p>
            </div>

            <div className="space-y-3.5">
              {/* Question 1 */}
              <div>
                <label className="block text-xs font-medium text-[#9aa3b5] mb-1">Аюулгүй байдлын асуулт 1</label>
                <select
                  value={securityQuestion1}
                  onChange={(e) => setSecurityQuestion1(e.target.value)}
                  className="block w-full px-3 py-1.5 border border-[var(--color-glass-border)] rounded bg-white/5 text-[#f1f3f8] text-xs focus:ring-1 focus:ring-violet-600 focus:outline-none"
                >
                  <option value="" className="bg-slate-900 text-[#f1f3f8]">-- Асуулт сонгох --</option>
                  {SECURITY_QUESTIONS.map((q, idx) => (
                    <option key={idx} value={q} className="bg-slate-900 text-[#f1f3f8]">{q}</option>
                  ))}
                </select>
                {securityQuestion1 && (
                  <input
                    type="text"
                    value={securityAnswer1}
                    onChange={(e) => setSecurityAnswer1(e.target.value)}
                    placeholder="Асуулт 1-ийн хариулт"
                    className="block w-full mt-1.5 px-3 py-1.5 border border-[var(--color-glass-border)] rounded bg-white/5 text-[#f1f3f8] text-xs focus:ring-1 focus:ring-violet-600 focus:outline-none font-sans"
                  />
                )}
              </div>

              {/* Question 2 */}
              <div>
                <label className="block text-xs font-medium text-[#9aa3b5] mb-1">Аюулгүй байдлын асуулт 2</label>
                <select
                  value={securityQuestion2}
                  onChange={(e) => setSecurityQuestion2(e.target.value)}
                  className="block w-full px-3 py-1.5 border border-[var(--color-glass-border)] rounded bg-white/5 text-[#f1f3f8] text-xs focus:ring-1 focus:ring-violet-600 focus:outline-none"
                >
                  <option value="" className="bg-slate-900 text-[#f1f3f8]">-- Асуулт сонгох --</option>
                  {SECURITY_QUESTIONS.map((q, idx) => (
                    <option key={idx} value={q} className="bg-slate-900 text-[#f1f3f8]">{q}</option>
                  ))}
                </select>
                {securityQuestion2 && (
                  <input
                    type="text"
                    value={securityAnswer2}
                    onChange={(e) => setSecurityAnswer2(e.target.value)}
                    placeholder="Асуулт 2-ийн хариулт"
                    className="block w-full mt-1.5 px-3 py-1.5 border border-[var(--color-glass-border)] rounded bg-white/5 text-[#f1f3f8] text-xs focus:ring-1 focus:ring-violet-600 focus:outline-none font-sans"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex space-x-3 pt-4 border-t border-[var(--color-glass-border)]">
            <button
              id="cancel-profile-edit-btn"
              type="button"
              disabled={!!success}
              onClick={onClose}
              className="flex-1 py-1.5 px-4 border border-[var(--color-glass-border)] text-[#9aa3b5] text-xs font-medium rounded hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Буцах
            </button>
            <button
              id="submit-profile-edit-btn"
              type="submit"
              disabled={!!success}
              className="flex-1 py-1.5 px-4 bg-violet-600 hover:bg-violet-600 text-white text-xs font-medium rounded transition-colors flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {success ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              <span>{success ? 'Шинэчлэгдлээ' : 'Шинэчлэх'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
