import { collection, addDoc, getDocs, query, where, doc, getDoc, updateDoc, serverTimestamp, orderBy } from "firebase/firestore";
import { getDb, COLLECTIONS } from "../config/firebase";
import { scopeConstraints, scopeFields } from "../auth/scope";
import { Animal } from "../types/animal";

export async function createAnimal(animal: Omit<Animal, "id" | "registrationDate">) {
  const db = getDb();
  const docRef = await addDoc(collection(db, COLLECTIONS.animals), {
    ...animal,
    ...scopeFields(), // location = the registering user's scope
    registrationDate: new Date().toISOString(),
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function listAnimals() {
  const db = getDb();
  // No orderBy (would need a composite index with the scope filters).
  const q = query(collection(db, COLLECTIONS.animals), ...scopeConstraints());
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() } as Animal))
    .sort((a, b) => (b.registrationDate ?? "").localeCompare(a.registrationDate ?? ""));
}

export async function getAnimalById(id: string) {
  const db = getDb();
  const docSnap = await getDoc(doc(db, COLLECTIONS.animals, id));
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Animal;
  }
  return null;
}

export async function updateAnimalStatus(id: string, status: Animal["currentStatus"]) {
  const db = getDb();
  await updateDoc(doc(db, COLLECTIONS.animals, id), {
    currentStatus: status,
    updatedAt: serverTimestamp(),
  });
}

export async function updateAnimal(id: string, updates: Partial<Animal>) {
  const db = getDb();
  await updateDoc(doc(db, COLLECTIONS.animals, id), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}
