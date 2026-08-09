import { redirect } from 'next/navigation';

/** KPI đã gộp vào `/company` — giữ route cũ để bookmark không 404. */
export default function CompanyKpiPage() {
  redirect('/company#company-kpi');
}
