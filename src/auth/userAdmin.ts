import { initializeApp, getApps } from "firebase/app";
import {
  initializeAuth,
  getAuth,
  inMemoryPersistence,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { firebaseApp, getDb, COLLECTIONS } from "../config/firebase";
import { AppUser, Role } from "../types/core";
import { toEmail } from "./AuthContext";
import { scopeConstraints } from "./scope";

// Creating an Auth user from the client signs that user in. To avoid signing
// the administrator out we create the account on a second, throw-away app
// instance with in-memory persistence, then sign it out again.
const SECONDARY = "girinka-admin-create";

function secondaryAuth() {
  const app = getApps().find((a) => a.name === SECONDARY) ?? initializeApp(firebaseApp.options, SECONDARY);
  try {
    return initializeAuth(app, { persistence: inMemoryPersistence });
  } catch {
    return getAuth(app);
  }
}

export type NewUserInput = {
  fullName: string;
  username: string;
  password: string;
  role: Role;
  district: string;
  sector: string | null;
  cell: string | null;
  village: string | null;
  phone: string;
  email: string | null;
  createdBy: string;
};

export async function createStaffUser(input: NewUserInput): Promise<string> {
  const auth = secondaryAuth();
  const email = toEmail(input.username);
  const cred = await createUserWithEmailAndPassword(auth, email, input.password);
  const uid = cred.user.uid;
  try {
    await signOut(auth);
  } catch {
    /* ignore */
  }

  // Written with the ADMIN's own session; rules decide whether it is allowed.
  const profile: Omit<AppUser, "id"> & { createdBy: string; createdAt: string } = {
    fullName: input.fullName.trim(),
    username: input.username.trim().toLowerCase(),
    role: input.role,
    district: input.district.toUpperCase(),
    sector: input.sector?.toUpperCase() || null,
    cell: input.cell?.toUpperCase() || null,
    village: input.village?.toUpperCase() || null,
    phone: input.phone.trim(),
    email: input.email?.trim().toLowerCase() || null,
    active: input.createdBy !== "SELF_REGISTER", // Self-registered users are inactive by default
    createdBy: input.createdBy,
    createdAt: new Date().toISOString(),
  };
  try {
    await setDoc(doc(getDb(), COLLECTIONS.users, uid), profile);
  } catch (e: any) {
    throw new Error(
      `Konti ya Auth yakozwe (${email}) ariko profile ntiyabitswe: ${e?.code ?? e?.message}. ` +
        `Ongera ugerageze cyangwa uyisibe muri Firebase Console.`
    );
  }
  return uid;
}

export async function listStaffUsers(): Promise<AppUser[]> {
  const snap = await getDocs(query(collection(getDb(), COLLECTIONS.users), ...scopeConstraints()));
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as object) } as AppUser))
    .sort((a, b) => (a.fullName ?? "").localeCompare(b.fullName ?? ""));
}

export async function setUserActive(uid: string, active: boolean): Promise<void> {
  await updateDoc(doc(getDb(), COLLECTIONS.users, uid), { active });
}
