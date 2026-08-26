/**
 * ── Horaires de service & créneaux de retrait ────────────────────────────────
 *
 * Source unique des horaires (Hero et Footer affichent les mêmes plages).
 * Les plages sont en « minutes depuis minuit du jour de service » : la plage
 * du soir se termine à 25h00 = 1500 min, soit 01h00 du lendemain — le franchi-
 * sement de minuit est donc de l'arithmétique de dates native. Le changement
 * d'heure FR a toujours lieu entre 02h et 03h, jamais dans une plage.
 */

export interface ServiceRange {
  /** Minutes depuis minuit (ex. 690 = 11h30). */
  start: number;
  /** Minutes depuis minuit, peut dépasser 1440 (1500 = 01h00 le lendemain). */
  end: number;
}

/** Plages de service quotidiennes : 11h30–14h30 et 18h00–01h00. */
export const SERVICE_RANGES: ServiceRange[] = [
  { start: 11 * 60 + 30, end: 14 * 60 + 30 },
  { start: 18 * 60, end: 25 * 60 },
];

/** Estimation affichée pour un retrait « dès que possible ». */
export const ASAP_LEAD_MINUTES = 20;
/** Délai plancher avant le premier créneau programmable du jour. */
export const MIN_SCHEDULE_LEAD_MINUTES = 15;
/** Dernier créneau = fermeture − 30 min (temps de préparation). */
export const LAST_SLOT_MARGIN = 30;
/** Horizon de planification des créneaux (jours). */
export const SCHEDULE_HORIZON_DAYS = 7;
/** Pas des créneaux (minutes, alignés sur :00/:15/:30/:45). */
export const SLOT_STEP_MINUTES = 15;

/** Un créneau de retrait programmable. */
export interface PickupSlot {
  /** ms epoch du retrait. */
  at: number;
  /** Date du retrait au format YYYY-MM-DD (clé de groupement). */
  dayKey: string;
  /** « Aujourd'hui », « Demain » ou « ven. 29/08 ». */
  dayLabel: string;
  /** Heure « 19:45 ». */
  label: string;
}

const minutesSinceMidnight = (d: Date) => d.getHours() * 60 + d.getMinutes();
const startOfDay = (d: Date) => {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c.getTime();
};
const alignUp = (m: number) => Math.ceil(m / SLOT_STEP_MINUTES) * SLOT_STEP_MINUTES;

/** Plage ouverte à l'instant `now` ? (gère l'après-minuit de la plage soir.) */
export function isOpenNow(now: Date): boolean {
  const m = minutesSinceMidnight(now);
  const inRanges = (mm: number) => SERVICE_RANGES.some((r) => mm >= r.start && mm < r.end);
  return inRanges(m) || inRanges(m + 1440); // +1440 : vue « journée d'hier »
}

/** Minutes restantes avant fermeture, ou null si fermé. */
export function minutesBeforeClose(now: Date): number | null {
  const m = minutesSinceMidnight(now);
  for (const offset of [0, 1440]) {
    const mm = m + offset;
    for (const r of SERVICE_RANGES) {
      if (mm >= r.start && mm < r.end) return r.end - mm;
    }
  }
  return null;
}

/**
 * Le service va-t-il fermer trop tôt pour un retrait ASAP ?
 * (fermeture imminente = moins de ASAP_LEAD + 5 min de marge).
 */
export function closesSoon(
  now: Date,
  withinMin: number = ASAP_LEAD_MINUTES + 5,
): boolean {
  const remaining = minutesBeforeClose(now);
  return remaining != null && remaining <= withinMin;
}

const dayKeyOf = (at: number) => {
  const d = new Date(at);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const dayLabelOf = (at: number, now: Date): string => {
  const days = Math.round((startOfDay(new Date(at)) - startOfDay(now)) / 86400000);
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return 'Demain';
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(at));
};

/**
 * Créneaux de retrait programmables, du plus proche au plus lointain (≤ 7 j).
 * Chaque plage génère des créneaux de 15 min alignés, jusqu'à 30 min avant la
 * fermeture ; aujourd'hui, seuls les créneaux à +15 min minimum sont retenus.
 * La plage soir du jour J−1 est incluse pour couvrir l'après-minuit.
 */
export function nextSlots(now: Date): PickupSlot[] {
  const minAt = now.getTime() + MIN_SCHEDULE_LEAD_MINUTES * 60000;
  const maxAt = startOfDay(now) + (SCHEDULE_HORIZON_DAYS + 1) * 86400000;
  const slots: PickupSlot[] = [];

  for (let dayOffset = -1; dayOffset <= SCHEDULE_HORIZON_DAYS; dayOffset++) {
    const dayStart = startOfDay(now) + dayOffset * 86400000; // jour de SERVICE
    for (const r of SERVICE_RANGES) {
      const lastSlot = r.end - LAST_SLOT_MARGIN;
      for (let t = alignUp(r.start); t <= lastSlot; t += SLOT_STEP_MINUTES) {
        const at = dayStart + t * 60000;
        if (at < minAt || at > maxAt) continue;
        slots.push({
          at,
          dayKey: dayKeyOf(at),
          dayLabel: dayLabelOf(at, now),
          label: new Intl.DateTimeFormat('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
          }).format(new Date(at)),
        });
      }
    }
  }

  slots.sort((a, b) => a.at - b.at);
  return slots;
}

/** Libellé lisible d'un mode de retrait (affichage admin & confirmation). */
export function formatPickup(
  pickup: { mode: 'asap' | 'scheduled'; at?: number },
  now: Date = new Date(),
): string {
  if (pickup.mode === 'asap') return `Dès que possible (~${ASAP_LEAD_MINUTES} min)`;
  if (!pickup.at) return 'Programmé';
  const d = new Date(pickup.at);
  const day = dayLabelOf(pickup.at, now);
  const time = new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
  return day === "Aujourd'hui" ? time : `${day} · ${time}`;
}
