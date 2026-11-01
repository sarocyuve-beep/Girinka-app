import { doc, getDoc, setDoc } from 'firebase/firestore';
import { firestoreDb } from '../config/firebase';
import type { UserProfile } from '../types/user';

export async function saveUserProfile(profile: UserProfile) {
  await setDoc(doc(firestoreDb, 'users', profile.uid), profile);
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const ref = doc(firestoreDb, 'users', uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  return snap.data() as UserProfile;
}
