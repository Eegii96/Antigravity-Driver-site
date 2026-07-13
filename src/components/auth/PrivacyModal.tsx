'use client';

import { Lock, X } from 'lucide-react';

interface PrivacyModalProps {
  onClose: () => void;
}

/** Privacy Policy modal (static content). Render conditionally by the parent. */
export default function PrivacyModal({ onClose }: PrivacyModalProps) {
  return (
        <div 
          onClick={() => onClose()}
          className="fixed inset-0 bg-[var(--bg2)] flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in text-left"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[var(--card)] border border-[var(--border)] rounded-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-md relative"
          >
            {/* Header */}
            <div className="sticky top-0 bg-[var(--card)] border-b border-[var(--border)] px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center space-x-2.5">
                <Lock className="w-5 h-5 text-[var(--verify)]" />
                <h3 className="text-sm font-bold text-[var(--fg)] font-sans">Нууцлалын бодлого (Privacy Policy)</h3>
              </div>
              <button
                onClick={() => onClose()}
                className="text-[var(--muted-foreground)] hover:text-[var(--fg)] transition-colors cursor-pointer p-1 rounded-lg hover:bg-[var(--bg2)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5 text-xs text-[var(--muted-foreground)] leading-relaxed font-sans">
              <div className="bg-[rgba(31,138,76,0.1)] border border-[var(--verify)] p-4 rounded-xl space-y-1.5">
                <p className="font-bold text-[var(--verify)] text-sm">Хувь хүний мэдээллийн аюулгүй байдал</p>
                <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                  Энэхүү нууцлалын бодлого нь Монгол Улсын Хувь хүний мэдээлэл хамгаалах тухай хуульд бүрэн нийцсэн бөгөөд таны хувийн мэдээллийг цуглуулах, боловсруулах, хамгаалахад баримтлах үндсэн зарчмыг тодорхойлно.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-[var(--fg)] text-sm">1. Candy мэдээлэл цуглуулах</h4>
                <p>1.1. Бид хэрэглэгчийн үйлчилгээ авах зорилгоор оруулсан дараах мэдээллүүдийг цуглуулна: Овог нэр / Компанийн нэр, утасны дугаар, хаяг байршил, мэргэшсэн техникийн төрөл, ажлын түүх болон танилцуулга намтар (bio).</p>
                <p>1.2. Нэвтрэх нууц кодыг систем шифрлэн (encrypted) хадгалах бөгөөд ямар ч администратор, гуравдагч этгээд харах боломжгүйгээр хамгаалагдсан болно.</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-[var(--fg)] text-sm">2. Мэдээллийн ашиглалт ба Зорилго</h4>
                <p>2.1. Таны оруулсан мэдээллийг зөвхөн ажил олгогч болон операторыг холбох, үнэлгээ өгөх, системийн найдвартай ажиллагааг хангахад ашиглана.</p>
                <p className="text-[var(--accent-soft-foreground)]">2.2. Систем нь хэрэглэгчийн утасны дугаар болон бусад хувийн мэдээллийг зар сурталчилгаанд худалдах, бусдад зөвшөөрөлгүйгээр шилжүүлэхийг хатуу хориглоно.</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-[var(--fg)] text-sm">3. Хэрэглэгчийн эрх болон Профайл нууцлал</h4>
                <p>3.1. Хэрэглэгч өөрийн профайлыг бусдад харагдуулахгүй байх (isPublic тохиргоо) эрхтэй.</p>
                <p>3.2. Хэрэглэгч өөрийн мэдээллийг хэдийд ч засах, системээс өөрийн бүртгэлийг бүрэн устгах (Аюулгүй байдлын цэсээр) эрхтэй.</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-[var(--fg)] text-sm">4. Мэдээллийн аюулгүй байдал</h4>
                <p>4.1. Систем нь таны мэдээллийг хамгаалах сүүлийн үеийн SSL шифрлэлт болон аюулгүй байдлын стандартыг ашиглаж байна.</p>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-[var(--border)] px-6 py-4 flex justify-end bg-[var(--card)]">
              <button
                onClick={() => onClose()}
                className="bg-[var(--verify)] hover:brightness-95 text-[var(--accent-foreground)] font-semibold px-5 py-2 rounded-xl transition-all cursor-pointer text-xs font-sans"
              >
                Ойлголоо, хүлээн зөвшөөрөв
              </button>
            </div>
          </div>
        </div>
  );
}
