// Girinka App — Beneficiary Registry module types
// This is the *already-served* register (families that have received a cow),
// as distinct from src/types/selection.ts which tracks in-progress candidates
// going through the selection workflow. A Candidate graduates into a
// Beneficiary once a cow is actually distributed to them (see distributions).

export type UbudeheCategory = "1" | "2" | "3" | "4" | null;

export interface Beneficiary {
  id: string; // Firestore doc id (we reuse distributionId where we have one)
  fullName: string;
  nationalId: string;
  sex: "M" | "F";
  ubudeheCategory: UbudeheCategory;
  district: string;
  sector: string;
  cell: string;
  village: string;
  phone: string | null;
  latitude?: number | null;
  longitude?: number | null;
  createdAt: string;
  updatedAt: string;

  // Field Verification (Alignment between database and physical reality)
  isVerified?: boolean;
  verificationStatus?: "HAS_COW" | "NO_COW" | "PASSED_ON";
  verificationDate?: string;
  verifiedBy?: string;
}

export type DistributionType = "NEW" | "REPLACEMENT";

// A single cow distribution event to a beneficiary. `source` (inkomoko)
// records where the cow came from per the auditor-general register:
// e.g. RARDA, RAB, RDDP, FARG, AKARERE, YARITUYE (pass-on), VCRP, etc.
export interface Distribution {
  // Denormalised location (copied from the parent) — Firestore rules use these.
  district?: string | null;
  sector?: string | null;
  cell?: string | null;
  village?: string | null;
  id: string; // Firestore doc id — the register's own distribution/animal number
  beneficiaryId: string;
  animalId: string | null; // Linked animal from the Animals module
  type: DistributionType; // NEW (itanzwe bwa mbere) cyangwa REPLACEMENT (gushumbusha)
  yearReceived: number;
  dateReceived?: string | null; // Itariki yayihaweho (full date)
  source: string;
  passedOnCow: boolean; // "kwitura" — whether they claim to have passed on a calf
  passOnVerified?: boolean; // Whether an auditor confirmed the pass-on
  passOnVerificationStatus?: "PENDING" | "VERIFIED" | "REJECTED";
  passOnDate?: string | null;
  notes: string | null;
  createdAt: string;
}

export type IncidentType = "DEATH" | "THEFT" | "SALE" | "GIFT" | "ILLNESS" | "SEIZURE" | "VOLUNTARY_RETURN" | "POOR_MANAGEMENT";

export interface Incident {
  id: string;
  beneficiaryId: string;
  animalId: string;
  type: IncidentType;
  date: string;
  description: string;
  photoUri?: string | null;
  reportedBy: string;
  createdAt: string;
  // Denormalised location
  district?: string | null;
  sector?: string | null;
  cell?: string | null;
  village?: string | null;
}

export interface FollowUp {
  id: string;
  beneficiaryId: string;
  animalId: string;
  date: string;
  // New fields from ODK-style form
  hasCowInShed: boolean;
  remembersYearReceived: boolean;
  yearReceivedInput?: number | null;
  noCowReason?: "DEATH" | "SOLD" | "STOLEN" | "RETURNED" | "OTHER" | null;
  noCowNotes?: string | null;
  hasPassedOn: boolean;
  noPassOnReason?: "NOT_GIVEN_BIRTH" | "DIED" | "OTHER" | null;

  // Cow condition / management fields
  hasShed?: boolean;
  bodyCondition?: "EXCELLENT" | "GOOD" | "POOR_ADVICE" | "POOR_URGENT" | "POOR_REMOVAL";
  photo1Uri?: string | null;
  photo2Uri?: string | null;

  // Existing fields
  cowCondition: "GOOD" | "FAIR" | "POOR";
  milkProductionPerDay?: number;
  isPregnant: boolean;
  notes: string;
  reportedBy: string;
  createdAt: string;
  district?: string | null;
  sector?: string | null;
  cell?: string | null;
  village?: string | null;
}

export interface PassOn {
  id: string;
  donorBeneficiaryId: string;
  recipientBeneficiaryId: string;
  animalId: string;
  date: string;
  status: "PENDING" | "COMPLETED";
  notes?: string;
  createdAt: string;
  district?: string | null;
  sector?: string | null;
  cell?: string | null;
  village?: string | null;
}

export interface PassOnAssessment {
  id: string;
  beneficiaryId: string;
  animalId?: string | null;
  breed: string;
  sex: "F" | "M";
  birthDate: string;
  earTag: string;
  isWellCaredFor: boolean;
  isReadyForPassOn: boolean;
  plannedPassOnDate?: string | null;
  noPassOnReason?: string | null;
  noPassOnReasonNotes?: string | null;
  conclusion: string;
  photoUri?: string | null; // Added photo field
  reportedBy: string;
  createdAt: string;
  // Denormalised location
  district?: string | null;
  sector?: string | null;
  cell?: string | null;
  village?: string | null;
}

export interface ShedInspection {
  id: string;
  beneficiaryId: string;
  hasShed: boolean;
  isFirm: boolean;
  isRoofed: boolean;
  hasEnoughSpace: boolean; // imitambiko
  hasCement: boolean;
  photo1Uri?: string;
  photo2Uri?: string;
  conclusion: "READY" | "IMPROVEMENT_NEEDED" | "NOT_READY";
  improvementNotes?: string;
  reportedBy: string;
  createdAt: string;
  // Denormalised location
  district?: string | null;
  sector?: string | null;
  cell?: string | null;
  village?: string | null;
}
