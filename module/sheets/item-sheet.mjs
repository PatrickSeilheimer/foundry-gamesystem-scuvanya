import { SCUVANYA } from "../config.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;

/** Ein generisches Sheet für alle Item-Typen; Template blendet typspezifische Felder ein. */
export default class ScuvanyaItemSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["scuvanya", "sheet", "item"],
    position: { width: 520, height: 560 },
    window: { resizable: true },
    form: { submitOnChange: true },
    actions: {
      addSkillBonus: ScuvanyaItemSheet.#onAddSkillBonus,
      removeSkillBonus: ScuvanyaItemSheet.#onRemoveSkillBonus
    }
  };

  static PARTS = {
    form: { template: "systems/scuvanya/templates/item/item-sheet.hbs", scrollable: [""] }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.item = this.item;
    context.system = this.item.system;
    context.config = SCUVANYA;
    return context;
  }

  static async #onAddSkillBonus() {
    const skillBonuses = foundry.utils.deepClone(this.item.system.skillBonuses ?? []);
    skillBonuses.push({ path: "", bonus: 0 });
    await this.item.update({ "system.skillBonuses": skillBonuses });
  }

  static async #onRemoveSkillBonus(event, target) {
    const index = Number(target.closest("[data-index]")?.dataset.index);
    const skillBonuses = foundry.utils.deepClone(this.item.system.skillBonuses ?? []);
    skillBonuses.splice(index, 1);
    await this.item.update({ "system.skillBonuses": skillBonuses });
  }
}
