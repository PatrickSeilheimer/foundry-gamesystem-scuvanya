import { SCUVANYA } from "./module/config.mjs";
import { registerHandlebarsHelpers } from "./module/helpers.mjs";
import { seedDefaultItems } from "./module/seed-data.mjs";

import CharacterData from "./module/data/actor/character.mjs";
import NpcData from "./module/data/actor/npc.mjs";

import WeaponData from "./module/data/item/weapon.mjs";
import ArmorData from "./module/data/item/armor.mjs";
import ConsumableData from "./module/data/item/consumable.mjs";
import EquipmentData from "./module/data/item/equipment.mjs";
import RaceData from "./module/data/item/race.mjs";
import ProfessionData from "./module/data/item/profession.mjs";

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

  // Initiative: bestätigt W12 + flacher SPD-Wert (kein Mod).
  CONFIG.Combat.initiative = { formula: "1d12 + @attributes.spd.value", decimals: 2 };

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
    "systems/scuvanya/templates/apps/parts/badge.hbs"
  ]);
});

Hooks.once("ready", () => {
  seedDefaultItems();
});
