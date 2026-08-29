'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '@/lib/firebase';
import { isStaffUser } from '@/lib/staff';
import { useProducts } from '@/lib/useProducts';
import {
  CATEGORY_LABELS,
  effectivePrice,
  hasPromo,
  isAvailable,
  isBestSeller,
  promoPercent,
  type Product,
} from '@/lib/menu';
import { formatPrice } from '@/lib/format';
import {
  removeProduct,
  seedProducts,
  subscribeToOrders,
  updateOrderStatus,
  updateProduct,
  type Order,
} from '@/lib/products';
import { deliverOrderAndCredit } from '@/lib/orderDelivery';
import { checkOrderTotal } from '@/lib/orderCheck';
import { formatPickup } from '@/lib/opening';
import { useOrderAlert } from './orderAlert';
import { ProductForm } from './ProductForm';
import { OrderForm } from './OrderForm';
import { LoyaltyAdmin } from './LoyaltyAdmin';
import { HomeSlidesAdmin } from './HomeSlidesAdmin';

export function AdminApp() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!auth) {
      setReady(true);
      return;
    }
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setReady(true);
      // Admin unique : l'UID est comparé localement (les règles Firestore
      // appliquent la même contrainte côté sécurité).
      setIsAdmin(u ? isStaffUser(u.uid) : null);
    });
  }, []);

  if (!isFirebaseConfigured) return <NotConfigured />;
  if (!ready) return <Splash text="Connexion…" />;
  if (!user) return <Login />;
  if (isAdmin === null) return <Splash text="Vérification des droits…" />;
  if (!isAdmin) return <NotStaff email={user.email ?? ''} />;
  return <Dashboard user={user} />;
}

/* ------------------------------ Accès refusé ------------------------------ */

function NotStaff({ email }: { email: string }) {
  return (
    <Shell>
      <div className="admin-card center">
        <h1>Accès réservé à l&apos;administration</h1>
        <p>
          Le compte <strong>{email}</strong> est un compte client (fidélité) :
          il n&apos;a pas accès au dashboard. Votre espace se trouve sur la page
          Mon compte.
        </p>
        <a className="admin-btn solid" href="/compte">
          Aller à mon espace client
        </a>
      </div>
    </Shell>
  );
}

/* ----------------------------- Not configured ---------------------------- */

