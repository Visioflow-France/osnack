'use client';

import { useEffect, useState, type ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '@/lib/firebase';
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
import { removeProduct, seedProducts, updateProduct } from '@/lib/products';
import { ProductForm } from './ProductForm';
import { LoyaltyAdmin } from './LoyaltyAdmin';
import { HomeSlidesAdmin } from './HomeSlidesAdmin';

export function AdminApp() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!auth) {
      setReady(true);
      return;
    }
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setReady(true);
    });
  }, []);

  if (!isFirebaseConfigured) return <NotConfigured />;
  if (!ready) return <Splash text="Connexion…" />;
  if (!user) return <Login />;
  return <Dashboard user={user} />;
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

function Dashboard({ user }: { user: User }) {
  const { products } = useProducts();
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [tab, setTab] = useState<'carte' | 'fidelite' | 'accueil'>('carte');

  function flash(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2500);
  }

  async function handleDelete(p: Product) {
    if (!window.confirm(`Supprimer définitivement « ${p.name} » ?`)) return;
    try {
      await removeProduct(p.id);
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

      <div className="admin-tabs">
        <button
          className={`admin-tab ${tab === 'carte' ? 'active' : ''}`}
          onClick={() => setTab('carte')}
        >
          Gestion de la carte
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
              <h1>Gestion de la carte</h1>
              <p className="admin-sub">Modifications en temps réel — visibles aussitôt sur le site.</p>
            </div>
            <div className="admin-toolbar-actions">
              <button className="admin-btn ghost" onClick={handleSeed}>
                Importer le menu
              </button>
              <button className="admin-btn solid" onClick={() => setCreating(true)}>
                + Ajouter un plat
              </button>
            </div>
          </div>

          <div className="admin-stats">
        <Stat label="Plats" value={products.length} />
        <Stat label="Best sellers" value={bestCount} />
        <Stat label="En promotion" value={promoCount} />
        <Stat label="Masqués" value={hiddenCount} />
      </div>

      <div className="admin-table-wrap">
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
      </div>

      {creating && <ProductForm onClose={() => setCreating(false)} />}
      {editing && (
        <ProductForm
          initial={editing}
          onClose={() => setEditing(null)}
        />
      )}
      </>
      )}

      {toast && <div className="admin-toast">{toast}</div>}
    </Shell>
  );
}

/* ------------------------------- subcomponents ------------------------------ */

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
