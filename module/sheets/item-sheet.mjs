import { SCUVANYA } from "../config.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;

/**
 * Ein generisches Sheet für alle Item-Typen; Template blendet typspezifische Felder ein.
 *
 * Rassen/Berufe bestehen aus einem oder mehreren "Bonus-Bündeln" (siehe bonus-bundle.hbs
 * und progression-shared.mjs) -- ein Beruf hat genau eins bei "system", eine Rasse mehrere
 * unter "system.base"/"system.maennlich"/"system.weiblich"/"system.subraces.N.bonuses". Jedes
 * Bündel enthält eine Liste "Eigenschaften", jede Eigenschaft eine Liste "Boni". Alle
 * Bündel-Actions sind deshalb "prefix-aware": das data-prefix-Attribut des geklickten
 * Elements ist der volle Pfad zum jeweiligen Bündel (z.B. "system" oder
 * "system.subraces.2.bonuses"), an den einfach ".eigenschaften" etc. angehängt wird.
 */
export default class ScuvanyaItemSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["scuvanya", "sheet", "item"],
    position: { width: 600, height: 680 },
    window: { resizable: true },
    form: { submitOnChange: true },
    actions: {
      addEigenschaft: ScuvanyaItemSheet.#onAddEigenschaft,
      removeEigenschaft: ScuvanyaItemSheet.#onRemoveEigenschaft,
      addBonus: ScuvanyaItemSheet.#onAddBonus,
      removeBonus: ScuvanyaItemSheet.#onRemoveBonus,
      addBonusOption: ScuvanyaItemSheet.#onAddBonusOption,
      removeBonusOption: ScuvanyaItemSheet.#onRemoveBonusOption,
      addSubrace: ScuvanyaItemSheet.#onAddSubrace,
      removeSubrace: ScuvanyaItemSheet.#onRemoveSubrace,
      addFlag: ScuvanyaItemSheet.#onAddFlag,
      removeFlag: ScuvanyaItemSheet.#onRemoveFlag,
      addCondition: ScuvanyaItemSheet.#onAddCondition,
      removeCondition: ScuvanyaItemSheet.#onRemoveCondition,
      addEffect: ScuvanyaItemSheet.#onAddEffect,
      removeEffect: ScuvanyaItemSheet.#onRemoveEffect
    }
  };

  static PARTS = {
    form: { template: "systems/scuvanya/templates/item/item-sheet.hbs", scrollable: [".sheet-body"] }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.item = this.item;
    context.system = this.item.system;
    context.config = SCUVANYA;
    return context;
  }

  static async #onAddEigenschaft(event, target) {
    const prefix = target.dataset.prefix;
    const eigenschaften = foundry.utils.deepClone(foundry.utils.getProperty(this.item, `${prefix}.eigenschaften`) ?? []);
    eigenschaften.push({ key: "", name: "", description: "", boni: [] });
    await this.item.update({ [`${prefix}.eigenschaften`]: eigenschaften });
  }

  static async #onRemoveEigenschaft(event, target) {
    const prefix = target.dataset.prefix;
    const index = Number(target.closest("[data-eigenschaft-index]")?.dataset.eigenschaftIndex);
    const eigenschaften = foundry.utils.deepClone(foundry.utils.getProperty(this.item, `${prefix}.eigenschaften`) ?? []);
    eigenschaften.splice(index, 1);
    await this.item.update({ [`${prefix}.eigenschaften`]: eigenschaften });
  }

  static async #onAddBonus(event, target) {
    const prefix = target.dataset.prefix;
    const eigenschaftIndex = Number(target.closest("[data-eigenschaft-index]")?.dataset.eigenschaftIndex);
    const eigenschaften = foundry.utils.deepClone(foundry.utils.getProperty(this.item, `${prefix}.eigenschaften`) ?? []);
    eigenschaften[eigenschaftIndex].boni.push({
      key: "", kind: "fixed", path: "", options: [], amount: 0, perOptionMax: 0, text: ""
    });
    await this.item.update({ [`${prefix}.eigenschaften`]: eigenschaften });
  }

  static async #onRemoveBonus(event, target) {
    const prefix = target.dataset.prefix;
    const eigenschaftIndex = Number(target.closest("[data-eigenschaft-index]")?.dataset.eigenschaftIndex);
    const bonusIndex = Number(target.closest("[data-bonus-index]")?.dataset.bonusIndex);
    const eigenschaften = foundry.utils.deepClone(foundry.utils.getProperty(this.item, `${prefix}.eigenschaften`) ?? []);
    eigenschaften[eigenschaftIndex].boni.splice(bonusIndex, 1);
    await this.item.update({ [`${prefix}.eigenschaften`]: eigenschaften });
  }

  static async #onAddBonusOption(event, target) {
    const prefix = target.dataset.prefix;
    const eigenschaftIndex = Number(target.closest("[data-eigenschaft-index]")?.dataset.eigenschaftIndex);
    const bonusIndex = Number(target.closest("[data-bonus-index]")?.dataset.bonusIndex);
    const eigenschaften = foundry.utils.deepClone(foundry.utils.getProperty(this.item, `${prefix}.eigenschaften`) ?? []);
    eigenschaften[eigenschaftIndex].boni[bonusIndex].options.push("");
    await this.item.update({ [`${prefix}.eigenschaften`]: eigenschaften });
  }

  static async #onRemoveBonusOption(event, target) {
    const prefix = target.dataset.prefix;
    const eigenschaftIndex = Number(target.closest("[data-eigenschaft-index]")?.dataset.eigenschaftIndex);
    const bonusIndex = Number(target.closest("[data-bonus-index]")?.dataset.bonusIndex);
    const optionIndex = Number(target.closest("[data-option-index]")?.dataset.optionIndex);
    const eigenschaften = foundry.utils.deepClone(foundry.utils.getProperty(this.item, `${prefix}.eigenschaften`) ?? []);
    eigenschaften[eigenschaftIndex].boni[bonusIndex].options.splice(optionIndex, 1);
    await this.item.update({ [`${prefix}.eigenschaften`]: eigenschaften });
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

  static async #onAddFlag() {
    const flags = foundry.utils.deepClone(this.item.system.flags ?? []);
    flags.push("");
    await this.item.update({ "system.flags": flags });
  }

  static async #onRemoveFlag(event, target) {
    const index = Number(target.closest("[data-flag-index]")?.dataset.flagIndex);
    const flags = foundry.utils.deepClone(this.item.system.flags ?? []);
    flags.splice(index, 1);
    await this.item.update({ "system.flags": flags });
  }

  static async #onAddCondition() {
    const conditions = foundry.utils.deepClone(this.item.system.conditions ?? []);
    conditions.push({ path: "", operator: "gte", value: 0 });
    await this.item.update({ "system.conditions": conditions });
  }

  static async #onRemoveCondition(event, target) {
    const index = Number(target.closest("[data-condition-index]")?.dataset.conditionIndex);
    const conditions = foundry.utils.deepClone(this.item.system.conditions ?? []);
    conditions.splice(index, 1);
    await this.item.update({ "system.conditions": conditions });
  }

  static async #onAddEffect() {
    const effects = foundry.utils.deepClone(this.item.system.effects ?? []);
    effects.push({ key: "", kind: "fixed", path: "", amount: 0, text: "", condition: "equipped" });
    await this.item.update({ "system.effects": effects });
  }

  static async #onRemoveEffect(event, target) {
    const index = Number(target.closest("[data-effect-index]")?.dataset.effectIndex);
    const effects = foundry.utils.deepClone(this.item.system.effects ?? []);
    effects.splice(index, 1);
    await this.item.update({ "system.effects": effects });
  }
}
