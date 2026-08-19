'use client';

import { useEffect, useState, type ReactNode } from 'react';
import type { User } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '@/lib/firebase';
import {
  getHistory,
  loginCustomer,
  logoutCustomer,
  pointsToEuros,
  POINTS_PER_EURO,
  registerCustomer,
  resetCustomerPassword,
  watchAuth,
  watchProfile,
  type CustomerProfile,
  type PointsEntry,
} from '@/lib/loyalty';
import { formatPrice } from '@/lib/format';
import { isStaffUser } from '@/lib/staff';

/**
 * Espace client : connexion / inscription Firebase, solde de points de
 * fidélité et historique. Aucun polling — l'écoute du profil est un
 * onSnapshot ciblé sur UN document, désabonné à la déconnexion.
 */
export function AccountApp() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => watchAuth((u) => {
    setUser(u);
    setReady(true);
  }), []);

  if (!isFirebaseConfigured || !auth) return <NotConfigured />;
  if (!ready) return <Splash text="Connexion…" />;
  // L'admin unique n'a rien à faire ici : redirection vers le dashboard.
  if (user && isStaffUser(user.uid)) {
    window.location.replace('/admin');
    return <Splash text="Redirection vers le dashboard…" />;
  }
  return user ? <Account user={user} /> : <AuthGate />;
}

/* ----------------------------- Not configured ---------------------------- */

function NotConfigured() {
  return (
    <Shell>
      <div className="admin-card center">
        <h1>Fidélité bientôt disponible</h1>
        <p>
          L&apos;espace client nécessite Firebase (Authentication + Firestore).
          Copie <code>.env.local.example</code> en <code>.env.local</code> et
          remplis les variables <code>NEXT_PUBLIC_FIREBASE_*</code> pour
          l&apos;activer.
        </p>
      </div>
    </Shell>
  );
}

function Splash({ text }: { text: string }) {
  return (
    <Shell>
      <div className="admin-splash">{text}</div>
    </Shell>
  );
}

/* ------------------------------ Connexion ------------------------------- */

type Mode = 'login' | 'register' | 'reset';

