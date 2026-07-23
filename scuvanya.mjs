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

  foundry.applications.handlebars.loadTemplates([
    "systems/scuvanya/templates/apps/parts/bonus-preview.hbs",
    "systems/scuvanya/templates/apps/parts/badge.hbs",
    "systems/scuvanya/templates/apps/parts/decision.hbs",
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
 * Rundenstruktur (siehe Konversation): jede neue Runde wird die Initiative komplett neu
 * gewürfelt -- wer die höchste Initiative hat, darf beginnen, muss aber nichts tun. Es gibt
 * bewusst KEINE erzwungene Zug-Reihenfolge (useAction prüft nirgends, ob ein Charakter "dran"
 * ist) -- man hat die gesamte Runde Zeit, seine AP einzusetzen, bis die SL manuell auf "Nächste
 * Runde" drückt. ALLE Charaktere im Encounter erhalten dabei wieder volle AP (siehe
 * resources.ap.max, aktuell immer SCUVANYA.turnStartAP -- über das Max statt einer festen
 * Zahl, damit ein künftiger Effekt "-2 max AP nächste Runde" hier automatisch greifen würde).
 *
 * "combatStart" deckt Runde 1 ab (die schon beim Start des Kampfes gilt), "combatRound" jede
 * weitere Runde (SL klickt "Nächste Runde").
 */
async function startNewCombatRound(combat) {
  if (!combat) return;
  await Promise.all(combat.combatants
    .filter(c => c.actor?.type === "character")
    .map(c => c.actor.update({ "system.resources.ap.value": c.actor.system.resources.ap.max })));
  await combat.rollAll();
}

Hooks.on("combatStart", (combat) => startNewCombatRound(combat));
Hooks.on("combatRound", (combat) => startNewCombatRound(combat));
