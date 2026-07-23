import { SCUVANYA } from "./module/config.mjs";
import { registerHandlebarsHelpers } from "./module/helpers.mjs";

import CharacterData from "./module/data/actor/character.mjs";
import NpcData from "./module/data/actor/npc.mjs";

import WeaponData from "./module/data/item/weapon.mjs";
import ArmorData from "./module/data/item/armor.mjs";
import ConsumableData from "./module/data/item/consumable.mjs";
import EquipmentData from "./module/data/item/equipment.mjs";
import RaceData from "./module/data/item/race.mjs";
import ProfessionData from "./module/data/item/profession.mjs";
import ActionData from "./module/data/item/action.mjs";

import ScuvanyaActor from "./module/documents/actor.mjs";
import ScuvanyaItem from "./module/documents/item.mjs";

import ScuvanyaCharacterSheet from "./module/sheets/character-sheet.mjs";
import ScuvanyaNpcSheet from "./module/sheets/npc-sheet.mjs";
import ScuvanyaItemSheet from "./module/sheets/item-sheet.mjs";
import { initRestSocket } from "./module/rest.mjs";
import { initResourceMaxSync } from "./module/rules/resource-sync.mjs";
import EncounterTracker from "./module/apps/encounter-tracker.mjs";

Hooks.once("init", () => {
  game.scuvanya = { config: SCUVANYA };
  CONFIG.SCUVANYA = SCUVANYA;

  CONFIG.Actor.documentClass = ScuvanyaActor;
  CONFIG.Item.documentClass = ScuvanyaItem;

  CONFIG.Actor.dataModels.character = CharacterData;
  CONFIG.Actor.dataModels.npc = NpcData;

  CONFIG.Item.dataModels.weapon = WeaponData;
  CONFIG.Item.dataModels.armor = ArmorData;
  CONFIG.Item.dataModels.consumable = ConsumableData;
  CONFIG.Item.dataModels.equipment = EquipmentData;
  CONFIG.Item.dataModels.race = RaceData;
  CONFIG.Item.dataModels.profession = ProfessionData;
  CONFIG.Item.dataModels.action = ActionData;

  // Initiative: bestätigt W12 + flacher SPD-Wert (kein Mod).
  CONFIG.Combat.initiative = { formula: "1d12 + @attributes.spd.value + @initiativeBonus", decimals: 2 };

  // Eigene Sheets als Standard registrieren (Core-Sheet bleibt als Alternative wählbar,
  // bewusst nicht deregistriert -- reduziert Abhängigkeit von genauen Core-Klassenpfaden,
  // die sich zwischen Foundry-Versionen verschoben haben).
  const { DocumentSheetConfig } = foundry.applications.apps;
  DocumentSheetConfig.registerSheet(Actor, "scuvanya", ScuvanyaCharacterSheet, {
    types: ["character"],
    makeDefault: true,
    label: "SCUVANYA.SheetCharacter"
  });
  DocumentSheetConfig.registerSheet(Actor, "scuvanya", ScuvanyaNpcSheet, {
    types: ["npc"],
    makeDefault: true,
    label: "SCUVANYA.SheetNpc"
  });
  DocumentSheetConfig.registerSheet(Item, "scuvanya", ScuvanyaItemSheet, {
    types: SCUVANYA.itemTypes,
    makeDefault: true,
    label: "SCUVANYA.SheetItem"
  });

  registerHandlebarsHelpers();
  initResourceMaxSync();

  foundry.applications.handlebars.loadTemplates([
    "systems/scuvanya/templates/apps/parts/bonus-preview.hbs",
    "systems/scuvanya/templates/apps/parts/badge.hbs",
    "systems/scuvanya/templates/apps/parts/decision.hbs",
    "systems/scuvanya/templates/apps/parts/sp-category.hbs",
    "systems/scuvanya/templates/item/parts/bonus-bundle.hbs",
    "systems/scuvanya/templates/item/parts/equipment-fields.hbs",
    "systems/scuvanya/templates/actor/parts/skill-category.hbs",
    "systems/scuvanya/templates/actor/parts/tiered-category.hbs",
    "systems/scuvanya/templates/actor/parts/slot-chip.hbs",
    "systems/scuvanya/templates/actor/parts/item-tooltip.hbs",
    "systems/scuvanya/templates/actor/parts/breakdown-tooltip.hbs",
    "systems/scuvanya/templates/actor/parts/action-tile.hbs",
    "systems/scuvanya/templates/actor/parts/action-tooltip.hbs"
  ]);
});

/**
 * Encounter-/Initiative-Ablauf (siehe module/rules/encounter.mjs für die eigentliche Logik --
 * hier nur die Anbindung): ein Button in Foundrys eingebauter Combat-Tracker-Sidebar öffnet den
 * eigenen Encounter-Tracker (siehe module/apps/encounter-tracker.mjs), und dessen Fenster wird
 * bei jeder relevanten Änderung neu gerendert, solange es offen ist. Bewusst KEIN automatischer
 * Rundenwechsel/keine automatische Neuwürfelung mehr (siehe Konversation) -- das war ein früherer
 * Ansatz (combatStart/combatRound-Hooks), der durch den expliziten "Nächste Runde"-Button und
 * die beiden Sammel-Würfel-Buttons im Encounter-Tracker ersetzt wurde.
 */
function refreshEncounterTracker() {
  if (EncounterTracker.current?.rendered) EncounterTracker.current.render();
}

Hooks.on("updateCombat", refreshEncounterTracker);
Hooks.on("updateCombatant", refreshEncounterTracker);
Hooks.on("createCombatant", refreshEncounterTracker);
Hooks.on("deleteCombatant", refreshEncounterTracker);
Hooks.on("updateActor", refreshEncounterTracker);

Hooks.on("renderCombatTracker", (app, html) => {
  const root = html instanceof HTMLElement ? html : html[0];
  if (!root || root.querySelector(".scuvanya-open-tracker")) return;
  const button = document.createElement("button");
  button.type = "button";
  button.className = "scuvanya-open-tracker";
  button.textContent = game.i18n.localize("SCUVANYA.Encounter.OpenButton");
  button.addEventListener("click", () => EncounterTracker.open());
  root.prepend(button);
});

Hooks.once("ready", () => initRestSocket());
