'use client';

import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../AuthContext';
import { useCart, type CartLine } from '../CartContext';
import { useProducts } from '@/lib/useProducts';
import { submitWebOrder } from '@/lib/orderSubmit';
import { type Order, type OrderItem } from '@/lib/products';
import { scrollToTop } from '@/lib/scrollLock';
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
 * La soumission écrit EXACTEMENT un document Firestore (orders) — sans
 * cadeau : simple création ; avec cadeaux fidélité : le débit des points et
 * la création se jouent dans une même transaction (lib/orderSubmit.ts).
 * Aucune lecture directe : le menu vient de /api/menu (cache), la
 * confirmation est de l'état client pur persisté en sessionStorage (survit
 * au F5).
 */

const CONFIRM_KEY = 'osnack.confirm.v1';
/** Téléphone valide : exactement 10 chiffres (espaces, points, tirets tolérés). */
const PHONE_RE = /^[0-9](?:[ .\-]?[0-9]){9}$/;

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
  /** Points fidélité débités par les cadeaux de la commande (0 sinon). */
  pointsSpent?: number;
  pickup: { mode: 'asap' | 'scheduled'; at?: number };
  createdAt: number;
  lines: {
    name: string;
    qty: number;
    optionsSummary?: string;
    lineTotal: number;
    /** Points débités pour ce cadeau (article offert). */
    giftPoints?: number;
  }[];
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
  const { user, profile, ready: authReady } = useAuth();
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

  /* ---- Cadeaux fidélité (payés en points, 0 € facturé) ---- */

  const hasGifts = lines.some((l) => !!l.loyaltyGift);
  const giftPoints = useMemo(
    () =>
      checked.reduce(
        (sum, c) =>
          c.blocked || !c.line.loyaltyGift
            ? sum
            : sum + c.line.loyaltyGift.threshold * c.line.qty,
        0,
      ),
    [checked],
  );
  const pointsBalance = profile?.points ?? 0;
  // Solde pas encore chargé (auth prête, profil en route) → pas de blocage
  // anticipé : la transaction Firestore revalide le solde à l'envoi.
  const pointsChecked = hasGifts && user != null && authReady && profile != null;
  const missingPoints =
    pointsChecked && user ? Math.max(0, giftPoints - pointsBalance) : 0;

  const total = useMemo(
    () =>
      Math.round(
        checked.reduce(
          (sum, c) =>
            c.blocked || c.line.loyaltyGift ? sum : sum + c.unit * c.line.qty,
          0,
        ) * 100,
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

  const phoneValid = PHONE_RE.test(phone.trim());
  const showPhoneError = phone.trim() !== '' && !phoneValid;

  const canSubmit =
    ready &&
    !loading &&
    isFirebaseConfigured &&
    lines.length > 0 &&
    blockedCount === 0 &&
    name.trim().length >= 1 &&
    phoneValid &&
    (mode === 'asap' || slotAt != null) &&
    // Cadeaux fidélité : compte connecté obligatoire (débit des points à
    // l'envoi) et solde suffisant — revérifié dans la transaction Firestore.
    (!hasGifts || (user != null && missingPoints === 0)) &&
    !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    // iOS : le champ qui a le focus (clavier ouvert) va être démonté avec le
    // formulaire. Sans cela, le viewport tactile reste désynchronisé et la
    // page peut ensuite être « baladée » dans tous les sens, y compris sur
    // les côtés. On retire le focus avant tout remplacement de contenu.
    (document.activeElement as HTMLElement | null)?.blur?.();
    try {
      const items: OrderItem[] = checked
        .filter((c) => !c.blocked)
        .map(({ line, unit }) => {
          // Cadeau fidélité : 0 € facturé, palier débité en transaction.
          if (line.loyaltyGift) {
            return {
              productId: line.productId,
              name: line.productName,
              qty: 1,
              price: 0,
              paidWithPoints: true,
              pointsSpent: line.loyaltyGift.threshold,
            } satisfies OrderItem;
          }
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
        ...(giftPoints > 0 ? { pointsSpent: giftPoints } : {}),
        pickup: mode === 'asap' ? { mode: 'asap' } : { mode: 'scheduled', at: slotAt! },
        createdAt: Date.now(),
        lines: checked
          .filter((c) => !c.blocked)
          .map(({ line, unit }) => ({
            name: line.productName,
            qty: line.loyaltyGift ? 1 : line.qty,
            optionsSummary: line.loyaltyGift
              ? `Cadeau fidélité · ${line.loyaltyGift.label}`
              : summarizeOptions(line.variant, line.options) || undefined,
            lineTotal: line.loyaltyGift ? 0 : Math.round(unit * line.qty * 100) / 100,
            ...(line.loyaltyGift ? { giftPoints: line.loyaltyGift.threshold } : {}),
          })),
      };

      const order: Omit<Order, 'id'> = {
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
        // Débit des points + création de la commande en UNE transaction.
        ...(giftPoints > 0
          ? { paidWithPoints: true as const, pointsSpent: giftPoints }
          : {}),
      };
      await submitWebOrder(order, giftPoints);

      try {
        sessionStorage.setItem(CONFIRM_KEY, JSON.stringify(payload));
      } catch {
        /* sans persistance, la confirmation reste à l'écran */
      }
      setConfirmed(payload);
      clearCart();
    } catch (err) {
      console.error('[checkout] submit failed:', err);
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('not-enough-points')) {
        setError(
          'Vos points de fidélité sont insuffisants pour les cadeaux de ce panier — retirez-les puis réessayez.',
        );
      } else if (msg.includes('gift-requires-account')) {
        setError(
          'Connectez-vous à votre compte fidélité pour commander vos cadeaux.',
        );
      } else {
        setError(
          "L'envoi a échoué. Vérifiez votre connexion puis réessayez — votre commande est intacte.",
        );
      }
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
        <h1 className="section-title">
          Votre commande.
          <span className="sr-only">
            {' '}
            Commande en ligne au snack fast food O'Snack Torcy — à emporter ou
            en livraison
          </span>
        </h1>
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
                className={`checkout-line ${blocked ? 'is-blocked' : ''} ${
                  line.loyaltyGift ? 'is-gift' : ''
                }`}
              >
                <div className="checkout-line-main">
                  <span className="checkout-line-name">
                    {line.productName}
                    <span className="checkout-line-qty-tag">× {line.loyaltyGift ? 1 : line.qty}</span>
                  </span>
                  {summarizeOptions(line.variant, line.options) && (
                    <small className="checkout-line-options">
                      {summarizeOptions(line.variant, line.options)}
                    </small>
                  )}
                  {line.loyaltyGift && !blocked && (
                    <span className="checkout-line-flag gift">
                      Offert · payé avec {line.loyaltyGift.threshold} points fidélité
                    </span>
                  )}
                  {blocked && (
                    <span className="checkout-line-flag">
                      Plus disponible à la carte — retirez cet article
                    </span>
                  )}
                  {priceChanged && !line.loyaltyGift && (
                    <span className="checkout-line-flag ok">Prix mis à jour selon la carte</span>
                  )}
                </div>
                <div className="checkout-line-side">
                  {line.loyaltyGift ? (
                    <span
                      className="checkout-qty locked"
                      title="Cadeau fidélité limité à 1 exemplaire"
                    >
                      1
                    </span>
                  ) : (
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
                  )}
                  <span className={`checkout-line-price ${line.loyaltyGift ? 'gift' : ''}`}>
                    {line.loyaltyGift ? (
                      <>
                        <s>{formatPrice(unit * line.qty)}</s> Offert
                      </>
                    ) : (
                      formatPrice(unit * line.qty)
                    )}
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
                  Commande liée à votre compte <strong>{user.email}</strong> —
                  {hasGifts
                    ? ` ${giftPoints} points fidélité seront débités à l'envoi, et les points gagnés le seront sur la partie payée en euros (1 € = 1 pt).`
                    : ' vos points fidélité (1 € = 1 pt) seront crédités à la remise de la commande.'}
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
                  inputMode="numeric"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value.replace(/[^0-9 .\-]/g, '').slice(0, 14))
                  }
                  placeholder="06 12 34 56 78"
                  required
                />
                {showPhoneError && (
                  <small className="checkout-field-error" role="alert">
                    Numéro invalide — il doit contenir exactement 10 chiffres
                    (ex. 06 12 34 56 78).
                  </small>
                )}
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
            {hasGifts && (
              <div
                className={`checkout-gift-note ${
                  user == null || missingPoints > 0 ? 'is-error' : ''
                }`}
                role={user == null || missingPoints > 0 ? 'alert' : 'status'}
              >
                {user == null ? (
                  <>
                    Cette commande contient un cadeau fidélité —{' '}
                    <Link href="/compte">connectez-vous à votre compte</Link>{' '}
                    pour l&apos;utiliser ({giftPoints} points requis).
                  </>
                ) : missingPoints > 0 ? (
                  <>
                    Il vous manque {missingPoints} point
                    {missingPoints > 1 ? 's' : ''} de fidélité pour les cadeaux
                    de ce panier (solde : {pointsBalance} pts) — retirez-les ou
                    rechargez votre solde.
                  </>
                ) : (
                  <>
                    ✓ {giftPoints} points de fidélité seront débités à l&apos;envoi
                    de cette commande.
                  </>
                )}
              </div>
            )}
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
              Paiement en espèces ou par carte au retrait · 57 Rue de Paris, 77200
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
  // La confirmation remplace un formulaire bien plus haut, sans navigation :
  // le navigateur garde alors le scroll au fond de l'ancienne page. On
  // remonte avant peinture pour que « Commande bien reçue » soit visible
  // dès l'apparition de l'écran (couvre aussi la restauration après F5).
  useLayoutEffect(() => {
    scrollToTop();
  }, []);

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
            <span className={`confirm-line-price ${l.giftPoints ? 'gift' : ''}`}>
              {l.giftPoints ? 'Offert' : formatPrice(l.lineTotal)}
            </span>
          </div>
        ))}
      </div>
      <div className="confirm-total">
        <span>Total</span>
        <strong>{formatPrice(data.total)}</strong>
      </div>
      {data.pointsSpent ? (
        <p className="confirm-points" role="status">
          {data.pointsSpent} points de fidélité utilisés pour les cadeaux de
          cette commande.
        </p>
      ) : null}

      <div className="confirm-pay">
        {data.pointsSpent && data.total === 0 ? (
          <>
            <strong>Réglé avec vos points — rien à payer au retrait.</strong>
            <span>Présentez votre référence ({data.reference}) au comptoir — 57 Rue de Paris, 77200 Torcy</span>
          </>
        ) : (
          <>
            <strong>À payer au retrait : {formatPrice(data.total)}</strong>
            <span>En espèces ou par carte bancaire — 57 Rue de Paris, 77200 Torcy</span>
          </>
        )}
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
