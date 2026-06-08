import { useState, FormEvent } from 'react';
import { X, ShieldCheck } from 'lucide-react';
import { Job } from '../types';
import { addJob, updateJob } from '../lib/db';

interface JobPostModalProps {
  employerId: string;
  employerName: string;
  employerRating: number;
  onClose: () => void;
  onSuccess: (savedJob: Job) => void;
  jobToEdit?: Job;
}

const AIMAGS = [
  'custom',
  'Улаанбаатар хот',
  'Архангай аймаг',
  'Баян-Өлгий аймаг',
  'Баянхонгор аймаг',
  'Булган аймаг',
  'Говь-Алтай аймаг',
  'Говьсүмбэр аймаг',
  'Дархан-Уул аймаг',
  'Дорноговь аймаг',
  'Дорнод аймаг',
  'Дундговь аймаг',
  'Завхан аймаг',
  'Орхон аймаг',
  'Өвөрхангай аймаг',
  'Өмнөговь аймаг',
  'Сүхбаатар аймаг',
  'Сэлэнгэ аймаг',
  'Төв аймаг',
  'Увс аймаг',
  'Ховд аймаг',
  'Хөвсгөл аймаг',
  'Хэнтий аймаг'
];

export default function JobPostModal({
  employerId,
  employerName,
  employerRating,
  onClose,
  onSuccess,
  jobToEdit
}: JobPostModalProps) {
  const isEditing = !!jobToEdit;

  const [title, setTitle] = useState<string>(jobToEdit?.title || '');
  const [description, setDescription] = useState<string>(jobToEdit?.description || '');
  
  // Determine initial type selection
  const initialType = jobToEdit
    ? (['operator_hiring', 'machinery_rental', 'earthwork'].includes(jobToEdit.type)
        ? jobToEdit.type
        : 'custom')
    : 'operator_hiring';
  const [type, setType] = useState<string>(initialType);
  const [customType, setCustomType] = useState<string>(
    jobToEdit && !['operator_hiring', 'machinery_rental', 'earthwork'].includes(jobToEdit.type)
      ? jobToEdit.type
      : ''
  );

  const [salary, setSalary] = useState<number | ''>(
    jobToEdit ? (jobToEdit.salary === 0 ? '' : jobToEdit.salary) : 150000
  );
  const [isNegotiable, setIsNegotiable] = useState<boolean>(
    jobToEdit ? jobToEdit.salary === 0 : false
  );

  // Determine initial location selection
  const initialLocation = jobToEdit
    ? (AIMAGS.includes(jobToEdit.location) ? jobToEdit.location : 'custom')
    : 'Улаанбаатар хот';
  const [location, setLocation] = useState<string>(initialLocation);
  const [customLocation, setCustomLocation] = useState<string>(
    jobToEdit && !AIMAGS.includes(jobToEdit.location) ? jobToEdit.location : ''
  );
  
  // Default values for database schema, hidden from user form
  const [machineryType] = useState<string>('Бусад');
  const [salaryUnit] = useState<'Өдрөөр' | 'Цагаар' | 'Төслөөр'>('Өдрөөр');
  const [duration] = useState<string>('Тохиролцоно');
  const [requirements] = useState<string[]>([
    'Архидан согтуурахаас хол, хариуцлагатай байх',
    'Хүнд машин механизмын хүчин төгөлдөр үнэмлэхтэй байх'
  ]);
  
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title || (salary === '' && !isNegotiable) || (!isNegotiable && salary !== '' && salary <= 0)) {
      setError('Шаардлагатай бүх талбарыг бөглөнө үү.');
      return;
    }

    if (type === 'custom' && !customType.trim()) {
      setError('Шинээр нэмэх зарын төрлийг бичнэ үү.');
      return;
    }

    if (location === 'custom' && !customLocation.trim()) {
      setError('Байршлыг гараар оруулна уу.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const resolvedType = type === 'custom' ? customType.trim() : type;
      const resolvedLocation = location === 'custom' ? customLocation.trim() : location;
      const resolvedSalary = isNegotiable ? 0 : Number(salary);

      if (isEditing && jobToEdit) {
        const updatedFields = {
          title,
          description: description.trim() || 'Нэмэлт мэдээлэл оруулаагүй.',
          type: resolvedType,
          salary: resolvedSalary,
          location: resolvedLocation,
        };
        await updateJob(jobToEdit.id, updatedFields);
        onSuccess({
          ...jobToEdit,
          ...updatedFields
        });
      } else {
        const job = await addJob({
          title,
          description: description.trim() || 'Нэмэлт мэдээлэл оруулаагүй.',
          employerId,
          employerName,
          employerRating,
          type: resolvedType,
          machineryType,
          salary: resolvedSalary,
          salaryUnit,
          duration,
          location: resolvedLocation,
          requirements
        });
        onSuccess(job);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Ажлын зар хадгалахад алдаа гарлаа. Та дахин оролдоно уу.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="job-post-modal-backdrop" className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
      <div id="job-post-modal-container" className="bg-slate-900 border border-slate-700 max-w-xl w-full rounded-xl overflow-hidden shadow-2xl my-8">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 px-6 py-4">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <h3 className="text-sm font-semibold text-white">
              {isEditing ? 'Ажлын Зар Засварлах' : 'Шинэ Ажлын Зар Бүртгүүлэх'}
            </h3>
          </div>
          <button id="close-job-post-modal" onClick={onClose} className="text-gray-400 hover:text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500 text-rose-300 p-2.5 rounded text-xs">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1" htmlFor="job-title-input">
              Зарын Ерөнхий Гарчиг
            </label>
            <input
              id="job-title-input"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Жишээ: Дундговьд дампны жолооч авна"
              className="block w-full px-3 py-1.5 border border-slate-700 rounded bg-slate-850 text-white text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none placeholder-gray-500 font-sans"
            />
          </div>

          {/* Job Type Options */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Зарын Төрөл</label>
            <select
              id="job-type-selector"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="block w-full px-3 py-1.5 border border-slate-700 rounded bg-slate-850 text-white text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="operator_hiring" className="bg-slate-900 text-white">Жолооч, оператор хайж байна</option>
              <option value="machinery_rental" className="bg-slate-900 text-white">Машин механизмын түрээс</option>
              <option value="earthwork" className="bg-slate-900 text-white">Барилга, зам, газар шорооны ажил</option>
              <option value="custom" className="bg-slate-900 text-white">✍️ Өөр төрөл нэмэх...</option>
            </select>
          </div>

          {/* Custom job type input */}
          {type === 'custom' && (
            <div className="animate-fade-in">
              <label className="block text-xs font-medium text-gray-300 mb-1" htmlFor="custom-job-type">
                Шинээр нэмэх зарын төрөл
              </label>
              <input
                id="custom-job-type"
                type="text"
                required
                value={customType}
                onChange={(e) => setCustomType(e.target.value)}
                placeholder="Жишээ: Харуул хамгаалалт"
                className="block w-full px-3 py-1.5 border border-slate-700 rounded bg-slate-850 text-white text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none placeholder-gray-500 font-sans"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Location */}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Байршил (Аймаг/Хот)</label>
              <select
                id="job-location-selector"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="block w-full px-3 py-1.5 border border-slate-700 rounded bg-slate-850 text-white text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              >
                {AIMAGS.map((a, idx) => (
                  <option key={idx} value={a} className="bg-slate-900 text-white">
                    {a === 'custom' ? '✍️ Гараар байршил оруулах...' : a}
                  </option>
                ))}
              </select>
            </div>

            {/* Salary */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-medium text-gray-300" htmlFor="job-salary">
                  Үнэлгээ / Цалин (₮)
                </label>
                <label className="flex items-center space-x-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isNegotiable}
                    onChange={(e) => {
                      setIsNegotiable(e.target.checked);
                      if (e.target.checked) {
                        setSalary(0);
                      } else {
                        setSalary(150000);
                      }
                    }}
                    className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-850 text-emerald-500 focus:ring-0 cursor-pointer"
                  />
                  <span className="text-[10px] text-gray-400 font-sans">Тохиролцоно</span>
                </label>
              </div>
              <input
                id="job-salary"
                type="number"
                required={!isNegotiable}
                disabled={isNegotiable}
                min={isNegotiable ? undefined : 100}
                value={isNegotiable ? '' : salary}
                onChange={(e) => setSalary(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                onFocus={(e) => e.target.select()}
                placeholder={isNegotiable ? 'Тохиролцоно' : ''}
                className={`block w-full px-3 py-1.5 border border-slate-700 rounded bg-slate-850 text-white text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none ${isNegotiable ? 'opacity-50 cursor-not-allowed font-sans' : ''}`}
              />
            </div>
          </div>

          {/* Custom location input */}
          {location === 'custom' && (
            <div className="animate-fade-in">
              <label className="block text-xs font-medium text-gray-300 mb-1" htmlFor="custom-job-location">
                Гараар оруулах байршил
              </label>
              <input
                id="custom-job-location"
                type="text"
                required
                value={customLocation}
                onChange={(e) => setCustomLocation(e.target.value)}
                placeholder="Жишээ: Өмнөговь аймаг, Цогтцэций сум, 3-р баг"
                className="block w-full px-3 py-1.5 border border-slate-700 rounded bg-slate-850 text-white text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none placeholder-gray-500 font-sans"
              />
            </div>
          )}

          {/* Additional Info / Description */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1" htmlFor="job-desc">
              Нэмэлт мэдээлэл
            </label>
            <textarea
              id="job-desc"
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ажлын нөхцөл, хангамж, тавигдах шаардлага зэрэг бусад мэдээллийг энд оруулах боломжтой..."
              className="block w-full px-3 py-1.5 border border-slate-700 rounded bg-slate-850 text-white placeholder-gray-500 text-xs focus:ring-1 focus:outline-none resize-none font-sans"
            />
          </div>

          <div className="bg-slate-950/40 p-3.5 rounded-lg border border-slate-800/60 flex items-center space-x-2 text-[10px] text-gray-400">
            <span className="text-emerald-500">🛡️</span>
            <span>Санамж: Ажил олгогчоор бүртгүүлсэн таны нэр, өнөөгийн үнэлгээ ({employerRating}⭐) энэхүү заранд хамт байршиж, жолооч нарт харагдана.</span>
          </div>

          {/* Action buttons */}
          <div className="flex space-x-3 pt-2">
            <button
              id="cancel-job-post"
              type="button"
              onClick={onClose}
              className="flex-1 py-1.5 border border-slate-700 text-gray-300 text-xs rounded hover:bg-slate-850 transition-colors cursor-pointer"
            >
              Цуцлах
            </button>
            <button
              id="submit-job-post-btn"
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Хадгалж байна...' : (isEditing ? 'Хадгалах' : 'Зар нэмэх')}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
