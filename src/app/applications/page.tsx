import { Metadata } from 'next';
import ApplicationsClient from './ApplicationsClient';

export const metadata: Metadata = {
  title: 'Миний илгээсэн хүсэлтүүд | Жолооч Монголиа',
  description: 'Таны бүртгүүлсэн ажлын саналууд, ажлын түүх болон илгээсэн хүсэлтүүдийг хянах хэсэг.',
};

export default function ApplicationsPage() {
  return <ApplicationsClient />;
}

