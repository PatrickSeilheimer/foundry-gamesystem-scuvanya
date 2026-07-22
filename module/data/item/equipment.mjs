import { baseItemSchema } from "./base-item.mjs";
import { equipableItemSchema } from "./equipment-shared.mjs";

const fields = foundry.data.fields;

/**
 * Generischer Ausrüstungs-/Inventar-Typ für alles, was nicht Waffe/Rüstung/Verbrauchsgut ist --
 * u.a. Schmuck (Ohrringe/Halskette/Armbänder/Ringe), siehe SCUVANYA.equipSlots.
 */
export default class EquipmentData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      ...baseItemSchema(),
      ...equipableItemSchema(),
      quantity: new fields.NumberField({ required: true, integer: true, initial: 1, min: 0 }),
      weight: new fields.NumberField({ required: true, initial: 0, min: 0 })
    };
  }
}
