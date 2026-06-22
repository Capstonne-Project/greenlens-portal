import { CompaniesPageClient } from '@/components/officer/companies/CompaniesPageClient';
import { mapOverviewPanelClass } from '@/lib/map/mapShellStyles';

export default function OfficerCompaniesPage() {
  return (
    <div className={mapOverviewPanelClass()}>
      <CompaniesPageClient />
    </div>
  );
}
