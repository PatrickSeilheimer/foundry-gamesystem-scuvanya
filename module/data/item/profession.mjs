import { professionItemSchema } from "./progression-shared.mjs";

export default class ProfessionData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return professionItemSchema();
  }
}
