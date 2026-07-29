import { redirect } from 'next/navigation';

export default function CompanyNotifPrefsRedirect() {
  redirect('/company/settings/notifications');
}
