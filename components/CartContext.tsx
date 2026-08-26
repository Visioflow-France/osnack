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
import type { SelectedOption } from '@/lib/options';

/**
 * Panier de la commande en ligne — état client pur, persisté en localStorage.
 * Aucune lecture Firestore : le panier vit entre les pages, le checkout relit
 * la carte via /api/menu (cache ISR) et recalcule les prix à la soumission.
 */

const STORAGE_KEY = 'osnack.cart.v1';
const MAX_LINES = 40;
export const MAX_QTY = 30;

/** Une ligne = une configuration précise d'un article (variante + options). */
export interface CartLine {
  /** productId | variant | options triées — deux configs coexistent. */
  key: string;
  productId: string;
  productName: string;
  variant: 'seul' | 'menu';
  options: SelectedOption[];
  qty: number;
  /** Cache d'affichage — TOUJOURS recalculé au checkout contre la carte. */
  unitPrice: number;
}

export function lineKey(
  productId: string,
  variant: 'seul' | 'menu',
  options: SelectedOption[],
): string {
  const labels = options.map((o) => o.label).sort().join(',');
  return `${productId}|${variant}|${labels}`;
}

interface CartContextValue {
  lines: CartLine[];
  /** True une fois le localStorage relu (évite le flash/mismatch SSR). */
  ready: boolean;
  /** Nombre total d'articles (Σ qty). */
  count: number;
  /** Total estimé (caches unitPrice) — recalculé au checkout. */
  total: number;
  addLine: (line: Omit<CartLine, 'key'>) => void;
  setQty: (key: string, qty: number) => void;
  removeLine: (key: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

/** Valide une ligne chargée du localStorage (shape, bornes). */
function sanitize(line: unknown): CartLine | null {
  if (typeof line !== 'object' || line === null) return null;
  const l = line as Partial<CartLine>;
  if (
    typeof l.key !== 'string' ||
    typeof l.productId !== 'string' ||
    typeof l.productName !== 'string' ||
    (l.variant !== 'seul' && l.variant !== 'menu') ||
    !Array.isArray(l.options) ||
    typeof l.qty !== 'number' ||
    typeof l.unitPrice !== 'number'
  ) {
    return null;
  }
  const options = l.options.filter(
    (o) =>
      o != null &&
      typeof o.label === 'string' &&
      typeof o.price === 'number' &&
      typeof o.groupId === 'string' &&
      typeof o.groupLabel === 'string',
  );
  return {
    key: l.key,
    productId: l.productId,
    productName: l.productName,
    variant: l.variant,
    options,
    qty: Math.min(MAX_QTY, Math.max(1, Math.round(l.qty))),
    unitPrice: l.unitPrice,
  };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  // Chargement en useEffect (jamais pendant le rendu → pas de mismatch SSR).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setLines(parsed.map(sanitize).filter(Boolean).slice(0, MAX_LINES) as CartLine[]);
        }
      }
    } catch {
      // localStorage indisponible (mode privé…) → panier mémoire de session.
    }
    setReady(true);
  }, []);

  // Persistance silencieuse à chaque changement.
  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // Silencieux : le panier reste en mémoire pour la session.
    }
  }, [lines, ready]);

  const addLine = useCallback((line: Omit<CartLine, 'key'>) => {
    const key = lineKey(line.productId, line.variant, line.options);
    setLines((prev) => {
      const existing = prev.find((l) => l.key === key);
      if (existing) {
        return prev.map((l) =>
          l.key === key
            ? { ...l, qty: Math.min(MAX_QTY, l.qty + line.qty) }
            : l,
        );
      }
      return [...prev, { ...line, key }].slice(-MAX_LINES);
    });
  }, []);

  const setQty = useCallback((key: string, qty: number) => {
    setLines((prev) =>
      qty <= 0
        ? prev.filter((l) => l.key !== key)
        : prev.map((l) =>
            l.key === key ? { ...l, qty: Math.min(MAX_QTY, Math.round(qty)) } : l,
          ),
    );
  }, []);

  const removeLine = useCallback((key: string) => {
    setLines((prev) => prev.filter((l) => l.key !== key));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartContextValue>(() => {
    const count = lines.reduce((sum, l) => sum + l.qty, 0);
    const total = Math.round(lines.reduce((sum, l) => sum + l.unitPrice * l.qty, 0) * 100) / 100;
    return { lines, ready, count, total, addLine, setQty, removeLine, clear };
  }, [lines, ready, addLine, setQty, removeLine, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart doit être utilisé dans <CartProvider>');
  return ctx;
}
