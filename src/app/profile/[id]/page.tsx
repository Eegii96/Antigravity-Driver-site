import ProfileDetailClient from './ProfileDetailClient';

export function generateStaticParams() {
  return [
    { id: 'user_op_1' },
    { id: 'user_op_2' },
    { id: 'user_op_3' },
    { id: 'user_op_unreliable' },
    { id: 'user_emp_1' },
    { id: 'user_emp_2' },
  ];
}

export default function ProfileDetailPage() {
  return <ProfileDetailClient />;
}
