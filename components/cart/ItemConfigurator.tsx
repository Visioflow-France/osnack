'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { effectivePrice, hasMenuPrice, type Product } from '@/lib/menu';
import { formatPrice } from '@/lib/format';
import {
  computeUnitPrice,
  optionGroupsFor,
  type OptionGroup,
  type SelectedOption,
} from '@/lib/options';
import { MAX_QTY, useCart } from '../CartContext';

/**
 * Modale de configuration d'un article avant ajout au panier :
 * formule Seul/Menu, groupes d'options (pain, suppléments, parfums…),
 * quantité. Le prix affiché est TOUJOURS recalculé par le moteur d'options.
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
  const [otherText, setOtherText] = useState<Record<string, string>>({});

  // Fermeture par Échap + blocage du scroll de fond.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

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
      } else {
        for (const id of multi[g.id] ?? []) {
          const choice = g.choices.find((c) => c.id === id);
          if (choice)
            out.push({ groupId: g.id, groupLabel: g.label, label: choice.label, price: choice.price });
        }
      }
    }
    return out;
  }, [groups, single, multi, otherText]);

  const unit = computeUnitPrice(product, variant, selected);

  /** Un « Autre » sélectionné mais non précisé bloque l'ajout. */
  const missingOther = groups.some(
    (g) => g.type === 'single' && single[g.id] === OTHER && !(otherText[g.id] ?? '').trim(),
  );

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
    if (missingOther) return;
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

  return (
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

        <div className="item-config-body">
          {menuAvailable && (
            <fieldset className="item-option-group">
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
                {!g.required && <span className="item-option-optional"> · facultatif</span>}
              </legend>
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
              {g.allowOther && single[g.id] === OTHER && (
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
            disabled={missingOther}
          >
            {missingOther ? 'Précisez votre choix' : `Ajouter — ${formatPrice(unit * qty)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
