"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User as FirebaseUser,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { api, ApiError, apiFetch, AUTH_ENDPOINTS } from "@/lib/api";
import { uploadAvatar as sendAvatar } from "@/lib/avatar";
import { normalizeProfile, type Profile, type UpdateProfileInput } from "./types";

/**
 * Auth state for the whole app.
 *
 * Sign-in happens in the browser against Firebase (Google popup — the only
 * enabled provider). The backend issues no tokens of its own; it just verifies
 * the Firebase ID token on each request.
 *
 * Two identities are tracked, and they are not interchangeable:
 *   - `firebaseUser` — the Firebase session. Use it to know *whether* someone
 *     is signed in.
 *   - `profile`      — the backend's user record from GET /api/auth/me. Use it
 *     for anything the backend cares about: `profile.role` to show or hide
 *     admin UI, `profile.id` for ownership checks. The Firebase uid is not
 *     exposed by the backend's APIs, so it must never be used for either.
 *
 * The backend account is created automatically on the first authenticated
 * request, so that /me call doubles as registration. There is no sign-up step.
 */

interface AuthContextValue {
  /** The Firebase session, or null when signed out. */
  firebaseUser: FirebaseUser | null;
  /** The backend's user record, or null when signed out or /me failed. */
  profile: Profile | null;
  /** True until the session is resolved, and while the profile is loading. */
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  /** Set when signed in to Firebase but the backend profile could not be read. */
  error: string | null;
  /** Retry the /me call, e.g. after the backend comes back up. */
  refreshProfile: () => Promise<void>;
  /** Save changes to the member's own profile and update the app immediately. */
  updateProfile: (input: UpdateProfileInput) => Promise<Profile>;
  /** Upload a new profile picture and adopt the returned record immediately. */
  uploadAvatar: (file: File) => Promise<Profile>;
  /** Delete the profile picture (file and URL) and adopt the returned record. */
  removeAvatar: () => Promise<Profile>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Popup outcomes that are the user changing their mind, not failures. */
const CANCELLED_CODES = new Set([
  "auth/popup-closed-by-user",
  "auth/cancelled-popup-request",
  "auth/user-cancelled",
]);

function isCancelledPopup(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    CANCELLED_CODES.has((err as { code: string }).code)
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Guards against a slow /me response from an earlier session overwriting the
  // state of a newer one (sign out then straight back in).
  const requestId = useRef(0);

  const loadProfile = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const me = await apiFetch<Profile>(AUTH_ENDPOINTS.me);
      if (id !== requestId.current) return;
      setProfile(normalizeProfile(me));
    } catch (err) {
      if (id !== requestId.current) return;
      setProfile(null);
      // On 401 apiFetch has already signed the user out; onAuthStateChanged
      // will fire with null and reset everything, so don't surface an error.
      if (!(err instanceof ApiError && err.status === 401)) {
        setError(
          err instanceof Error
            ? err.message
            : "Could not load your account from the server.",
        );
      }
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  // Single source of truth for the session: Firebase tells us, we react.
  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (!user) {
        requestId.current++; // discard any /me still in flight
        setProfile(null);
        setError(null);
        setLoading(false);
        return;
      }
      void loadProfile();
    });
  }, [loadProfile]);

  const signIn = useCallback(async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      // onAuthStateChanged takes it from here and loads the profile.
    } catch (err) {
      if (isCancelledPopup(err)) return;
      throw err;
    }
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
  }, []);

  const updateProfile = useCallback(async (input: UpdateProfileInput) => {
    const updated = await api.patch<Profile>(AUTH_ENDPOINTS.me, input);
    // Adopt the server's version rather than the optimistic one — it decides
    // the final username (trimming, case) and is the source of truth.
    const normalized = normalizeProfile(updated);
    setProfile(normalized);
    return normalized;
  }, []);

  const uploadAvatar = useCallback(async (file: File) => {
    // The backend stores the image and returns the updated record, so a single
    // call both uploads and persists — no follow-up PATCH needed.
    const updated = await sendAvatar(file);
    setProfile(updated);
    return updated;
  }, []);

  const removeAvatar = useCallback(async () => {
    const updated = normalizeProfile(
      await api.del<Profile>(AUTH_ENDPOINTS.avatar),
    );
    setProfile(updated);
    return updated;
  }, []);

  const value = useMemo(
    () => ({
      firebaseUser,
      profile,
      loading,
      signIn,
      signOut,
      error,
      refreshProfile: loadProfile,
      updateProfile,
      uploadAvatar,
      removeAvatar,
    }),
    [
      firebaseUser,
      profile,
      loading,
      signIn,
      signOut,
      error,
      loadProfile,
      updateProfile,
      uploadAvatar,
      removeAvatar,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
