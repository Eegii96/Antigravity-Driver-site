import { Metadata } from 'next';
import HomeClient from './HomeClient';

export const metadata: Metadata = {
  title: 'Барилга, Механизмын Ажлын Нэгдсэн Систем | Жолооч Монголиа',
  description: 'Барилга, замын газар шорооны ажил, хүнд машин механизм түрээс ба жолооч нарын үнэлгээ, түүх бүхий нэгдсэн зарын систем.',
};

export default function HomePage() {
  return <HomeClient />;
}
