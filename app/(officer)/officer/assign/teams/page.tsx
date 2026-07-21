import { redirect } from 'next/navigation';

/** Legacy route — đội nhóm chuyển sang Đội ngũ. */
export default function OfficerAssignTeamsPage() {
  redirect('/officer/workforce');
}
