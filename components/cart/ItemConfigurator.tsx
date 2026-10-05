'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { effectivePrice, hasMenuPrice, type Product } from '@/lib/menu';
import { formatPrice } from '@/lib/format';
import {
  computeUnitPrice,
  optionGroupsFor,
  sauceUnitPrice,
  type OptionGroup,
  type SelectedOption,
} from '@/lib/options';
import { MAX_QTY, useCart } from '../CartContext';
import { useScrollLock } from '@/lib/scrollLock';

/**
 * Modale de configuration d'un article avant ajout au panier :
 * formule Seul/Menu, groupes d'options (pain, suppléments, parfums…),
 * quantité. Le prix affiché est TOUJOURS recalculé par le moteur d'options.
 *
 * Rendue via un portail dans <body> : les cartes produit (.pcard, .menu-card)
 * gardent une transform d'animation + overflow:hidden, ce qui emprisonnait la
 * modale « fixed » À L'INTÉRIEUR de la carte. Au dernier niveau du DOM, elle
 * couvre réellement tout l'écran, au-dessus de tout.
 */

interface Props {
  product: Product;
  onClose: () => void;
}

/** id sentinel du choix « Autre (préciser) ». */
const OTHER = '__other__';

export function ItemConfigurator({ product, onClose }: Props) {
  const { addLine } = useCart();
  const groups = useMemo(() => optionGroupsFor(product), [product]);
  const menuAvailable = hasMenuPrice(product);

  const [variant, setVariant] = useState<'seul' | 'menu'>('seul');
  const [qty, setQty] = useState(1);
  // single : groupId → id de choix (ou sentinel Autre) ; multi : ids choisis.
  const [single, setSingle] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      groups
        .filter((g) => g.type === 'single' && g.required)
        .map((g) => [g.id, g.choices[0].id]),
    ),
  );
  const [multi, setMulti] = useState<Record<string, string[]>>({});
  // sauces : groupId → (choiceId | sentinel Autre) → nombre d'unités.
  // Comme les groupes single requis, la 1re sauce est présélectionnée.
  const [counts, setCounts] = useState<Record<string, Record<string, number>>>(() =>
    Object.fromEntries(
      groups
        .filter((g) => g.type === 'sauces' && g.required)
        .map((g) => [g.id, { [g.choices[0].id]: 1 }]),
    ),
  );
  const [otherText, setOtherText] = useState<Record<string, string>>({});

  // Fermeture par Échap.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Blocage du scroll de fond : verrou comptabilisé qui stoppe aussi Lenis
  // et rend TOUJOURS le scroll à la fermeture (fix du blocage mobile).
  useScrollLock();

  /** Options sélectionnées, dans l'ordre des groupes. */
  const selected: SelectedOption[] = useMemo(() => {
    const out: SelectedOption[] = [];
    for (const g of groups) {
      if (g.type === 'single') {
        const id = single[g.id];
        if (!id) continue;
        if (id === OTHER) {
          const text = (otherText[g.id] ?? '').trim();
          if (text)
            out.push({ groupId: g.id, groupLabel: g.label, label: `Autre : ${text.slice(0, 60)}`, price: 0 });
        } else {
          const choice = g.choices.find((c) => c.id === id);
          if (choice)
            out.push({ groupId: g.id, groupLabel: g.label, label: choice.label, price: choice.price });
        }
      } else if (g.type === 'sauces') {
        // Une entrée par unité (une sauce prise 2× → 2 entrées) : la position
        // cumulée fixe le prix — 1res unités offertes, suivantes en supplément.
        const m = counts[g.id] ?? {};
        const rows: { id: string; label: string }[] = [
          ...g.choices.map((c) => ({ id: c.id, label: c.label })),
          ...(g.allowOther ? [{ id: OTHER, label: '' }] : []),
        ];
        let used = 0;
        for (const row of rows) {
          const n = m[row.id] ?? 0;
          if (!n) continue;
          const text = row.id === OTHER ? (otherText[g.id] ?? '').trim() : '';
          if (row.id === OTHER && !text) continue;
          const label = row.id === OTHER ? `Autre : ${text.slice(0, 60)}` : row.label;
          for (let i = 0; i < n; i++) {
            out.push({
              groupId: g.id,
              groupLabel: g.label,
              label,
              price: sauceUnitPrice(g, used),
            });
            used++;
          }
        }
      } else {
        for (const id of multi[g.id] ?? []) {
          const choice = g.choices.find((c) => c.id === id);
          if (choice)
            out.push({ groupId: g.id, groupLabel: g.label, label: choice.label, price: choice.price });
        }
      }
    }
    return out;
  }, [groups, single, multi, counts, otherText]);

  const unit = computeUnitPrice(product, variant, selected);

  /** Total d'unités d'un groupe sauces (Autre compris). */
  function sauceTotal(g: OptionGroup): number {
    return Object.values(counts[g.id] ?? {}).reduce((a, b) => a + b, 0);
  }

  /** Indicateur d'état du groupe : sauces offertes restantes ou supplément. */
  function sauceHint(g: OptionGroup): string {
    const total = sauceTotal(g);
    const free = g.freeUnits ?? 0;
    const extra = g.extraUnitPrice ?? 0;
    const remaining = free - total;
    if (remaining > 0)
      return `Encore ${remaining} sauce${remaining > 1 ? 's' : ''} offerte${remaining > 1 ? 's' : ''} — ensuite +${formatPrice(extra)} la sauce`;
    if (total === free) return `Toutes vos sauces sont offertes — la suivante : +${formatPrice(extra)}`;
    return `Sauces supplémentaires : +${formatPrice((total - free) * extra)}`;
  }

  /** +1/−1 sur une sauce ; le plafond du groupe (maxTotal) bloque l'ajout. */
  function bumpSauce(g: OptionGroup, id: string, delta: 1 | -1) {
    setCounts((prev) => {
      const m = { ...(prev[g.id] ?? {}) };
      const next = (m[id] ?? 0) + delta;
      if (next <= 0) {
        delete m[id];
      } else {
        const total = Object.values(m).reduce((a, b) => a + b, 0) + delta;
        if (g.maxTotal != null && total > g.maxTotal) return prev; // plafond atteint
        m[id] = next;
      }
      return { ...prev, [g.id]: m };
    });
  }

  /** Un « Autre » sélectionné mais non précisé bloque l'ajout. */
  const missingOther = groups.some((g) =>
    g.type === 'single'
      ? single[g.id] === OTHER && !(otherText[g.id] ?? '').trim()
      : g.type === 'sauces'
        ? ((counts[g.id] ?? {})[OTHER] ?? 0) > 0 && !(otherText[g.id] ?? '').trim()
        : false,
  );
  /** Un groupe sauces obligatoire sans aucune unité bloque l'ajout. */
  const missingSauce = groups.some((g) => g.type === 'sauces' && g.required && sauceTotal(g) === 0);

  function toggleMulti(g: OptionGroup, id: string) {
    setMulti((prev) => {
      const current = prev[g.id] ?? [];
      const has = current.includes(id);
      if (has) return { ...prev, [g.id]: current.filter((c) => c !== id) };
      if (g.maxSelect != null && current.length >= g.maxSelect) return prev; // plafond atteint
      return { ...prev, [g.id]: [...current, id] };
    });
  }

  function handleAdd() {
    if (missingOther || missingSauce) return;
    addLine({
      productId: product.id,
      productName: product.name,
      variant,
      options: selected,
      qty,
      unitPrice: unit,
    });
    onClose();
  }

  // Portail dans <body> (voir docblock) — le composant ne monte qu'au clic,
  // donc `document` est toujours disponible ici.
  return createPortal(
    <div className="item-config-overlay" onClick={onClose}>
      <div
        className="item-config"
        role="dialog"
        aria-modal="true"
        aria-label={`Options de ${product.name}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="item-config-head">
          <div className="item-config-thumb">
            <Image src={product.image} alt={product.name} fill sizes="96px" />
          </div>
          <div className="item-config-head-txt">
            <h3>{product.name}</h3>
            <p>{product.desc}</p>
          </div>
          <button className="item-config-x" onClick={onClose} aria-label="Fermer">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* data-lenis-prevent : le scroll tactile interne à la modale reste
            natif et n'essaie pas de faire défiler la page derrière. */}
        <div className="item-config-body" data-lenis-prevent>
          {menuAvailable && (
            <fieldset className="item-option-group is-formule">
              <legend>Formule</legend>
              <div className="item-option-choices">
                <button
                  type="button"
                  className={`item-option-choice ${variant === 'seul' ? 'is-selected' : ''}`}
                  onClick={() => setVariant('seul')}
                >
                  <span>Seul</span>
                  <span className="item-option-price">{formatPrice(effectivePrice(product))}</span>
                </button>
                <button
                  type="button"
                  className={`item-option-choice ${variant === 'menu' ? 'is-selected' : ''}`}
                  onClick={() => setVariant('menu')}
                >
                  <span>Menu</span>
                  <span className="item-option-price">{formatPrice(product.priceMenu as number)}</span>
                </button>
              </div>
            </fieldset>
          )}

          {groups.map((g) => (
            <fieldset className="item-option-group" key={g.id}>
              <legend>
                {g.label}
                {g.type === 'sauces' ? (
                  <span className="item-option-optional">
                    {' '}
                    · {g.freeUnits ?? 0} offertes
                    {g.extraUnitPrice ? `, +${formatPrice(g.extraUnitPrice)} la supplémentaire` : ''}
                  </span>
                ) : (
                  !g.required && <span className="item-option-optional"> · facultatif</span>
                )}
              </legend>

              {g.type === 'sauces' ? (
                <>
                  <p className="item-sauce-hint">{sauceHint(g)}</p>
                  <div className="item-sauce-list">
                    {g.choices.map((c) => (
                      <SauceRow
                        key={c.id}
                        label={c.label}
                        count={(counts[g.id] ?? {})[c.id] ?? 0}
                        capped={g.maxTotal != null && sauceTotal(g) >= g.maxTotal}
                        onDown={() => bumpSauce(g, c.id, -1)}
                        onUp={() => bumpSauce(g, c.id, 1)}
                      />
                    ))}
                    {g.allowOther && (
                      <SauceRow
                        label="Autre sauce (préciser)"
                        count={(counts[g.id] ?? {})[OTHER] ?? 0}
                        capped={g.maxTotal != null && sauceTotal(g) >= g.maxTotal}
                        onDown={() => bumpSauce(g, OTHER, -1)}
                        onUp={() => bumpSauce(g, OTHER, 1)}
                      />
                    )}
                  </div>
                  {g.allowOther && (counts[g.id] ?? {})[OTHER] > 0 && (
                    <input
                      className="item-option-other"
                      value={otherText[g.id] ?? ''}
                      onChange={(e) =>
                        setOtherText((p) => ({ ...p, [g.id]: e.target.value.slice(0, 60) }))
                      }
                      placeholder="Précisez la sauce (ex. barbecue)"
                      maxLength={60}
                    />
                  )}
                </>
              ) : (
                <div className="item-option-choices">
                  {g.type === 'single'
                    ? g.choices.map((c) => (
                        <button
                          type="button"
                          key={c.id}
                          className={`item-option-choice ${single[g.id] === c.id ? 'is-selected' : ''}`}
                          onClick={() => setSingle((p) => ({ ...p, [g.id]: c.id }))}
                        >
                          <span>{c.label}</span>
                          {c.price > 0 && (
                            <span className="item-option-price">+{formatPrice(c.price)}</span>
                          )}
                        </button>
                      ))
                    : g.choices.map((c) => {
                        const on = (multi[g.id] ?? []).includes(c.id);
                        const full =
                          g.maxSelect != null && (multi[g.id] ?? []).length >= g.maxSelect && !on;
                        return (
                          <button
                            type="button"
                            key={c.id}
                            className={`item-option-choice ${on ? 'is-selected' : ''} ${full ? 'is-full' : ''}`}
                            onClick={() => toggleMulti(g, c.id)}
                            aria-pressed={on}
                          >
                            <span>{c.label}</span>
                            {c.price > 0 && (
                              <span className="item-option-price">+{formatPrice(c.price)}</span>
                            )}
                          </button>
                        );
                      })}
                  {g.allowOther && g.type === 'single' && (
                    <button
                      type="button"
                      className={`item-option-choice ${single[g.id] === OTHER ? 'is-selected' : ''}`}
                      onClick={() => setSingle((p) => ({ ...p, [g.id]: OTHER }))}
                    >
                      <span>Autre…</span>
                    </button>
                  )}
                </div>
              )}

              {g.allowOther && g.type === 'single' && single[g.id] === OTHER && (
                <input
                  className="item-option-other"
                  value={otherText[g.id] ?? ''}
                  onChange={(e) => setOtherText((p) => ({ ...p, [g.id]: e.target.value.slice(0, 60) }))}
                  placeholder="Précisez (ex. sans cornichons)"
                  maxLength={60}
                />
              )}
            </fieldset>
          ))}
        </div>

        <div className="item-config-footer">
          <div className="item-qty" aria-label="Quantité">
            <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Retirer un">−</button>
            <span>{qty}</span>
            <button type="button" onClick={() => setQty((q) => Math.min(MAX_QTY, q + 1))} aria-label="Ajouter un">+</button>
          </div>
          <button
            type="button"
            className="item-config-add"
            onClick={handleAdd}
            disabled={missingOther || missingSauce}
          >
            {missingOther
              ? 'Précisez votre choix'
              : missingSauce
                ? 'Choisissez au moins une sauce'
                : `Ajouter — ${formatPrice(unit * qty)}`}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** Une ligne de sauce : libellé + compteur d'unités (− / n / +). */
function SauceRow({
  label,
  count,
  capped,
  onDown,
  onUp,
}: {
  label: string;
  count: number;
  /** Plafond d'unités du groupe atteint : le + est désactivé. */
  capped: boolean;
  onDown: () => void;
  onUp: () => void;
}) {
  return (
    <div className={`item-sauce-row ${count > 0 ? 'is-selected' : ''}`}>
      <span className="item-sauce-name">{label}</span>
      <div className="item-sauce-stepper" role="group" aria-label={`Quantité — ${label}`}>
        <button
          type="button"
          onClick={onDown}
          disabled={count === 0}
          aria-label={`Retirer une sauce ${label}`}
        >
          −
        </button>
        <span>{count}</span>
        <button
          type="button"
          onClick={onUp}
          disabled={capped}
          aria-label={`Ajouter une sauce ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}
