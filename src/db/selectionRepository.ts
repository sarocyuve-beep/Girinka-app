import { v4 as uuidv4 } from "uuid";
import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  updateDoc,
  addDoc,
  serverTimestamp,
  QueryConstraint,
} from "firebase/firestore";
import { getDb, COLLECTIONS } from "../config/firebase";
import { scopeConstraints, getSessionProfile, scopeOf, scopeFields } from "../auth/scope";
import {
  SelectionCampaign,
  Candidate,
  EligibilityChecklist,
  AssessmentScore,
  CommitteeDecision,
  Appeal,
} from "../types/selection";

// Candidate ID format from the spec: year/month/day/hour/minute/second
// + a 4-character system code, e.g. 20260927143205AB12
function generateCandidateId(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const stamp =
    now.getFullYear().toString() +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    pad(now.getHours()) +
    pad(now.getMinutes()) +
    pad(now.getSeconds());
  const code = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${stamp}${code}`;
}

function locationOf(x: { district?: string | null; sector?: string | null; cell?: string | null; village?: string | null }) {
  return {
    district: x.district?.toUpperCase() ?? null,
    sector: x.sector?.toUpperCase() ?? null,
    cell: x.cell?.toUpperCase() ?? null,
    village: x.village?.toUpperCase() ?? null,
  };
}

// Child records (assessment, decision, appeal…) inherit the candidate's
// location so that rules can check them without an extra lookup.
async function candidateLocation(candidateId: string) {
  const c = await getCandidate(candidateId);
  if (!c) throw new Error("Umukandida ntabonetse cyangwa ntiwemerewe kumubona.");
  return locationOf(c);
}

export async function createSelectionCampaign(
  input: Omit<SelectionCampaign, "id" | "createdAt" | "status"> & {
    status?: SelectionCampaign["status"];
  }
): Promise<SelectionCampaign> {
  const db = getDb();
  const campaign: SelectionCampaign = {
    ...input,
    id: uuidv4(),
    status: input.status ?? "OPEN",
    createdAt: new Date().toISOString(),
  };
  await setDoc(doc(db, COLLECTIONS.selectionCampaigns, campaign.id), campaign);
  return campaign;
}

export async function listSelectionCampaigns(): Promise<SelectionCampaign[]> {
  const db = getDb();
  // No orderBy: equality filters (scope) + orderBy would need a composite
  // index. The list is small, so we sort here.
  const snap = await getDocs(
    query(collection(db, COLLECTIONS.selectionCampaigns), ...scopeConstraints())
  );
  return snap.docs
    .map((d) => d.data() as SelectionCampaign)
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
}

export async function createCandidate(
  input: Omit<Candidate, "id" | "createdAt">
): Promise<Candidate> {
  const db = getDb();

  // 1. Check if ID exists in Candidates
  const qCand = query(collection(db, COLLECTIONS.candidates), where("nationalId", "==", input.nationalId));
  const snapCand = await getDocs(qCand);

  // 2. Check if ID exists in Beneficiaries (Past or Present)
  const qBen = query(collection(db, COLLECTIONS.beneficiaries), where("nationalId", "==", input.nationalId));
  const snapBen = await getDocs(qBen);

  if (!snapCand.empty || !snapBen.empty) {
    const existing = !snapCand.empty ? snapCand.docs[0].data() : snapBen.docs[0].data();
    throw new Error(`Indangamuntu ${input.nationalId} isanzwe muri sisitemu kuri: ${existing.fullName} (${existing.village})`);
  }

  const candidate: Candidate = {
    ...input,
    id: generateCandidateId(),
    createdAt: new Date().toISOString(),
  };
  await setDoc(doc(db, COLLECTIONS.candidates, candidate.id), candidate);

  // Every new candidate starts with an empty eligibility checklist.
  const checklistId = uuidv4();
  const checklist: EligibilityChecklist = {
    id: checklistId,
    candidateId: candidate.id,
    ...locationOf(candidate),
    householdIdentified: false,
    eligibilityConditionsChecked: false,
    locationVerified: false,
    requiredDocumentsAvailable: false,
    householdAssessed: false,
    candidateAcceptedByCommittee: false,
    communityVerificationCompleted: false,
    finalApprovalCompleted: false,
    updatedAt: new Date().toISOString(),
  };
  await setDoc(doc(db, COLLECTIONS.eligibilityChecklists, checklistId), checklist);

  return candidate;
}

export async function getCandidate(id: string): Promise<Candidate | null> {
  const db = getDb();
  const snap = await getDoc(doc(db, COLLECTIONS.candidates, id));
  return snap.exists() ? (snap.data() as Candidate) : null;
}

export async function listCandidatesByCampaign(
  campaignId: string
): Promise<Candidate[]> {
  const db = getDb();
  const snap = await getDocs(
    query(
      collection(db, COLLECTIONS.candidates),
      where("campaignId", "==", campaignId),
      ...scopeConstraints()
    )
  );
  return snap.docs
    .map((d) => d.data() as Candidate)
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
}

export async function getEligibilityChecklist(
  candidateId: string
): Promise<EligibilityChecklist | null> {
  const db = getDb();
  const snap = await getDocs(
    query(
      collection(db, COLLECTIONS.eligibilityChecklists),
      where("candidateId", "==", candidateId),
      ...scopeConstraints()
    )
  );
  return snap.empty ? null : (snap.docs[0].data() as EligibilityChecklist);
}

export async function updateEligibilityChecklist(
  candidateId: string,
  updates: Partial<
    Omit<EligibilityChecklist, "id" | "candidateId" | "updatedAt">
  >
): Promise<void> {
  const existing = await getEligibilityChecklist(candidateId);
  if (!existing) return;
  const db = getDb();
  await updateDoc(doc(db, COLLECTIONS.eligibilityChecklists, existing.id), {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

// Assessment / Scoring
export async function saveAssessment(assessment: Omit<AssessmentScore, "id">) {
  const db = getDb();
  const loc = await candidateLocation(assessment.candidateId);
  const docRef = await addDoc(collection(db, COLLECTIONS.assessmentScores), {
    ...assessment,
    ...loc,
    createdAt: new Date().toISOString(),
  });
  return docRef.id;
}

// Committee Decision
export async function saveCommitteeDecision(decision: Omit<CommitteeDecision, "id">) {
  const db = getDb();
  const loc = await candidateLocation(decision.candidateId);

  // Update candidate conclusion status
  await updateDoc(doc(db, COLLECTIONS.candidates, decision.candidateId), {
    conclusion: decision.decision,
    updatedAt: new Date().toISOString(),
  });

  const docRef = await addDoc(collection(db, COLLECTIONS.committeeDecisions), {
    ...decision,
    ...loc,
    createdAt: new Date().toISOString(),
  });
  return docRef.id;
}

export async function getCommitteeDecision(
  candidateId: string
): Promise<CommitteeDecision | null> {
  const db = getDb();
  const snap = await getDocs(
    query(
      collection(db, COLLECTIONS.committeeDecisions),
      where("candidateId", "==", candidateId),
      ...scopeConstraints()
    )
  );
  if (snap.empty) return null;
  // Get the latest decision
  const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as CommitteeDecision));
  return docs.sort((a, b) => b.decisionDate.localeCompare(a.decisionDate))[0];
}

// Appeals
export async function seedCyuveWaitingListIfNeeded(): Promise<void> {
  const db = getDb();
  const profile = getSessionProfile();

  const markerRef = doc(db, COLLECTIONS.meta, "seed_cyuve_waiting_list_v2");
  const marker = await getDoc(markerRef);
  if (marker.exists()) return;

  if (!profile) return;

  try {
    const cyuveData = require("../data/cyuveWaitingList.json");
    const campaignId = "cyuve-2026-2027-waiting-list";

    // Check if campaign exists
    const campaignSnap = await getDoc(doc(db, COLLECTIONS.selectionCampaigns, campaignId));
    if (!campaignSnap.exists()) {
      const campaign: SelectionCampaign = {
        id: campaignId,
        title: "URUTONDE RW'IMIRYANGO IZOROZWA MURI GAHUNDA YA GIRINKA MU MWAKA WA 2026-2027",
        program: "Girinka",
        financialYear: "2026-2027",
        district: "MUSANZE",
        sector: "CYUVE",
        cell: "MIGESHI",
        village: "RABIKA",
        startDate: new Date().toISOString(),
        endDate: null,
        responsibleCommittee: "DISTRICT",
        status: "OPEN",
        createdAt: new Date().toISOString(),
        ...scopeFields(profile),
      };
      await setDoc(doc(db, COLLECTIONS.selectionCampaigns, campaignId), campaign);
    }

    for (const item of cyuveData) {
      const candId = `waiting-${item.id}`;
      const candidate: Candidate = {
        id: candId,
        campaignId: campaignId,
        fullName: item.name.toUpperCase(),
        nationalId: item.id,
        sex: item.sex as "M" | "F",
        spouse: item.spouse,
        phone: "",
        district: "MUSANZE",
        sector: item.sector.toUpperCase(),
        cell: item.cell.toUpperCase(),
        village: item.village.toUpperCase(),
        householdInfo: "",
        currentLivestock: "",
        landHouseholdInfo: "",
        economicSocialInfo: "",
        drawNumber: item.draw.toString(),
        conclusion: "APPROVED",
        graduationStatus: "APPROVED",
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, COLLECTIONS.candidates, candId), candidate);
    }
    await setDoc(markerRef, { seeded: true, at: new Date().toISOString() });
  } catch (e) {
    console.error("Waiting list seeding failed", e);
  }
}

export async function listApprovedCandidates(opts?: {
  sector?: string;
  cell?: string;
  village?: string;
}): Promise<Candidate[]> {
  const db = getDb();
  const p = getSessionProfile();
  const scope = scopeOf(p);

  const constraints: QueryConstraint[] = [];
  constraints.push(where("district", "==", scope.district || "MUSANZE"));
  constraints.push(where("conclusion", "==", "APPROVED"));

  const s = (opts?.sector || scope.sector)?.toUpperCase();
  const c = (opts?.cell || scope.cell)?.toUpperCase();
  const v = (opts?.village || scope.village)?.toUpperCase();

  if (s) constraints.push(where("sector", "==", s));
  if (c) constraints.push(where("cell", "==", c));
  if (v) constraints.push(where("village", "==", v));

  const snap = await getDocs(
    query(
      collection(db, COLLECTIONS.candidates),
      ...constraints
    )
  );

  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Candidate))
    .sort((a, b) => Number(a.drawNumber || 999) - Number(b.drawNumber || 999));
}
