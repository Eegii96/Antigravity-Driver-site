import { Metadata } from 'next';
import AuthClient from './AuthClient';

export const metadata: Metadata = {
  title: 'Нэвтрэх, Бүртгүүлэх | Жолооч Монголиа',
  description: 'Хүнд машин, механизм & Газар шорооны ажлын нэгдсэн системд нэвтрэх эсвэл шинээр бүртгэл үүсгэх.',
};

export default function AuthPage() {
  return <AuthClient />;
}

