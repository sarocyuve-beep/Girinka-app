import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit as fsLimit,
  writeBatch,
  setDoc,
  updateDoc,
  runTransaction,
  deleteDoc,
  QueryConstraint,
} from "firebase/firestore";
import { getDb, COLLECTIONS } from "../config/firebase";
import { scopeConstraints, getSessionProfile, scopeOf } from "../auth/scope";
import { getCandidate } from "./selectionRepository";
import {
  Beneficiary,
  Distribution,
  UbudeheCategory,
  Incident,
  FollowUp,
  PassOn,
  PassOnAssessment,
  ShedInspection
} from "../types/registry";

type CyuveRow = {
  no: number;
  fullName: string;
  nationalId: string;
  ubudeheCategory: UbudeheCategory;
  district: string;
  sector: string;
  cell: string;
  village: string;
  yearReceived: number;
  source: string;
  distributionId: string;
  passedOnCow: boolean;
  phone: string | null;
};

// ---------------------------------------------------------------------------
// Seed import — loads the bundled Cyuve sector register (from the auditor
// general PDF) into Firestore. Safe to call on every app start: it checks a
// small marker doc first and does nothing if that sector was already seeded.
// ---------------------------------------------------------------------------
export async function importCyuveBeneficiariesIfNeeded(): Promise<{ imported: number }> {
  const db = getDb();
  const profile = getSessionProfile();

  // Allow seeding for anyone during the pilot testing phase to ensure data is present
  // Incrementing to v14 to trigger refresh with orthographic corrections.
  const markerRef = doc(db, COLLECTIONS.meta, "seed_cyuve_beneficiaries_v14");
  const marker = await getDoc(markerRef);
  if (marker.exists()) return { imported: 0 };

  // Safety check: ensure we only seed if we have a profile (logged in)
  if (!profile) return { imported: 0 };

  const rows = require("../data/cyuveBeneficiaries.json") as CyuveRow[];
  const now = new Date().toISOString();

  // Firestore batches cap at 500 writes; we write 2 docs/row (beneficiary +
  // distribution), so chunk at 200 rows (=400 writes) per batch.
  const CHUNK = 200;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const batch = writeBatch(db);
    const chunk = rows.slice(i, i + CHUNK);

    for (const row of chunk) {
      // Use the national ID as the beneficiary doc id when present and
      // well-formed, so re-imports/edits merge instead of duplicating;
      // otherwise fall back to a synthetic id.
      const beneficiaryId =
        /^\d{13,16}$/.test(row.nationalId) ? row.nationalId : `cyuve-${row.no}`;

      const beneficiary: Beneficiary = {
        id: beneficiaryId,
        fullName: row.fullName.toUpperCase(),
        nationalId: row.nationalId,
        ubudeheCategory: row.ubudeheCategory,
        district: row.district.toUpperCase(),
        sector: row.sector.toUpperCase(),
        cell: row.cell.toUpperCase(),
        village: row.village.toUpperCase(),
        phone: row.phone,
        createdAt: now,
        updatedAt: now,
      };
      batch.set(doc(db, COLLECTIONS.beneficiaries, beneficiaryId), beneficiary, {
        merge: true,
      });

      const distribution: Distribution = {
        id: row.distributionId || `cyuve-${row.no}-dist`,
        beneficiaryId,
        animalId: null,
        type: "NEW",
        yearReceived: row.yearReceived,
        source: row.source,
        passedOnCow: false,
        passOnVerified: false,
        passOnVerificationStatus: "PENDING", // Always PENDING for audit
        notes: null,
        createdAt: now,
        district: row.district.toUpperCase(),
        sector: row.sector.toUpperCase(),
        cell: row.cell.toUpperCase(),
        village: row.village.toUpperCase(),
      };
      batch.set(
        doc(db, COLLECTIONS.distributions, distribution.id),
        distribution,
        { merge: true }
      );
    }

    await batch.commit();
  }

  await setDoc(markerRef, { seeded: true, count: rows.length, seededAt: now });
  invalidateBeneficiaryCache();
  return { imported: rows.length };
}

