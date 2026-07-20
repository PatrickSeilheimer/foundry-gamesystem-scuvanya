/**
 * Skillpunkt-Kostenformeln. Alle Funktionen sind rein und stufenbasiert:
 * costX(level) = Kosten, um GENAU diese Stufe zu erreichen (den Punkt "level" zu kaufen).
 * upgradeCost(from, to) summiert die Einzelkosten für alle Punkte zwischen from (exklusiv) und to (inklusiv).
 */

/**
 * Attribute: Punkt 1-5 kosten 6, Punkt 6 kostet 8, danach 10, 12, 15, 18, 20, 25, 30,
 * ab Punkt 14 dann in 10er-Schritten (40, 50, ...). Attribute starten bei Stufe 6 (siehe
 * SCUVANYA.attributeStartingValue) -- diese Starthöhe ist kostenlos, siehe attributeSpentCost().
 */
const ATTRIBUTE_STEP_COSTS = { 6: 8, 7: 10, 8: 12, 9: 15, 10: 18, 11: 20, 12: 25, 13: 30 };

export function attributeLevelCost(level) {
  if (level <= 5) return 6;
  if (level <= 13) return ATTRIBUTE_STEP_COSTS[level];
  return 30 + (level - 13) * 10;
}

function sumRange(from, to, levelCostFn) {
  if (to <= from) return 0;
  let total = 0;
  for (let level = from + 1; level <= to; level++) total += levelCostFn(level);
  return total;
}

export function attributeUpgradeCost(from, to) {
  return sumRange(from, to, attributeLevelCost);
}

/**
 * Kosten, um ein Attribut vom kostenlosen Startwert auf "value" zu bringen.
 *
 * "shift" ist die Summe aus Rassen-/Berufsbonus + verteilten Punkten auf dieses Attribut
 * (siehe path-resolve.mjs) -- eine Rasse mit z.B. +5 verschiebt den kostenlosen Startwert
 * von 6 auf 11: der NÄCHSTE gekaufte Punkt (12.) kostet dann den Preis für Stufe 12 (absolut),
 * nicht den Preis für Stufe 7 (der gälte, wenn man den Rassenbonus als reinen Aufschlag ohne
 * Einfluss auf die Kostenkurve behandeln würde -- ausdrücklich so gewünscht, kein DnD-artiges
 * "Bonus zählt nicht für die Kostenstufe").
 */
export function attributeSpentCost(value, startingValue, shift = 0) {
  const from = startingValue + shift;
  return attributeUpgradeCost(from, Math.max(from, value + shift));
}

/** Talente (Sozial, Wissenschaften, Körperlich, Sonder): Punkt N kostet exakt N. */
export function talentLevelCost(level) {
  return level;
}

export function talentUpgradeCost(from, to) {
  return sumRange(from, to, talentLevelCost);
}

/** Wie attributeSpentCost, aber für Talente (kostenloser Startwert ist immer 0). */
export function talentSpentCost(level, shift = 0) {
  return talentUpgradeCost(shift, Math.max(shift, level + shift));
}

/** Handwerk & Disziplinen (Kampf/Magie): Punkt 1 kostet 6, Steigung linear +2 pro Stufe. */
export function tieredLevelCost(level) {
  return 6 + 2 * (level - 1);
}

export function tieredUpgradeCost(from, to) {
  return sumRange(from, to, tieredLevelCost);
}

/** Wie attributeSpentCost, aber für Handwerk/Disziplinen (startingLevel meist 0). */
export function tieredSpentCost(level, startingLevel, shift = 0) {
  const from = startingLevel + shift;
  return tieredUpgradeCost(from, Math.max(from, level + shift));
}

/** Spezialtalente: exakt die Hälfte der Handwerk/Disziplin-Kosten. */
export function specialtyLevelCost(level) {
  return tieredLevelCost(level) / 2;
}

export function specialtyUpgradeCost(from, to) {
  return sumRange(from, to, specialtyLevelCost);
}

/** Wie attributeSpentCost, aber für Spezialtalente (startingLevel meist 1). */
export function specialtySpentCost(level, startingLevel, shift = 0) {
  const from = startingLevel + shift;
  return specialtyUpgradeCost(from, Math.max(from, level + shift));
}

/** Extra-Fähigkeiten: pauschal 10 SP, unabhängig davon welche. */
export const EXTRA_TALENT_COST = 10;
