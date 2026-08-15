import { redirect } from 'next/navigation';

/** Legacy — gộp vào Đội ngũ tab Nhân sự. */
export default function CompanyStaffPage() {
  redirect('/company/workforce?tab=members');
}
