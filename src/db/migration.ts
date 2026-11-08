import { collection, getDocs, writeBatch, doc } from "firebase/firestore";
import { getDb, COLLECTIONS } from "../config/firebase";
import { scopeFields } from "../auth/scope";

// One-time backfill: older child documents (distributions, checklists,
// assessments, decisions, appeals, animals) were saved without a location.
// The new Firestore rules need it, so we copy it from the parent record.
//
// RUN THIS BEFORE publishing the final firestore.rules (it reads whole
// collections, which the final rules do not allow). Safe to run repeatedly.
type Loc = { district: string | null; sector: string | null; cell: string | null; village: string | null };
const pick = (x: any): Loc => ({
  district: x?.district ?? null,
  sector: x?.sector ?? null,
  cell: x?.cell ?? null,
  village: x?.village ?? null,
});

export type MigrationReport = Record<string, { updated: number; skipped: number }>;

export async function backfillLocations(): Promise<MigrationReport> {
  const db = getDb();
  const report: MigrationReport = {};

  const benLoc = new Map<string, Loc>();
  (await getDocs(collection(db, COLLECTIONS.beneficiaries))).forEach((d) => benLoc.set(d.id, pick(d.data())));
  const candLoc = new Map<string, Loc>();
  (await getDocs(collection(db, COLLECTIONS.candidates))).forEach((d) => candLoc.set(d.id, pick(d.data())));

  async function run(
    name: string,
    resolve: (data: any) => Loc | null
  ) {
    const snap = await getDocs(collection(db, name));
    let updated = 0;
    let skipped = 0;
    let batch = writeBatch(db);
    let n = 0;
    for (const d of snap.docs) {
      const data = d.data();
      if (data.district !== undefined) continue; // already has a location
      const loc = resolve(data);
      if (!loc || !loc.district) {
        skipped++;
        continue;
      }
      batch.update(doc(db, name, d.id), loc);
      updated++;
      if (++n === 400) {
        await batch.commit();
        batch = writeBatch(db);
        n = 0;
      }
    }
    if (n > 0) await batch.commit();
    report[name] = { updated, skipped };
  }

  await run(COLLECTIONS.distributions, (x) => benLoc.get(x.beneficiaryId) ?? null);
  for (const name of [
    COLLECTIONS.eligibilityChecklists,
    COLLECTIONS.assessmentScores,
    COLLECTIONS.committeeDecisions,
    COLLECTIONS.appeals,
  ]) {
    await run(name, (x) => candLoc.get(x.candidateId) ?? null);
  }
  // Animals: owner's location if they have an owner, else the admin's own scope.
  await run(COLLECTIONS.animals, (x) => (x.currentOwnerId ? benLoc.get(x.currentOwnerId) : null) ?? scopeFields());

  return report;
}
