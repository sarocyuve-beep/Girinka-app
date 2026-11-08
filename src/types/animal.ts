export type AnimalBreed = "Friesian" | "Jersey" | "Sahiwal" | "Ankole" | "Cross" | "Other";
export type AnimalStatus = "HEALTHY" | "SICK" | "PREGNANT" | "DEAD" | "SOLD" | "PASSED_ON" | "STOLEN";

export interface Animal {
  // Denormalised location (copied from the parent) — Firestore rules use these.
  district?: string | null;
  sector?: string | null;
  cell?: string | null;
  village?: string | null;
  id?: string;
  earTag: string;
  breed: AnimalBreed;
  sex: "F" | "M";
  color: string;
  birthDate: string; // ISO date
  origin: string; // Urugero: "RAB", "Pass-on from X", "Market"
  healthStatus: string;
  currentStatus: AnimalStatus;
  photoUrl: string | null;
  currentOwnerId: string | null; // Beneficiary ID
  registrationDate: string;
}
