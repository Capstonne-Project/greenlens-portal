/** FE models — thẻ loại rác thải (admin). */

export interface WasteTag {
  id: string;
  code: string;
  nameVi: string;
  nameEn: string;
  iconUrl: string | null;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
}

export interface WasteTagList {
  items: WasteTag[];
}

export interface CreateWasteTagInput {
  code: string;
  nameVi: string;
  nameEn: string;
  iconUrl?: string;
  description?: string;
  displayOrder: number;
}

export interface UpdateWasteTagInput {
  code: string;
  nameVi: string;
  nameEn: string;
  iconUrl?: string;
  description?: string;
  displayOrder: number;
}

export interface ToggleWasteTagInput {
  isActive: boolean;
}

export interface WasteTagMutationResult {
  id: string;
  code: string;
}
