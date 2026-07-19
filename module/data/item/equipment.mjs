import { baseItemSchema } from "./base-item.mjs";

const fields = foundry.data.fields;

/** Generischer Ausrüstungs-/Inventar-Typ für alles, was nicht Waffe/Rüstung/Verbrauchsgut ist. */
export default class EquipmentData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      ...baseItemSchema(),
      quantity: new fields.NumberField({ required: true, integer: true, initial: 1, min: 0 }),
      weight: new fields.NumberField({ required: true, initial: 0, min: 0 })
    };
  }
}
