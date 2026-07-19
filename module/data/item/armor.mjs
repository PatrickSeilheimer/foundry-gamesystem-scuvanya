import { baseItemSchema } from "./base-item.mjs";

const fields = foundry.data.fields;

export default class ArmorData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      ...baseItemSchema(),
      armorType: new fields.StringField({
        required: true,
        initial: "physical",
        choices: ["physical", "magical", "both"]
      }),
      value: new fields.NumberField({ required: true, integer: true, initial: 0, min: 0 }),
      slot: new fields.StringField({ required: false, blank: true, initial: "" }),
      equipped: new fields.BooleanField({ required: true, initial: false })
    };
  }
}
