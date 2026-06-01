import { useState, FormEvent } from 'react';
import { X, Plus, Trash2, ShieldCheck, Sparkles } from 'lucide-react';
import { Job } from '../types';
import { addJob } from '../lib/db';
import { generateJobDescription } from '../lib/gemini';

interface JobPostModalProps {
  employerId: string;
  employerName: string;
  employerRating: number;
  onClose: () => void;
  onSuccess: (newJob: Job) => void;
}

const AIMAGS = [
  'Улаанбаатар хот',
  'Өмнөговь аймаг',
  'Дархан-Уул аймаг',
  'Орхон аймаг',
  'Сэлэнгэ аймаг',
  'Дорноговь аймаг',
  'Хэнтий аймаг',
  'Баян-Өлгий аймаг',
  'Хөвсгөл аймаг',
  'Төв аймаг'
];

export default function JobPostModal({
  employerId,
  employerName,
  employerRating,
  onClose,
  onSuccess
}: JobPostModalProps) {
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [type, setType] = useState<'operator_hiring' | 'machinery_rental' | 'earthwork'>('operator_hiring');
  const [machineryType, setMachineryType] = useState<string>('CAT 320 Экскаватор');
  const [salary, setSalary] = useState<number>(150000);
  const [salaryUnit, setSalaryUnit] = useState<'Өдрөөр' | 'Цагаар' | 'Төслөөр'>('Өдрөөр');
  const [duration, setDuration] = useState<string>('14 хоног');
  const [location, setLocation] = useState<string>('Улаанбаатар хот');
  
  // Custom requirement list states
  const [requirements, setRequirements] = useState<string[]>([
    'Архидан согтуурахаас хол, хариуцлагатай байх',
    'Хүнд машин механизмын хүчин төгөлдөр үнэмлэхтэй байх',
    'Систем дэх ажлын түүхийн үнэлгээ муугүй байх'
  ]);
  const [newReq, setNewReq] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleGenerateAIDesc = async () => {
    setIsGenerating(true);
    setError('');
    try {
      const generated = await generateJobDescription({
        machineryType,
        salary,
        salaryUnit,
        location,
        duration,
        requirements
      });
      setDescription(generated);
    } catch (err: any) {
      console.error(err);
      setError('AI зар үүсгэхэд алдаа гарлаа. Та дахин оролдоно уу.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddRequirement = () => {
    if (newReq.trim()) {
      setRequirements([...requirements, newReq.trim()]);
      setNewReq('');
    }
  };

  const handleRemoveRequirement = (idx: number) => {
    setRequirements(requirements.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title || !description || !machineryType || !salary || !duration) {
      setError('Шаардлагатай бүх талбарыг бөглөнө үү.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const job = await addJob({
        title,
        description,
        employerId,
        employerName,
        employerRating,
        type,
        machineryType,
        salary,
        salaryUnit,
        duration,
        location,
        requirements
      });

      onSuccess(job);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Ажлын зар нэмэхэд алдаа гарлаа. Та дахин оролдоно уу.');
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
            <h3 className="text-sm font-semibold text-white">Шинэ Ажлын Зар Бүртгүүлэх</h3>
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
              placeholder="Дундговьд гүүрэн замын барилгад дамп жолоодох 2 хүн авна"
              className="block w-full px-3 py-1.5 border border-slate-700 rounded bg-slate-850 text-white text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none placeholder-gray-500 font-sans"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Job Type Options */}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Зарын Төрөл</label>
              <select
                id="job-type-selector"
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="block w-full px-3 py-1.5 border border-slate-700 rounded bg-slate-850 text-white text-xs focus:ring-1"
              >
                <option value="operator_hiring">Жолооч, оператор хайж байна</option>
                <option value="machinery_rental">Машин механизм түрээслүүлнэ</option>
                <option value="earthwork">Газар шорооны ажил гүйцэтгэнэ</option>
              </select>
            </div>

            {/* Machinery selection */}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1" htmlFor="job-machinery-type">
                Техникийн Ангилал / Загвар
              </label>
              <input
                id="job-machinery-type"
                type="text"
                required
                value={machineryType}
                onChange={(e) => setMachineryType(e.target.value)}
                placeholder="Экскаватор САТ-320 эсвэл Shacman Дамп"
                className="block w-full px-3 py-1.5 border border-slate-700 rounded bg-slate-850 text-white text-xs focus:ring-1 focus:outline-none placeholder-gray-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {/* Location */}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Байршил (Аймаг/Хот)</label>
              <select
                id="job-location-selector"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="block w-full px-3 py-1.5 border border-slate-700 rounded bg-slate-850 text-white text-xs focus:ring-1"
              >
                {AIMAGS.map((a, idx) => (
                  <option key={idx} value={a}>{a}</option>
                ))}
              </select>
            </div>

            {/* Salary */}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1" htmlFor="job-salary">
                Үнэлгээ / Цалин (₮)
              </label>
              <input
                id="job-salary"
                type="number"
                required
                min={100}
                value={salary}
                onChange={(e) => setSalary(parseInt(e.target.value) || 0)}
                className="block w-full px-3 py-1.5 border border-slate-700 rounded bg-slate-850 text-white text-xs focus:ring-1 focus:outline-none"
              />
            </div>

            {/* Price cycle Unit */}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Төлбөрийн мөчлөг</label>
              <select
                id="job-salary-unit"
                value={salaryUnit}
                onChange={(e) => setSalaryUnit(e.target.value as any)}
                className="block w-full px-3 py-1.5 border border-slate-700 rounded bg-slate-850 text-white text-xs focus:ring-1"
              >
                <option value="Өдрөөр">Өдрөөр бодож өгнө</option>
                <option value="Цагаар">Цагаар бодож өгнө</option>
                <option value="Төслөөр">Төслөөр гэрээнээс өгнө</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Duration */}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1" htmlFor="job-duration">
                Ажлын Хугацаа / Багаж
              </label>
              <input
                id="job-duration"
                type="text"
                required
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="14 хоног (эсвэл Сарын хугацаанд)"
                className="block w-full px-3 py-1.5 border border-slate-700 rounded bg-slate-850 text-white text-xs focus:ring-1 focus:outline-none"
              />
            </div>

            <div className="p-3 bg-slate-800 rounded-lg flex items-center justify-between border border-slate-800 text-xs">
              <span className="text-gray-400">Тавигдах шаардлага:</span>
              <span className="font-semibold text-emerald-400 font-mono">{requirements.length} ш</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-medium text-gray-300" htmlFor="job-desc">
                Дэлгэрэнгүй тодорхойлолт, ажлын нөхцөлүүд
              </label>
              <button
                type="button"
                onClick={handleGenerateAIDesc}
                disabled={isGenerating}
                className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 border border-emerald-500/30 bg-emerald-500/5 px-2.5 py-1 rounded cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} />
                <span>{isGenerating ? 'AI бичиж байна...' : 'AI-аар бичүүлэх'}</span>
              </button>
            </div>
            <textarea
              id="job-desc"
              rows={5}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Газар ухах гүн 4 метр, нийт 100 урт суваг ухна. Байр, 3 хоол барилгын кэмп дотор өгнө. Согтууруулах ундаа бүрэн хориотой..."
              className="block w-full px-3 py-1.5 border border-slate-700 rounded bg-slate-850 text-white placeholder-gray-500 text-xs focus:ring-1 focus:outline-none resize-none font-sans"
            />
          </div>

          {/* Requirements addition list */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-300">Ажлын тусгай шаардлага нэмэх</label>
            <div className="flex space-x-2">
              <input
                id="new-requirement-input"
                type="text"
                value={newReq}
                onChange={(e) => setNewReq(e.target.value)}
                placeholder="Жишээ: Согтууруулж ажил хаяхгүй байхаар барьцаа гэрээ хийнэ"
                className="flex-1 px-3 py-1.5 border border-slate-700 rounded bg-slate-850 text-white text-xs focus:ring-1 focus:outline-none placeholder-gray-500"
              />
              <button
                id="add-requirement-btn"
                type="button"
                onClick={handleAddRequirement}
                className="bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 px-3 py-1.5 rounded text-xs cursor-pointer flex items-center"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            
            <div className="max-h-24 overflow-y-auto space-y-1.5 pt-1.5">
              {requirements.map((req, idx) => (
                <div key={idx} className="flex items-center justify-between bg-slate-850 px-2.5 py-1 rounded text-xs text-gray-300 border border-slate-800/80">
                  <span className="truncate max-w-[90%]">• {req}</span>
                  <button
                    id={`remove-req-${idx}`}
                    type="button"
                    onClick={() => handleRemoveRequirement(idx)}
                    className="text-rose-400 hover:text-rose-350 transition-colors pointer-events-auto cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
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
              disabled={isSubmitting}
              className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Нийтэлж байна...' : 'Зарыг Нийтэд цацах'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
