import { Metadata } from 'next';
import SettingsClient from './SettingsClient';

export const metadata: Metadata = {
  title: 'Хэрэглэгчийн тохиргоо | Жолооч Монголиа',
  description: 'Профайлын мэдээлэл засах, нууц үг шинэчлэх болон системийн тохиргооны хэсэг.',
};

export default function SettingsPage() {
  return <SettingsClient />;
}

