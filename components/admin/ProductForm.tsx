'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import {
  CATEGORY_LABELS,
  type Category,
  type Product,
} from '@/lib/menu';
import { createProduct, updateProduct } from '@/lib/products';
import { deleteDishImageByUrl, uploadDishImage } from '@/lib/storage';

const CATS: Category[] = [
  'sandwichs',
  'burgers',
  'menus',
  'crepes',
  'texmex',
  'desserts',
  'boissons',
];

const FALLBACK_IMG =
  'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80';

interface Props {
  initial?: Product;
  onClose: () => void;
}

export function ProductForm({ initial, onClose }: Props) {
  const [name, setName] = useState(initial?.name ?? '');
  const [desc, setDesc] = useState(initial?.desc ?? '');
  const [category, setCategory] = useState<Category>(initial?.category ?? 'sandwichs');
  const [price, setPrice] = useState(initial ? String(initial.price) : '');
  const [priceMenu, setPriceMenu] = useState(
    initial?.priceMenu != null ? String(initial.priceMenu) : '',
  );
  const [promoPrice, setPromoPrice] = useState(
    initial?.promoPrice != null ? String(initial.promoPrice) : '',
  );
  const [image, setImage] = useState(initial?.image ?? '');
  const [tag, setTag] = useState(initial?.tag ?? '');
  const [note, setNote] = useState(initial?.note ?? '');
  const [available, setAvailable] = useState(initial?.available !== false);
  const [bestseller, setBestseller] = useState(initial?.bestseller === true);
  const [order, setOrder] = useState(initial?.order != null ? String(initial.order) : '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const isEdit = Boolean(initial);

  /**
   * Choisir une photo locale → compression WebP (≤ 800 px, q80, < 150 Ko)
   * → upload Storage. L'ancienne image Firebase est supprimée juste après
   * l'enregistrement réussi du plat (voir handleSubmit).
   */
  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const url = await uploadDishImage(initial?.id ?? `nouveau-${Date.now()}`, file);
      setImage(url);
    } catch (err) {
      console.error(err);
      setError("Échec de l'upload image. Firebase Storage est-il activé ?");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const basePrice = Number(price);
    if (!name.trim()) return setError('Le nom est obligatoire.');
    if (!Number.isFinite(basePrice) || basePrice < 0) return setError('Prix invalide.');

    const promo = promoPrice.trim() === '' ? null : Number(promoPrice);
    if (promo != null && (!Number.isFinite(promo) || promo < 0))
      return setError('Prix promo invalide.');

    const menu = priceMenu.trim() === '' ? null : Number(priceMenu);
    if (menu != null && (!Number.isFinite(menu) || menu < 0))
      return setError('Prix menu invalide.');

    const data: Omit<Product, 'id'> = {
      name: name.trim(),
      desc: desc.trim(),
      category,
      price: Math.round(basePrice * 100) / 100,
      priceMenu: menu != null ? Math.round(menu * 100) / 100 : null,
      promoPrice: promo != null ? Math.round(promo * 100) / 100 : null,
      image: image.trim() || FALLBACK_IMG,
      tag: tag.trim() || undefined,
      note: note.trim() || undefined,
      available,
      bestseller,
      order: order.trim() === '' ? undefined : Number(order),
    };

    setSaving(true);
    try {
      // Nettoyage : si la photo a changé, supprimer l'ancienne dans Storage
      // (uniquement si elle nous appartenait — les URLs externes sont ignorées).
      const oldImage = initial?.image;
      const imageChanged =
        oldImage && oldImage !== data.image && oldImage !== FALLBACK_IMG;

      if (initial) {
        await updateProduct(initial.id, data);
      } else {
        await createProduct(data);
      }
      if (imageChanged) await deleteDishImageByUrl(oldImage);
      onClose();
    } catch (err) {
      console.error(err);
      setError("Échec de l'enregistrement. Firebase est-il configuré ?");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-head">
          <h2>{isEdit ? 'Modifier le plat' : 'Nouveau plat'}</h2>
          <button className="admin-x" onClick={onClose} aria-label="Fermer">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="admin-preview">
            <Image
              src={image.trim() || FALLBACK_IMG}
              alt="Aperçu"
              fill
              sizes="120px"
              unoptimized
            />
          </div>

          <label className="admin-field">
            <span>Photo du plat (WebP compressé automatiquement)</span>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFile}
              disabled={uploading || saving}
            />
          </label>
          <p className="admin-hint">
            Compression automatique : WebP, 800 px max, ~150 Ko max. L&apos;ancienne
            photo est supprimée de Firebase Storage lors du remplacement.
          </p>

          <label className="admin-field">
            <span>— ou Image (URL)</span>
            <input
              type="url"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://…"
            />
          </label>

          <label className="admin-field">
            <span>Nom *</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Grec" />
          </label>

          <label className="admin-field">
            <span>Description</span>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={3}
              placeholder="Ingrédients, garniture…"
            />
          </label>

          <div className="admin-row">
            <label className="admin-field">
              <span>Catégorie</span>
              <select value={category} onChange={(e) => setCategory(e.target.value as Category)}>
                {CATS.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
            </label>

            <label className="admin-field">
              <span>Prix (€) *</span>
              <input
                type="number"
                step="0.1"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="8,50"
              />
            </label>
          </div>

          <div className="admin-row">
            <label className="admin-field">
              <span>Prix menu (€)</span>
              <input
                type="number"
                step="0.1"
                min="0"
                value={priceMenu}
                onChange={(e) => setPriceMenu(e.target.value)}
                placeholder="Formule menu (ex. 7,50)"
              />
            </label>

            <label className="admin-field">
              <span>Prix promo (€)</span>
              <input
                type="number"
                step="0.1"
                min="0"
                value={promoPrice}
                onChange={(e) => setPromoPrice(e.target.value)}
                placeholder="Laisser vide = pas de promo"
              />
            </label>
          </div>

          <div className="admin-row">
            <label className="admin-field">
              <span>Badge / tag</span>
              <input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="Signature, Gourmet…" />
            </label>

            <label className="admin-field">
              <span>Note</span>
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Accompagné de sauce maison…" />
            </label>
          </div>

          <div className="admin-row">
            <label className="admin-field">
              <span>Ordre d’affichage</span>
              <input
                type="number"
                min="0"
                value={order}
                onChange={(e) => setOrder(e.target.value)}
                placeholder="plus bas = en premier"
              />
            </label>

            <label className="admin-check">
              <input
                type="checkbox"
                checked={available}
                onChange={(e) => setAvailable(e.target.checked)}
              />
              <span>Visible sur le site</span>
            </label>

            <label className="admin-check">
              <input
                type="checkbox"
                checked={bestseller}
                onChange={(e) => setBestseller(e.target.checked)}
              />
              <span>★ Best Seller (page d&apos;accueil)</span>
            </label>
          </div>

          {error && <div className="admin-error">{error}</div>}

          <div className="admin-actions">
            <button type="button" className="admin-btn ghost" onClick={onClose} disabled={saving}>
              Annuler
            </button>
            <button type="submit" className="admin-btn solid" disabled={saving || uploading}>
              {uploading
                ? 'Compression de l’image…'
                : saving
                  ? 'Enregistrement…'
                  : isEdit
                    ? 'Enregistrer'
                    : 'Créer le plat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
