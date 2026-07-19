import { SCUVANYA } from "../../config.mjs";
import { baseItemSchema } from "./base-item.mjs";

const fields = foundry.data.fields;

export default class WeaponData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      ...baseItemSchema(),
      damageFormula: new fields.StringField({ required: true, initial: "1d6" }),
      damageType: new fields.StringField({
        required: true,
        initial: "stumpf",
        choices: Object.keys(SCUVANYA.damageTypes)
      }),
      ranged: new fields.BooleanField({ required: true, initial: false }),
      // Optionaler Bezug zu einer Kampf-/Magiedisziplin, gegen die der Angriffswurf läuft.
      // Leer lassen, wenn die Waffe keiner bestimmten Disziplin zugeordnet ist.
      discipline: new fields.StringField({ required: false, blank: true, initial: "" }),
      equipped: new fields.BooleanField({ required: true, initial: false })
    };
  }
}