// ---------------------------------------------------------------------------
// CRUD / queries
// ---------------------------------------------------------------------------

export async function getBeneficiaryByNationalId(nationalId: string): Promise<Beneficiary | null> {
  const db = getDb();
  const snap = await getDocs(
    query(
      collection(db, COLLECTIONS.beneficiaries),
      where("nationalId", "==", nationalId),
      fsLimit(1)
    )
  );
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as Beneficiary;
}

export async function saveBeneficiary(beneficiary: Beneficiary): Promise<void> {
  const db = getDb();

  // 1. Check for duplication in Beneficiaries
  const qBen = query(
    collection(db, COLLECTIONS.beneficiaries),
    where("nationalId", "==", beneficiary.nationalId)
  );
  const existingBen = await getDocs(qBen);
  const duplicateBen = existingBen.docs.find(d => d.id !== beneficiary.id);
  if (duplicateBen) {
    const data = duplicateBen.data() as Beneficiary;
    throw new Error(`Indangamuntu ${beneficiary.nationalId} isanzwe muri sisitemu (Beneficiaries) kuri: ${data.fullName} (${data.village})`);
  }

  // 2. Check for duplication in Candidates
  const qCand = query(
    collection(db, COLLECTIONS.candidates),
    where("nationalId", "==", beneficiary.nationalId)
  );
  const existingCand = await getDocs(qCand);
  const duplicateCand = existingCand.docs.find(d => d.id !== beneficiary.id);
  if (duplicateCand) {
    const data = duplicateCand.data() as any;
    throw new Error(`Indangamuntu ${beneficiary.nationalId} isanzwe muri sisitemu (Candidates) kuri: ${data.fullName} (${data.village})`);
  }

  await setDoc(doc(db, COLLECTIONS.beneficiaries, beneficiary.id), beneficiary, { merge: true });
  invalidateBeneficiaryCache();
}

