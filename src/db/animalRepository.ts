import {
  addDoc,
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { firestoreDb, collections } from '../config/firebase';
import type { AnimalRecord } from '../types/animal';

export async function listAnimalsByBeneficiary(beneficiaryId: string): Promise<AnimalRecord[]> {
  const q = query(
    collection(firestoreDb, collections.animals),
    where('beneficiaryId', '==', beneficiaryId)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<AnimalRecord, 'id'>),
  }));
}

export async function addAnimalRecord(record: AnimalRecord) {
  return addDoc(collection(firestoreDb, collections.animals), record);
}
