import {
  adaptAssignOfficeOfficer,
  adaptCreateOffice,
  adaptOfficeDetail,
  adaptOfficesList,
  adaptUpdateOffice,
} from '@/lib/api/adapters/offices.adapter';
import type {
  AssignOfficeOfficerInput,
  CreateOfficeInput,
  Office,
  OfficeDetail,
  OfficesList,
  OfficesListParams,
  UpdateOfficeInput,
} from '@/lib/api/models/office';
import type { ApiEnvelope } from '@/lib/api/types/envelope';

export type {
  AssignOfficeOfficerInput,
  CreateOfficeInput,
  Office,
  OfficeDetail,
  OfficeListItem,
  OfficesList,
  OfficesListParams,
  UpdateOfficeInput,
} from '@/lib/api/models/office';

export async function fetchOffices(params?: OfficesListParams): Promise<ApiEnvelope<OfficesList>> {
  return adaptOfficesList(params);
}

export async function fetchOfficeDetail(id: string): Promise<ApiEnvelope<OfficeDetail>> {
  return adaptOfficeDetail(id);
}

export async function createOffice(body: CreateOfficeInput): Promise<ApiEnvelope<Office>> {
  return adaptCreateOffice(body);
}

export async function updateOffice(id: string, body: UpdateOfficeInput): Promise<void> {
  return adaptUpdateOffice(id, body);
}

export async function assignOfficeOfficer(
  officeId: string,
  body: AssignOfficeOfficerInput
): Promise<void> {
  return adaptAssignOfficeOfficer(officeId, body);
}

export default {
  fetchOffices,
  fetchOfficeDetail,
  createOffice,
  updateOffice,
  assignOfficeOfficer,
};