export async function saveDistribution(distribution: Distribution, candidateId?: string): Promise<void> {
  const db = getDb();

  let beneficiary: Beneficiary | null = null;

  if (candidateId) {
    // If graduating a candidate, fetch candidate data
    const candidate = await getCandidate(candidateId);
    if (!candidate) throw new Error("Umukandida ntabonetse.");

    beneficiary = {
      id: candidate.id,
      fullName: candidate.fullName.toUpperCase(),
      nationalId: candidate.nationalId,
      sex: candidate.sex,
      ubudeheCategory: null, // Candidates might not have this in basic info
      district: candidate.district.toUpperCase(),
      sector: candidate.sector.toUpperCase(),
      cell: candidate.cell.toUpperCase(),
      village: candidate.village.toUpperCase(),
      phone: candidate.phone,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } else {
    beneficiary = await getBeneficiary(distribution.beneficiaryId);
  }

  if (!beneficiary) throw new Error("Umugenerwabikorwa ntabonetse cyangwa ntiwemerewe kumubona.");

  const loc = {
    district: (beneficiary.district ?? "").toUpperCase() || null,
    sector: (beneficiary.sector ?? "").toUpperCase() || null,
    cell: (beneficiary.cell ?? "").toUpperCase() || null,
    village: (beneficiary.village ?? "").toUpperCase() || null,
  };

  await runTransaction(db, async (transaction) => {
    // 1. If candidateId is present, promote to Beneficiary and delete Candidate record
    if (candidateId && beneficiary) {
      transaction.set(doc(db, COLLECTIONS.beneficiaries, beneficiary.id), beneficiary);
      transaction.delete(doc(db, COLLECTIONS.candidates, candidateId));
    }

    // 2. Add distribution record
    const distRef = doc(db, COLLECTIONS.distributions, distribution.id);
    transaction.set(distRef, { ...distribution, ...loc });

    // 3. Link animal to owner if animalId is provided
    if (distribution.animalId) {
      const animalRef = doc(db, COLLECTIONS.animals, distribution.animalId);
      transaction.update(animalRef, {
        currentOwnerId: distribution.beneficiaryId,
        updatedAt: new Date().toISOString(),
        ...loc,
      });
    }
  });

  invalidateBeneficiaryCache();
}

// Small in-memory cache: each listing reads every beneficiary in the user's
// scope (hundreds of docs), which counts against the free daily read quota.
let benCache: { key: string; at: number; data: Beneficiary[] } | null = null;
const BEN_CACHE_MS = 5 * 60 * 1000;
export function invalidateBeneficiaryCache() {
  benCache = null;
}

export async function listBeneficiaries(opts?: {
  sector?: string;
  cell?: string;
  village?: string;
  max?: number;
}): Promise<Beneficiary[]> {
  const db = getDb();
  const p = getSessionProfile();

  // Create a cache key based on the specific query
  const key = JSON.stringify([p?.id, opts?.sector, opts?.cell, opts?.village]);

  if (benCache && benCache.key === key && Date.now() - benCache.at < BEN_CACHE_MS) {
    return benCache.data;
  }

  // Build constraints carefully to avoid conflicts with scope
  const scope = scopeOf(p);
  const constraints: QueryConstraint[] = [];

  // District is always required by rules
  constraints.push(where("district", "==", scope.district || "MUSANZE"));

  // Add sector/cell/village: prefer the explicit opts, fallback to scope
  const s = (opts?.sector || scope.sector)?.toUpperCase();
  const c = (opts?.cell || scope.cell)?.toUpperCase();
  const v = (opts?.village || scope.village)?.toUpperCase();

  if (s) constraints.push(where("sector", "==", s));
  if (c) constraints.push(where("cell", "==", c));
  if (v) constraints.push(where("village", "==", v));

  const snap = await getDocs(
    query(collection(db, COLLECTIONS.beneficiaries), ...constraints, fsLimit(opts?.max ?? 500))
  );

  const all = snap.docs
    .map((d) => d.data() as Beneficiary)
    .sort((a, b) => (a.fullName ?? "").localeCompare(b.fullName ?? ""));

  benCache = { key, at: Date.now(), data: all };
  return all;
}

// Firestore has no case-insensitive "contains" search built in; for a pilot
// dataset (hundreds, not millions, of rows) it's simplest and fast enough to
// pull the (small, indexed) page and filter client-side.
export async function searchBeneficiariesByName(
  queryText: string,
  max = 2000,
  opts?: { sector?: string; cell?: string; village?: string }
): Promise<Beneficiary[]> {
  const all = await listBeneficiaries({ ...opts, max });
  const needle = queryText.trim().toUpperCase();
  if (!needle) return all;
  return all.filter((b) =>
    (b.fullName ?? "").toUpperCase().includes(needle) ||
    (b.sector ?? "").toUpperCase().includes(needle) ||
    (b.cell ?? "").toUpperCase().includes(needle) ||
    (b.village ?? "").toUpperCase().includes(needle) ||
    (b.nationalId ?? "").includes(needle)
  );
}

export async function getBeneficiary(id: string): Promise<Beneficiary | null> {
  const db = getDb();
  const snap = await getDoc(doc(db, COLLECTIONS.beneficiaries, id));
  return snap.exists() ? (snap.data() as Beneficiary) : null;
}

export async function listDistributionsForBeneficiary(
  beneficiaryId: string
): Promise<Distribution[]> {
  const db = getDb();
  const snap = await getDocs(
    query(
      collection(db, COLLECTIONS.distributions),
      where("beneficiaryId", "==", beneficiaryId),
      ...scopeConstraints()
    )
  );
  return snap.docs
    .map((d) => d.data() as Distribution)
    .sort((a, b) => (b.yearReceived ?? 0) - (a.yearReceived ?? 0));
}

export async function hasActiveCow(beneficiaryId: string): Promise<boolean> {
  const incidents = await listIncidentsForBeneficiary(beneficiaryId);
  const distributions = await listDistributionsForBeneficiary(beneficiaryId);

  if (distributions.length === 0) return false;

  const latestDist = distributions[0];

  // Terminal incidents that mean they no longer have that specific cow
  const terminalIncidents = incidents.filter(i =>
    (i.animalId === latestDist.animalId) &&
    ["DEATH", "THEFT", "SALE", "GIFT", "SEIZURE", "VOLUNTARY_RETURN"].includes(i.type)
  );

  return terminalIncidents.length === 0;
}

export async function updateBeneficiary(
  id: string,
  updates: Partial<Omit<Beneficiary, "id" | "createdAt">>
): Promise<void> {
  const db = getDb();
  await updateDoc(doc(db, COLLECTIONS.beneficiaries, id), {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
  invalidateBeneficiaryCache();
}

export async function saveIncident(incident: Incident): Promise<void> {
  const db = getDb();
  const owner = await getBeneficiary(incident.beneficiaryId);
  if (!owner) throw new Error("Umugenerwabikorwa ntabonetse.");

  const loc = {
    district: (owner.district ?? "").toUpperCase() || null,
    sector: (owner.sector ?? "").toUpperCase() || null,
    cell: (owner.cell ?? "").toUpperCase() || null,
    village: (owner.village ?? "").toUpperCase() || null,
  };

  await runTransaction(db, async (transaction) => {
    // 1. Record the incident
    const incidentRef = doc(db, COLLECTIONS.incidents, incident.id);
    transaction.set(incidentRef, { ...incident, ...loc });

    // 2. Update animal status based on incident type
    const animalRef = doc(db, COLLECTIONS.animals, incident.animalId);
    let newStatus: any = "HEALTHY";
    let newOwnerId: string | null = incident.beneficiaryId;

    if (incident.type === "DEATH") newStatus = "DEAD";
    if (incident.type === "THEFT") newStatus = "STOLEN";
    if (incident.type === "SALE") newStatus = "SOLD";
    if (incident.type === "SEIZURE" || incident.type === "VOLUNTARY_RETURN") {
      newStatus = "HEALTHY";
      newOwnerId = null; // Cow is now available again
    }

    transaction.update(animalRef, {
      currentStatus: newStatus,
      currentOwnerId: newOwnerId,
      updatedAt: new Date().toISOString(),
    });
  });
}

export async function listIncidentsForBeneficiary(
  beneficiaryId: string
): Promise<Incident[]> {
  const db = getDb();
  const snap = await getDocs(
    query(
      collection(db, COLLECTIONS.incidents),
      where("beneficiaryId", "==", beneficiaryId),
      ...scopeConstraints()
    )
  );
  return snap.docs
    .map((d) => d.data() as Incident)
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
}

export async function saveFollowUp(followUp: FollowUp): Promise<void> {
  const db = getDb();
  const owner = await getBeneficiary(followUp.beneficiaryId);
  if (!owner) throw new Error("Umugenerwabikorwa ntabonetse.");

  const loc = {
    district: (owner.district ?? "").toUpperCase() || null,
    sector: (owner.sector ?? "").toUpperCase() || null,
    cell: (owner.cell ?? "").toUpperCase() || null,
    village: (owner.village ?? "").toUpperCase() || null,
  };

  const followUpRef = doc(collection(db, COLLECTIONS.followUps), followUp.id);
  await setDoc(followUpRef, { ...followUp, ...loc });
}

export async function savePassOnWithNewRecipient(
  passOn: PassOn,
  recipientData: Omit<Beneficiary, "createdAt" | "updatedAt">
): Promise<void> {
  const db = getDb();
  const donor = await getBeneficiary(passOn.donorBeneficiaryId);
  if (!donor) throw new Error("Umutanzi ntabonetse.");

  const loc = {
    district: (recipientData.district || donor.district || "").toUpperCase(),
    sector: (recipientData.sector || donor.sector || "").toUpperCase(),
    cell: (recipientData.cell || donor.cell || "").toUpperCase(),
    village: (recipientData.village || donor.village || "").toUpperCase(),
  };

  const now = new Date().toISOString();

  await runTransaction(db, async (transaction) => {
    // 1. Create the new Beneficiary (Receiver)
    const newBen: Beneficiary = {
      ...recipientData,
      ...loc,
      createdAt: now,
      updatedAt: now,
    };
    transaction.set(doc(db, COLLECTIONS.beneficiaries, newBen.id), newBen);

    // 2. Create a Distribution record for the Receiver
    const newDist: Distribution = {
      id: `passon-${passOn.id}`,
      beneficiaryId: newBen.id,
      animalId: passOn.animalId,
      type: "NEW",
      yearReceived: new Date(passOn.date).getFullYear(),
      dateReceived: passOn.date,
      source: "YARITUWE (Pass-on)",
      passedOnCow: false,
      notes: `Yahawe na ${donor.fullName}`,
      createdAt: now,
      ...loc,
    };
    transaction.set(doc(db, COLLECTIONS.distributions, newDist.id), newDist);

    // 3. Save the PassOn record
    transaction.set(doc(db, COLLECTIONS.passOns, passOn.id), { ...passOn, ...loc });

    // 4. Update Donor's distribution to marked as passed on (Pending Audit)
    const donorDists = await listDistributionsForBeneficiary(passOn.donorBeneficiaryId);
    const activeDist = donorDists.find(d => d.animalId === passOn.animalId);
    if (activeDist) {
      transaction.update(doc(db, COLLECTIONS.distributions, activeDist.id), {
        passedOnCow: true,
        passOnDate: passOn.date,
        passOnVerified: false,
        passOnVerificationStatus: "PENDING",
      });
    }

    // 5. Update Animal Ownership
    transaction.update(doc(db, COLLECTIONS.animals, passOn.animalId), {
      currentOwnerId: newBen.id,
      currentStatus: "HEALTHY",
      updatedAt: now,
      ...loc,
    });
  });

  invalidateBeneficiaryCache();
}

export async function savePassOnAssessment(assessment: PassOnAssessment): Promise<void> {
  const db = getDb();
  const owner = await getBeneficiary(assessment.beneficiaryId);
  if (!owner) throw new Error("Umugenerwabikorwa ntabonetse.");

  const loc = {
    district: (owner.district ?? "").toUpperCase() || null,
    sector: (owner.sector ?? "").toUpperCase() || null,
    cell: (owner.cell ?? "").toUpperCase() || null,
    village: (owner.village ?? "").toUpperCase() || null,
  };

  const ref = doc(collection(db, COLLECTIONS.passOnAssessments), assessment.id);
  await setDoc(ref, { ...assessment, ...loc });
}

export async function listPassOnAssessments(): Promise<PassOnAssessment[]> {
  const db = getDb();
  const snap = await getDocs(
    query(collection(db, COLLECTIONS.passOnAssessments), ...scopeConstraints())
  );
  return snap.docs
    .map((d) => d.data() as PassOnAssessment)
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
}

export async function listPassOnAssessmentsForBeneficiary(
  beneficiaryId: string
): Promise<PassOnAssessment[]> {
  const db = getDb();
  const snap = await getDocs(
    query(
      collection(db, COLLECTIONS.passOnAssessments),
      where("beneficiaryId", "==", beneficiaryId),
      ...scopeConstraints()
    )
  );
  return snap.docs
    .map((d) => d.data() as PassOnAssessment)
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
}

export async function deletePassOnAssessment(id: string): Promise<void> {
  const db = getDb();
  await deleteDoc(doc(db, COLLECTIONS.passOnAssessments, id));
}

export async function getPassOnAssessment(id: string): Promise<PassOnAssessment | null> {
  const db = getDb();
  const snap = await getDoc(doc(db, COLLECTIONS.passOnAssessments, id));
  return snap.exists() ? (snap.data() as PassOnAssessment) : null;
}

export async function deleteIncident(id: string): Promise<void> {
  const db = getDb();
  await deleteDoc(doc(db, COLLECTIONS.incidents, id));
}

export async function deleteBeneficiary(id: string): Promise<void> {
  const db = getDb();
  await deleteDoc(doc(db, COLLECTIONS.beneficiaries, id));
  invalidateBeneficiaryCache();
}

export async function deleteDistribution(id: string): Promise<void> {
  const db = getDb();
  await deleteDoc(doc(db, COLLECTIONS.distributions, id));
}

export async function saveShedInspection(inspection: ShedInspection): Promise<void> {
  const db = getDb();

  // Try to get location from Beneficiary first, then Candidate
  let owner: any = await getBeneficiary(inspection.beneficiaryId);
  if (!owner) {
    owner = await getCandidate(inspection.beneficiaryId);
  }

  if (!owner) throw new Error("Umugenerwabikorwa cyangwa Umukandida ntabonetse.");

  const loc = {
    district: (owner.district ?? "").toUpperCase() || null,
    sector: (owner.sector ?? "").toUpperCase() || null,
    cell: (owner.cell ?? "").toUpperCase() || null,
    village: (owner.village ?? "").toUpperCase() || null,
  };

  const ref = doc(collection(db, COLLECTIONS.shedInspections), inspection.id);
  await setDoc(ref, { ...inspection, ...loc });
}

export async function listShedInspectionsForBeneficiary(
  beneficiaryId: string
): Promise<ShedInspection[]> {
  const db = getDb();
  const snap = await getDocs(
    query(
      collection(db, COLLECTIONS.shedInspections),
      where("beneficiaryId", "==", beneficiaryId),
      ...scopeConstraints()
    )
  );
  return snap.docs
    .map((d) => d.data() as ShedInspection)
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
}

export async function deleteShedInspection(id: string): Promise<void> {
  const db = getDb();
  await deleteDoc(doc(db, COLLECTIONS.shedInspections, id));
}

export async function deleteFollowUp(id: string): Promise<void> {
  const db = getDb();
  await deleteDoc(doc(db, COLLECTIONS.followUps, id));
}

export async function getShedInspection(id: string): Promise<ShedInspection | null> {
  const db = getDb();
  const snap = await getDoc(doc(db, COLLECTIONS.shedInspections, id));
  return snap.exists() ? (snap.data() as ShedInspection) : null;
}

// Global list functions (scoped to user location)

export async function listAllDistributions(opts?: { sector?: string; cell?: string; village?: string }): Promise<Distribution[]> {
  const db = getDb();
  const p = getSessionProfile();
  const scope = scopeOf(p);
  const constraints: QueryConstraint[] = [];

  constraints.push(where("district", "==", scope.district || "MUSANZE"));

  const s = (opts?.sector || scope.sector)?.toUpperCase();
  const c = (opts?.cell || scope.cell)?.toUpperCase();
  const v = (opts?.village || scope.village)?.toUpperCase();

  if (s) constraints.push(where("sector", "==", s));
  if (c) constraints.push(where("cell", "==", c));
  if (v) constraints.push(where("village", "==", v));

  const snap = await getDocs(
    query(collection(db, COLLECTIONS.distributions), ...constraints)
  );
  return snap.docs.map((d) => d.data() as Distribution);
}

export async function listAllIncidents(opts?: { sector?: string; cell?: string; village?: string }): Promise<Incident[]> {
  const db = getDb();
  const p = getSessionProfile();
  const scope = scopeOf(p);
  const constraints: QueryConstraint[] = [];

  constraints.push(where("district", "==", scope.district || "MUSANZE"));

  const s = (opts?.sector || scope.sector)?.toUpperCase();
  const c = (opts?.cell || scope.cell)?.toUpperCase();
  const v = (opts?.village || scope.village)?.toUpperCase();

  if (s) constraints.push(where("sector", "==", s));
  if (c) constraints.push(where("cell", "==", c));
  if (v) constraints.push(where("village", "==", v));

  const snap = await getDocs(
    query(collection(db, COLLECTIONS.incidents), ...constraints)
  );
  return snap.docs.map((d) => d.data() as Incident);
}

export async function listAllFollowUps(opts?: { sector?: string; cell?: string; village?: string }): Promise<FollowUp[]> {
  const db = getDb();
  const p = getSessionProfile();
  const scope = scopeOf(p);
  const constraints: QueryConstraint[] = [];

  constraints.push(where("district", "==", scope.district || "MUSANZE"));

  const s = (opts?.sector || scope.sector)?.toUpperCase();
  const c = (opts?.cell || scope.cell)?.toUpperCase();
  const v = (opts?.village || scope.village)?.toUpperCase();

  if (s) constraints.push(where("sector", "==", s));
  if (c) constraints.push(where("cell", "==", c));
  if (v) constraints.push(where("village", "==", v));

  const snap = await getDocs(
    query(collection(db, COLLECTIONS.followUps), ...constraints)
  );
  return snap.docs.map((d) => d.data() as FollowUp);
}

export async function listAllPassOns(opts?: { sector?: string; cell?: string; village?: string }): Promise<PassOn[]> {
  const db = getDb();
  const p = getSessionProfile();
  const scope = scopeOf(p);
  const constraints: QueryConstraint[] = [];

  constraints.push(where("district", "==", scope.district || "MUSANZE"));

  const s = (opts?.sector || scope.sector)?.toUpperCase();
  const c = (opts?.cell || scope.cell)?.toUpperCase();
  const v = (opts?.village || scope.village)?.toUpperCase();

  if (s) constraints.push(where("sector", "==", s));
  if (c) constraints.push(where("cell", "==", c));
  if (v) constraints.push(where("village", "==", v));

  const snap = await getDocs(
    query(collection(db, COLLECTIONS.passOns), ...constraints)
  );
  return snap.docs.map((d) => d.data() as PassOn);
}

export async function listAllShedInspections(opts?: { sector?: string; cell?: string; village?: string }): Promise<ShedInspection[]> {
  const db = getDb();
  const p = getSessionProfile();
  const scope = scopeOf(p);
  const constraints: QueryConstraint[] = [];

  constraints.push(where("district", "==", scope.district || "MUSANZE"));

  const s = (opts?.sector || scope.sector)?.toUpperCase();
  const c = (opts?.cell || scope.cell)?.toUpperCase();
  const v = (opts?.village || scope.village)?.toUpperCase();

  if (s) constraints.push(where("sector", "==", s));
  if (c) constraints.push(where("cell", "==", c));
  if (v) constraints.push(where("village", "==", v));

  const snap = await getDocs(
    query(collection(db, COLLECTIONS.shedInspections), ...constraints)
  );
  return snap.docs.map((d) => d.data() as ShedInspection);
}

export async function linkAnimalToDistribution(distributionId: string, animalId: string, beneficiaryId: string): Promise<void> {
  const db = getDb();
  const owner = await getBeneficiary(beneficiaryId);
  if (!owner) throw new Error("Umugenerwabikorwa ntabonetse.");

  const loc = {
    district: (owner.district ?? "").toUpperCase() || null,
    sector: (owner.sector ?? "").toUpperCase() || null,
    cell: (owner.cell ?? "").toUpperCase() || null,
    village: (owner.village ?? "").toUpperCase() || null,
  };

  await runTransaction(db, async (transaction) => {
    transaction.update(doc(db, COLLECTIONS.distributions, distributionId), { animalId });
    transaction.update(doc(db, COLLECTIONS.animals, animalId), {
      currentOwnerId: beneficiaryId,
      updatedAt: new Date().toISOString(),
      ...loc,
    });
  });
}
