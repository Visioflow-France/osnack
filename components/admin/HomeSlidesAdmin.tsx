'use client';

import { useState } from 'react';
import Image from 'next/image';
import { FILTER_LABELS } from '@/lib/menu';
import { updateSlide, type CategorySlide } from '@/lib/slides';
import { useSlides } from '@/lib/useSlides';

const FALLBACK_IMG =
  'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80';

/**
 * Onglet « Accueil » du dashboard : édition du carrousel de catégories de la
 * page d'accueil. Titre et image sont modifiables pour chaque slide ; la
 * catégorie ciblée par le bouton « Découvrir » est fixe (clé du slide).
 */
export function HomeSlidesAdmin() {
  const { slides } = useSlides();

  return (
    <>
      <div className="admin-toolbar">
        <div>
          <h1>Carrousel d&apos;accueil</h1>
          <p className="admin-sub">
            Les grandes catégories qui défilent sur la page d&apos;accueil. Titre
            et image modifiables — la catégorie ciblée par « Découvrir » reste
            fixe.
          </p>
        </div>
      </div>

      <div className="admin-slides">
        {slides.map((slide) => (
          <SlideEditor key={slide.id} slide={slide} />
        ))}
      </div>
    </>
  );
}

function SlideEditor({ slide }: { slide: CategorySlide }) {
  const [title, setTitle] = useState(slide.title);
  const [image, setImage] = useState(slide.image);
  const [status, setStatus] = useState<'idle' | 'saving' | 'ok' | 'err'>('idle');

  const dirty = title !== slide.title || image !== slide.image;

  async function save() {
    if (!title.trim() || !image.trim()) {
      setStatus('err');
      return;
    }
    setStatus('saving');
    try {
      await updateSlide(slide.id, { title: title.trim(), image: image.trim() });
      setStatus('ok');
    } catch (err) {
      console.error(err);
      setStatus('err');
    }
  }

  return (
    <div className="admin-slide-card">
      <div className="admin-slide-head">
        <strong>{FILTER_LABELS[slide.id]}</strong>
        <span
          className="admin-slide-target"
          title="Catégorie ciblée par le bouton « Découvrir » (fixe)"
        >
          /carte?cat={slide.id}
        </span>
      </div>

      <div className="admin-preview">
        <Image
          src={image.trim() || FALLBACK_IMG}
          alt={`Aperçu — ${title}`}
          fill
          sizes="360px"
          unoptimized
        />
      </div>

      <label className="admin-field">
        <span>Titre affiché</span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nos Menus Sandwich"
        />
      </label>

      <label className="admin-field">
        <span>URL de l&apos;image</span>
        <input
          type="url"
          value={image}
          onChange={(e) => setImage(e.target.value)}
          placeholder="https://images.unsplash.com/photo-…"
        />
      </label>

      <div className="admin-slide-foot">
        <span
          className={`admin-slide-status ${status === 'ok' ? 'ok' : ''} ${status === 'err' ? 'err' : ''}`}
          aria-live="polite"
        >
          {status === 'saving' && 'Enregistrement…'}
          {status === 'ok' && '✓ Enregistré'}
          {status === 'err' && 'Erreur — titre et image obligatoires.'}
        </span>
        <button
          className="admin-btn solid sm"
          onClick={save}
          disabled={!dirty || status === 'saving'}
        >
          {status === 'saving' ? '…' : 'Enregistrer'}
        </button>
      </div>
    </div>
  );
}
