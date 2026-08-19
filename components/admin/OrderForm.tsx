'use client';

import { useEffect, useMemo, useState } from 'react';
import { CATEGORY_LABELS, effectivePrice, type Category, type Product } from '@/lib/menu';
import { formatPrice } from '@/lib/format';
import { createOrder, type OrderItem } from '@/lib/products';
import {
  addPoints,
  adminCreateCustomer,
  lookupCustomerByEmail,
  pointsToEuros,
  POINTS_PER_EURO,
  spendPoints,
  type CustomerProfile,
} from '@/lib/loyalty';

/**
 * Saisie d'une commande comptoir :
 * - articles (recherche dans le menu) + quantités, total automatique ;
 * - client identifié par email (optionnel) : ses points s'affichent ;
 * - au payement : le solde est crédité de 10 pts/€ (ou débité si paiement
 *   en points choisi).
 * Écrit 1 commande + 2 documents client (profil + historique) — ponctuel.
 */

const CATS: Category[] = [
  'sandwichs',
  'burgers',
  'menus',
  'crepes',
  'texmex',
  'desserts',
  'boissons',
];

interface Props {
  products: Product[];
  onClose: () => void;
  onSaved: (msg: string) => void;
}

export function OrderForm({ products, onClose, onSaved }: Props) {
  const [email, setEmail] = useState('');
  const [customer, setCustomer] = useState<{ uid: string; profile: CustomerProfile } | null>(null);
  const [lookupState, setLookupState] = useState<'idle' | 'searching' | 'found' | 'unknown'>('idle');
  const [lines, setLines] = useState<{ product: Product; qty: number }[]>([]);
  const [search, setSearch] = useState('');
  const [payWithPoints, setPayWithPoints] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Création de compte client inline (quand l'email est inconnu).
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);

  const total = useMemo(
    () => lines.reduce((sum, l) => sum + effectivePrice(l.product) * l.qty, 0),
    [lines],
  );
  const pointsToEarn = Math.round(total * POINTS_PER_EURO);
  const pointsNeeded = Math.ceil(total * POINTS_PER_EURO); // tout en points
  const canPayWithPoints = customer != null && customer.profile.points >= pointsNeeded && total > 0;

  // Recherche du client par email (debounce 600 ms, lecture ponctuelle).
  useEffect(() => {
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes('@')) {
      setCustomer(null);
      setLookupState('idle');
      return;
    }
    setLookupState('searching');
    const t = window.setTimeout(() => {
      lookupCustomerByEmail(trimmed)
        .then((res) => {
          setCustomer(res);
          setLookupState(res ? 'found' : 'unknown');
        })
        .catch(() => {
          setCustomer(null);
          setLookupState('unknown');
        });
    }, 600);
    return () => window.clearTimeout(t);
  }, [email]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = q
      ? products.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.desc.toLowerCase().includes(q),
        )
      : products;
    return base.slice(0, 8);
  }, [products, search]);

  /** Création du compte client au comptoir (session admin préservée). */
  async function handleCreateAccount(e: React.FormEvent) {
    e.preventDefault();
    setAccountError(null);
    if (newPassword.length < 6)
      return setAccountError('Mot de passe : 6 caractères minimum.');
    if (!email.trim().includes('@'))
      return setAccountError('Renseigne un email valide ci-dessus.');
    setCreatingAccount(true);
    try {
      const created = await adminCreateCustomer(email, newPassword, newName);
      setCustomer(created);
      setLookupState('found');
      setNewName('');
      setNewPassword('');
    } catch (err) {
      console.error(err);
      const code = (err as { code?: string })?.code ?? '';
      setAccountError(
        code.includes('email-already-in-use')
          ? 'Un compte existe déjà avec cet email.'
          : code.includes('weak-password')
            ? 'Mot de passe trop court.'
            : 'Échec de la création du compte.',
      );
    } finally {
      setCreatingAccount(false);
    }
  }

  function addLine(p: Product) {
    setLines((prev) => {
      const existing = prev.find((l) => l.product.id === p.id);
      if (existing) {
        return prev.map((l) =>
          l.product.id === p.id ? { ...l, qty: l.qty + 1 } : l,
        );
      }
      return [...prev, { product: p, qty: 1 }];
    });
  }

  function setQty(productId: string, qty: number) {
    setLines((prev) =>
      qty <= 0
        ? prev.filter((l) => l.product.id !== productId)
        : prev.map((l) => (l.product.id === productId ? { ...l, qty } : l)),
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (lines.length === 0) return setError('Ajoute au moins un article.');

    setSaving(true);
    try {
      const items: OrderItem[] = lines.map((l) => ({
        productId: l.product.id,
        name: l.product.name,
        qty: l.qty,
        price: effectivePrice(l.product),
      }));

      // Référence lisible : n° du jour + compteur minute.
      const now = new Date();
      const reference = `${String(now.getHours()).padStart(2, '0')}${String(
        now.getMinutes(),
      ).padStart(2, '0')}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

      await createOrder({
        reference,
        status: 'nouvelle',
        customerEmail: email.trim() || undefined,
        paidWithPoints: payWithPoints || undefined,
        items,
        total: Math.round(total * 100) / 100,
        createdAt: Date.now(),
      });

      // Fidélité : débit puis crédit (paiement en points d'abord, puis gain
      // sur le montant réglé en euros).
      let msg = `Commande ${reference} enregistrée.`;
      if (customer) {
        if (payWithPoints) {
          await spendPoints(customer.uid, pointsNeeded, `Commande ${reference} — paiement en points`);
          msg += ` ${pointsNeeded} pts débités.`;
        } else if (total > 0) {
          const earn = pointsToEarn;
          await addPoints(customer.uid, earn, `Commande ${reference}`);
          msg += ` +${earn} pts crédités.`;
        }
      }
      onSaved(msg);
      onClose();
    } catch (err) {
      console.error(err);
      setError("Échec de l'enregistrement de la commande.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-head">
          <h2>Nouvelle commande</h2>
          <button className="admin-x" onClick={onClose} aria-label="Fermer">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form className="admin-form" onSubmit={handleSubmit}>
          <label className="admin-field">
            <span>Client (email fidélité — optionnel)</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="client@exemple.fr"
            />
          </label>

          {lookupState === 'searching' && (
            <p className="admin-hint">Recherche du compte…</p>
          )}
          {lookupState === 'found' && customer && (
            <div className="account-notice">
              ✓ {customer.profile.displayName || 'Client'} —{' '}
              <strong>{customer.profile.points} pts</strong> (
              {formatPrice(pointsToEuros(customer.profile.points))})
            </div>
          )}
          {lookupState === 'unknown' && email.trim() && (
            <div className="order-create-account">
              <p className="admin-hint">
                Aucun compte fidélité pour cet email. Crée-le en 10 secondes
                (le client gagnera des points sur cette commande) :
              </p>
              <form className="admin-row" onSubmit={handleCreateAccount}>
                <label className="admin-field">
                  <span>Prénom du client</span>
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Prénom"
                  />
                </label>
                <label className="admin-field">
                  <span>Mot de passe provisoire *</span>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="6 caractères min. (à communiquer au client)"
                    autoComplete="new-password"
                  />
                </label>
                <button
                  type="submit"
                  className="admin-btn solid sm"
                  disabled={creatingAccount}
                >
                  {creatingAccount ? 'Création…' : 'Créer le compte'}
                </button>
              </form>
              {accountError && <div className="admin-error">{accountError}</div>}
            </div>
          )}

          <label className="admin-field">
            <span>Rechercher un plat</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Grec, Cheese, milkshake…"
            />
          </label>

          {search.trim() && (
            <div className="order-picker">
              {filtered.map((p) => (
                <button
                  type="button"
                  key={p.id}
                  className="order-picker-item"
                  onClick={() => addLine(p)}
                >
                  <span>{p.name}</span>
                  <small>
                    {CATEGORY_LABELS[p.category]} · {formatPrice(effectivePrice(p))}
                  </small>
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="admin-hint">Aucun plat trouvé.</p>
              )}
            </div>
          )}

          {lines.length > 0 && (
            <div className="order-lines">
              {lines.map((l) => (
                <div key={l.product.id} className="order-line">
                  <span className="order-line-name">{l.product.name}</span>
                  <div className="order-line-qty">
                    <button type="button" onClick={() => setQty(l.product.id, l.qty - 1)}>−</button>
                    <span>{l.qty}</span>
                    <button type="button" onClick={() => setQty(l.product.id, l.qty + 1)}>+</button>
                  </div>
                  <span className="order-line-price">
                    {formatPrice(effectivePrice(l.product) * l.qty)}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="order-total">
            <span>Total</span>
            <strong>{formatPrice(total)}</strong>
          </div>

          {canPayWithPoints && (
            <label className="admin-check">
              <input
                type="checkbox"
                checked={payWithPoints}
                onChange={(e) => setPayWithPoints(e.target.checked)}
              />
              <span>
                Payer en points ({Math.ceil(total * POINTS_PER_EURO)} pts)
              </span>
            </label>
          )}

          <p className="admin-hint">
            {customer && !payWithPoints && total > 0
              ? `Ce client gagnera ${pointsToEarn} pts (${formatPrice(pointsToEuros(pointsToEarn))}).`
              : '10 points = 1 € · 1 € dépensé = 10 points.'}
          </p>

          {error && <div className="admin-error">{error}</div>}

          <div className="admin-actions">
            <button type="button" className="admin-btn ghost" onClick={onClose} disabled={saving}>
              Annuler
            </button>
            <button type="submit" className="admin-btn solid" disabled={saving}>
              {saving ? 'Enregistrement…' : 'Enregistrer la commande'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
