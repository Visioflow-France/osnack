'use client';

import { useEffect, useState } from 'react';
import {
  DEFAULT_SITE_LINKS,
  resetSiteLink,
  saveSiteLinks,
  SITE_LINK_FIELDS,
  type SiteLinks,
} from '@/lib/siteSettings';
import { useSiteLinks } from '@/lib/useSiteLinks';

/**
 * Onglet « Liens & réseaux » du dashboard : URLs des réseaux sociaux et des
 * plateformes de commande (Uber Eats, Deliveroo). Les valeurs vides
 * retombent sur les défauts de lib/links.ts ; un champ « modifié » peut être
 * réinitialisé d'un clic. Sauvegarde instantanée sur tout le site (doc
 * unique site_settings/links + écoute temps réel).
 */
export function SiteLinksAdmin() {
  const { links, loading } = useSiteLinks();
  const [draft, setDraft] = useState<SiteLinks | null>(null);
  const [status, setStatus] = useState<'idle' | 'saving' | 'ok' | 'err'>('idle');
  const [error, setError] = useState<string | null>(null);

  // Première livraison de la souscription → préremplissage (sans écraser la saisie).
  useEffect(() => {
    if (!loading && draft === null) setDraft({ ...links });
  }, [loading, links, draft]);

  if (!draft) {
    return <div className="admin-empty">Connexion à Firestore…</div>;
  }
  // Capture non-null pour les closures (save/reset) — le formulaire n'est
  // rendu qu'une fois le brouillon prêt.
  const current = draft;

  const dirty = SITE_LINK_FIELDS.some((f) => current[f.key] !== links[f.key]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    // Validation : toute URL saisie doit être http(s) — évite les liens morts.
    const invalid = SITE_LINK_FIELDS.filter(
      (f) =>
        current[f.key].trim() !== '' &&
        !/^https?:\/\/.+/i.test(current[f.key].trim()),
    );
    if (invalid.length > 0) {
      setError(
        `URL invalide pour : ${invalid.map((f) => f.label).join(', ')} — elle doit commencer par https://`,
      );
      setStatus('err');
      return;
    }
    setStatus('saving');
    try {
      await saveSiteLinks(current);
      setStatus('ok');
    } catch (err) {
      console.error(err);
      setError("Échec de l'enregistrement. Vérifiez la connexion.");
      setStatus('err');
    }
  }

  async function reset(key: keyof SiteLinks) {
    setError(null);
    try {
      await resetSiteLink(key);
      setDraft({ ...current, [key]: DEFAULT_SITE_LINKS[key] });
      setStatus('ok');
    } catch (err) {
      console.error(err);
      setStatus('err');
    }
  }

  return (
    <>
      <div className="admin-toolbar">
        <div>
          <h1>Liens &amp; réseaux sociaux</h1>
          <p className="admin-sub">
            URL des boutons réseaux sociaux et plateformes de commande (pied de
            page, accueil, barre de navigation). Champ vide = valeur par défaut
            du site. Changements visibles immédiatement.
          </p>
        </div>
      </div>

      <form className="admin-card admin-links" onSubmit={save}>
        {SITE_LINK_FIELDS.map((field) => {
          const overridden = links[field.key] !== DEFAULT_SITE_LINKS[field.key];
          return (
            <div className="admin-links-row" key={field.key}>
              <label className="admin-field">
                <span>
                  {field.label}
                  {overridden && (
                    <em
                      className="admin-links-flag"
                      title={`Valeur par défaut : ${DEFAULT_SITE_LINKS[field.key]}`}
                    >
                      modifié
                    </em>
                  )}
                </span>
                <input
                  type="url"
                  value={current[field.key]}
                  onChange={(e) => {
                    setStatus('idle');
                    setError(null);
                    setDraft({ ...draft, [field.key]: e.target.value });
                  }}
                  placeholder={field.placeholder}
                  spellCheck={false}
                />
              </label>
              <div className="admin-links-actions">
                <a
                  className="admin-btn ghost sm"
                  href={current[field.key].trim() || '#'}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Ouvrir le lien ${field.label}`}
                >
                  Ouvrir ↗
                </a>
                {overridden && (
                  <button
                    type="button"
                    className="admin-btn ghost sm"
                    onClick={() => reset(field.key)}
                    title={`Revenir à la valeur par défaut : ${DEFAULT_SITE_LINKS[field.key]}`}
                  >
                    Défaut ↺
                  </button>
                )}
              </div>
            </div>
          );
        })}

        <div className="admin-slide-foot">
          <span
            className={`admin-slide-status ${status === 'ok' ? 'ok' : ''} ${status === 'err' ? 'err' : ''}`}
            aria-live="polite"
          >
            {status === 'saving' && 'Enregistrement…'}
            {status === 'ok' && !error && '✓ Enregistré — visible sur le site'}
            {status === 'err' && (error ?? 'Erreur — réessayez.')}
          </span>
          <button
            type="submit"
            className="admin-btn solid sm"
            disabled={!dirty || status === 'saving'}
          >
            {status === 'saving' ? '…' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </>
  );
}