function AuthGate() {
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function friendlyError(err: unknown): string {
    const code = (err as { code?: string })?.code ?? '';
    if (code.includes('invalid-credential') || code.includes('wrong-password'))
      return 'Email ou mot de passe incorrect.';
    if (code.includes('email-already-in-use'))
      return 'Un compte existe déjà avec cet email.';
    if (code.includes('weak-password'))
      return 'Mot de passe trop court (6 caractères minimum).';
    if (code.includes('invalid-email')) return 'Adresse email invalide.';
    if (code.includes('too-many-requests'))
      return 'Trop de tentatives. Réessaie dans quelques minutes.';
    return 'Une erreur est survenue. Réessaie.';
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      if (mode === 'login') {
        await loginCustomer(email, password);
      } else if (mode === 'register') {
        if (!email.trim() || password.length < 6)
          throw { code: 'weak-password' };
        await registerCustomer(email, password, name);
      } else {
        if (!email.trim()) throw { code: 'invalid-email' };
        await resetCustomerPassword(email);
        setNotice('Email de réinitialisation envoyé — vérifie ta boîte mail.');
      }
    } catch (err) {
      console.error(err);
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  const titles: Record<Mode, string> = {
    login: 'Connexion',
    register: 'Créer un compte',
    reset: 'Mot de passe oublié',
  };

  return (
    <Shell>
      <form className="admin-card login" onSubmit={submit}>
        <div className="admin-logo">O’Snack <span>Fidélité</span></div>
        <h1>{titles[mode]}</h1>
        <p className="account-sub">
          Gagne {POINTS_PER_EURO} points par euro dépensé en boutique et
          transforme-les en remises.
        </p>

        {mode === 'register' && (
          <label className="admin-field">
            <span>Prénom</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ton prénom"
              autoComplete="given-name"
            />
          </label>
        )}

        <label className="admin-field">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="toi@exemple.fr"
            autoComplete="email"
            required
          />
        </label>

        {mode !== 'reset' && (
          <label className="admin-field">
            <span>Mot de passe</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6 caractères minimum"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
            />
          </label>
        )}

        {error && <div className="admin-error">{error}</div>}
        {notice && <div className="account-notice">{notice}</div>}

        <button type="submit" className="admin-btn solid" disabled={busy}>
          {busy
            ? 'Un instant…'
            : mode === 'login'
              ? 'Se connecter'
              : mode === 'register'
                ? 'Créer mon compte'
                : 'Envoyer le lien'}
        </button>

        <div className="account-switch">
          {mode === 'login' && (
            <>
              <button type="button" onClick={() => setMode('register')}>
                Créer un compte
              </button>
              <button type="button" onClick={() => setMode('reset')}>
                Mot de passe oublié ?
              </button>
            </>
          )}
          {mode !== 'login' && (
            <button type="button" onClick={() => setMode('login')}>
              ← Retour à la connexion
            </button>
          )}
        </div>
      </form>
    </Shell>
  );
}

/* -------------------------------- Compte -------------------------------- */

function Account({ user }: { user: User }) {
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [history, setHistory] = useState<PointsEntry[] | null>(null);

  // Écoute du profil (1 document) — désabonnée au démontage/déconnexion.
  useEffect(() => watchProfile(user.uid, setProfile), [user.uid]);

  // Historique : lecture ponctuelle, une seule fois par ouverture de page.
  useEffect(() => {
    let alive = true;
    getHistory(user.uid)
      .then((entries) => alive && setHistory(entries))
      .catch((err) => {
        console.warn('[compte] historique :', err);
        if (alive) setHistory([]);
      });
    return () => {
      alive = false;
    };
  }, [user.uid]);

  const points = profile?.points ?? 0;

  return (
    <Shell>
      <header className="admin-top">
        <div className="admin-logo">O’Snack <span>Fidélité</span></div>
        <div className="admin-top-right">
          <span className="admin-user">
            {user.displayName || user.email}
          </span>
          <button className="admin-btn ghost" onClick={() => logoutCustomer()}>
            Déconnexion
          </button>
        </div>
      </header>

      <div className="account-hero">
        <div className="account-hero-main">
          <span className="account-eyebrow">Mes points de fidélité</span>
          <div className="account-points">
            {points}
            <small>pts</small>
          </div>
          <p className="account-euros">
            soit <strong>{formatPrice(pointsToEuros(points))}</strong> de remise
            en boutique
          </p>
          <p className="account-rule">
            {POINTS_PER_EURO} points = 1 € · 1 € dépensé = {POINTS_PER_EURO} points
          </p>
        </div>

        <div className="account-hero-side">
          <div className="account-progress">
            <div
              className="account-progress-bar"
              style={{ width: `${Math.min(100, (points % 100))}%` }}
            />
          </div>
          <span className="account-progress-label">
            {100 - (points % 100)} points avant le prochain palier de 100 pts
            (10 €)
          </span>
          {profile?.lifetime ? (
            <span className="account-lifetime">
              Total gagné depuis l&apos;inscription : {profile.lifetime} pts
            </span>
          ) : null}
        </div>
      </div>

      <div className="account-history">
        <h2>Historique</h2>
        {!history ? (
          <div className="admin-empty">Chargement…</div>
        ) : history.length === 0 ? (
          <div className="admin-empty">
            Aucun mouvement pour le moment. Tes points apparaîtront ici après
            ta prochaine commande en boutique.
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Mouvement</th>
                  <th>Points</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id}>
                    <td className="cell-price">
                      {new Date(h.createdAt).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td>{h.reason}</td>
                    <td className={`cell-points ${h.delta >= 0 ? 'gain' : 'spend'}`}>
                      {h.delta >= 0 ? '+' : ''}
                      {h.delta}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return <div className="admin-shell account-shell">{children}</div>;
}
