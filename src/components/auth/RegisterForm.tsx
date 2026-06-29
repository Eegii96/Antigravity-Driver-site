'use client';

import { FormEvent, ChangeEvent } from 'react';
import { User as UserIcon, Phone, MapPin, Truck, Check, AlertCircle, Sparkles, X, Eye, EyeOff } from 'lucide-react';
import type { AuthFormState } from './useAuthForm';
import { AVATAR_PRESETS, MACHINE_OPTIONS } from './constants';

interface RegisterFormProps {
  form: AuthFormState;
  onRegister: (e: FormEvent) => void;
  onOptimizeBio: () => void;
}

/** Full registration form — role selector, personal details, password, avatar, bio, machine picker. */
export default function RegisterForm({ form, onRegister, onOptimizeBio }: RegisterFormProps) {
  const {
    userType, setUserType,
    email, setEmail,
    lastName, setLastName,
    firstName, setFirstName,
    companyName, setCompanyName,
    phone, setPhone,
    address, setAddress,
    regPassword, setRegPassword,
    regConfirmPassword, setRegConfirmPassword,
    showRegPassword, setShowRegPassword,
    showRegConfirmPassword, setShowRegConfirmPassword,
    selectedAvatar, setSelectedAvatar,
    bio, setBio,
    setOriginalBio, setHasOptimized,
    isOptimizing, hasOptimized,
    experienceYears, setExperienceYears,
    selectedMachines, setSelectedMachines,
    customRegMachine, setCustomRegMachine,
    isAgreedToTerms, setIsAgreedToTerms,
    isSubmitting,
    successMsg, error,
    setShowTerms, setShowPrivacy,
  } = form;

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      form.setError('Зураг 2MB-аас бага хэмжээтэй байх ёстой.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') setSelectedAvatar(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const toggleMachine = (machine: string) => {
    if (selectedMachines.includes(machine)) {
      setSelectedMachines(selectedMachines.filter(m => m !== machine));
    } else {
      setSelectedMachines([...selectedMachines, machine]);
    }
  };

  const isFormValid =
    firstName.trim() !== '' &&
    lastName.trim() !== '' &&
    (email.trim() === '' || email.includes('@')) &&
    phone.trim() !== '' &&
    phone.trim().length >= 8 &&
    address.trim() !== '' &&
    regPassword.length >= 8 &&
    /[!@#$%^&*(),.?":{}|<>_\-+=]/.test(regPassword) &&
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
            className="block w-full px-3 py-1.5 input text-xs text-[var(--accent-foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] font-sans"
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
            className="block w-full px-3 py-1.5 input text-xs text-[var(--accent-foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] font-sans"
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
              className="block w-full px-3 py-1.5 input text-xs text-[var(--accent-foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] font-sans"
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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder=""
            className="block w-full px-3 py-1.5 input text-xs text-[var(--accent-foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] font-sans"
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
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder=""
              className="block w-full pl-9 pr-3 py-1.5 input text-xs text-[var(--accent-foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1" htmlFor="reg-address">
            Гэрийн/Байгууллагын хаяг
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MapPin className="h-4 w-4 text-[var(--muted-foreground)]" />
            </div>
            <input
              id="reg-address"
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder=""
              className="block w-full pl-9 pr-3 py-1.5 input text-xs text-[var(--accent-foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
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
              value={regPassword}
              onChange={(e) => setRegPassword(e.target.value)}
              placeholder=""
              className="block w-full pl-3 pr-10 py-1.5 input text-xs text-[var(--accent-foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] font-sans"
            />
            <span
              id="toggle-reg-pass-visibility"
              onClick={() => setShowRegPassword(!showRegPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--muted-foreground)] hover:text-[var(--accent-foreground)] cursor-pointer"
            >
              {showRegPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
            </span>
          </div>
          {regPassword !== '' && regPassword.length < 8 && (
            <p className="text-[10px] text-red-400 mt-1 font-sans flex items-center space-x-1">
              <span className="font-bold">✗</span>
              <span>Нууц үг хамгийн багадаа 8 тэмдэгт байх шаардлагатай! (Одоо: {regPassword.length})</span>
            </p>
          )}
          {regPassword !== '' && regPassword.length >= 8 && !/[!@#$%^&*(),.?":{}|<>_\-+=]/.test(regPassword) && (
            <p className="text-[10px] text-red-400 mt-1 font-sans flex items-center space-x-1">
              <span className="font-bold">✗</span>
              <span>Нууц үгэнд дор хаяж нэг тусгай тэмдэгт (!@#$%^&* гэх мэт) орох шаардлагатай!</span>
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
              value={regConfirmPassword}
              onChange={(e) => setRegConfirmPassword(e.target.value)}
              placeholder=""
              className="block w-full pl-3 pr-10 py-1.5 input text-xs text-[var(--accent-foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] font-sans"
            />
            <span
              id="toggle-reg-confirm-pass-visibility"
              onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--muted-foreground)] hover:text-[var(--fg)] cursor-pointer"
            >
              {showRegConfirmPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
            </span>
          </div>
          {regConfirmPassword !== '' && regPassword !== regConfirmPassword && (
            <p className="text-[10px] text-red-400 mt-1 font-sans flex items-center space-x-1">
              <span className="font-bold">✗</span>
              <span>Давтан оруулсан нууц үг тохирохгүй байна!</span>
            </p>
          )}
        </div>

        {/* Live Password Checklist */}
        <div className="bg-[var(--color-glass-bg)] p-3 rounded-lg border border-[var(--color-glass-border)] space-y-1.5 font-sans">
          <span className="text-[10px] font-semibold text-[var(--muted-foreground)] block mb-1">Нууц үгэнд тавих шаардлага:</span>
          <div className="flex items-center space-x-2 text-[10.5px]">
            <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 border ${regPassword.length >= 8
                ? 'bg-[var(--accent-soft)] text-[var(--accent-soft-foreground)] border-[var(--accent)]'
                : 'bg-red-500/10 text-red-400 border-red-500/30'
              }`}>
              {regPassword.length >= 8 ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
            </div>
            <span className={regPassword.length >= 8 ? 'text-[var(--accent-soft-foreground)] font-medium' : 'text-[var(--muted-foreground)]'}>
              Хамгийн багадаа 8 тэмдэгт (Одоогийн урт: {regPassword.length})
            </span>
          </div>
          <div className="flex items-center space-x-2 text-[10.5px]">
            <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 border ${/[!@#$%^&*(),.?":{}|<>_\-+=]/.test(regPassword)
                ? 'bg-[var(--accent-soft)] text-[var(--accent-soft-foreground)] border-[var(--accent)]'
                : 'bg-red-500/10 text-red-400 border-red-500/30'
              }`}>
              {/[!@#$%^&*(),.?":{}|<>_\-+=]/.test(regPassword) ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
            </div>
            <span className={/[!@#$%^&*(),.?":{}|<>_\-+=]/.test(regPassword) ? 'text-[var(--accent-soft-foreground)] font-medium' : 'text-[var(--muted-foreground)]'}>
              Дор хаяж нэг тусгай тэмдэгт (!@#$%^&* гэх мэт)
            </span>
          </div>
          <div className="flex items-center space-x-2 text-[10.5px]">
            <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 border ${(regPassword === regConfirmPassword && regConfirmPassword !== '')
                ? 'bg-[var(--accent-soft)] text-[var(--accent-soft-foreground)] border-[var(--accent)]'
                : 'bg-red-500/10 text-red-400 border-red-500/30'
              }`}>
              {(regPassword === regConfirmPassword && regConfirmPassword !== '') ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
            </div>
            <span className={(regPassword === regConfirmPassword && regConfirmPassword !== '') ? 'text-[var(--accent-soft-foreground)] font-medium' : 'text-[var(--muted-foreground)]'}>
              Хоёр нууц үг хоорондоо тохирох
            </span>
          </div>
        </div>
      </div>

      {/* Avatar Picker */}
      <div>
        <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1.5 font-sans">Профайл зураг сонгох</label>
        <div className="flex items-center space-x-6">
          <div className="flex space-x-3 items-center">
            {AVATAR_PRESETS.map((avatar, idx) => (
              <button
                id={`preset-avatar-${idx}`}
                key={idx}
                type="button"
                onClick={() => setSelectedAvatar(avatar)}
                className={`relative rounded-full overflow-hidden w-12 h-12 border-2 transition-colors cursor-pointer ${selectedAvatar === avatar ? 'border-[var(--accent)]' : 'border-transparent'}`}
              >
                <img src={avatar} alt={`Avatar Preset ${idx + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                {selectedAvatar === avatar && (
                  <div className="absolute inset-0 bg-[var(--accent-soft)] flex items-center justify-center">
                    <Check className="w-4 h-4 text-[var(--accent-soft-foreground)]" />
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="border-l border-[var(--border)] pl-4 py-1.5 flex flex-col justify-center">
            <label className="text-xs text-[var(--accent-soft-foreground)] hover:text-[var(--accent-soft-foreground)] underline cursor-pointer font-sans inline-flex items-center space-x-1">
              <span>Эсвэл өөрийн зургийг хуулах (Upload)</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
            {!AVATAR_PRESETS.includes(selectedAvatar) && (
              <div className="mt-1 flex items-center space-x-2">
                <img src={selectedAvatar} alt="Custom upload" className="w-7 h-7 rounded-full object-cover border border-[var(--accent)]" referrerPolicy="no-referrer" />
                <span className="text-[10px] text-[var(--accent-soft-foreground)]">Зургийг сонголоо!</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bio */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="block text-xs font-medium text-[var(--muted-foreground)]" htmlFor="reg-bio">
            Нэмэлт Мэдээлэл / Био (Туршлага, ажлын чиглэл, товч танилцуулга г.м)
          </label>
          <button
            type="button"
            onClick={onOptimizeBio}
            disabled={isOptimizing}
            className="text-[10px] text-[var(--accent-soft-foreground)] hover:text-[var(--accent-soft-foreground)] flex items-center space-x-1 border border-[var(--accent)] bg-[var(--accent-soft)] px-2.5 py-0.5 rounded cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-sans"
          >
            <Sparkles className={`w-3 h-3 ${isOptimizing ? 'animate-spin' : ''}`} />
            <span>{isOptimizing ? 'AI сайжруулж байна...' : (hasOptimized ? 'Өөр загвар гаргах' : 'AI-аар сайжруулах')}</span>
          </button>
        </div>
        <textarea
          id="reg-bio"
          rows={6}
          value={bio}
          onChange={(e) => {
            const val = e.target.value;
            setBio(val);
            setOriginalBio(val);
            setHasOptimized(false);
          }}
          placeholder=""
          className="block w-full px-3 py-2.5 input text-xs text-[var(--accent-foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] font-sans min-h-[140px] leading-relaxed"
        />
      </div>

      {/* Operator-specific fields */}
      {userType === 'operator' && (
        <div className="border-t border-[var(--border)] pt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1" htmlFor="reg-experience">
              Ажилласан туршлага (Жилээр)
            </label>
            <input
              id="reg-experience"
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
              className="block w-[100px] px-3 py-1.5 input text-xs text-[var(--accent-foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1.5">
              Мэргэшсэн Хүнд Машин Механизмууд (Сонгоно уу)
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs font-sans">
              {MACHINE_OPTIONS.map((item, id) => (
                <button
                  id={`machine-option-${id}`}
                  type="button"
                  key={id}
                  onClick={() => toggleMachine(item)}
                  className={`flex items-center space-x-1.5 py-1 px-2.5 rounded transition-colors text-left border cursor-pointer ${selectedMachines.includes(item)
                      ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-soft-foreground)]'
                      : 'border-[var(--color-glass-border)] bg-[var(--color-glass-bg)] text-[var(--muted-foreground)] hover:border-[var(--border)]'
                    }`}
                >
                  <span className="text-xs">{item}</span>
                </button>
              ))}
            </div>

            {/* Custom machine entry */}
            <div className="mt-3.5 pt-3 border-t border-[var(--border)]">
              <label className="block text-[11px] font-medium text-[var(--muted-foreground)] mb-1">
                Бусад машин механизм нэмэх (Гараар бичих)
              </label>
              <div className="flex space-x-2">
                <input
                  id="custom-machine-reg-input"
                  type="text"
                  placeholder=""
                  value={customRegMachine}
                  onChange={(e) => setCustomRegMachine(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const trimmed = customRegMachine.trim();
                      if (trimmed && !selectedMachines.includes(trimmed)) {
                        setSelectedMachines([...selectedMachines, trimmed]);
                      }
                      setCustomRegMachine('');
                    }
                  }}
                  className="flex-1 px-2.5 py-1.5 input text-xs text-[var(--accent-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] placeholder-[var(--muted-foreground)] font-sans"
                />
                <button
                  id="add-custom-machine-reg-btn"
                  type="button"
                  onClick={() => {
                    const trimmed = customRegMachine.trim();
                    if (trimmed && !selectedMachines.includes(trimmed)) {
                      setSelectedMachines([...selectedMachines, trimmed]);
                    }
                    setCustomRegMachine('');
                  }}
                  className="px-3 bg-[var(--color-glass-bg)] border border-[var(--color-glass-border)] hover:bg-[var(--bg2)] text-[var(--accent-soft-foreground)] rounded text-xs font-semibold transition-colors cursor-pointer"
                >
                  Нэмэх
                </button>
              </div>
            </div>

            {/* Custom machines list */}
            {selectedMachines.some(m => !MACHINE_OPTIONS.includes(m)) && (
              <div className="mt-2.5 space-y-1">
                <span className="text-[10px] text-[var(--muted-foreground)] block font-sans">Нэмэлтээр оруулсан хүнд техникүүд:</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedMachines.filter(m => !MACHINE_OPTIONS.includes(m)).map((item, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center space-x-1.5 py-1 px-2 rounded-md bg-[var(--accent-soft)] border border-[var(--accent)] text-[var(--accent-soft-foreground)] text-[10.5px]"
                    >
                      <span>{item}</span>
                      <button
                        type="button"
                        onClick={() => toggleMachine(item)}
                        className="text-[var(--muted-foreground)] hover:text-red-400 font-bold ml-1 text-xs cursor-pointer focus:outline-none"
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

      {/* Validation warnings */}
      {!isFormValid && (
        <div className="mt-4 p-3.5 bg-red-500/5 border border-red-500/25 text-red-300 rounded-lg text-xs space-y-1.5 font-sans animate-fade-in leading-relaxed">
          <div className="flex items-center space-x-1.5 font-bold text-red-400 mb-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Бүртгүүлэхийн тулд дараах мэдээллүүдийг гүйцээнэ үү:</span>
          </div>
          <ul className="list-disc pl-4.5 space-y-1 text-[10.5px] text-[var(--muted-foreground)]">
            {lastName.trim() === '' && <li>Овгоо оруулна уу.</li>}
            {firstName.trim() === '' && <li>Нэрээ оруулна уу.</li>}
            {email.trim() !== '' && !email.includes('@') && <li>Зөв имэйл хаяг оруулна уу.</li>}
            {phone.trim() === '' && <li>Утасны дугаараа оруулна уу.</li>}
            {phone.trim() !== '' && phone.trim().length < 8 && <li>Утасны дугаар дор хаяж 8 оронтой байх ёстой.</li>}
            {address.trim() === '' && <li>Гэрийн/Байгууллагын хаягаа оруулна уу.</li>}
            {regPassword === '' && <li>Нэвтрэх нууц кодоо оруулна уу.</li>}
            {regPassword !== '' && regPassword.length < 8 && <li>Нууц код хамгийн багадаа 8 тэмдэгт байх шаардлагатай.</li>}
            {regPassword !== '' && !/[!@#$%^&*(),.?":{}|<>_\-+=]/.test(regPassword) && <li>Нууц код дор хаяж нэг тусгай тэмдэгт (!@#$%^&* гэх мэт) агуулсан байх шаардлагатай.</li>}
            {regConfirmPassword === '' && <li>Нууц кодоо давтан оруулна уу.</li>}
            {regPassword !== '' && regConfirmPassword !== '' && regPassword !== regConfirmPassword && <li>Хоёр нууц код хоорондоо тохирохгүй байна.</li>}
            {!isAgreedToTerms && <li>Үйлчилгээний нөхцөл болон Нууцлалын бодлогыг хүлээн зөвшөөрөх шаардлагатай.</li>}
          </ul>
        </div>
      )}

      {/* Terms consent */}
      <div className="flex items-start space-x-2.5 bg-[var(--color-glass-bg)] p-3.5 rounded-lg border border-[var(--color-glass-border)] mt-4 animate-fade-in">
        <input
          id="agree-terms-checkbox"
          type="checkbox"
          checked={isAgreedToTerms}
          onChange={(e) => setIsAgreedToTerms(e.target.checked)}
          className="w-4.5 h-4.5 rounded text-[var(--accent-soft-foreground)] bg-[var(--color-glass-bg)] border-[var(--color-glass-border)] focus:ring-[var(--accent)] focus:ring-offset-[var(--card)] accent-[var(--accent)] shrink-0 mt-0.5 cursor-pointer"
        />
        <label htmlFor="agree-terms-checkbox" className="text-xs text-[var(--muted-foreground)] leading-normal select-none font-sans">
          Би энэхүү платформын{' '}
          <button type="button" onClick={() => setShowTerms(true)} className="text-[var(--accent-soft-foreground)] hover:text-[var(--accent-soft-foreground)] underline font-semibold transition-colors cursor-pointer bg-transparent border-none p-0">Үйлчилгээний нөхцөл</button>
          {' '}болон{' '}
          <button type="button" onClick={() => setShowPrivacy(true)} className="text-[var(--verify)] hover:text-[var(--verify)] underline font-semibold transition-colors cursor-pointer bg-transparent border-none p-0">Нууцлалын бодлого</button>
          -той бүрэн танилцаж, хүлээн зөвшөөрч байна.
        </label>
      </div>

      {/* Submit */}
      <div className="pt-3">
        <button
          id="submit-register-btn"
          type="submit"
          disabled={isSubmitting || !isFormValid}
          className={`w-full flex justify-center py-2.5 px-4 border border-transparent rounded text-[var(--accent-foreground)] font-medium text-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${!isSubmitting && isFormValid
              ? 'bg-[var(--accent)] hover:brightness-95 shadow-lg'
              : 'bg-[var(--bg2)] text-[var(--muted-foreground)] cursor-not-allowed opacity-50'
            }`}
        >
          {isSubmitting ? 'Бүртгэж байна...' : 'Бүртгүүлэх'}
        </button>
        {successMsg && (
          <div className="mt-3.5 bg-[var(--accent-soft)] border border-[var(--accent)] text-[var(--accent-soft-foreground)] px-4 py-2.5 rounded-lg text-xs flex items-center justify-center space-x-2 animate-fade-in font-sans">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-ping shrink-0"></span>
            <span className="text-left">{successMsg}</span>
          </div>
        )}
        {error && (
          <div className="mt-3.5 bg-red-500/10 border border-red-500/40 text-red-300 px-4 py-2.5 rounded-lg text-xs flex items-center justify-center text-center animate-fade-in font-sans">
            <span>{error}</span>
          </div>
        )}
      </div>
    </form>
  );
}
