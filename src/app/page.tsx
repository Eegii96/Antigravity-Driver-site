import { Metadata } from 'next';
import BoardClient from './board/BoardClient';

export const metadata: Metadata = {
  title: 'Барилга, Механизмын Ажлын Нэгдсэн Систем',
  description: 'Барилга, замын газар шорооны ажил, хүнд машин механизм түрээс ба жолооч нарын үнэлгээ, түүх бүхий нэгдсэн зарын систем.',
  openGraph: {
    title: 'Барилга, Механизмын Ажлын Нэгдсэн Систем | Жолооч Монголиа',
    description: 'Хүнд машин, механизм & Газар шорооны ажлын зарыг нэг дороос хайж, мэргэшсэн операторуудтай холбогдоорой.',
    url: 'https://jolooch.net',
    type: 'website',
  },
};

export default function HomePage() {
  return <BoardClient />;
}
