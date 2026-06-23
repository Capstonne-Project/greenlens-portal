import { redirect } from 'next/navigation';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function OfficerVerifyDetailPage({ params }: PageProps) {
  await params;
  redirect('/officer/map');
}
