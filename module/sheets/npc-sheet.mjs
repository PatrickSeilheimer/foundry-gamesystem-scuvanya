import { SCUVANYA } from "../config.mjs";
import BaseActorSheet from "./base-actor-sheet.mjs";
import { mapAttributes } from "./context-helpers.mjs";

export default class ScuvanyaNpcSheet extends BaseActorSheet {
  static DEFAULT_TAB = "attribute";

  static DEFAULT_OPTIONS = {
    classes: ["scuvanya", "sheet", "actor", "npc"],
    position: { width: 560, height: 600 },
    actions: {
      rollAttribute: ScuvanyaNpcSheet.#onRollAttribute
    }
  };

  static PARTS = {
    form: { template: "systems/scuvanya/templates/actor/npc-sheet.hbs", scrollable: [".sheet-body"] }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const sys = this.actor.system;
    context.config = SCUVANYA;
    context.attributes = mapAttributes(sys.attributes);
    context.items = {
      weapon: this.actor.items.filter(i => i.type === "weapon"),
      armor: this.actor.items.filter(i => i.type === "armor"),
      consumable: this.actor.items.filter(i => i.type === "consumable"),
      equipment: this.actor.items.filter(i => i.type === "equipment")
    };
    return context;
  }

  static #onRollAttribute(event, target) {
    this.actor.rollAttribute(target.dataset.key);
  }
}
