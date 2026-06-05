import { Metadata } from 'next';
import { getSingleUser, getUsers } from '../../../lib/db';
import ProfileDetailClient from './ProfileDetailClient';

interface Props {
  params: Promise<{ id: string }>;
}

// Generate static params for Next.js static export
export async function generateStaticParams() {
  try {
    const users = await getUsers();
    const ids = users.map((u) => ({ id: u.id }));
    if (ids.length === 0) {
      return [
        { id: 'user_op_1' },
        { id: 'user_op_2' },
        { id: 'user_op_3' },
        { id: 'user_op_unreliable' },
        { id: 'user_emp_1' },
        { id: 'user_emp_2' },
      ];
    }
    return ids;
  } catch (err) {
    console.error('Error in generateStaticParams for profiles:', err);
    return [
      { id: 'user_op_1' },
      { id: 'user_op_2' },
      { id: 'user_op_3' },
      { id: 'user_op_unreliable' },
      { id: 'user_emp_1' },
      { id: 'user_emp_2' },
    ];
  }
}

// Generate dynamic SEO metadata for profile pages
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const user = await getSingleUser(id);

  if (!user) {
    return {
      title: 'Хэрэглэгчийн профайл олдсонгүй | Барилга, Механизмын Ажлын Нэгдсэн Систем',
      description: 'Манай системээс хэрэглэгчийн профайлыг харна уу.'
    };
  }

  let title = '';
  let description = '';

  if (user.type === 'operator') {
    title = `${user.fullName} - Хүнд механизмын оператор (Туршлага: ${user.experienceYears || 0} жил, Үнэлгээ: ${user.rating || 5}★) | Жолооч Монголиа`;
    description = `Миний ажиллуулдаг техникүүд: ${user.machineTypes?.join(', ') || 'Байхгүй'}. Намтар: ${user.bio || 'Хэрэглэгчийн мэдээлэл одоогоор байхгүй байна.'}`;
  } else {
    title = `${user.fullName} - Ажил олгогч${user.companyName ? ` (${user.companyName})` : ''} | Жолооч Монголиа`;
    description = `Ажил олгогчийн үнэлгээ: ${user.rating || 5}★. Намтар: ${user.bio || 'Ажил олгогчийн мэдээлэл одоогоор байхгүй байна.'}`;
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'profile',
      images: user.profileImage ? [{ url: user.profileImage }] : undefined
    }
  };
}

export default async function ProfileDetailPage({ params }: Props) {
  const { id } = await params;
  return <ProfileDetailClient />;
}

