'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '@/lib/firebase';
import {
  subscribeLoyalty,
  type LoyaltyProfile,
} from '@/lib/loyalty';

/**
 * Contexte d'authentification client (programme fidélité).
 * Expose l'utilisateur Firebase, son profil de points en temps réel et les
 * actions de connexion / inscription / réinitialisation. Monté une seule
 * fois dans le layout, consommé par la nav et la page /compte.
 */
interface AuthContextValue {
  user: User | null;
  ready: boolean;
  profile: LoyaltyProfile | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<LoyaltyProfile | null>(null);

  useEffect(() => {
    if (!auth || !isFirebaseConfigured) {
      setReady(true);
      return;
    }
    // onAuthStateChanged renvoie lui-même la fonction de désinscription.
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setReady(true);
    });
  }, []);

  // Points en temps réel : réabonné à chaque changement d'utilisateur.
  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    return subscribeLoyalty(user.uid, setProfile);
  }, [user]);

  const login = useCallback(async (email: string, password: string) => {
    if (!auth) throw new Error('Firebase non configuré');
    await signInWithEmailAndPassword(auth, email.trim(), password);
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      if (!auth) throw new Error('Firebase non configuré');
      const cred = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password,
      );
      if (name.trim()) {
        await updateProfile(cred.user, { displayName: name.trim() });
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    if (!auth) return;
    await signOut(auth);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    if (!auth) throw new Error('Firebase non configuré');
    await sendPasswordResetEmail(auth, email.trim());
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      ready,
      profile,
      login,
      register,
      logout,
      resetPassword,
    }),
    [user, ready, profile, login, register, logout, resetPassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans <AuthProvider>');
  return ctx;
}
