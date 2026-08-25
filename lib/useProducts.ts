'use client';

import { useEffect, useState } from 'react';
import { MENU, type Product } from './menu';

/**
 * Menu public — chargé UNE SEULE FOIS.
 *
 * ⚠️ Aucun onSnapshot, aucun polling : le site public ne doit pas consommer
 * de lectures Firestore en continu (forfait Spark). Le rendu initial vient
 * du serveur (props `initial`) servi par le cache ISR de /api/menu ; ce hook
 * ne fait qu'un unique fetch de rattrapage si aucune props n'est fournie.
 * En cas d'erreur réseau, on garde le menu statique embarqué (fallback).
 */
export function useProducts(initial?: Product[]) {
  const [products, setProducts] = useState<Product[]>(initial ?? MENU);
  const [loading, setLoading] = useState(!initial);

  useEffect(() => {
    if (initial) {
      setProducts(initial);
      setLoading(false);
      return;
    }

    // Rattrapage one-shot : un seul fetch, jamais relancé (pas de polling).
    let alive = true;
    fetch('/api/menu')
      .catch(() =>
        // Réseau indisponible → fallback : menu.json embarqué dans /public.
        fetch('/menu.json').then((r) => (r.ok ? r.json() : Promise.reject(r.status))),
      )
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data: { items?: Product[] }) => {
        if (alive && Array.isArray(data.items) && data.items.length > 0) {
          setProducts(data.items);
        }
      })
      .catch((err) => {
        // Fallback silencieux : le menu statique embarqué reste affiché.
        console.warn('[menu] /api/menu indisponible, menu statique conservé :', err);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [initial]);

  return { products, loading };
}
