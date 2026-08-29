'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../AuthContext';
import { useCart, type CartLine } from '../CartContext';
import { useProducts } from '@/lib/useProducts';
import { createOrder, type OrderItem } from '@/lib/products';
import { computeUnitPrice, summarizeOptions } from '@/lib/options';
import {
  ASAP_LEAD_MINUTES,
  closesSoon,
  formatPickup,
  isOpenNow,
  nextSlots,
  type PickupSlot,
} from '@/lib/opening';
import { formatPrice } from '@/lib/format';
import { LINKS } from '@/lib/links';
import { isFirebaseConfigured } from '@/lib/firebase';
import { Reveal } from '../Reveal';

/**
 * ── Commande en ligne, paiement au retrait ───────────────────────────────────
 *
 * Une seule vue verticale : panier réconcilié contre la carte (ISR ≤ 5 min),
 * choix du retrait (ASAP / créneau), coordonnées, précisions, soumission.
 * La soumission écrit EXACTEMENT un document Firestore (addDoc orders) — aucune
 * lecture directe : le menu vient de /api/menu (cache), la confirmation est de
 * l'état client pur persisté en sessionStorage (survit au F5).
 */

const CONFIRM_KEY = 'osnack.confirm.v1';
const PHONE_RE = /^[0-9+ .()\-]{6,20}$/;

/** Référence web lisible : W-XXXXXX (sans caractères ambigus). */
function webReference(): string {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let body = '';
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(6);
    crypto.getRandomValues(bytes);
    for (const b of bytes) body += alphabet[b % alphabet.length];
  } else {
    for (let i = 0; i < 6; i++) body += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `W-${body}`;
}

/** Confirmation persistée en sessionStorage. */
interface ConfirmPayload {
  reference: string;
  customerName: string;
  total: number;
  pickup: { mode: 'asap' | 'scheduled'; at?: number };
  createdAt: number;
  lines: { name: string; qty: number; optionsSummary?: string; lineTotal: number }[];
}

/** Une ligne du panier confrontée à la carte courante. */
interface CheckedLine {
  line: CartLine;
  /** Produit introuvable ou masqué par l'admin → commande bloquée. */
  blocked: boolean;
  /** Prix unitaire recalculé (fait foi) — cache si produit introuvable. */
  unit: number;
  /** Le prix affiché a changé depuis l'ajout au panier. */
  priceChanged: boolean;
}

