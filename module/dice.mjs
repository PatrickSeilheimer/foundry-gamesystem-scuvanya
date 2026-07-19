import { SCUVANYA } from "./config.mjs";

/**
 * Baut die Würfelformel für Handwerk/Spezial: Stufenwürfel (W4-W12), offen explodierend
 * (bestätigt: wiederholt sich bei jedem erneuten Maximalwurf, siehe "x"-Modifier).
 * Stufe 0 ("untrained") liefert null -- der Aufrufer muss diesen Fall behandeln.
 */
export function tieredSkillFormula(level) {
  const die = SCUVANYA.tieredDieSteps[level];
  if (!die) return null;
  return `1${die}x`;
}

/**
 * Führt einen Standardwurf (W20 + Bonus) aus und sendet ihn als Chat-Nachricht.
 * @param {Actor} actor
 * @param {string} formula   Rollformel, z.B. "1d20 + 3"
 * @param {string} flavor    Beschriftung in der Chatnachricht
 */
export async function rollToChat(actor, formula, flavor) {
  const roll = new Roll(formula, actor.getRollData());
  await roll.evaluate();
  await roll.toMessage({
    speaker: ChatMessage.getSpeaker({ actor }),
    flavor
  });
  return roll;
}
