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

/** Kosten, um ein Attribut vom kostenlosen Startwert (6) auf "value" zu bringen. */
export function attributeSpentCost(value, startingValue) {
  return attributeUpgradeCost(startingValue, Math.max(startingValue, value));
}

/** Talente (Sozial, Wissenschaften, Körperlich, Sonder): Punkt N kostet exakt N. */
export function talentLevelCost(level) {
  return level;
}

export function talentUpgradeCost(from, to) {
  return sumRange(from, to, talentLevelCost);
}

/** Handwerk & Disziplinen (Kampf/Magie): Punkt 1 kostet 6, Steigung linear +2 pro Stufe. */
export function tieredLevelCost(level) {
  return 6 + 2 * (level - 1);
}

export function tieredUpgradeCost(from, to) {
  return sumRange(from, to, tieredLevelCost);
}

/** Spezialtalente: exakt die Hälfte der Handwerk/Disziplin-Kosten. */
export function specialtyLevelCost(level) {
  return tieredLevelCost(level) / 2;
}

export function specialtyUpgradeCost(from, to) {
  return sumRange(from, to, specialtyLevelCost);
}

/** Extra-Fähigkeiten: pauschal 10 SP, unabhängig davon welche. */
export const EXTRA_TALENT_COST = 10;