function NotConfigured() {
  return (
    <Shell>
      <div className="admin-card center">
        <h1>Firebase pas encore configuré</h1>
        <p>
          Pour activer le dashboard, crée un projet Firebase, puis copie
          <code>.env.local.example</code> en <code>.env.local</code> et remplis les
          6 variables <code>NEXT_PUBLIC_FIREBASE_*</code>.
        </p>
        <p>
          Active <strong>Firestore</strong> et <strong>Authentication</strong>
          (provider Email/Mot de passe), crée ton compte admin, puis utilise le
          bouton « Importer le menu » une fois connecté.
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

/* --------------------------------- Login --------------------------------- */

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (!auth) throw new Error('no-auth');
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err) {
      console.error(err);
      setError('Identifiants invalides ou compte non créé dans Firebase.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Shell>
      <form className="admin-card login" onSubmit={submit}>
        <div className="admin-logo">O’Snack <span>Admin</span></div>
        <h1>Espace administrateur</h1>
        <label className="admin-field">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@osnack.fr"
            autoComplete="username"
            required
          />
        </label>
        <label className="admin-field">
          <span>Mot de passe</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        {error && <div className="admin-error">{error}</div>}
        <button type="submit" className="admin-btn solid" disabled={loading}>
          {loading ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
    </Shell>
  );
}

/* ------------------------------- Dashboard ------------------------------- */

type Tab = 'accueil' | 'carte' | 'commandes' | 'fidelite';

function Dashboard({ user }: { user: User }) {
  // Menu admin : chargé UNE fois via /api/menu (cache ISR) — pas de boucle.
  const { products } = useProducts();
  // Commandes : LA SEULE écoute temps réel, remontée ici (une souscription
  // partagée par les stats, le tableau et l'alerte sonore).
  const orders = useOrders();
  const orderAlert = useOrderAlert(orders);
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  const [ordering, setOrdering] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('carte');

  function flash(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2500);
  }

  async function handleDelete(p: Product) {
    if (!window.confirm(`Supprimer définitivement « ${p.name} » ?`)) return;
    try {
      await removeProduct(p); // supprime le plat + son image Storage
      flash(`${p.name} supprimé.`);
    } catch (err) {
      console.error(err);
      flash('Échec de la suppression.');
    }
  }

  async function handleToggle(p: Product) {
    const next = !isAvailable(p);
    try {
      await updateProduct(p.id, { available: next });
    } catch (err) {
      console.error(err);
      flash('Échec de la mise à jour.');
    }
  }

  async function handleToggleBest(p: Product) {
    const next = !isBestSeller(p);
    try {
      await updateProduct(p.id, { bestseller: next });
      flash(next ? `${p.name} mis en Best Seller.` : `${p.name} retiré des Best Sellers.`);
    } catch (err) {
      console.error(err);
      flash('Échec de la mise à jour.');
    }
  }

  async function handleSeed() {
    if (
      !window.confirm(
        'Importer / réinitialiser le menu de base dans Firestore ? Les plats existants avec le même identifiant seront écrasés.',
      )
    )
      return;
    try {
      await seedProducts();
      flash('Menu importé dans Firestore.');
    } catch (err) {
      console.error(err);
      flash('Échec de l’import.');
    }
  }

  async function handleSignOut() {
    if (!auth) return;
    await signOut(auth);
  }

  const promoCount = products.filter(hasPromo).length;
  const hiddenCount = products.filter((p) => !isAvailable(p)).length;
  const bestCount = products.filter(isBestSeller).length;

  return (
    <Shell>
      <header className="admin-top">
        <div className="admin-logo">O’Snack <span>Admin</span></div>
        <div className="admin-top-right">
          <span className="admin-user">{user.email}</span>
          <button className="admin-btn ghost" onClick={handleSignOut}>
            Déconnexion
          </button>
        </div>
      </header>

      {/* Bandeau alerte : nouvelles commandes WEB non acquittées. */}
      {orderAlert.pending.length > 0 && (
        <div className="admin-neworder-banner" role="alert">
          <div className="admin-neworder-list">
            {orderAlert.pending.map((o) => (
              <div key={o.id} className="admin-neworder-item">
                <strong>Nouvelle commande WEB</strong>
                <span className="admin-neworder-ref">{o.reference ?? o.id.slice(0, 8)}</span>
                <span>
                  {o.customerName ?? '—'} · {formatPrice(o.total ?? 0)} ·{' '}
                  {formatPickup(o.pickup ?? { mode: 'asap' })}
                </span>
                <button className="admin-btn ghost sm" onClick={() => orderAlert.ack(o.id)}>
                  Vu
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="admin-tabs">
        <button
          className={`admin-tab ${tab === 'carte' ? 'active' : ''}`}
          onClick={() => setTab('carte')}
        >
          Gestion de la carte
        </button>
        <button
          className={`admin-tab ${tab === 'commandes' ? 'active' : ''}`}
          onClick={() => setTab('commandes')}
        >
          Commandes
        </button>
        <button
          className={`admin-tab ${tab === 'accueil' ? 'active' : ''}`}
          onClick={() => setTab('accueil')}
        >
          Accueil
        </button>
        <button
          className={`admin-tab ${tab === 'fidelite' ? 'active' : ''}`}
          onClick={() => setTab('fidelite')}
        >
          Fidélité
        </button>
      </div>

      {tab === 'fidelite' ? (
        <LoyaltyAdmin user={user} />
      ) : tab === 'accueil' ? (
        <HomeSlidesAdmin />
      ) : (
        <>
          <div className="admin-toolbar">
            <div>
              <h1>{tab === 'carte' ? 'Gestion de la carte' : 'Commandes'}</h1>
              <p className="admin-sub">
                {tab === 'carte'
                  ? 'Modifications visibles sur le site sous 5 min (cache).'
                  : 'Temps réel · les totaux web sont vérifiés contre la carte (fraîcheur ≤ 5 min).'}
              </p>
            </div>
            <div className="admin-toolbar-actions">
              {tab === 'carte' && (
                <>
                  <button className="admin-btn ghost" onClick={handleSeed}>
                    Importer le menu
                  </button>
                  <button className="admin-btn solid" onClick={() => setCreating(true)}>
                    + Ajouter un plat
                  </button>
                </>
              )}
              {tab === 'commandes' && (
                <button className="admin-btn solid" onClick={() => setOrdering(true)}>
                  + Nouvelle commande
                </button>
              )}
            </div>
          </div>

          <div className="admin-stats">
            {tab === 'carte' ? (
              <>
                <Stat label="Plats" value={products.length} />
                <Stat label="Best sellers" value={bestCount} />
                <Stat label="En promotion" value={promoCount} />
                <Stat label="Masqués" value={hiddenCount} />
              </>
            ) : (
              <OrdersLive orders={orders} />
            )}
          </div>

          <div className="admin-table-wrap">
            {tab === 'commandes' ? (
              <OrdersTable
                orders={orders}
                products={products}
                pendingIds={orderAlert.pending.map((o) => o.id)}
                onFlash={flash}
              />
            ) : (
              <table className="admin-table">
          <thead>
            <tr>
              <th>Plat</th>
              <th>Catégorie</th>
              <th>Prix</th>
              <th>Promo</th>
              <th>Top</th>
              <th>État</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className={!isAvailable(p) ? 'is-hidden' : ''}>
                <td className="cell-name">
                  <div
                    className="admin-thumb"
                    style={{ backgroundImage: `url(${p.image})` }}
                  />
                  <div>
                    <strong>{p.name}</strong>
                    <small>Ordre {p.order ?? '—'}</small>
                  </div>
                </td>
                <td>{CATEGORY_LABELS[p.category]}</td>
                <td className="cell-price">
                  {hasPromo(p) ? (
                    <>
                      <span className="price-old">{formatPrice(p.price)}</span>
                      <span>{formatPrice(effectivePrice(p))}</span>
                    </>
                  ) : (
                    formatPrice(p.price)
                  )}
                </td>
                <td>
                  {hasPromo(p) ? (
                    <span className="admin-pill promo">-{promoPercent(p)} %</span>
                  ) : (
                    <span className="admin-mute">—</span>
                  )}
                </td>
                <td>
                  <button
                    className={`admin-pill ${isBestSeller(p) ? 'on' : 'off'}`}
                    onClick={() => handleToggleBest(p)}
                    title="Mettre en / retirer des Best Sellers (page d'accueil)"
                  >
                    {isBestSeller(p) ? '★ Top' : 'Non'}
                  </button>
                </td>
                <td>
                  <button
                    className={`admin-pill ${isAvailable(p) ? 'on' : 'off'}`}
                    onClick={() => handleToggle(p)}
                    title="Afficher / masquer sur le site"
                  >
                    {isAvailable(p) ? 'En ligne' : 'Masqué'}
                  </button>
                </td>
                <td className="cell-actions">
                  <button className="admin-btn ghost sm" onClick={() => setEditing(p)}>
                    Éditer
                  </button>
                  <button
                    className="admin-btn danger sm"
                    onClick={() => handleDelete(p)}
                    aria-label={`Supprimer ${p.name}`}
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={7} className="admin-empty">
                  Aucun plat. Clique sur « Importer le menu » pour démarrer, ou
                  « + Ajouter un plat ».
                </td>
              </tr>
            )}
          </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {creating && <ProductForm onClose={() => setCreating(false)} />}
      {ordering && (
        <OrderForm
          products={products}
          onClose={() => setOrdering(false)}
          onSaved={flash}
        />
      )}
      {editing && (
        <ProductForm
          initial={editing}
          onClose={() => setEditing(null)}
        />
      )}

      {toast && <div className="admin-toast">{toast}</div>}
    </Shell>
  );
}

/* ------------------------------- subcomponents ------------------------------ */

/**
 * Écoute temps réel des commandes — LA SEULE de toute l'application
 * (onSnapshot sur la collection 'orders', réservée au dashboard cuisine).
 */
function useOrders() {
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    return subscribeToOrders(setOrders);
  }, []);

  return orders;
}

function OrdersLive({ orders }: { orders: Order[] | null }) {
  if (!orders) return <Stat label="Commandes" value={0} />;
  const active = orders.filter((o) => o.status !== 'livree' && o.status !== 'annulee');
  return (
    <>
      <Stat label="Commandes actives" value={active.length} />
      <Stat label="Nouvelles" value={orders.filter((o) => o.status === 'nouvelle').length} />
      <Stat label="En cours" value={orders.filter((o) => o.status === 'en_cours').length} />
      <Stat label="Total" value={orders.length} />
    </>
  );
}

const ORDER_STATUS_LABELS: Record<string, string> = {
  nouvelle: 'Nouvelle',
  en_cours: 'En cours',
  prete: 'Prête',
  livree: 'Livrée',
  annulee: 'Annulée',
};

interface OrdersTableProps {
  orders: Order[] | null;
  products: Product[];
  /** Commandes web non acquittées (ligne mise en évidence). */
  pendingIds: string[];
  onFlash: (msg: string) => void;
}

function OrdersTable({ orders, products, pendingIds, onFlash }: OrdersTableProps) {
  const [busy, setBusy] = useState<string | null>(null);

  async function setStatus(id: string, status: Order['status']) {
    setBusy(id);
    try {
      await updateOrderStatus(id, status);
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(null);
    }
  }

  /** « Livrée » : passage comptoir + crédit fidélité auto pour le web. */
  async function handleDeliver(o: Order) {
    setBusy(o.id);
    try {
      const pts = await deliverOrderAndCredit(o);
      onFlash(
        pts > 0
          ? `Commande ${o.reference ?? o.id.slice(0, 8)} livrée · ${pts} pts fidélité crédités.`
          : `Commande ${o.reference ?? o.id.slice(0, 8)} livrée.`,
      );
    } catch (err) {
      console.error(err);
      onFlash('Échec du passage en « livrée ».');
    } finally {
      setBusy(null);
    }
  }

  if (!orders) {
    return <div className="admin-empty">Connexion à Firestore…</div>;
  }
  if (orders.length === 0) {
    return (
      <div className="admin-empty">
        Aucune commande pour le moment. Les commandes apparaissent ici en temps réel.
      </div>
    );
  }

  return (
    <table className="admin-table">
      <thead>
        <tr>
          <th>Réf</th>
          <th>Client</th>
          <th>Articles</th>
          <th>Retrait</th>
          <th>Total</th>
          <th>Heure</th>
          <th>Statut</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {orders.map((o) => {
          // Contrôle anti-fraude : total recalculé contre la carte courante.
          const check = o.channel === 'web' ? checkOrderTotal(o, products) : null;
          const rowClass = [
            o.status === 'livree' ? 'is-hidden' : '',
            pendingIds.includes(o.id) ? 'row-new' : '',
            check && !check.ok ? 'row-warn' : '',
          ]
            .filter(Boolean)
            .join(' ');
          return (
            <tr key={o.id} className={rowClass}>
              <td className="cell-price">
                <div className="cell-ref">
                  {o.reference ?? o.id.slice(0, 8)}
                  <span className={`admin-pill ${o.channel === 'web' ? 'web' : ''}`}>
                    {o.channel === 'web' ? 'Web' : 'Comptoir'}
                  </span>
                </div>
              </td>
              <td>
                <strong>{o.customerName ?? '—'}</strong>
                {o.customerPhone && <small> {o.customerPhone}</small>}
                {o.note && <div className="cell-note">⚠ {o.note}</div>}
              </td>
              <td className="cell-articles">
                {(o.items ?? []).map((it, i) => (
                  <div key={`${o.id}-${i}`} className="cell-article">
                    <span>
                      {it.qty}× {it.name}
                      {it.variant === 'menu' ? ' (menu)' : ''}
                    </span>
                    {it.optionsSummary && (
                      <small className="cell-options">{it.optionsSummary}</small>
                    )}
                  </div>
                )) || '—'}
              </td>
              <td className="cell-pickup">
                {o.pickup ? formatPickup(o.pickup) : '—'}
              </td>
              <td className="cell-price">
                <div className="cell-ref">
                  {formatPrice(o.total ?? 0)}
                  {check && !check.ok && (
                    <span className="admin-pill warn" title={check.issues.join('\n')}>
                      ≠ vérif. {formatPrice(check.expected)}
                    </span>
                  )}
                </div>
              </td>
              <td className="cell-price">
                {o.createdAt ? new Date(o.createdAt).toLocaleTimeString('fr-FR') : '—'}
              </td>
              <td>
                <span className={`admin-pill ${o.status === 'nouvelle' ? 'on' : 'off'}`}>
                  {ORDER_STATUS_LABELS[o.status] ?? o.status}
                </span>
              </td>
              <td className="cell-actions">
                <button
                  className="admin-btn ghost sm"
                  disabled={busy === o.id}
                  onClick={() => setStatus(o.id, o.status === 'nouvelle' ? 'en_cours' : 'prete')}
                >
                  {o.status === 'nouvelle' ? 'Préparer' : 'Prête'}
                </button>
                <button
                  className="admin-btn danger sm"
                  disabled={busy === o.id}
                  onClick={() => handleDeliver(o)}
                >
                  Livrée
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="admin-stat">
      <div className="admin-stat-num">{value}</div>
      <div className="admin-stat-label">{label}</div>
    </div>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return <div className="admin-shell">{children}</div>;
}
