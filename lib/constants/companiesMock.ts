export type CompanyStatus = 'active' | 'inactive' | 'pending';

export type CompanyRecord = {
  id: string;
  countryCode: string;
  name: string;
  logoInitials: string;
  area: string;
  businessType: string;
  licenseCode: string;
  foundedYear: number;
  status: CompanyStatus;
};

/** Mock dataset — thay bằng API L2 khi BE sẵn sàng. */
export const COMPANIES_MOCK: CompanyRecord[] = [
  {
    id: 'co-001',
    countryCode: 'VN',
    name: 'Công ty TNHH Môi trường Xanh Sài Gòn',
    logoInitials: 'XS',
    area: 'TP.HCM • Quận 7',
    businessType: 'Thu gom rác thải',
    licenseCode: 'MT-2021-00482',
    foundedYear: 2018,
    status: 'active',
  },
  {
    id: 'co-002',
    countryCode: 'VN',
    name: 'GreenTech Recycling JSC',
    logoInitials: 'GT',
    area: 'TP.HCM • Thủ Đức',
    businessType: 'Tái chế công nghiệp',
    licenseCode: 'MT-2019-01103',
    foundedYear: 2015,
    status: 'active',
  },
  {
    id: 'co-003',
    countryCode: 'VN',
    name: 'Nhà máy xử lý nước thải Đông Sài Gòn',
    logoInitials: 'DS',
    area: 'TP.HCM • Bình Thạnh',
    businessType: 'Xử lý nước thải',
    licenseCode: 'MT-2020-00791',
    foundedYear: 2012,
    status: 'active',
  },
  {
    id: 'co-004',
    countryCode: 'VN',
    name: 'EcoLogistics Việt Nam',
    logoInitials: 'EL',
    area: 'Đồng Nai • Biên Hòa',
    businessType: 'Vận chuyển chất thải',
    licenseCode: 'MT-2022-00214',
    foundedYear: 2020,
    status: 'pending',
  },
  {
    id: 'co-005',
    countryCode: 'VN',
    name: 'Công ty CP Khí thải Công nghiệp Miền Nam',
    logoInitials: 'KT',
    area: 'Bình Dương • Thuận An',
    businessType: 'Quan trắc môi trường',
    licenseCode: 'MT-2017-01556',
    foundedYear: 2010,
    status: 'active',
  },
  {
    id: 'co-006',
    countryCode: 'VN',
    name: 'Saigon Waste Solutions',
    logoInitials: 'SW',
    area: 'TP.HCM • Quận 12',
    businessType: 'Thu gom rác thải',
    licenseCode: 'MT-2016-00988',
    foundedYear: 2008,
    status: 'inactive',
  },
  {
    id: 'co-007',
    countryCode: 'VN',
    name: 'Công ty TNHH Xử lý bùn ven sông Sài Gòn',
    logoInitials: 'BS',
    area: 'TP.HCM • Củ Chi',
    businessType: 'Xử lý bùn thải',
    licenseCode: 'MT-2023-00107',
    foundedYear: 2021,
    status: 'active',
  },
  {
    id: 'co-008',
    countryCode: 'VN',
    name: 'VietClean Environmental Services',
    logoInitials: 'VC',
    area: 'Long An • Bến Lức',
    businessType: 'Dịch vụ môi trường',
    licenseCode: 'MT-2018-00634',
    foundedYear: 2014,
    status: 'active',
  },
  {
    id: 'co-009',
    countryCode: 'VN',
    name: 'Nhà máy tái chế nhựa Phú Mỹ',
    logoInitials: 'PM',
    area: 'Bà Rịa — Vũng Tàu • Phú Mỹ',
    businessType: 'Tái chế nhựa',
    licenseCode: 'MT-2015-01201',
    foundedYear: 2009,
    status: 'active',
  },
  {
    id: 'co-010',
    countryCode: 'VN',
    name: 'Công ty CP Quản lý chất thải đô thị',
    logoInitials: 'QT',
    area: 'TP.HCM • Tân Bình',
    businessType: 'Quản lý chất thải',
    licenseCode: 'MT-2024-00031',
    foundedYear: 2023,
    status: 'pending',
  },
];

/** Tổng bản ghi “trên server” (mock pagination meta). */
export const COMPANIES_MOCK_TOTAL = 500;

export const COUNTRY_FLAG_EMOJI: Record<string, string> = {
  VN: '🇻🇳',
  DE: '🇩🇪',
  US: '🇺🇸',
};

export function countryFlag(code: string): string {
  return COUNTRY_FLAG_EMOJI[code] ?? '🏳️';
}
