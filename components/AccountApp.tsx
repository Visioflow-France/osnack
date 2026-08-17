'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { User } from 'firebase/auth';
import { isFirebaseConfigured } from '@/lib/firebase';
import { useAuth } from './AuthContext';
import {
  GIFT_TIERS,
  giftProduct,
  normalizeCode,
  redeemCode,
  claimGift,
  type LoyaltyProfile,
} from '@/lib/loyalty';
import { useProducts } from '@/lib/useProducts';
import { isAvailable, type Product } from '@/lib/menu';
import { formatPrice } from '@/lib/format';
import { Reveal } from './Reveal';

/**
 * Page « Mon compte fidélité » :
 *  - Non connecté : formulaire connexion / inscription (+ mot de passe oublié).
 *  - Connecté : solde en temps réel, progression des paliers, saisie d'un
 *    code reçu après commande, et échange de points contre un cadeau.
 */
export function AccountApp() {
  const { user, ready, profile } = useAuth();

  if (!isFirebaseConfigured) return <FirebaseHint />;
  if (!ready) {
    return (
      <section className="account section-pad">
        <div className="container">
          <p className="account-loading">Connexion…</p>
        </div>
      </section>
    );
  }
  if (!user) return <AuthForms />;

  return <AccountDashboard user={user} profile={profile} />;
}

function FirebaseHint() {
  return (
    <section className="account section-pad">
      <div className="container">
        <div className="account-hint-card">
          <h2 className="section-title">Fidélité bientôt disponible.</h2>
          <p>
            Le programme de fidélité arrive. Revenez très vite pour créer votre
            compte et cumuler des points à chaque commande.
          </p>
        </div>
      </div>
    </section>
  );
}

/* --------------------------- Connexion / Inscription --------------------------- */

type AuthMode = 'login' | 'register' | 'reset';

const AUTH_ERRORS: Record<string, string> = {
  'auth/invalid-email': 'Adresse e-mail invalide.',
  'auth/user-not-found': 'Aucun compte avec cette adresse.',
  'auth/wrong-password': 'Mot de passe incorrect.',
  'auth/invalid-credential': 'Identifiants incorrects.',
  'auth/email-already-in-use': 'Un compte existe déjà avec cette adresse.',
  'auth/weak-password': 'Mot de passe trop faible (6 caractères minimum).',
  'auth/too-many-requests': 'Trop de tentatives. Réessayez plus tard.',
};

function authErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code ?? '';
  return (
    AUTH_ERRORS[code] ??
    'Une erreur est survenue. Vérifiez vos identifiants et réessayez.'
  );
}

