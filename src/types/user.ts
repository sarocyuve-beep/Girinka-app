export type Role =
  | 'DISTRICT_ADMIN'
  | 'SECTOR'
  | 'CELL'
  | 'VILLAGE'
  | 'FIELD_OFFICER'
  | 'VIEWER';

export type UserProfile = {
  uid: string;
  email: string;
  role: Role;
  district: string;
  sector?: string;
  cell?: string;
  village?: string;
};
