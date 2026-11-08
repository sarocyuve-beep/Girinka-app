import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  User,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { getAuthInstance, getDb, AUTH_EMAIL_DOMAIN, COLLECTIONS } from "../config/firebase";
import { AppUser } from "../types/core";
import { setSessionProfile, canWrite, canManageRegistry, canDeleteImportantData, canEditFieldData } from "./scope";

// loading  : checking the profile
// ok       : active profile with a district -> app may open
// missing  : signed in but no users/{uid} document -> no access
// inactive : profile exists but active !== true (or no district)
// error    : could not read the profile (network / rules) -> retry
export type ProfileStatus = "loading" | "ok" | "missing" | "inactive" | "error";

type AuthState = {
  user: User | null;
  profile: AppUser | null;
  profileStatus: ProfileStatus;
  initializing: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  reloadProfile: () => Promise<void>;
  changePassword: (current: string, next: string) => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

// "jean.mukiza" -> "jean.mukiza@girinka.local"; a full email is used as typed.
export function toEmail(username: string): string {
  const u = username.trim().toLowerCase();
  return u.includes("@") ? u : `${u}@${AUTH_EMAIL_DOMAIN}`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [profileStatus, setProfileStatus] = useState<ProfileStatus>("loading");
  const [initializing, setInitializing] = useState(true);

  const loadProfile = useCallback(async (u: User | null) => {
    if (!u) {
      setSessionProfile(null);
      setProfile(null);
      setProfileStatus("loading");
      return;
    }
    setProfileStatus("loading");
    try {
      const snap = await getDoc(doc(getDb(), COLLECTIONS.users, u.uid));
      if (!snap.exists()) {
        setSessionProfile(null);
        setProfile(null);
        setProfileStatus("missing");
        return;
      }
      const p = { id: u.uid, ...(snap.data() as object) } as AppUser;
      if (p.active !== true || !p.district) {
        setSessionProfile(null);
        setProfile(p);
        setProfileStatus("inactive");
        return;
      }
      setSessionProfile(p); // set BEFORE the app screens mount
      setProfile(p);
      setProfileStatus("ok");
    } catch {
      setSessionProfile(null);
      setProfile(null);
      setProfileStatus("error");
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(getAuthInstance(), async (u) => {
      setUser(u);
      await loadProfile(u);
      setInitializing(false);
    });
    return unsub;
  }, [loadProfile]);

  const value = useMemo<AuthState>(
    () => ({
      user,
      profile,
      profileStatus,
      initializing,
      signIn: async (username, password) => {
        await signInWithEmailAndPassword(getAuthInstance(), toEmail(username), password);
      },
      signOut: async () => {
        await fbSignOut(getAuthInstance());
      },
      reloadProfile: async () => loadProfile(getAuthInstance().currentUser),
      changePassword: async (currentPw, nextPw) => {
        const u = getAuthInstance().currentUser;
        if (!u || !u.email) throw new Error("Nta muntu winjiye.");
        await reauthenticateWithCredential(u, EmailAuthProvider.credential(u.email, currentPw));
        await updatePassword(u, nextPw);
      },
    }),
    [user, profile, profileStatus, initializing, loadProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export function useCanWrite(): boolean {
  const { profile } = useAuth();
  return canWrite(profile?.role);
}

export function useCanManageRegistry(): boolean {
  const { profile } = useAuth();
  return canManageRegistry(profile?.role);
}

export function useCanDeleteImportantData(): boolean {
  const { profile } = useAuth();
  return canDeleteImportantData(profile?.role);
}

export function useCanEditFieldData(): boolean {
  const { profile } = useAuth();
  return canEditFieldData(profile?.role);
}
