import { redirect } from 'next/navigation';

/** Legacy — gộp vào Đội ngũ tab Đội nhóm. */
export default function CompanyTeamsPage() {
  redirect('/company/workforce');
}
