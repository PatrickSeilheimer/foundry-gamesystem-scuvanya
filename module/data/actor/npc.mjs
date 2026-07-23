import { SCUVANYA } from "../../config.mjs";
import {
  attributesSchema,
  resourcesSchema,
  armorSchema,
  armorClassSchema,
  resistancesSchema,
  biographySchema
} from "../templates.mjs";

const fields = foundry.data.fields;

/**
 * Vereinfachtes NPC-Datenmodell: Attribute, Ressourcen, Rüstung/Resistenzen, AC
 * und ein einzelner Kampfbonus -- bewusst ohne vollen Talentbaum. Braucht die SL
 * einen detaillierten NSC, wird stattdessen ein Character-Actor verwendet.
 */
export default class NpcData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      attributes: attributesSchema(),
      resources: resourcesSchema(),
      armor: armorSchema(),
      ac: armorClassSchema(),
      resistances: resistancesSchema(),
      biography: biographySchema(),

      // Pauschaler Bonus für Angriffe/Proben, statt vollem Disziplinen-/Talentbaum.
      combatBonus: new fields.NumberField({ required: true, integer: true, initial: 0 })
    };
  }

  prepareDerivedData() {
    for (const key of Object.keys(SCUVANYA.attributes)) {
      const attr = this.attributes[key];
      attr.mod = attr.value - 10;
    }
    const attr = this.attributes;
    this.resources.hp.max = 4 * attr.con.value + attr.str.value;
    this.resources.mana.max = 2 * attr.mnd.value + 2 * attr.mag.value + attr.con.value;
    this.resources.mentalHealth.max = 3 * attr.mnd.value + attr.int.value + attr.con.value;
    // Wie bei Charakteren (siehe character.mjs) -- NSCs nehmen ebenfalls am AP-/Encounter-System
    // teil (siehe module/rules/encounter.mjs "hasAnyApLeft").
    this.resources.ap.max = SCUVANYA.turnStartAP;
  }
}
