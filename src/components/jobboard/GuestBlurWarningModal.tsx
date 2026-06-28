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
        className="bg-[var(--card)] border border-[var(--border-strong)] max-w-sm w-full rounded-md overflow-hidden shadow-md relative p-6 space-y-4"
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-2 border-b border-[var(--border)]">
          <div className="flex items-center space-x-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-[var(--accent)] animate-pulse"></span>
            <h3 className="text-sm font-display font-bold uppercase tracking-wide text-[var(--fg)]">Дэлгэрэнгүй харах</h3>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--muted-foreground)] hover:text-[var(--fg)] transition-colors cursor-pointer p-1 rounded hover:bg-[var(--bg2)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Description */}
        <div className="space-y-3 text-left">
          <p className="text-xs text-[var(--fg)] leading-relaxed font-sans">
            Ажлын зар байршуулсан хэрэглэгч болон утасны дугаар зэрэг дэлгэрэнгүй мэдээлэл нь зөвхөн системд нэвтэрсэн хэрэглэгчдэд харагдах боломжтой.
          </p>
          <p className="text-xs text-[var(--muted-foreground)] leading-relaxed font-sans">
            Та системд нэвтэрч орсны дараа зар бүтнээр харагдах болно.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col space-y-2 pt-2">
          <button
            type="button"
            onClick={onLogin}
            className="w-full py-2.5 bg-[var(--accent)] hover:brightness-95 text-[var(--accent-foreground)] text-xs font-bold rounded transition-all shadow-sm cursor-pointer font-sans text-center"
          >
            Нэвтрэх хэсэг рүү очих
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--fg)] text-xs font-medium rounded hover:bg-[var(--bg2)] transition-colors cursor-pointer font-sans"
          >
            Хаах
          </button>
        </div>
      </div>
    </div>
  );
}
