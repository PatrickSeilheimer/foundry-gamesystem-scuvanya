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
      removeSkillBonus: ScuvanyaItemSheet.#onRemoveSkillBonus,
      addChoice: ScuvanyaItemSheet.#onAddChoice,
      removeChoice: ScuvanyaItemSheet.#onRemoveChoice,
      addChoiceOption: ScuvanyaItemSheet.#onAddChoiceOption,
      removeChoiceOption: ScuvanyaItemSheet.#onRemoveChoiceOption,
      toggleExtraGrant: ScuvanyaItemSheet.#onToggleExtraGrant
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

  static async #onAddChoice() {
    const choices = foundry.utils.deepClone(this.item.system.choices ?? []);
    choices.push({ key: "", label: "", kind: "attribute", options: [], amount: 0 });
    await this.item.update({ "system.choices": choices });
  }

  static async #onRemoveChoice(event, target) {
    const index = Number(target.closest("[data-choice-index]")?.dataset.choiceIndex);
    const choices = foundry.utils.deepClone(this.item.system.choices ?? []);
    choices.splice(index, 1);
    await this.item.update({ "system.choices": choices });
  }

  static async #onAddChoiceOption(event, target) {
    const choiceIndex = Number(target.closest("[data-choice-index]")?.dataset.choiceIndex);
    const choices = foundry.utils.deepClone(this.item.system.choices ?? []);
    choices[choiceIndex].options.push("");
    await this.item.update({ "system.choices": choices });
  }

  static async #onRemoveChoiceOption(event, target) {
    const choiceIndex = Number(target.closest("[data-choice-index]")?.dataset.choiceIndex);
    const optionIndex = Number(target.closest("[data-option-index]")?.dataset.optionIndex);
    const choices = foundry.utils.deepClone(this.item.system.choices ?? []);
    choices[choiceIndex].options.splice(optionIndex, 1);
    await this.item.update({ "system.choices": choices });
  }

  static async #onToggleExtraGrant(event, target) {
    const key = target.dataset.key;
    const grants = foundry.utils.deepClone(this.item.system.extraGrants ?? []);
    const index = grants.indexOf(key);
    if (index >= 0) grants.splice(index, 1);
    else grants.push(key);
    await this.item.update({ "system.extraGrants": grants });
  }
}
