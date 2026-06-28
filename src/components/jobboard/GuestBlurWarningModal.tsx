'use client';

import { X } from 'lucide-react';

interface GuestBlurWarningModalProps {
  onClose: () => void;
  /** Navigate the guest to the login page. */
  onLogin: () => void;
}

/**
 * Shown when a logged-out visitor taps a blurred employer name/phone.
 * Render conditionally by the parent: `{show && <GuestBlurWarningModal .../>}`.
 */
export default function GuestBlurWarningModal({ onClose, onLogin }: GuestBlurWarningModalProps) {
  return (
    <div
      id="blur-warning-modal-backdrop"
      onClick={onClose}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
    >
      <div
        id="blur-warning-modal-container"
        onClick={(e) => e.stopPropagation()}
        className="bg-[var(--color-brand-bg2)] border border-[var(--color-glass-border)] max-w-sm w-full rounded-2xl overflow-hidden shadow-2xl relative p-6 space-y-4"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>

        {/* Header */}
        <div className="flex justify-between items-center pb-2 border-b border-[var(--color-glass-border)]">
          <div className="flex items-center space-x-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-violet-500 animate-pulse"></span>
            <h3 className="text-sm font-semibold text-[#f1f3f8] tracking-wide">Дэлгэрэнгүй харах</h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#9aa3b5] hover:text-[#f1f3f8] transition-colors cursor-pointer p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Description */}
        <div className="space-y-3 text-left">
          <p className="text-xs text-[#e3e6ee] leading-relaxed font-sans">
            Ажлын зар байршуулсан хэрэглэгч болон утасны дугаар зэрэг дэлгэрэнгүй мэдээлэл нь зөвхөн системд нэвтэрсэн хэрэглэгчдэд харагдах боломжтой.
          </p>
          <p className="text-xs text-[#9aa3b5] leading-relaxed font-sans">
            Та системд нэвтэрч орсны дараа зар бүтнээр харагдах болно.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col space-y-2 pt-2">
          <button
            type="button"
            onClick={onLogin}
            className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-violet-950/25 cursor-pointer font-sans text-center"
          >
            Нэвтрэх хэсэг рүү очих
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 border border-[var(--color-glass-border)] text-[#c8cbe0] hover:text-[#f1f3f8] text-xs font-medium rounded-xl hover:bg-white/10 transition-colors cursor-pointer font-sans"
          >
            Хаах
          </button>
        </div>
      </div>
    </div>
  );
}
