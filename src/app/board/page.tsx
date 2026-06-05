import { Metadata } from 'next';
import BoardClient from './BoardClient';

export const metadata: Metadata = {
  title: 'Ажлын зарын самбар | Жолооч Монголиа',
  description: 'Хүнд машин механизм, газар шорооны ажлын нээлттэй ажлын байрууд, захиалгууд болон түрээсийн зар мэдээлэл.',
};

export default function BoardPage() {
  return <BoardClient />;
}

