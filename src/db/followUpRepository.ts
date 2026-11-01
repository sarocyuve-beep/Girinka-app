import {
  addDoc,
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { firestoreDb, collections } from '../config/firebase';
import type { FollowUpRecord } from '../types/followUp';

export async function listFollowUpsByBeneficiary(beneficiaryId: string): Promise<FollowUpRecord[]> {
  const q = query(
    collection(firestoreDb, collections.followUps),
    where('beneficiaryId', '==', beneficiaryId)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<FollowUpRecord, 'id'>),
  }));
}

export async function addFollowUp(record: FollowUpRecord) {
  return addDoc(collection(firestoreDb, collections.followUps), record);
}
