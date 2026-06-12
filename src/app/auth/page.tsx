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
      <div className="min-h-screen bg-[#070a13] flex items-center justify-center text-white font-sans">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm">Уншиж байна...</p>
        </div>
      </div>
    }>
      <AuthClient />
    </Suspense>
  );
}

