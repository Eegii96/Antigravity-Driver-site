'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, HelpCircle } from 'lucide-react';

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  /** Destructive action — confirm button uses the terracotta alert color. */
  danger?: boolean;
  /** May be async; the confirm button shows a busy state until it resolves. */
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

/**
 * Design-system confirmation dialog — replaces window.confirm() (AGENTS.md §4).
 * Calm Professional: fg/40 scrim, white card, pill buttons, ≥44px targets.
 */
export default function ConfirmModal({
  title,
  message,
  confirmLabel,
  cancelLabel = 'Болих',
  danger = false,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  const [isBusy, setIsBusy] = useState<boolean>(false);

  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  const handleConfirm = async () => {
    setIsBusy(true);
    try {
      await onConfirm();
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div
      id="confirm-modal-backdrop"
      onClick={() => { if (!isBusy) onClose(); }}
      className="fixed inset-0 bg-[var(--fg)]/40 flex items-center justify-center p-4 z-[60] animate-fade-in"
    >
      <div
        id="confirm-modal-container"
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="bg-[var(--card)] border border-[var(--border-strong)] max-w-sm w-full rounded-2xl shadow-md p-6 space-y-4"
      >
        <div className="flex items-start gap-3">
          <span className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
            danger ? 'bg-[rgba(188,79,36,0.1)]' : 'bg-[var(--accent-soft)]'
          }`}>
            {danger ? (
              <AlertTriangle className="w-5 h-5 text-[var(--alert)]" aria-hidden="true" />
            ) : (
              <HelpCircle className="w-5 h-5 text-[var(--accent-soft-foreground)]" aria-hidden="true" />
            )}
          </span>
          <div className="space-y-1.5 pt-0.5">
            <h3 className="text-[17px] font-display font-bold text-[var(--fg)] leading-snug">{title}</h3>
            <p className="text-[15px] text-[var(--muted-foreground)] leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex gap-2.5 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="flex-1 min-h-12 border border-[var(--border)] hover:border-[var(--border-strong)] bg-[var(--card)] hover:bg-[var(--bg2)] text-[var(--fg)] text-[15px] font-semibold rounded-full transition-colors cursor-pointer disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isBusy}
            className={`flex-1 min-h-12 text-[15px] font-semibold rounded-full transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
              danger
                ? 'bg-[var(--alert)] hover:brightness-95 text-white'
                : 'bg-[var(--accent)] hover:opacity-90 text-[var(--accent-foreground)]'
            }`}
          >
            {isBusy ? 'Түр хүлээнэ үү...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
