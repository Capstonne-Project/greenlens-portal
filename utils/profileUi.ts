/** Display helpers shared by profile UI + sidebar avatar. */

export function initialsFromUser(name: string | undefined, email: string | undefined): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return 'GL';
}

export function profileRoleLabelVi(role: string | undefined): string {
  if (!role) return '—';
  switch (role) {
    case 'Admin':
    case 'SystemAdministrator':
      return 'Quản trị viên';
    case 'EnvironmentalOfficer':
      return 'Cán bộ môi trường';
    case 'CompanyManager':
      return 'Quản lý công ty';
    case 'CompanyStaff':
      return 'Nhân viên công ty';
    case 'Citizen':
      return 'Công dân';
    default:
      return role;
  }
}
