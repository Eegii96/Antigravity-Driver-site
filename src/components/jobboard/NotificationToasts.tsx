'use client';

import { X } from 'lucide-react';
import type { AppNotification } from '../../types';
import { formatNotificationDate } from '../../lib/job-format';

interface NotificationToastsProps {
  toasts: AppNotification[];
  /** Called when a toast body is clicked (navigates to the related entity). */
  onToastClick: (toast: AppNotification) => void;
  /** Called when a toast's close button is clicked. */
  onDismiss: (id: string) => void;
}

/** Fixed, top-right stack of transient toast notifications. */
export default function NotificationToasts({ toasts, onToastClick, onDismiss }: NotificationToastsProps) {
  return (
    <div id="toast-alerts-container" className="fixed top-24 right-6 flex flex-col gap-3 pointer-events-none z-[9999] max-w-sm w-80">
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => onToastClick(t)}
          className={`pointer-events-auto bg-[var(--card)] border-l-4 ${
            t.type === 'alert' ? 'border-rose-500' : 'border-[var(--verify)]'
          } text-[var(--fg)] px-5 py-4 rounded-xl shadow-md border border-[var(--border)] flex items-start space-x-3 w-full animate-slide-in relative cursor-pointer hover:bg-[var(--bg2)] transition-colors`}
        >
          <div className="flex-1 text-left pr-4">
            <div className="flex justify-between items-start">
              <span className={`text-xs font-bold ${
                t.type === 'alert' ? 'text-rose-600' : 'text-[var(--verify)]'
              } font-mono`}>
                {t.type === 'alert' ? 'Алдаа ⚠️' : 'Амжилттай 🎉'}
              </span>
              <span className="text-xs text-[var(--muted-foreground)] font-mono mr-2">{formatNotificationDate(t.createdAt)}</span>
            </div>
            <p className="text-xs font-bold text-[var(--fg)] mt-1 leading-snug">{t.title}</p>
            <p className="text-sm text-[var(--muted-foreground)] leading-relaxed mt-0.5">{t.message}</p>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDismiss(t.id);
            }}
            className="absolute top-3 right-3 text-[var(--muted-foreground)] hover:text-[var(--fg)] transition-colors cursor-pointer p-0.5 rounded-full hover:bg-[var(--bg2)] flex items-center justify-center"
            aria-label="Хаах"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
