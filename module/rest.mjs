/**
 * Einstündige Rast für die gesamte Gruppe (siehe Konversation). Jeder Client führt den Ablauf
 * NUR für die Charaktere aus, deren expliziter Besitzer der eigene Nutzer ist (nicht per
 * GM-Bypass) -- so bekommt jeder Spieler den Aktivitäts-Prompt für sein eigenes Blatt, ohne dass
 * die SL für jeden PC einen Dialog sieht. Auslösen kann jeder (SL oder Spieler); die Aktion
 * broadcastet per Socket an alle anderen Clients, führt aber lokal beim Auslöser auch direkt
 * aus (game.socket.emit erreicht den eigenen Client nicht).
 */
const SOCKET_CHANNEL = "system.scuvanya";

export function initRestSocket() {
  game.socket.on(SOCKET_CHANNEL, data => {
    if (data?.type === "startRest") runRestForOwnedActors();
  });
}

export async function requestPartyRest() {
  await ChatMessage.create({ content: `<b>${game.i18n.localize("SCUVANYA.Rest.PartyMessage")}</b>` });
  game.socket.emit(SOCKET_CHANNEL, { type: "startRest" });
  await runRestForOwnedActors();
}

/** Eigene (explizit zugewiesene) Charaktere dieses Nutzers -- ignoriert den generellen SL-Bypass. */
function _ownedCharacters() {
  return game.actors.filter(a =>
    a.type === "character" && a.ownership[game.user.id] === CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER
  );
}

async function runRestForOwnedActors() {
  for (const actor of _ownedCharacters()) {
    await applyAutomaticRestHeal(actor);
    await openRestActivityDialog(actor);
  }
}

async function applyAutomaticRestHeal(actor) {
  const hp = actor.system.resources.hp;
  const amount = Math.round(hp.max * 0.1);
  if (amount > 0) await actor.update({ "system.resources.hp.value": Math.min(hp.max, hp.value + amount) });
}

/**
 * Aktivitäts-Wahl für EINEN Charakter -- Handwerk erscheint nur, wenn mindestens ein Handwerk
 * auf Stufe >= 1 UND mit passendem Werkzeug im Besitz ausführbar ist (siehe actor.mjs
 * getUsableCraftSkills).
 */
async function openRestActivityDialog(actor) {
  const usableCrafts = actor.getUsableCraftSkills();

  const buttons = [
    { action: "meditation", label: game.i18n.localize("SCUVANYA.Rest.Meditation") },
    { action: "heal", label: game.i18n.localize("SCUVANYA.Rest.HealWounds") }
  ];
  if (usableCrafts.length) buttons.push({ action: "craft", label: game.i18n.localize("SCUVANYA.Rest.Craft") });
  buttons.push({ action: "none", label: game.i18n.localize("SCUVANYA.Rest.DoNothing") });

  const choice = await foundry.applications.api.DialogV2.wait({
    window: { title: game.i18n.format("SCUVANYA.Rest.PromptTitle", { name: actor.name }) },
    content: `<p>${game.i18n.localize("SCUVANYA.Rest.PromptHint")}</p>`,
    buttons,
    rejectClose: false
  });

  if (choice === "meditation") await performMeditation(actor);
  else if (choice === "heal") await performHealWounds(actor);
  else if (choice === "craft") await performCraft(actor, usableCrafts);
}

/** Mana += 1W20 + 2×Konzentration (Talentwert inkl. Rassen-/Item-Bonus), siehe Konversation. */
async function performMeditation(actor) {
  const skill = actor.system.talents.sonder.konzentration;
  const level = skill.level + (skill.raceBonus ?? 0) + (skill.itemBonus ?? 0);
  const roll = new Roll(`1d20 + ${2 * level}`);
  await roll.evaluate();
  await roll.toMessage({
    speaker: ChatMessage.getSpeaker({ actor }),
    flavor: game.i18n.localize("SCUVANYA.Rest.Meditation")
  });

  const mana = actor.system.resources.mana;
  await actor.update({ "system.resources.mana.value": Math.min(mana.max, mana.value + roll.total) });
}

/** Zusätzlich zur automatischen 10%-Heilung: 20% der Max-HP oben drauf. */
async function performHealWounds(actor) {
  const hp = actor.system.resources.hp;
  const amount = Math.round(hp.max * 0.2);
  await actor.update({ "system.resources.hp.value": Math.min(hp.max, hp.value + amount) });
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: game.i18n.format("SCUVANYA.Rest.HealWoundsMessage", { name: actor.name, amount })
  });
}

/** Wähle ggf. zwischen mehreren ausführbaren Handwerken, dann derselbe Wurf wie ein Klick auf das Talent. */
async function performCraft(actor, usableCrafts) {
  let key = usableCrafts[0]?.key;
  if (usableCrafts.length > 1) {
    key = await foundry.applications.api.DialogV2.wait({
      window: { title: game.i18n.localize("SCUVANYA.Rest.ChooseCraft") },
      content: "",
      buttons: usableCrafts.map(c => ({ action: c.key, label: game.i18n.localize(`SCUVANYA.Skill.${c.key}`) })),
      rejectClose: false
    });
  }
  if (key) await actor.rollHandwerkSkill(key);
}
