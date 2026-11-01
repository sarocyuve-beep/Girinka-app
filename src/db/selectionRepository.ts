import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
} from 'firebase/firestore';
import { firestoreDb, collections } from '../config/firebase';
import type { SelectionCampaign } from '../types/selection';

export async function listSelectionCampaigns(): Promise<SelectionCampaign[]> {
  const snapshot = await getDocs(
    query(collection(firestoreDb, collections.campaigns), orderBy('openDate', 'desc'))
  );

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<SelectionCampaign, 'id'>),
  }));
}

export async function createSelectionCampaign(campaign: SelectionCampaign) {
  const ref = await addDoc(collection(firestoreDb, collections.campaigns), campaign);
  return { ...campaign, id: ref.id };
}
