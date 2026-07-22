/**
 * Lädt die Aktionen/Zauber-Liste aus dem Compendium-Pack "actions" (siehe system.json,
 * scripts/default-actions.mjs) PLUS eigene Ergänzungen der SL als Welt-Item (gleiches Prinzip
 * wie Rassen/Berufe, siehe apps/character-creation.mjs _availableRaces). Aktionen sind KEINE
 * eingebetteten Items pro Charakter -- jeder Charakterbogen liest denselben zentralen Katalog
 * und filtert ihn selbst nach Verfügbarkeit (siehe documents/actor.mjs isActionAvailable,
 * sheets/character-sheet.mjs).
 *
 * Foundry cached Compendium-Dokumente nach dem ersten getDocuments()-Aufruf intern selbst,
 * ein wiederholter Aufruf hier ist deshalb günstig -- kein eigenes Caching nötig.
 */
export async function getActionCatalog() {
  const pack = game.packs.get("scuvanya.actions");
  const packActions = pack ? await pack.getDocuments() : [];
  const worldActions = game.items.filter(i => i.type === "action");
  return [...packActions, ...worldActions];
}
