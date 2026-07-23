/**
 * Encounter-/Initiative-Ablauf (siehe Konversation) -- bewusst NICHT Foundrys eingebauter
 * Zug-für-Zug-Ablauf (kein "Next Turn"): die Kämpfer werden nach Initiative sortiert gelistet,
 * ein Zähler läuft von der höchsten gewürfelten Initiative bis 0 herunter. Ein Kämpfer darf
 * Aktionen ausführen, sobald der Zähler seinen gewürfelten Wert erreicht hat -- und bleibt DANN
 * für den Rest der Runde frei (keine erzwungene Reihenfolge, siehe documents/actor.mjs
 * getCombatGate/useAction). AP-Kosten und die "erreicht"-Sperre gelten nur, wenn es einen
 * aktiven Encounter gibt UND der Actor tatsächlich Kämpfer darin ist.
 *
 * Rundenwechsel (AP auffüllen, Zähler zurücksetzen) ist ein expliziter SL-Klick (startNextRound)
 * -- die Initiative wird dabei bewusst NICHT automatisch neu gewürfelt, das übernehmen die
 * Spieler selbst (rollOwnInitiative) oder die SL über die beiden Sammel-Buttons
 * (rerollNpcs/rerollCharacters), die einen bereits selbst gewürfelten Wert dieser Runde nicht
 * überschreiben.
 */
const FLAG_SCOPE = "scuvanya";

/** Aktueller Zähler-Stand -- null bedeutet "Countdown dieser Runde noch nicht gestartet". */
export function getInitCounter(combat) {
  const value = combat?.getFlag(FLAG_SCOPE, "initCounter");
  return typeof value === "number" ? value : null;
}

function highestInitiative(combat) {
  const values = combat.combatants.map(c => c.initiative).filter(v => typeof v === "number");
  return values.length ? Math.max(...values) : null;
}

/** Darf dieser Kämpfer laut Konversation Aktionen ausführen ("Init-Wert erreicht")? */
export function isCombatantReady(combatant, counter) {
  return typeof combatant?.initiative === "number" && typeof counter === "number" && combatant.initiative >= counter;
}

/** Hat noch IRGENDEIN Kämpfer mit Actor Aktionspunkte übrig (siehe Rundenende-Bedingung)? */
export function hasAnyApLeft(combat) {
  return combat.combatants.some(c => (c.actor?.system.resources?.ap?.value ?? 0) > 0);
}

/** Rundenende erreicht (Zähler bei 0 ODER niemand hat noch AP) -- signalisiert nur, startet NICHTS automatisch. */
export function isRoundOver(combat) {
  const counter = getInitCounter(combat);
  return counter === 0 || !hasAnyApLeft(combat);
}

/**
 * SL zählt eine Stufe weiter herunter. Ist die Runde noch nicht gestartet (Zähler = null),
 * initialisiert der erste Klick den Zähler auf die höchste gewürfelte Initiative -- die Runde
 * "beginnt" faktisch mit diesem Klick. Ohne jede gewürfelte Initiative gibt es nichts zu starten.
 */
export async function advanceInitCounter(combat) {
  const current = getInitCounter(combat);
  if (current === null) {
    const start = highestInitiative(combat);
    if (start === null) return;
    await combat.setFlag(FLAG_SCOPE, "initCounter", start);
    return;
  }
  await combat.setFlag(FLAG_SCOPE, "initCounter", Math.max(0, current - 1));
}

/**
 * Manueller "Nächste Runde"-Trigger -- füllt AP aller Kämpfer mit Actor auf ihr Maximum auf und
 * setzt den Zähler zurück auf "nicht gestartet". Würfelt bewusst NICHTS neu automatisch neu.
 */
export async function startNextRound(combat) {
  const updates = combat.combatants
    .map(c => {
      const ap = c.actor?.system.resources?.ap;
      return ap ? c.actor.update({ "system.resources.ap.value": ap.max }) : null;
    })
    .filter(Boolean);
  await Promise.all(updates);
  await combat.setFlag(FLAG_SCOPE, "initCounter", null);
  await combat.update({ round: combat.round + 1 });
}

/** Ein einzelner Kämpfer würfelt (Spieler selbst oder SL gezielt) -- markiert als "diese Runde gewürfelt". */
export async function rollOwnInitiative(combatant) {
  await combatant.combat.rollInitiative([combatant.id]);
  await combatant.setFlag(FLAG_SCOPE, "selfRolledRound", combatant.combat.round);
}

/** SL-Sammel-Button: alle NSC-Kämpfer neu würfeln (keine Schutzlogik nötig, NSCs würfelt immer die SL). */
export async function rerollNpcs(combat) {
  const ids = combat.combatants.filter(c => c.actor?.type === "npc").map(c => c.id);
  if (ids.length) await combat.rollInitiative(ids);
}

/**
 * SL-Sammel-Button: alle PC-Kämpfer neu würfeln -- überspringt aber jeden, der in DIESER Runde
 * bereits gezielt gewürfelt wurde (siehe rollOwnInitiative), siehe Konversation: "selber
 * gewürfelte Inits aus dieser aktuellen Runde ... nicht überschrieben werden".
 */
export async function rerollCharacters(combat) {
  const ids = combat.combatants
    .filter(c => c.actor?.type === "character" && c.getFlag(FLAG_SCOPE, "selfRolledRound") !== combat.round)
    .map(c => c.id);
  if (ids.length) await combat.rollInitiative(ids);
}

/**
 * Kampf-Freigabe für documents/actor.mjs useAction: außerhalb eines aktiven Encounters (oder
 * wenn der Actor gar nicht Kämpfer darin ist) gibt es weder Einschränkung noch AP-Kosten (siehe
 * Konversation). Innerhalb muss der Kämpfer "erreicht" sein (siehe isCombatantReady).
 */
export function getCombatGate(actor) {
  const combat = game.combat;
  const combatant = combat?.combatants.find(c => c.actor?.id === actor.id);
  if (!combat || !combatant) return { inCombat: false, ready: true, combatant: null };
  return { inCombat: true, ready: isCombatantReady(combatant, getInitCounter(combat)), combatant };
}
