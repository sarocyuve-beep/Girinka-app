// Girinka App — core/shared types (Administration, Locations)

export type Role =
  | "DISTRICT_ADMIN"
  | "ES_SECTOR"      // Umuyobozi wa Komite (Umurenge)
  | "SECTOR_MEMBER"  // Member wa Komite (Umurenge)
  | "ES_CELL"        // Umuyobozi wa Komite (Akagari)
  | "CELL_MEMBER"    // Member wa Komite (Akagari)
  | "VILLAGE_HEAD"   // Umuyobozi w'Umudugudu (Chairperson)
  | "VILLAGE_PSW"    // Para Social Worker (Village level)
  | "VILLAGE_MEMBER" // Member wa Komite (Umudugudu)
  | "FIELD_OFFICER"
  | "VIEWER";

export interface AppUser {
  id: string;
  fullName: string;
  username: string;
  role: Role;
  district: string | null;
  sector: string | null;
  cell: string | null;
  village: string | null;
  phone: string;
  email: string | null;
  active: boolean;
}

// A location "scope" describes which admin level's data a user may see.
// Rule from the spec: a lower level must never see another same-level
// unit's data (e.g. one village cannot see another village's data).
export interface LocationScope {
  district?: string;
  sector?: string;
  cell?: string;
  village?: string;
}
