import { useState, FormEvent } from 'react';
import { X, ShieldCheck, Camera, Trash2, Image as ImageIcon } from 'lucide-react';
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

const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
          resolve(dataUrl);
        } else {
          reject(new Error('Canvas context not available'));
        }
      };
      img.onerror = () => reject(new Error('Image load error'));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error('FileReader error'));
    reader.readAsDataURL(file);
  });
};


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
  const [imageUrls, setImageUrls] = useState<string[]>(jobToEdit?.imageUrls || (jobToEdit?.imageUrl ? [jobToEdit.imageUrl] : []));
  const [isImageUploading, setIsImageUploading] = useState<boolean>(false);
  
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
          imageUrl: imageUrls[0] || '',
          imageUrls: imageUrls,
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
          requirements,
          imageUrl: imageUrls[0] || undefined,
          imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
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

          {/* Job Image Attachment */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1 flex justify-between">
              <span>Зургийн хавсралт (Сонгох)</span>
              <span className="text-[10px] text-gray-550 font-sans">({imageUrls.length}/4 зураг оруулах боломжтой)</span>
            </label>
            <div className="flex flex-wrap gap-3 mt-1.5">
              {/* Render uploaded image thumbnails */}
              {imageUrls.map((url, idx) => (
                <div key={idx} className="relative w-20 h-20 rounded-lg border border-slate-700 bg-slate-950 overflow-hidden shrink-0">
                  <img
                    src={url}
                    alt={`Preview ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setImageUrls(prev => prev.filter((_, i) => i !== idx))}
                    className="absolute top-1 right-1 bg-rose-600/90 hover:bg-rose-500 text-white rounded-full p-0.5 shadow-md transition-colors cursor-pointer"
                    title="Устгах"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {/* Render dashed upload button if less than 4 images */}
              {imageUrls.length < 4 && (
                <label className="flex flex-col items-center justify-center w-20 h-20 border border-slate-700 border-dashed rounded-lg cursor-pointer bg-slate-850 hover:bg-slate-805 transition-all text-center">
                  {isImageUploading ? (
                    <span className="text-[8px] text-gray-400 font-medium px-1 leading-tight">Шахаж байна...</span>
                  ) : (
                    <>
                      <Camera className="w-4 h-4 text-emerald-450 mb-0.5" />
                      <span className="text-[10px] text-emerald-450 font-bold">Нэмэх</span>
                      <span className="text-[8px] text-gray-500 font-sans mt-0.5">{imageUrls.length}/4</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={isImageUploading}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setIsImageUploading(true);
                        try {
                          const compressed = await compressImage(file);
                          setImageUrls(prev => [...prev, compressed]);
                        } catch (err) {
                          console.error(err);
                          alert('Зураг боловсруулахад алдаа гарлаа.');
                        } finally {
                          setIsImageUploading(false);
                        }
                      }
                      e.target.value = ''; // Reset input to allow selecting same file again
                    }}
                  />
                </label>
              )}
            </div>
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
              disabled={isSubmitting || isImageUploading}
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
