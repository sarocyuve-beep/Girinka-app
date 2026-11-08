// Girinka App — Selection module types
// Reba: 3. Module ya mbere: SELECTION – Gutoranya abagenerwabikorwa

export type SelectionStatus =
  | "OPEN"
  | "VILLAGE_REVIEW"
  | "CELL_REVIEW"
  | "SECTOR_REVIEW"
  | "DISTRICT_APPROVED"
  | "CLOSED";

export interface SelectionCampaign {
  id: string;
  program: string; // e.g. "Girinka"
  financialYear: string; // e.g. "2025-2026"
  district: string;
  sector: string;
  cell: string;
  village: string;
  startDate: string; // ISO date
  endDate: string | null;
  responsibleCommittee: string; // which committee level created it
  status: SelectionStatus;
  createdAt: string;
}

export type Sex = "M" | "F";

export interface Candidate {
  id: string; // Candidate ID: yyyyMMddHHmmss + 4-char system code
  campaignId: string;
  fullName: string;
  sex: Sex;
  nationalId: string;
  spouse: string | null;
  phone: string | null;
  district: string;
  sector: string;
  cell: string;
  village: string;
  householdInfo: string | null;
  currentLivestock: string | null;
  landHouseholdInfo: string | null;
  economicSocialInfo: string | null;
  drawNumber: string | null;
  graduationStatus: string | null;
  conclusion: string | null;
  createdAt: string;
}

export interface EligibilityChecklist {
  // Denormalised location (copied from the parent) — Firestore rules use these.
  district?: string | null;
  sector?: string | null;
  cell?: string | null;
  village?: string | null;
  id: string;
  candidateId: string;
  householdIdentified: boolean;
  eligibilityConditionsChecked: boolean;
  locationVerified: boolean;
  requiredDocumentsAvailable: boolean;
  householdAssessed: boolean;
  candidateAcceptedByCommittee: boolean;
  communityVerificationCompleted: boolean;
  finalApprovalCompleted: boolean;
  updatedAt: string;
}

export interface AssessmentScore {
  // Denormalised location (copied from the parent) — Firestore rules use these.
  district?: string | null;
  sector?: string | null;
  cell?: string | null;
  village?: string | null;
  id: string;
  candidateId: string;
  criterion: string;
  score: number;
  totalScore: number;
  recommendation: string | null;
  assessmentOfficer: string;
  assessmentDate: string;
}

export type CommitteeDecisionValue = "APPROVED" | "REJECTED";

export interface CommitteeDecision {
  // Denormalised location (copied from the parent) — Firestore rules use these.
  district?: string | null;
  sector?: string | null;
  cell?: string | null;
  village?: string | null;
  id: string;
  candidateId: string;
  decision: CommitteeDecisionValue;
  decisionDate: string;
  decisionBy: string;
  reason: string | null;
  comments: string | null;
  minutesReference: string | null;
  supportingDocument: string | null; // local file uri
}

export interface Appeal {
  // Denormalised location (copied from the parent) — Firestore rules use these.
  district?: string | null;
  sector?: string | null;
  cell?: string | null;
  village?: string | null;
  id: string;
  candidateId: string;
  dateSubmitted: string;
  reason: string;
  submittedBy: string;
  decision: string | null;
  decisionDate: string | null;
  decisionOfficer: string | null;
  document: string | null;
}
