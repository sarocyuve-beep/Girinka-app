// Musanze pilot-district geo data (district -> sector -> cell -> villages).
// This is small and static enough to bundle directly rather than round-trip
// through Firestore reads (which cost quota on the free plan).

export type LocationTree = Record<string, Record<string, Record<string, string[]>>>;

export function getLocationTree(): LocationTree {
  return require("./musanzeLocations.json") as LocationTree;
}

export function getSectors(district: string): string[] {
  const tree = getLocationTree();
  // Handle case-insensitivity for district names
  const key = Object.keys(tree).find(k => k.toUpperCase() === district.toUpperCase()) || district;
  return Object.keys(tree[key] ?? {});
}

export function getCells(district: string, sector: string): string[] {
  const tree = getLocationTree();
  const dKey = Object.keys(tree).find(k => k.toUpperCase() === district.toUpperCase()) || district;
  const sKey = Object.keys(tree[dKey] ?? {}).find(k => k.toUpperCase() === sector.toUpperCase()) || sector;
  return Object.keys(tree[dKey]?.[sKey] ?? {});
}

export function getVillages(district: string, sector: string, cell: string): string[] {
  const tree = getLocationTree();
  const dKey = Object.keys(tree).find(k => k.toUpperCase() === district.toUpperCase()) || district;
  const sKey = Object.keys(tree[dKey] ?? {}).find(k => k.toUpperCase() === sector.toUpperCase()) || sector;
  const cKey = Object.keys(tree[dKey]?.[sKey] ?? {}).find(k => k.toUpperCase() === cell.toUpperCase()) || cell;
  return tree[dKey]?.[sKey]?.[cKey] ?? [];
}