export function CheckoutApp() {
  const { lines, ready, setQty, removeLine, clear: clearCart } = useCart();
  const { user } = useAuth();
  const { products, loading } = useProducts();

  const [confirmed, setConfirmed] = useState<ConfirmPayload | null>(null);
  const [confirmRestored, setConfirmRestored] = useState(false);

  // Confirmation restaurée au montage (F5) : sessionStorage, jamais Firestore.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(CONFIRM_KEY);
      if (raw) setConfirmed(JSON.parse(raw) as ConfirmPayload);
    } catch {
      /* pas grave : affichage par défaut */
    }
    setConfirmRestored(true);
  }, []);

  /* ---- Réconciliation panier ↔ carte courante ---- */

  const checked: CheckedLine[] = useMemo(
    () =>
      lines.map((line) => {
        const product = products.find((p) => p.id === line.productId);
        if (!product || product.available === false) {
          return { line, blocked: true, unit: line.unitPrice, priceChanged: false };
        }
        const unit = computeUnitPrice(product, line.variant, line.options);
        return {
          line,
          blocked: false,
          unit,
          priceChanged: Math.abs(unit - line.unitPrice) > 0.005,
        };
      }),
    [lines, products],
  );

  const blockedCount = checked.filter((c) => c.blocked).length;
  const total = useMemo(
    () =>
      Math.round(
        checked.reduce((sum, c) => (c.blocked ? sum : sum + c.unit * c.line.qty), 0) * 100,
      ) / 100,
    [checked],
  );

  /* ---- Retrait : ASAP / créneau ---- */

  // Horloge minute par minute pour l'état ouvert/fermé (aucune I/O).
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(t);
  }, []);

  const asapAvailable = isOpenNow(now) && !closesSoon(now);
  const slots = useMemo(() => nextSlots(now), [now]);
  const days = useMemo(() => {
    const map = new Map<string, { dayKey: string; dayLabel: string; slots: PickupSlot[] }>();
    for (const s of slots) {
      const entry = map.get(s.dayKey) ?? { dayKey: s.dayKey, dayLabel: s.dayLabel, slots: [] };
      entry.slots.push(s);
      map.set(s.dayKey, entry);
    }
    return [...map.values()];
  }, [slots]);

  const [mode, setMode] = useState<'asap' | 'scheduled'>('asap');
  const [dayKey, setDayKey] = useState<string | null>(null);
  const [slotAt, setSlotAt] = useState<number | null>(null);

  // Défauts cohérents : ASAP si possible, sinon créneau ; 1er jour/heure dispo.
  useEffect(() => {
    if (!asapAvailable && mode === 'asap') setMode('scheduled');
  }, [asapAvailable, mode]);
  useEffect(() => {
    if (mode === 'scheduled' && dayKey == null && days.length > 0) setDayKey(days[0].dayKey);
  }, [mode, dayKey, days]);
  const daySlots = days.find((d) => d.dayKey === dayKey)?.slots ?? [];
  useEffect(() => {
    if (mode === 'scheduled' && daySlots.length > 0 && !daySlots.some((s) => s.at === slotAt)) {
      setSlotAt(daySlots[0].at);
    }
  }, [mode, daySlots, slotAt]);

  /* ---- Coordonnées ---- */

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');

  // Prénom prérempli depuis le compte (une fois, sans écraser la saisie).
  useEffect(() => {
    if (user?.displayName && !name) setName(user.displayName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  /* ---- Soumission (exactement 1 write) ---- */

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    ready &&
    !loading &&
    isFirebaseConfigured &&
    lines.length > 0 &&
    blockedCount === 0 &&
    name.trim().length >= 1 &&
    PHONE_RE.test(phone.trim()) &&
    (mode === 'asap' || slotAt != null) &&
    !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    try {
      const items: OrderItem[] = checked
        .filter((c) => !c.blocked)
        .map(({ line, unit }) => {
          const item: OrderItem = {
            productId: line.productId,
            name: line.productName,
            qty: line.qty,
            price: unit,
          };
          if (line.variant === 'menu') item.variant = 'menu';
          const summary = summarizeOptions(line.variant, line.options);
          if (summary) item.optionsSummary = summary;
          if (line.options.length > 0) {
            item.options = line.options.map((o) => ({ label: o.label, price: o.price }));
          }
          return item;
        });

      const payload: ConfirmPayload = {
        reference: webReference(),
        customerName: name.trim().slice(0, 40),
        total,
        pickup: mode === 'asap' ? { mode: 'asap' } : { mode: 'scheduled', at: slotAt! },
        createdAt: Date.now(),
        lines: checked
          .filter((c) => !c.blocked)
          .map(({ line, unit }) => ({
            name: line.productName,
            qty: line.qty,
            optionsSummary:
              summarizeOptions(line.variant, line.options) || undefined,
            lineTotal: Math.round(unit * line.qty * 100) / 100,
          })),
      };

      await createOrder({
        reference: payload.reference,
        status: 'nouvelle',
        channel: 'web',
        customerName: payload.customerName,
        customerPhone: phone.trim(),
        customerEmail: user?.email ?? undefined,
        uid: user?.uid ?? undefined,
        pickup: payload.pickup,
        note: note.trim() ? note.trim().slice(0, 300) : undefined,
        items,
        total: payload.total,
        createdAt: payload.createdAt,
      });

      try {
        sessionStorage.setItem(CONFIRM_KEY, JSON.stringify(payload));
      } catch {
        /* sans persistance, la confirmation reste à l'écran */
      }
      setConfirmed(payload);
      clearCart();
    } catch (err) {
      console.error('[checkout] submit failed:', err);
      setError(
        "L'envoi a échoué. Vérifiez votre connexion puis réessayez — votre commande est intacte.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  /* ---- Rendu ---- */

  if (!confirmRestored || !ready) {
    return (
      <section className="checkout section-pad">
        <div className="container checkout-container">
          <p className="checkout-pay-note">Chargement…</p>
        </div>
      </section>
    );
  }

  if (confirmed) {
    return (
      <section className="checkout section-pad">
        <div className="container checkout-container">
          <Confirmation
            data={confirmed}
            onNewOrder={() => {
              try {
                sessionStorage.removeItem(CONFIRM_KEY);
              } catch {
                /* ignore */
              }
              setConfirmed(null);
            }}
          />
        </div>
      </section>
    );
  }

  if (lines.length === 0) {
    return (
      <section className="checkout section-pad">
        <div className="container checkout-container">
          <Reveal className="section-label" as="div">Commander en ligne</Reveal>
          <div className="checkout-empty">
            <p>Votre panier est vide — la carte vous attend.</p>
            <Link href="/carte" className="btn">Voir la carte</Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="checkout section-pad">
      <div className="container checkout-container">
        <Reveal className="section-label" as="div">Commander en ligne</Reveal>
        <h1 className="section-title">Votre commande.</h1>
        <p className="checkout-lead">
          Composez, choisissez votre heure de retrait, et réglez en espèces ou
          par carte en boutique au moment de la récupération.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          {/* 1 · Panier */}
          <div className="checkout-block">
            <h2 className="checkout-block-title">1 · Votre panier</h2>
            {checked.map(({ line, blocked, unit, priceChanged }) => (
              <div
                key={line.key}
                className={`checkout-line ${blocked ? 'is-blocked' : ''}`}
              >
                <div className="checkout-line-main">
                  <span className="checkout-line-name">
                    {line.productName}
                    <span className="checkout-line-qty-tag">× {line.qty}</span>
                  </span>
                  {summarizeOptions(line.variant, line.options) && (
                    <small className="checkout-line-options">
                      {summarizeOptions(line.variant, line.options)}
                    </small>
                  )}
                  {blocked && (
                    <span className="checkout-line-flag">
                      Plus disponible à la carte — retirez cet article
                    </span>
                  )}
                  {priceChanged && (
                    <span className="checkout-line-flag ok">Prix mis à jour selon la carte</span>
                  )}
                </div>
                <div className="checkout-line-side">
                  <div className="checkout-qty">
                    <button
                      type="button"
                      aria-label="Diminuer"
                      onClick={() => setQty(line.key, line.qty - 1)}
                    >
                      −
                    </button>
                    <span>{line.qty}</span>
                    <button
                      type="button"
                      aria-label="Augmenter"
                      onClick={() => setQty(line.key, line.qty + 1)}
                    >
                      +
                    </button>
                  </div>
                  <span className="checkout-line-price">
                    {formatPrice(unit * line.qty)}
                  </span>
                  <button
                    type="button"
                    className="checkout-remove"
                    aria-label={`Retirer ${line.productName}`}
                    onClick={() => removeLine(line.key)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* 2 · Retrait */}
          <div className="checkout-block">
            <h2 className="checkout-block-title">2 · Retrait en boutique</h2>
            <div className="pickup-cards">
              <button
                type="button"
                className={`pickup-card ${mode === 'asap' ? 'is-selected' : ''} ${
                  asapAvailable ? '' : 'is-disabled'
                }`}
                onClick={() => asapAvailable && setMode('asap')}
                aria-pressed={mode === 'asap'}
                disabled={!asapAvailable}
              >
                <span className="pickup-card-title">Dès que possible</span>
                <span className="pickup-card-sub">
                  {asapAvailable
                    ? `Prête dans ~${ASAP_LEAD_MINUTES} min`
                    : 'Indisponible (fermé ou fermeture imminente)'}
                </span>
              </button>
              <button
                type="button"
                className={`pickup-card ${mode === 'scheduled' ? 'is-selected' : ''}`}
                onClick={() => setMode('scheduled')}
                aria-pressed={mode === 'scheduled'}
              >
                <span className="pickup-card-title">Programmer</span>
                <span className="pickup-card-sub">Choisissez un créneau (par pas de 15 min)</span>
              </button>
            </div>

            {mode === 'scheduled' && (
              <div className="slot-picker">
                <div className="slot-days">
                  {days.map((d) => (
                    <button
                      type="button"
                      key={d.dayKey}
                      className={`slot-chip ${dayKey === d.dayKey ? 'active' : ''}`}
                      onClick={() => setDayKey(d.dayKey)}
                    >
                      {d.dayLabel}
                    </button>
                  ))}
                </div>
                <div className="slot-times">
                  {daySlots.length > 0 ? (
                    daySlots.map((s) => (
                      <button
                        type="button"
                        key={s.at}
                        className={`slot-chip ${slotAt === s.at ? 'active' : ''}`}
                        onClick={() => setSlotAt(s.at)}
                      >
                        {s.label}
                      </button>
                    ))
                  ) : (
                    <span className="slot-empty">Aucun créneau ce jour-là.</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 3 · Coordonnées */}
          <div className="checkout-block">
            <h2 className="checkout-block-title">3 · Vos coordonnées</h2>
            {user && (
              <div className="checkout-account">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} style={{ flexShrink: 0, marginTop: 2 }}>
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span>
                  Commande liée à votre compte <strong>{user.email}</strong> — vos
                  points fidélité (1 € = 1 pt) seront crédités à la remise de la
                  commande.
                </span>
              </div>
            )}
            <div className="checkout-fields">
              <label className="checkout-field">
                Prénom *
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, 40))}
                  placeholder="Votre prénom"
                  maxLength={40}
                  required
                />
              </label>
              <label className="checkout-field">
                Téléphone *
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.slice(0, 20))}
                  placeholder="06 12 34 56 78"
                  required
                />
              </label>
              <label className="checkout-field wide">
                Précisions (facultatif)
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value.slice(0, 300))}
                  placeholder="Allergies, demandes particulières…"
                  maxLength={300}
                />
              </label>
            </div>
          </div>

          {/* Total & soumission */}
          <div className="checkout-summary">
            <div className="checkout-total">
              <span>Total à régler au retrait</span>
              <strong>{formatPrice(total)}</strong>
            </div>
            {!isFirebaseConfigured && (
              <div className="checkout-error">
                La commande en ligne n&apos;est pas encore activée. Réessayez dans
                quelques instants.
              </div>
            )}
            {error && <div className="checkout-error">{error}</div>}
            <button type="submit" className="checkout-submit" disabled={!canSubmit}>
              {submitting ? 'Envoi en cours…' : 'Envoyer ma commande'}
            </button>
            <p className="checkout-pay-note">
              Paiement en espèces ou par carte au retrait · 57 Rue de Paris, 77220
              Torcy · {mode === 'asap'
                ? `prête dans ~${ASAP_LEAD_MINUTES} min`
                : slotAt != null
                  ? formatPickup({ mode: 'scheduled', at: slotAt }, now)
                  : 'créneau à choisir'}
            </p>
          </div>
        </form>
      </div>
    </section>
  );
}

/* ------------------------------ Confirmation ------------------------------ */

function Confirmation({
  data,
  onNewOrder,
}: {
  data: ConfirmPayload;
  onNewOrder: () => void;
}) {
  return (
    <div className="confirm">
      <div className="confirm-check" aria-hidden>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <h1 className="confirm-title">Commande bien reçue&nbsp;!</h1>
      <p className="confirm-ref">
        Votre référence&nbsp;: <strong>{data.reference}</strong>
      </p>
      <p className="confirm-pickup">
        Retrait {formatPickup(data.pickup)} — donnez votre référence ({data.reference}) au comptoir.
      </p>

      <div className="confirm-lines">
        {data.lines.map((l, i) => (
          <div className="confirm-line" key={`${l.name}-${i}`}>
            <div className="confirm-line-main">
              <span className="confirm-line-name">
                <span className="confirm-line-qty">{l.qty}×</span>
                {l.name}
              </span>
              {l.optionsSummary && (
                <small className="confirm-line-options">{l.optionsSummary}</small>
              )}
            </div>
            <span className="confirm-line-price">{formatPrice(l.lineTotal)}</span>
          </div>
        ))}
      </div>
      <div className="confirm-total">
        <span>Total</span>
        <strong>{formatPrice(data.total)}</strong>
      </div>

      <div className="confirm-pay">
        <strong>À payer au retrait : {formatPrice(data.total)}</strong>
        <span>En espèces ou par carte bancaire — 57 Rue de Paris, 77220 Torcy</span>
      </div>

      <p className="confirm-note">
        Une question&nbsp;? Appelez-nous au{' '}
        <a href={LINKS.phoneHref}>{LINKS.phone}</a>.
      </p>

      <div className="confirm-actions">
        <Link href="/carte" className="btn">Retour à la carte</Link>
        <button type="button" className="btn" onClick={onNewOrder}>
          Nouvelle commande
        </button>
      </div>
    </div>
  );
}
