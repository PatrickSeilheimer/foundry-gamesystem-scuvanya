import { baseItemSchema } from "./base-item.mjs";
import { equipableItemSchema } from "./equipment-shared.mjs";

const fields = foundry.data.fields;

export default class ArmorData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      ...baseItemSchema(),
      ...equipableItemSchema(),
      armorType: new fields.StringField({
        required: true,
        initial: "physical",
        choices: ["physical", "magical", "both"]
      }),
      value: new fields.NumberField({ required: true, integer: true, initial: 0, min: 0 }),
      equipped: new fields.BooleanField({ required: true, initial: false })
    };
  }
}
