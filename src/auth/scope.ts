import { where, QueryConstraint } from "firebase/firestore";
import { AppUser, Role } from "../types/core";

// ---------------------------------------------------------------------------
// Session profile — set by AuthContext after sign-in so repositories can add
// the user's location filters without every screen passing it around.
// ---------------------------------------------------------------------------
let current: AppUser | null = null;
export function setSessionProfile(p: AppUser | null) {
  current = p;
}
export function getSessionProfile(): AppUser | null {
  return current;
}

export type Loc = {
  district: string | null;
  sector: string | null;
  cell: string | null;
  village: string | null;
};

// The user's scope = every non-null level of their profile. A VILLAGE user has
// all four, a SECTOR user has district+sector, a DISTRICT_ADMIN only district.
export function scopeOf(p: AppUser | null = current): Loc {
  return {
    district: p?.district?.toUpperCase() ?? null,
    sector: p?.sector?.toUpperCase() ?? null,
    cell: p?.cell?.toUpperCase() ?? null,
    village: p?.village?.toUpperCase() ?? null,
  };
}

// Equality filters that mirror the Firestore rules (inScope). Queries MUST
// include them: rules are not filters, so an unscoped query is rejected.
export function scopeConstraints(p: AppUser | null = current): QueryConstraint[] {
  const s = scopeOf(p);
  const c: QueryConstraint[] = [];
  if (s.district) c.push(where("district", "==", s.district));
  if (s.sector) c.push(where("sector", "==", s.sector));
  if (s.cell) c.push(where("cell", "==", s.cell));
  if (s.village) c.push(where("village", "==", s.village));
  return c;
}

// Location fields stamped on documents that have no location of their own.
export function scopeFields(p: AppUser | null = current): Loc {
  return scopeOf(p);
}

// ---------------------------------------------------------------------------
// Permissions (kept in sync with firestore.rules)
// ---------------------------------------------------------------------------
export const ROLE_LABEL: Record<Role, string> = {
  DISTRICT_ADMIN: "Umuyobozi w'Akarere",
  ES_SECTOR: "Umuyobozi wa Komite (Umurenge)",
  SECTOR_MEMBER: "Member wa Komite (Umurenge)",
  ES_CELL: "Umuyobozi wa Komite (Akagari)",
  CELL_MEMBER: "Member wa Komite (Akagari)",
  VILLAGE_HEAD: "Umuyobozi w'Umudugudu",
  VILLAGE_PSW: "Para Social Worker (PSW)",
  VILLAGE_MEMBER: "Member wa Komite (Umudugudu)",
  FIELD_OFFICER: "Umukozi w'ikurikirana",
  VIEWER: "Usoma gusa",
};

export function canWrite(role?: Role | null): boolean {
  return !!role && role !== "VIEWER";
}

// Urwego rw'Umurenge na District nibo gusa banditsa cyangwa bemeza itangwa ry'inka (Distribution)
export function canManageRegistry(role?: Role | null): boolean {
  return role === "DISTRICT_ADMIN" || role === "ES_SECTOR" || role === "SECTOR_MEMBER";
}

/**
 * Ubu bubasha ni ubwo gusiba cyangwa guhindura amakuru y'ingenzi (Beneficiaries, Distributions, Animals).
 * Ibi bikorwa gusa n'inzego zisumbuye kugira ngo Field Officer adasiba ibintu by'ingenzi.
 */
export function canDeleteImportantData(role?: Role | null): boolean {
  return role === "DISTRICT_ADMIN" || role === "ES_SECTOR" || role === "SECTOR_MEMBER";
}

/**
 * Field Officers, Cells, and Villages can edit/delete field data (Shed inspections, Incidents, Assessments)
 * as long as they have write access.
 */
export function canEditFieldData(role?: Role | null): boolean {
  return canWrite(role);
}

export function canManageUsers(role?: Role | null): boolean {
  return role === "DISTRICT_ADMIN" || role === "ES_SECTOR";
}
// Roles the given manager may create.
export function assignableRoles(role?: Role | null): Role[] {
  if (role === "DISTRICT_ADMIN")
    return [
      "DISTRICT_ADMIN",
      "ES_SECTOR",
      "SECTOR_MEMBER",
      "ES_CELL",
      "CELL_MEMBER",
      "VILLAGE_HEAD",
      "VILLAGE_PSW",
      "VILLAGE_MEMBER",
      "FIELD_OFFICER",
      "VIEWER",
    ];
  if (role === "ES_SECTOR")
    return ["SECTOR_MEMBER", "ES_CELL", "CELL_MEMBER", "VILLAGE_HEAD", "VILLAGE_PSW", "VILLAGE_MEMBER", "FIELD_OFFICER", "VIEWER"];
  // For self-registration (no logged in user)
  if (!role)
    return ["ES_SECTOR", "SECTOR_MEMBER", "ES_CELL", "CELL_MEMBER", "VILLAGE_HEAD", "VILLAGE_PSW", "VILLAGE_MEMBER", "FIELD_OFFICER", "VIEWER"];
  return [];
}
// How deep the location must go for a role: 0 district, 1 sector, 2 cell, 3 village.
export function requiredLevel(role: Role): number {
  switch (role) {
    case "ES_SECTOR":
    case "SECTOR_MEMBER":
      return 1;
    case "ES_CELL":
    case "CELL_MEMBER":
      return 2;
    case "VILLAGE_HEAD":
    case "VILLAGE_PSW":
    case "VILLAGE_MEMBER":
      return 3;
    case "FIELD_OFFICER":
    case "VIEWER":
      return 1;
    default:
      return 0;
  }
}
