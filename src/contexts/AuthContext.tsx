"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { auth, db, initClientAnalytics } from "@/lib/firebase";
import type { RolePreassignment, UserProfile, UserRole } from "@/types/content";

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  teamUsers: UserProfile[];
  preassignments: RolePreassignment[];
  loading: boolean;
  isManager: boolean;
  authError: string | null;
  clearAuthError: () => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (displayName: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateMemberRole: (targetUid: string, role: UserRole, teamTag?: string) => Promise<void>;
  saveRolePreassignment: (email: string, role: UserRole, teamTag: string) => Promise<void>;
  removeRolePreassignment: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [teamUsers, setTeamUsers] = useState<UserProfile[]>([]);
  const [preassignments, setPreassignments] = useState<RolePreassignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    void initClientAnalytics();
  }, []);

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;
    let unsubTeam: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }
      if (unsubTeam) {
        unsubTeam();
        unsubTeam = null;
      }

      if (!firebaseUser) {
        setUser(null);
        setProfile(null);
        setTeamUsers([]);
        setPreassignments([]);
        setLoading(false);
        return;
      }

      setUser(firebaseUser);
      const userRef = doc(db, "users", firebaseUser.uid);

      try {
        const existingSnap = await getDoc(userRef);
        if (!existingSnap.exists()) {
          let assignedRole: UserRole = "member";
          let assignedTag = "";
          const email = firebaseUser.email ? normalizeEmail(firebaseUser.email) : "";

          if (email) {
            try {
              const preSnap = await getDoc(doc(db, "rolePreassignments", email));
              if (preSnap.exists()) {
                const preData = preSnap.data() as Partial<RolePreassignment>;
                if (preData.role === "manager") {
                  assignedRole = "manager";
                }
                if (typeof preData.teamTag === "string") {
                  assignedTag = preData.teamTag;
                }
              }
            } catch {
              // No preassignment found or unreadable; safely default to member
            }
          }

          await setDoc(userRef, {
            uid: firebaseUser.uid,
            email: email || "",
            displayName:
              firebaseUser.displayName?.trim() ||
              (email ? email.split("@")[0] : "Team Member"),
            photoURL: firebaseUser.photoURL ?? "",
            role: assignedRole,
            teamTag: assignedTag,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      } catch (err) {
        console.error("Failed to initialize user profile:", err);
      }

      unsubProfile = onSnapshot(userRef, (snap) => {
        if (snap.exists()) {
          setProfile(snap.data() as UserProfile);
        }
        setLoading(false);
      });

      unsubTeam = onSnapshot(
        query(collection(db, "users"), orderBy("displayName", "asc")),
        (snap) => {
          setTeamUsers(snap.docs.map((d) => d.data() as UserProfile));
        }
      );
    });

    return () => {
      unsubAuth();
      if (unsubProfile) unsubProfile();
      if (unsubTeam) unsubTeam();
    };
  }, []);

  const isManager = profile?.role === "manager";

  useEffect(() => {
    if (!isManager) {
      setPreassignments([]);
      return;
    }
    const unsub = onSnapshot(
      query(collection(db, "rolePreassignments"), orderBy("email", "asc")),
      (snap) => {
        setPreassignments(snap.docs.map((d) => d.data() as RolePreassignment));
      }
    );
    return () => unsub();
  }, [isManager]);

  const signInWithGoogle = async () => {
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : "Google sign-in failed.");
      throw err;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    setAuthError(null);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : "Email sign-in failed.");
      throw err;
    }
  };

  const signUpWithEmail = async (displayName: string, email: string, password: string) => {
    setAuthError(null);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (displayName.trim()) {
        await updateProfile(cred.user, { displayName: displayName.trim() });
      }
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : "Account creation failed.");
      throw err;
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const updateMemberRole = async (
    targetUid: string,
    role: UserRole,
    teamTag?: string
  ) => {
    if (!isManager) {
      throw new Error("Only the Marketing Manager can update team roles.");
    }
    const payload: Record<string, unknown> = {
      role,
      updatedAt: serverTimestamp(),
    };
    if (teamTag !== undefined) {
      payload.teamTag = teamTag.trim();
    }
    await updateDoc(doc(db, "users", targetUid), payload);
  };

  const saveRolePreassignment = async (
    email: string,
    role: UserRole,
    teamTag: string
  ) => {
    if (!isManager) {
      throw new Error("Only the Marketing Manager can pre-assign roles.");
    }
    const normalized = normalizeEmail(email);
    await setDoc(doc(db, "rolePreassignments", normalized), {
      email: normalized,
      role,
      teamTag: teamTag.trim(),
      updatedAt: serverTimestamp(),
    });
  };

  const removeRolePreassignment = async (email: string) => {
    if (!isManager) {
      throw new Error("Only the Marketing Manager can remove pre-assignments.");
    }
    const normalized = normalizeEmail(email);
    await deleteDoc(doc(db, "rolePreassignments", normalized));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        teamUsers,
        preassignments,
        loading,
        isManager,
        authError,
        clearAuthError: () => setAuthError(null),
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        updateMemberRole,
        saveRolePreassignment,
        removeRolePreassignment,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
