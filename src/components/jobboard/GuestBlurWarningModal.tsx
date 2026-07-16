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
      className="fixed inset-0 bg-[var(--fg)]/40 flex items-center justify-center p-4 z-50 animate-fade-in"
    >
      <div
        id="blur-warning-modal-container"
        onClick={(e) => e.stopPropagation()}
        className="bg-[var(--card)] border border-[var(--border-strong)] max-w-sm w-full rounded-2xl overflow-hidden shadow-md relative p-6 space-y-4"
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-2 border-b border-[var(--border)]">
          <h3 className="text-[17px] font-display font-bold text-[var(--fg)]">Дэлгэрэнгүй харах</h3>
          <button
            onClick={onClose}
            aria-label="Хаах"
            className="min-w-11 min-h-11 flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--fg)] transition-colors cursor-pointer rounded-full hover:bg-[var(--bg2)] -mr-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Description */}
        <div className="space-y-3 text-left">
          <p className="text-[15px] text-[var(--fg)] leading-relaxed font-sans">
            Ажлын зар байршуулсан хэрэглэгч болон утасны дугаар зэрэг дэлгэрэнгүй мэдээлэл нь зөвхөн системд нэвтэрсэн хэрэглэгчдэд харагдах боломжтой.
          </p>
          <p className="text-sm text-[var(--muted-foreground)] leading-relaxed font-sans">
            Та системд нэвтэрч орсны дараа зар бүтнээр харагдах болно.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col space-y-2.5 pt-2">
          <button
            type="button"
            onClick={onLogin}
            className="w-full min-h-12 bg-[var(--accent)] hover:opacity-90 text-[var(--accent-foreground)] text-[15px] font-semibold rounded-full transition-all shadow-sm cursor-pointer font-sans text-center"
          >
            Нэвтрэх хэсэг рүү очих
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full min-h-12 border border-[var(--border)] hover:border-[var(--border-strong)] text-[var(--fg)] text-sm font-semibold rounded-full hover:bg-[var(--bg2)] transition-colors cursor-pointer font-sans"
          >
            Хаах
          </button>
        </div>
      </div>
    </div>
  );
}
