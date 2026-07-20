import { SCUVANYA } from "../config.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;

/**
 * Ein generisches Sheet für alle Item-Typen; Template blendet typspezifische Felder ein.
 *
 * Rassen/Berufe bestehen aus einem oder mehreren "Bonus-Bündeln" (siehe bonus-bundle.hbs
 * und progression-shared.mjs) -- ein Beruf hat genau eins bei "system", eine Rasse mehrere
 * unter "system.base"/"system.maennlich"/"system.weiblich"/"system.subraces.N.bonuses".
 * Alle Bündel-Actions (Skill-/Wahl-Boni, Extra-Grants) sind deshalb "prefix-aware": das
 * data-prefix-Attribut des geklickten Elements ist der volle Pfad zum jeweiligen Bündel
 * (z.B. "system" oder "system.subraces.2.bonuses"), an den einfach ".skillBonuses" etc.
 * angehängt wird.
 */
export default class ScuvanyaItemSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["scuvanya", "sheet", "item"],
    position: { width: 560, height: 640 },
    window: { resizable: true },
    form: { submitOnChange: true },
    actions: {
      addSkillBonus: ScuvanyaItemSheet.#onAddSkillBonus,
      removeSkillBonus: ScuvanyaItemSheet.#onRemoveSkillBonus,
      addChoice: ScuvanyaItemSheet.#onAddChoice,
      removeChoice: ScuvanyaItemSheet.#onRemoveChoice,
      addChoiceOption: ScuvanyaItemSheet.#onAddChoiceOption,
      removeChoiceOption: ScuvanyaItemSheet.#onRemoveChoiceOption,
      toggleExtraGrant: ScuvanyaItemSheet.#onToggleExtraGrant,
      addSubrace: ScuvanyaItemSheet.#onAddSubrace,
      removeSubrace: ScuvanyaItemSheet.#onRemoveSubrace
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

  static async #onAddSkillBonus(event, target) {
    const prefix = target.dataset.prefix;
    const skillBonuses = foundry.utils.deepClone(foundry.utils.getProperty(this.item, `${prefix}.skillBonuses`) ?? []);
    skillBonuses.push({ path: "", bonus: 0 });
    await this.item.update({ [`${prefix}.skillBonuses`]: skillBonuses });
  }

  static async #onRemoveSkillBonus(event, target) {
    const prefix = target.dataset.prefix;
    const index = Number(target.closest("[data-index]")?.dataset.index);
    const skillBonuses = foundry.utils.deepClone(foundry.utils.getProperty(this.item, `${prefix}.skillBonuses`) ?? []);
    skillBonuses.splice(index, 1);
    await this.item.update({ [`${prefix}.skillBonuses`]: skillBonuses });
  }

  static async #onAddChoice(event, target) {
    const prefix = target.dataset.prefix;
    const choices = foundry.utils.deepClone(foundry.utils.getProperty(this.item, `${prefix}.choices`) ?? []);
    choices.push({ key: "", label: "", kind: "attribute", options: [], amount: 0 });
    await this.item.update({ [`${prefix}.choices`]: choices });
  }

  static async #onRemoveChoice(event, target) {
    const prefix = target.dataset.prefix;
    const index = Number(target.closest("[data-choice-index]")?.dataset.choiceIndex);
    const choices = foundry.utils.deepClone(foundry.utils.getProperty(this.item, `${prefix}.choices`) ?? []);
    choices.splice(index, 1);
    await this.item.update({ [`${prefix}.choices`]: choices });
  }

  static async #onAddChoiceOption(event, target) {
    const prefix = target.dataset.prefix;
    const choiceIndex = Number(target.closest("[data-choice-index]")?.dataset.choiceIndex);
    const choices = foundry.utils.deepClone(foundry.utils.getProperty(this.item, `${prefix}.choices`) ?? []);
    choices[choiceIndex].options.push("");
    await this.item.update({ [`${prefix}.choices`]: choices });
  }

  static async #onRemoveChoiceOption(event, target) {
    const prefix = target.dataset.prefix;
    const choiceIndex = Number(target.closest("[data-choice-index]")?.dataset.choiceIndex);
    const optionIndex = Number(target.closest("[data-option-index]")?.dataset.optionIndex);
    const choices = foundry.utils.deepClone(foundry.utils.getProperty(this.item, `${prefix}.choices`) ?? []);
    choices[choiceIndex].options.splice(optionIndex, 1);
    await this.item.update({ [`${prefix}.choices`]: choices });
  }

  static async #onToggleExtraGrant(event, target) {
    const prefix = target.dataset.prefix;
    const key = target.dataset.key;
    const grants = foundry.utils.deepClone(foundry.utils.getProperty(this.item, `${prefix}.extraGrants`) ?? []);
    const index = grants.indexOf(key);
    if (index >= 0) grants.splice(index, 1);
    else grants.push(key);
    await this.item.update({ [`${prefix}.extraGrants`]: grants });
  }

  static async #onAddSubrace() {
    const subraces = foundry.utils.deepClone(this.item.system.subraces ?? []);
    subraces.push({ key: "", name: "", bonuses: {} });
    await this.item.update({ "system.subraces": subraces });
  }

  static async #onRemoveSubrace(event, target) {
    const index = Number(target.closest("[data-subrace-index]")?.dataset.subraceIndex);
    const subraces = foundry.utils.deepClone(this.item.system.subraces ?? []);
    subraces.splice(index, 1);
    await this.item.update({ "system.subraces": subraces });
  }
}
