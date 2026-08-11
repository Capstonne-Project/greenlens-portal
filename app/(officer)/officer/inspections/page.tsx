import { redirect } from 'next/navigation';

/** Legacy list route — gộp vào hub 「Sau xử lý」 tab Hồ sơ xử phạt. */
export default function OfficerInspectionsPage() {
  redirect('/officer/recurrence?tab=inspections');
}
