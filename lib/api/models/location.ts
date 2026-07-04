export interface Province {
  code: string;
  name: string;
  boundaryUrl: string | null;
}

export interface Ward {
  code: string;
  name: string;
  unitAbbreviation: string | null;
  boundaryUrl: string | null;
}
