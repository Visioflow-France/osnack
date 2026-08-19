'use client';

import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  createLoyaltyCode,
  pointsForAmount,
  subscribeLoyaltyCodes,
  type LoyaltyCode,
} from '@/lib/loyalty';

/**
 * Onglet « Fidélité » de l'admin : après chaque commande (téléphone, sur
 * place), le restaurant saisit le montant, génère un code et le remet au
 * client (ticket, SMS…). Le client le saisit dans son compte pour être
 * crédité. La liste suit les codes en temps réel (utilisé / disponible).
 */
export function LoyaltyAdmin({ user }: { user: User }) {
  const [codes, setCodes] = useState<LoyaltyCode[]>([]);
  const [amountEur, setAmountEur] = useState('');
  const [lastCode, setLastCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => subscribeLoyaltyCodes(setCodes), []);

  const amount = Number(amountEur.replace(',', '.'));
  const valid = Number.isFinite(amount) && amount > 0;

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCopied(false);
    if (!valid) {
      setError('Saisissez un montant valide (ex. 12,50).');
      return;
    }
    setBusy(true);
    try {
      const code = await createLoyaltyCode(pointsForAmount(amount), {
        amountEur: amount,
        createdBy: user.email ?? undefined,
      });
      setLastCode(code);
    } catch (err) {
      console.error(err);
      setError('Impossible de créer le code. Vérifiez la connexion.');
    } finally {
      setBusy(false);
    }
  }

  async function copyLast() {
    if (!lastCode) return;
    try {
      await navigator.clipboard.writeText(lastCode);
      setCopied(true);
    } catch {
      // presse-papier indisponible (contexte non sécurisé) : silencieux
    }
  }

  const available = codes.filter((c) => c.status === 'available').length;

  return (
    <div className="admin-loyalty">
      <div className="admin-toolbar">
        <div>
          <h1>Programme fidélité</h1>
          <p className="admin-sub">
            Générez un code après chaque commande — le client le saisit dans
            son compte pour recevoir ses points (1 € = 1 point).
          </p>
        </div>
      </div>

      <div className="admin-stats">
        <div className="admin-stat">
          <div className="admin-stat-num">{codes.length}</div>
          <div className="admin-stat-label">Codes générés</div>
        </div>
        <div className="admin-stat">
          <div className="admin-stat-num">{available}</div>
          <div className="admin-stat-label">Disponibles</div>
        </div>
        <div className="admin-stat">
          <div className="admin-stat-num">
            {codes.filter((c) => c.status === 'redeemed').length}
          </div>
          <div className="admin-stat-label">Utilisés</div>
        </div>
      </div>

      <form className="admin-loyalty-form" onSubmit={generate}>
        <label className="admin-field">
          <span>Montant de la commande (€)</span>
          <input
            type="text"
            inputMode="decimal"
            value={amountEur}
            onChange={(e) => setAmountEur(e.target.value)}
            placeholder="12,50"
            required
          />
        </label>
        <div className="admin-loyalty-preview">
          {valid
            ? `→ ${pointsForAmount(amount)} points pour le client`
            : '→ 1 € = 1 point'}
        </div>
        <button type="submit" className="admin-btn solid" disabled={busy}>
          {busy ? 'Génération…' : 'Générer le code'}
        </button>
        {error && <div className="admin-error">{error}</div>}
      </form>

      {lastCode && (
        <div className="admin-loyalty-result">
          <div>
            <small>Code à remettre au client</small>
            <strong className="admin-loyalty-code">{lastCode}</strong>
          </div>
          <button className="admin-btn ghost" onClick={copyLast}>
            {copied ? 'Copié ✓' : 'Copier'}
          </button>
        </div>
      )}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Montant</th>
              <th>Points</th>
              <th>Statut</th>
              <th>Créé le</th>
            </tr>
          </thead>
          <tbody>
            {codes.map((c) => (
              <tr key={c.code}>
                <td className="cell-code">{c.code}</td>
                <td>{c.amountEur != null ? `${c.amountEur.toFixed(2)} €` : '—'}</td>
                <td>{c.points} pts</td>
                <td>
                  <span className={`admin-pill ${c.status === 'redeemed' ? 'on' : c.status === 'cancelled' ? 'off' : 'promo'}`}>
                    {c.status === 'redeemed'
                      ? 'Utilisé'
                      : c.status === 'cancelled'
                        ? 'Annulé'
                        : 'Disponible'}
                  </span>
                </td>
                <td>{new Date(c.createdAt).toLocaleString('fr-FR')}</td>
              </tr>
            ))}
            {codes.length === 0 && (
              <tr>
                <td colSpan={5} className="admin-empty">
                  Aucun code généré pour le moment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
