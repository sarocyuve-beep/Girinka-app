export type Role = 'DISTRICT_ADMIN' | 'SECTOR' | 'CELL' | 'VILLAGE' | 'FIELD_OFFICER' | 'VIEWER';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  sector?: string;
  cell?: string;
  village?: string;
}
