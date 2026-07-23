/**
 * Wenn sich Max-HP/-Mana/-MG eines Charakters ändern (Attributkauf, Rasse/Beruf hinzufügen/
 * entfernen/bearbeiten, Ausrüstung an-/ausziehen), muss derselbe Betrag auch auf den AKTUELLEN
 * Wert gerechnet werden (siehe Konversation) -- sonst würde z.B. ein Konstitutions-Zuwachs den
 * Charakter relativ zu seinem neuen Maximum ärmer dastehen lassen, statt ihm sofort zugutezukommen.
 *
 * Der zuletzt bekannte Max-Wert wird als Flag auf dem Actor gespeichert -- das macht die Prüfung
 * unabhängig davon, WAS die Änderung ausgelöst hat (Attribut-Update, Item erstellt/gelöscht/
 * bearbeitet, ...), ohne fragiles preUpdate-Options-Threading über sehr unterschiedliche
 * Auslöser hinweg. Reagiert nur der Client, der die ursprüngliche Änderung ausgelöst hat
 * (game.user.id === userId), damit nicht jeder verbundene Client denselben Folge-Update sendet.
 */
const RESOURCE_KEYS = ["hp", "mana", "mentalHealth"];

function currentResourceMax(actor) {
  const resources = actor.system.resources;
  return Object.fromEntries(RESOURCE_KEYS.map(key => [key, resources[key].max]));
}

async function syncResourceMax(actor, userId) {
  if (!actor || actor.type !== "character") return;
  if (game.user.id !== userId) return;

  const stored = actor.getFlag("scuvanya", "resourceMax");
  const current = currentResourceMax(actor);

  if (!stored) {
    await actor.setFlag("scuvanya", "resourceMax", current);
    return;
  }

  const updates = {};
  for (const key of RESOURCE_KEYS) {
    const delta = current[key] - stored[key];
    if (delta === 0) continue;
    const resource = actor.system.resources[key];
    updates[`system.resources.${key}.value`] = Math.max(0, Math.min(current[key], resource.value + delta));
  }
  if (!Object.keys(updates).length) return;

  updates["flags.scuvanya.resourceMax"] = current;
  await actor.update(updates);
}

function actorOf(item) {
  return item.parent instanceof Actor ? item.parent : null;
}

export function initResourceMaxSync() {
  Hooks.on("updateActor", (actor, changes, options, userId) => syncResourceMax(actor, userId));
  Hooks.on("createItem", (item, options, userId) => syncResourceMax(actorOf(item), userId));
  Hooks.on("deleteItem", (item, options, userId) => syncResourceMax(actorOf(item), userId));
  Hooks.on("updateItem", (item, changes, options, userId) => syncResourceMax(actorOf(item), userId));
}