function AuthForms() {
  const { login, register, resetPassword } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else if (mode === 'register') {
        await register(name, email, password);
      } else {
        await resetPassword(email);
        setNotice('E-mail de réinitialisation envoyé. Vérifiez votre boîte.');
      }
    } catch (err) {
      console.error(err);
      setError(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="account section-pad" id="compte">
      <div className="container">
        <Reveal className="section-label" as="div">Fidélité</Reveal>
        <div className="account-auth">
          <div className="account-auth-intro">
            <h2 className="section-title">
              Votre compte
              <br />
              fidélité.
            </h2>
            <p>
              1 € dépensé = 1 point. Cumulez des points à chaque commande et
              transformez-les en cadeaux de la carte.
            </p>
            <ul className="account-perks">
              <li>Solde de points en temps réel</li>
              <li>Codes reçus en caisse, crédités en un clic</li>
              <li>Cadeaux à partir de 50 points</li>
            </ul>
          </div>

          <form className="account-form" onSubmit={submit}>
            <div className="account-form-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'login'}
                className={mode === 'login' ? 'active' : ''}
                onClick={() => { setMode('login'); setError(null); }}
              >
                Connexion
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'register'}
                className={mode === 'register' ? 'active' : ''}
                onClick={() => { setMode('register'); setError(null); }}
              >
                Inscription
              </button>
            </div>

            {mode === 'register' && (
              <label className="account-field">
                <span>Prénom</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Camille"
                  autoComplete="given-name"
                />
              </label>
            )}

            <label className="account-field">
              <span>E-mail</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.fr"
                autoComplete="email"
                required
              />
            </label>

            {mode !== 'reset' && (
              <label className="account-field">
                <span>Mot de passe</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  minLength={6}
                  required
                />
              </label>
            )}

            {error && <div className="account-error" role="alert">{error}</div>}
            {notice && <div className="account-notice" role="status">{notice}</div>}

            <button type="submit" className="btn btn-primary account-submit" disabled={loading}>
              {loading
                ? 'Un instant…'
                : mode === 'login'
                  ? 'Se connecter'
                  : mode === 'register'
                    ? 'Créer mon compte'
                    : 'Envoyer le lien'}
            </button>

            <button
              type="button"
              className="account-reset-toggle"
              onClick={() =>
                setMode((m) => (m === 'reset' ? 'login' : 'reset'))
              }
            >
              {mode === 'reset' ? '← Retour à la connexion' : 'Mot de passe oublié ?'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------- Dashboard -------------------------------- */

function AccountDashboard({
  user,
  profile,
}: {
  user: User;
  profile: LoyaltyProfile | null;
}) {
  const { logout } = useAuth();
  const { products } = useProducts();
  const points = profile?.points ?? 0;
  const maxTier = Math.max(...GIFT_TIERS.map((t) => t.threshold));
  const firstName = user.displayName?.trim() || user.email?.split('@')[0] || 'client';

  const [code, setCode] = useState('');
  const [redeemState, setRedeemState] = useState<{
    kind: 'idle' | 'loading' | 'ok' | 'error';
    message?: string;
  }>({ kind: 'idle' });
  const [giftBusy, setGiftBusy] = useState<number | null>(null);
  const [giftState, setGiftState] = useState<{
    kind: 'ok' | 'error';
    message: string;
  } | null>(null);

  const visibleProducts = useMemo<Product[]>(
    () => products.filter(isAvailable),
    [products],
  );

  async function handleRedeem(e: React.FormEvent) {
    e.preventDefault();
    const normalized = normalizeCode(code);
    if (!normalized) {
      setRedeemState({ kind: 'error', message: 'Code invalide (format OS-XXXXXX).' });
      return;
    }
    setRedeemState({ kind: 'loading' });
    const result = await redeemCode(user.uid, normalized);
    if (result.ok) {
      setRedeemState({
        kind: 'ok',
        message: `Code crédité — nouveau solde : ${result.newBalance} points.`,
      });
      setCode('');
    } else {
      const messages = {
        'not-found': 'Ce code est inconnu. Vérifiez la saisie.',
        used: 'Ce code a déjà été utilisé.',
        cancelled: 'Ce code a été annulé.',
        network: 'Connexion impossible. Réessayez.',
      } as const;
      setRedeemState({ kind: 'error', message: messages[result.error] });
    }
  }

  async function handleClaim(tierIndex: number) {
    const tier = GIFT_TIERS[tierIndex];
    setGiftBusy(tierIndex);
    setGiftState(null);
    const res = await claimGift(user.uid, tier);
    setGiftBusy(null);
    if (res.ok) {
      setGiftState({
        kind: 'ok',
        message: `${tier.label} ! Il vous reste ${points - tier.threshold} points — présentez-vous au comptoir pour le récupérer.`,
      });
    } else if (res.error === 'not-enough') {
      setGiftState({
        kind: 'error',
        message: `Il vous manque ${tier.threshold - points} points pour ce cadeau.`,
      });
    } else {
      setGiftState({ kind: 'error', message: 'Échec de l’échange. Réessayez.' });
    }
  }

  return (
    <section className="account section-pad" id="compte">
      <div className="container">
        <div className="account-head">
          <div>
            <Reveal className="section-label" as="div">Mon compte</Reveal>
            <h2 className="section-title account-title">Bonjour, {firstName}.</h2>
          </div>
          <button className="account-logout" onClick={logout}>
            Se déconnecter
          </button>
        </div>

        {/* Solde */}
        <div className="account-balance">
          <div className="account-balance-num">
            {points}
            <small>pts</small>
          </div>
          <div className="account-balance-meta">
            <div className="account-progress" role="progressbar" aria-valuenow={points} aria-valuemin={0} aria-valuemax={maxTier}>
              <span style={{ width: `${Math.min(100, (points / maxTier) * 100)}%` }} />
            </div>
            <p>
              {points >= maxTier
                ? 'Tous les paliers sont à votre portée — échangez vos points !'
                : `Encore ${maxTier - points} points pour le grand cadeau (menu offert).`}
            </p>
          </div>
        </div>

        {/* Saisie de code */}
        <form className="account-redeem" onSubmit={handleRedeem}>
          <label htmlFor="loyalty-code" className="account-redeem-label">
            Un code de fidélité ? Saisissez-le ici
          </label>
          <div className="account-redeem-row">
            <input
              id="loyalty-code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="OS-XXXXXX"
              autoComplete="off"
              className="account-redeem-input"
            />
            <button type="submit" className="btn btn-primary" disabled={redeemState.kind === 'loading'}>
              {redeemState.kind === 'loading' ? 'Vérification…' : 'Créditer'}
            </button>
          </div>
          {redeemState.kind === 'ok' && (
            <p className="account-redeem-msg ok" role="status">{redeemState.message}</p>
          )}
          {redeemState.kind === 'error' && (
            <p className="account-redeem-msg err" role="alert">{redeemState.message}</p>
          )}
        </form>

        {/* Paliers cadeaux */}
        <div className="account-tiers">
          <h3 className="account-subtitle">Vos cadeaux</h3>
          {giftState && (
            <p className={`account-redeem-msg ${giftState.kind}`} role="status">
              {giftState.message}
            </p>
          )}
          <div className="account-tiers-grid">
            {GIFT_TIERS.map((tier, i) => {
              const gift =
                visibleProducts.find((p) => p.id === tier.productId) ??
                giftProduct(tier);
              const unlocked = points >= tier.threshold;
              return (
                <div key={tier.threshold} className={`account-tier ${unlocked ? 'unlocked' : ''}`}>
                  <div className="account-tier-gift">
                    <span className="account-tier-pts">{tier.threshold} pts</span>
                    <h4>{gift?.name ?? tier.label}</h4>
                    <p>{gift?.desc}</p>
                    <span className="account-tier-price">
                      {gift ? `Valeur ${formatPrice(gift.price)}` : ''}
                    </span>
                  </div>
                  <button
                    className="btn account-tier-btn"
                    disabled={!unlocked || giftBusy === i}
                    onClick={() => handleClaim(i)}
                    data-cursor-hover
                  >
                    {unlocked
                      ? giftBusy === i
                        ? 'Échange…'
                        : 'Échanger'
                      : `Dans ${tier.threshold - points} pts`}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <p className="account-foot-note">
          Les cadeaux se récupèrent au comptoir, en donnant votre e-mail après
          l&apos;échange.{' '}
          <Link href="/carte">Voir la carte <span className="btn-arrow">→</span></Link>
        </p>
      </div>
    </section>
  );
}
