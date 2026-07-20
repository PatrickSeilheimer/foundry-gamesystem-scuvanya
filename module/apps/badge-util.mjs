/**
 * Bonus-Badges im Rarity-Stil (wie Item-Seltenheit in Loot-Systemen), je höher der Bonus
 * desto auffälliger die Badge -- Stufe 1-4 "gewöhnlich -> episch", 5-6 "episch" mit Funken/
 * Flamme (nur Talente/Wahlmöglichkeiten mit Bonus > 4 erreichen das). Boni <= 0 bleiben
 * neutral/gedämpft, es gibt bewusst keine "Malus"-Färbung (Rot ist für +5/+6 reserviert,
 * nicht für Negatives). Ursprünglich aus der Angular-Charaktererstellung von app.scuvanya.online
 * übernommen (dort: bonus-badge.util.ts) und 1:1 auf Handlebars/Vanilla-CSS portiert.
 */

export function signedBonus(n) {
  return n >= 0 ? `+${n}` : `${n}`;
}

export function bonusTier(n) {
  if (n <= 0) return 0;
  return Math.min(Math.round(n), 6);
}

export function badgeText(chip) {
  return chip.binaer ? chip.label : `${chip.label} ${signedBonus(chip.bonus)}`;
}

export function badgeClasses(chip, talent = false) {
  const classes = ["scv-badge"];
  if (talent) classes.push("scv-badge--talent");

  if (chip.binaer) {
    classes.push("scv-badge--special");
  } else {
    const t = bonusTier(chip.bonus);
    classes.push(`scv-badge--tier${t}`);
    if (t === 6) classes.push("scv-badge--flame");
  }

  return classes.join(" ");
}

/**
 * Inline-Styles für die Glutfunken der Epic-Badge (Stufe 5/6, .scv-ember in scuvanya.css).
 * Position, Timing und Drift unterscheiden sich leicht, damit das Sprühen organisch statt
 * synchron wirkt -- CSS blendet sie außer bei --tier5/--tier6 ohnehin aus.
 */
export const EMBER_STYLES = [
  "left: 12%; --ember-drift: -6px; animation-duration: 1.1s; animation-delay: 0s;",
  "left: 28%; --ember-drift: 4px;  animation-duration: 1.4s; animation-delay: 0.3s;",
  "left: 46%; --ember-drift: -3px; animation-duration: 0.9s; animation-delay: 0.55s;",
  "left: 63%; --ember-drift: 6px;  animation-duration: 1.6s; animation-delay: 0.15s;",
  "left: 79%; --ember-drift: -5px; animation-duration: 1.2s; animation-delay: 0.75s;",
  "left: 92%; --ember-drift: 3px;  animation-duration: 1s;   animation-delay: 0.4s;"
];

/** Baut ein renderfertiges Badge-Objekt (Klassen + Text vorab berechnet) für ein Handlebars-Template. */
export function buildBadge(chip, talent = false) {
  return { cssClass: badgeClasses(chip, talent), text: badgeText(chip) };
}
