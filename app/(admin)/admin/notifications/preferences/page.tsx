import { redirect } from 'next/navigation';

export default function AdminNotifPrefsRedirect() {
  redirect('/admin/settings/notifications');
}
