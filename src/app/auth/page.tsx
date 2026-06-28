import { Metadata } from 'next';
import { Suspense } from 'react';
import AuthClient from './AuthClient';

export const metadata: Metadata = {
  title: 'Нэвтрэх, Бүртгүүлэх | Жолооч Монголиа',
  description: 'Хүнд машин, механизм & Газар шорооны ажлын нэгдсэн системд нэвтрэх эсвэл шинээр бүртгэл үүсгэх.',
};

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center text-[var(--fg)] font-sans">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[var(--muted-foreground)] text-sm">Уншиж байна...</p>
        </div>
      </div>
    }>
      <AuthClient />
    </Suspense>
  );
}

