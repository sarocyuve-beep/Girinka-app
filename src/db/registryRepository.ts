import {
  addDoc,
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { firestoreDb, collections } from '../config/firebase';
import type { Beneficiary } from '../types/registry';

export async function listBeneficiaries(): Promise<Beneficiary[]> {
  const snapshot = await getDocs(collection(firestoreDb, collections.beneficiaries));
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<Beneficiary, 'id'>),
  }));
}

export async function addBeneficiary(beneficiary: Beneficiary) {
  const ref = await addDoc(collection(firestoreDb, collections.beneficiaries), beneficiary);
  return { ...beneficiary, id: ref.id };
}

export async function searchBeneficiaries(query: string): Promise<Beneficiary[]> {
  const cleanQuery = query.trim().toLowerCase();
  const all = await listBeneficiaries();

  if (!cleanQuery) return all;

  return all.filter(
    (beneficiary) =>
      beneficiary.fullName.toLowerCase().includes(cleanQuery) ||
      beneficiary.sector.toLowerCase().includes(cleanQuery) ||
      beneficiary.village.toLowerCase().includes(cleanQuery) ||
      beneficiary.nationalId.includes(cleanQuery)
  );
}

export async function getBeneficiaryById(beneficiaryId: string): Promise<Beneficiary | null> {
  const snapshot = await getDocs(
    query(collection(firestoreDb, collections.beneficiaries), where('__name__', '==', beneficiaryId))
  );

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    ...(doc.data() as Omit<Beneficiary, 'id'>),
  };
}
