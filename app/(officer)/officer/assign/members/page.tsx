import { redirect } from 'next/navigation';

/** Legacy route — nhân sự chuyển sang Đội ngũ. */
export default function OfficerAssignMembersPage() {
  redirect('/officer/workforce?tab=members');
}
