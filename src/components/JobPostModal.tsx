import { useState, FormEvent, useEffect } from 'react';
import { X, ShieldCheck, Camera, Trash2, Image as ImageIcon } from 'lucide-react';
import { Job } from '../types';
import { addJob, updateJob } from '../lib/db';
import { uploadJobImage, deleteJobImage } from '../lib/storage';
import { MACHINE_OPTIONS } from './auth/constants';

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

  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  // Pre-generate job ID so Storage uploads can use it before Firestore doc exists.
  // crypto.randomUUID() instead of Date.now() — two posts in the same
  // millisecond (e.g. a script, or a fast double-submit) used to collide and
  // silently overwrite each other (audit S11).
  const [tempJobId] = useState<string>(() => jobToEdit?.id || `job_${crypto.randomUUID()}`);
  const [title, setTitle] = useState<string>(jobToEdit?.title || '');
  const [description, setDescription] = useState<string>(jobToEdit?.description || '');
  const [imageUrls, setImageUrls] = useState<string[]>(jobToEdit?.imageUrls || (jobToEdit?.imageUrl ? [jobToEdit.imageUrl] : []));
  // Index-parallel to imageUrls for newly-uploaded images. Jobs edited from
  // before this field existed keep whatever thumbnailUrls they already had
  // (display code falls back to the full image when a thumbnail is missing).
  const [thumbnailUrls, setThumbnailUrls] = useState<string[]>(jobToEdit?.thumbnailUrls || []);
  const [isImageUploading, setIsImageUploading] = useState<boolean>(false);
  
  // Determine initial type selection
  const initialType = jobToEdit
    ? (['operator_hiring', 'machinery_rental', 'earthwork', 'operator_job_seeking'].includes(jobToEdit.type)
        ? jobToEdit.type
        : 'custom')
    : 'operator_hiring';
  const [type, setType] = useState<string>(initialType);
  const [customType, setCustomType] = useState<string>(
    jobToEdit && !['operator_hiring', 'machinery_rental', 'earthwork', 'operator_job_seeking'].includes(jobToEdit.type)
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
  
  // Previously silently hardcoded to 'Бусад'/'Өдрөөр' on every job — search
  // filters by machineryType, so every new listing landed in the same bucket,
  // and the salary unit shown on the detail page was frequently wrong
  // (audit C4). Now real form fields, defaulting to the same values so
  // existing behavior doesn't change until the poster picks something else.
  const [machineryType, setMachineryType] = useState<string>(jobToEdit?.machineryType || 'Бусад');
  const [salaryUnit, setSalaryUnit] = useState<'Өдрөөр' | 'Цагаар' | 'Төслөөр'>(jobToEdit?.salaryUnit || 'Өдрөөр');
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
          machineryType,
          salary: resolvedSalary,
          salaryUnit,
          location: resolvedLocation,
          imageUrl: imageUrls[0] || '',
          imageUrls: imageUrls,
          thumbnailUrls: thumbnailUrls,
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
          thumbnailUrls: thumbnailUrls.length > 0 ? thumbnailUrls : undefined,
        }, tempJobId);
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
    <div 
      id="job-post-modal-backdrop" 
      onClick={onClose}
      className="fixed inset-0 bg-[var(--bg2)] flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in"
    >
      <div 
        id="job-post-modal-container" 
        onClick={(e) => e.stopPropagation()}
        className="bg-[var(--bg2)] border border-[var(--border)] max-w-xl w-full rounded-xl overflow-hidden shadow-2xl my-8"
      >
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-[var(--border)] px-6 py-4">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-[var(--accent-soft-foreground)]" />
            <h3 className="text-sm font-semibold text-[var(--fg)]">
              {isEditing ? 'Ажлын Зар Засварлах' : 'Шинэ Ажлын Зар Бүртгүүлэх'}
            </h3>
          </div>
          <button id="close-job-post-modal" onClick={onClose} className="min-w-11 min-h-11 flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--fg)] transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-700 p-2.5 rounded text-xs">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1" htmlFor="job-title-input">
              Зарын Ерөнхий Гарчиг
            </label>
            <input
              id="job-title-input"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Жишээ: Дундговьд дампны жолооч авна"
              className="block w-full px-3 py-1.5 border border-[var(--border)] rounded bg-[var(--bg2)] text-[var(--fg)] text-xs focus:ring-1 focus:ring-[var(--accent)] focus:outline-none placeholder-[var(--muted-foreground)] font-sans"
            />
          </div>

          {/* Job Type Options */}
          <div>
            <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Зарын Төрөл</label>
            <select
              id="job-type-selector"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="block w-full px-3 py-1.5 border border-[var(--border)] rounded bg-[var(--bg2)] text-[var(--fg)] text-xs focus:ring-1 focus:ring-[var(--accent)] focus:outline-none"
            >
              <option value="operator_hiring" className="bg-[var(--bg2)] text-[var(--fg)]">Жолооч, оператор хайж байна</option>
              <option value="operator_job_seeking" className="bg-[var(--bg2)] text-[var(--fg)]">Жолооч, операторын ажил хайж байна</option>
              <option value="machinery_rental" className="bg-[var(--bg2)] text-[var(--fg)]">Машин механизмын түрээс</option>
              <option value="earthwork" className="bg-[var(--bg2)] text-[var(--fg)]">Барилга, зам, газар шорооны ажил</option>
              <option value="custom" className="bg-[var(--bg2)] text-[var(--fg)]">✍️ Өөр төрөл нэмэх...</option>
            </select>
          </div>

          {/* Custom job type input */}
          {type === 'custom' && (
            <div className="animate-fade-in">
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1" htmlFor="custom-job-type">
                Шинээр нэмэх зарын төрөл
              </label>
              <input
                id="custom-job-type"
                type="text"
                required
                value={customType}
                onChange={(e) => setCustomType(e.target.value)}
                placeholder="Жишээ: Харуул хамгаалалт"
                className="block w-full px-3 py-1.5 border border-[var(--border)] rounded bg-[var(--bg2)] text-[var(--fg)] text-xs focus:ring-1 focus:ring-[var(--accent)] focus:outline-none placeholder-[var(--muted-foreground)] font-sans"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Location */}
            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Байршил (Аймаг/Хот)</label>
              <select
                id="job-location-selector"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="block w-full px-3 py-1.5 border border-[var(--border)] rounded bg-[var(--bg2)] text-[var(--fg)] text-xs focus:ring-1 focus:ring-[var(--accent)] focus:outline-none"
              >
                {AIMAGS.map((a, idx) => (
                  <option key={idx} value={a} className="bg-[var(--bg2)] text-[var(--fg)]">
                    {a === 'custom' ? '✍️ Гараар байршил оруулах...' : a}
                  </option>
                ))}
              </select>
            </div>

            {/* Salary */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-medium text-[var(--muted-foreground)]" htmlFor="job-salary">
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
                    className="w-3.5 h-3.5 rounded border-[var(--border)] bg-[var(--bg2)] text-[var(--accent-soft-foreground)] focus:ring-0 cursor-pointer"
                  />
                  <span className="text-[10px] text-[var(--muted-foreground)] font-sans">Тохиролцоно</span>
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
                className={`block w-full px-3 py-1.5 border border-[var(--border)] rounded bg-[var(--bg2)] text-[var(--fg)] text-xs focus:ring-1 focus:ring-[var(--accent)] focus:outline-none ${isNegotiable ? 'opacity-50 cursor-not-allowed font-sans' : ''}`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Machinery type — previously silently hardcoded to 'Бусад' on
                every job, which broke the machineryType search filter (audit C4) */}
            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1" htmlFor="job-machinery-type">
                Машин механизмын төрөл
              </label>
              <select
                id="job-machinery-type"
                value={machineryType}
                onChange={(e) => setMachineryType(e.target.value)}
                className="block w-full px-3 py-1.5 border border-[var(--border)] rounded bg-[var(--bg2)] text-[var(--fg)] text-xs focus:ring-1 focus:ring-[var(--accent)] focus:outline-none"
              >
                <option value="Бусад" className="bg-[var(--bg2)] text-[var(--fg)]">Бусад</option>
                {MACHINE_OPTIONS.map((m, idx) => (
                  <option key={idx} value={m} className="bg-[var(--bg2)] text-[var(--fg)]">{m}</option>
                ))}
              </select>
            </div>

            {/* Salary unit — previously silently hardcoded to 'Өдрөөр' (audit C4) */}
            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1" htmlFor="job-salary-unit">
                Цалингийн нэгж
              </label>
              <select
                id="job-salary-unit"
                value={salaryUnit}
                onChange={(e) => setSalaryUnit(e.target.value as 'Өдрөөр' | 'Цагаар' | 'Төслөөр')}
                className="block w-full px-3 py-1.5 border border-[var(--border)] rounded bg-[var(--bg2)] text-[var(--fg)] text-xs focus:ring-1 focus:ring-[var(--accent)] focus:outline-none"
              >
                <option value="Өдрөөр" className="bg-[var(--bg2)] text-[var(--fg)]">Өдрөөр</option>
                <option value="Цагаар" className="bg-[var(--bg2)] text-[var(--fg)]">Цагаар</option>
                <option value="Төслөөр" className="bg-[var(--bg2)] text-[var(--fg)]">Төслөөр</option>
              </select>
            </div>
          </div>

          {/* Custom location input */}
          {location === 'custom' && (
            <div className="animate-fade-in">
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1" htmlFor="custom-job-location">
                Гараар оруулах байршил
              </label>
              <input
                id="custom-job-location"
                type="text"
                required
                value={customLocation}
                onChange={(e) => setCustomLocation(e.target.value)}
                placeholder="Жишээ: Өмнөговь аймаг, Цогтцэций сум, 3-р баг"
                className="block w-full px-3 py-1.5 border border-[var(--border)] rounded bg-[var(--bg2)] text-[var(--fg)] text-xs focus:ring-1 focus:ring-[var(--accent)] focus:outline-none placeholder-[var(--muted-foreground)] font-sans"
              />
            </div>
          )}

          {/* Additional Info / Description */}
          <div>
            <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1" htmlFor="job-desc">
              Нэмэлт мэдээлэл
            </label>
            <textarea
              id="job-desc"
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ажлын нөхцөл, хангамж, тавигдах шаардлага зэрэг бусад мэдээллийг энд оруулах боломжтой..."
              className="block w-full px-3 py-1.5 border border-[var(--border)] rounded bg-[var(--bg2)] text-[var(--fg)] placeholder-[var(--muted-foreground)] text-xs focus:ring-1 focus:outline-none resize-none font-sans"
            />
          </div>

          {/* Job Image Attachment */}
          <div>
            <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1 flex justify-between">
              <span>Зургийн хавсралт (Сонгох)</span>
              <span className="text-[10px] text-[var(--muted-foreground)] font-sans">({imageUrls.length}/4 зураг оруулах боломжтой)</span>
            </label>
            <div className="flex flex-wrap gap-3 mt-1.5">
              {/* Render uploaded image thumbnails */}
              {imageUrls.map((url, idx) => (
                <div key={idx} className="relative w-20 h-20 rounded-lg border border-[var(--border)] bg-[var(--bg2)] overflow-hidden shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Preview ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const urlToDelete = imageUrls[idx];
                      const thumbToDelete = thumbnailUrls[idx];
                      setImageUrls(prev => prev.filter((_, i) => i !== idx));
                      setThumbnailUrls(prev => prev.filter((_, i) => i !== idx));
                      if (urlToDelete.startsWith('https://')) deleteJobImage(urlToDelete);
                      if (thumbToDelete && thumbToDelete.startsWith('https://')) deleteJobImage(thumbToDelete);
                    }}
                    className="absolute top-1 right-1 bg-red-600/90 hover:bg-red-500 text-[var(--accent-foreground)] rounded-full p-0.5 shadow-md transition-colors cursor-pointer"
                    title="Устгах"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {/* Render dashed upload button if less than 4 images */}
              {imageUrls.length < 4 && (
                <label className="flex flex-col items-center justify-center w-20 h-20 border border-[var(--border)] border-dashed rounded-lg cursor-pointer bg-[var(--bg2)] hover:bg-[var(--bg2)] transition-all text-center">
                  {isImageUploading ? (
                    <span className="text-[10px] text-[var(--muted-foreground)] font-medium px-1 leading-tight">Шахаж байна...</span>
                  ) : (
                    <>
                      <Camera className="w-4 h-4 text-[var(--accent-soft-foreground)] mb-0.5" />
                      <span className="text-[10px] text-[var(--accent-soft-foreground)] font-bold">Нэмэх</span>
                      <span className="text-[10px] text-[var(--muted-foreground)] font-sans mt-0.5">{imageUrls.length}/4</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    disabled={isImageUploading}
                    onChange={async (e) => {
                      const files = e.target.files;
                      if (files && files.length > 0) {
                        setIsImageUploading(true);
                        try {
                          const maxRemaining = 4 - imageUrls.length;
                          const filesToProcess = Array.from(files).slice(0, maxRemaining);
                          const uploaded = await Promise.all(
                            filesToProcess.map(file => uploadJobImage(tempJobId, file))
                          );
                          setImageUrls(prev => [...prev, ...uploaded.map(u => u.url)]);
                          setThumbnailUrls(prev => [...prev, ...uploaded.map(u => u.thumbUrl)]);
                        } catch (err) {
                          console.error(err);
                          setError('Зураг боловсруулахад алдаа гарлаа.');
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

          <div className="bg-[var(--card)] p-3.5 rounded-lg border border-[var(--border)] flex items-center space-x-2 text-[10px] text-[var(--muted-foreground)]">
            <span className="text-[var(--accent-soft-foreground)]">🛡️</span>
            <span>Санамж: Ажил олгогчоор бүртгүүлсэн таны нэр, өнөөгийн үнэлгээ ({employerRating}⭐) энэхүү заранд хамт байршиж, жолооч нарт харагдана.</span>
          </div>

          {/* Action buttons */}
          <div className="flex space-x-3 pt-2">
            <button
              id="cancel-job-post"
              type="button"
              onClick={onClose}
              className="flex-1 py-1.5 border border-[var(--border)] text-[var(--muted-foreground)] text-xs rounded hover:bg-[var(--bg2)] transition-colors cursor-pointer"
            >
              Цуцлах
            </button>
            <button
              id="submit-job-post-btn"
              type="submit"
              disabled={isSubmitting || isImageUploading}
              className="flex-1 py-1.5 bg-[var(--accent)] hover:brightness-95 text-[var(--accent-foreground)] text-xs font-medium rounded transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Хадгалж байна...' : (isEditing ? 'Хадгалах' : 'Зар нэмэх')}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
