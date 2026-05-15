/** Nhãn vai trò hiển thị (API tiếng Anh → tiếng Việt). */
export function roleDisplayVi(role: string): string {
  const x = role.trim().toLowerCase().replace(/\s+/g, '');
  if (x === 'admin') return 'Quản trị';
  if (x === 'citizen') return 'Người dân';
  if (x === 'officer' || x === 'environmentalofficer') return 'Cán bộ môi trường';
  if (x === 'cleanupteam') return 'Đội dọn dẹp';
  return role;
}

export function roleBadgeClasses(role: string): string {
  const x = role.trim().toLowerCase().replace(/\s+/g, '');
  if (x === 'admin') return 'bg-emerald-600 text-white';
  if (x === 'citizen') return 'bg-muted text-foreground';
  if (x === 'officer' || x === 'environmentalofficer') return 'bg-sky-100 text-sky-900';
  if (x === 'cleanupteam') return 'bg-emerald-100 text-emerald-900';
  return 'bg-secondary text-secondary-foreground';
}
