import { progressionItemSchema } from "./progression-shared.mjs";

export default class RaceData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return progressionItemSchema();
  }
}
