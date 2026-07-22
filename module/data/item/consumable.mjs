import { baseItemSchema } from "./base-item.mjs";
import { flagsField } from "./equipment-shared.mjs";

const fields = foundry.data.fields;

export default class ConsumableData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      ...baseItemSchema(),
      flags: flagsField(),
      quantity: new fields.NumberField({ required: true, integer: true, initial: 1, min: 0 }),
      consumeOnUse: new fields.BooleanField({ required: true, initial: true })
    };
  }
}
