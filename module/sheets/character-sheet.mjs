import { SCUVANYA } from "../config.mjs";
import BaseActorSheet from "./base-actor-sheet.mjs";
import {
  mapLeveledSkills,
  mapTieredSkills,
  mapBooleanSkills,
  mapDisciplines,
  mapAttributes
} from "./context-helpers.mjs";

export default class ScuvanyaCharacterSheet extends BaseActorSheet {
  static DEFAULT_TAB = "attribute";

  static DEFAULT_OPTIONS = {
    classes: ["scuvanya", "sheet", "actor", "character"],
    actions: {
      rollAttribute: ScuvanyaCharacterSheet.#onRollAttribute,
      rollSocialSkill: ScuvanyaCharacterSheet.#onRollSocialSkill,
      rollScienceSkill: ScuvanyaCharacterSheet.#onRollScienceSkill,
      rollPhysicalSkill: ScuvanyaCharacterSheet.#onRollPhysicalSkill,
      rollSonderSkill: ScuvanyaCharacterSheet.#onRollSonderSkill,
      rollHandwerkSkill: ScuvanyaCharacterSheet.#onRollHandwerkSkill,
      rollSpezialSkill: ScuvanyaCharacterSheet.#onRollSpezialSkill,
      rollDiscipline: ScuvanyaCharacterSheet.#onRollDiscipline,
      allocatePoint: ScuvanyaCharacterSheet.#onAllocatePoint,
      addLanguage: ScuvanyaCharacterSheet.#onAddLanguage,
      removeLanguage: ScuvanyaCharacterSheet.#onRemoveLanguage
    }
  };

  static PARTS = {
    form: { template: "systems/scuvanya/templates/actor/character-sheet.hbs", scrollable: [""] }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const sys = this.actor.system;

    context.config = SCUVANYA;
    context.attributes = mapAttributes(sys.attributes, sys.attributeAllocation);
    context.freeAttributePointsAvailable = sys.freeAttributePointsAvailable;
    context.freeAttributePointsSpent = sys.freeAttributePointsSpent;

    context.sozialPositiv = mapLeveledSkills(SCUVANYA.socialSkills.positive, sys.talents.sozial.positiv);
    context.sozialNegativ = mapLeveledSkills(SCUVANYA.socialSkills.negative, sys.talents.sozial.negativ);
    context.wissenschaftenSozial = mapLeveledSkills(SCUVANYA.scienceSkills.sozial, sys.talents.wissenschaften.sozial);
    context.wissenschaftenNatur = mapLeveledSkills(SCUVANYA.scienceSkills.natur, sys.talents.wissenschaften.natur);
    context.koerperlich = mapLeveledSkills(SCUVANYA.physicalSkills, sys.talents.koerperlich);
    context.sonder = mapLeveledSkills(Object.keys(SCUVANYA.sonderSkills), sys.talents.sonder);
    context.handwerk = mapTieredSkills(SCUVANYA.craftSkills, sys.talents.handwerk);
    context.spezial = mapTieredSkills(SCUVANYA.spezialSkills, sys.talents.spezial);
    context.extra = mapBooleanSkills(SCUVANYA.extraSkills, sys.talents.extra);

    context.kampfDisziplinen = mapDisciplines(SCUVANYA.combatDisciplines, sys.disziplinen.kampf);
    context.magieDisziplinen = mapDisciplines(SCUVANYA.magicDisciplines, sys.disziplinen.magie);

    context.gemeinsprache = sys.sprachen.gemeinsprache;
    context.weitereSprachen = sys.sprachen.weitere;

    context.items = {
      weapon: this.actor.items.filter(i => i.type === "weapon"),
      armor: this.actor.items.filter(i => i.type === "armor"),
      consumable: this.actor.items.filter(i => i.type === "consumable"),
      equipment: this.actor.items.filter(i => i.type === "equipment"),
      race: this.actor.items.find(i => i.type === "race") ?? null,
      profession: this.actor.items.find(i => i.type === "profession") ?? null
    };

    return context;
  }

  static #onRollAttribute(event, target) {
    this.actor.rollAttribute(target.dataset.key);
  }

  static #onRollSocialSkill(event, target) {
    this.actor.rollSocialSkill(target.dataset.polarity, target.dataset.key);
  }

  static #onRollScienceSkill(event, target) {
    this.actor.rollScienceSkill(target.dataset.branch, target.dataset.key);
  }

  static #onRollPhysicalSkill(event, target) {
    this.actor.rollPhysicalSkill(target.dataset.key);
  }

  static #onRollSonderSkill(event, target) {
    this.actor.rollSonderSkill(target.dataset.key);
  }

  static #onRollHandwerkSkill(event, target) {
    this.actor.rollHandwerkSkill(target.dataset.key);
  }

  static #onRollSpezialSkill(event, target) {
    this.actor.rollSpezialSkill(target.dataset.key);
  }

  static #onRollDiscipline(event, target) {
    this.actor.rollDiscipline(target.dataset.kind, target.dataset.key);
  }

  static async #onAllocatePoint(event, target) {
    const key = target.dataset.key;
    const delta = Number(target.dataset.delta);
    const current = this.actor.system.attributeAllocation[key] ?? 0;
    const next = Math.max(0, current + delta);

    const spent = this.actor.system.freeAttributePointsSpent - current + next;
    if (delta > 0 && spent > this.actor.system.freeAttributePointsAvailable) {
      ui.notifications.warn(game.i18n.localize("SCUVANYA.Warning.NoFreePoints"));
      return;
    }
    await this.actor.update({ [`system.attributeAllocation.${key}`]: next });
  }

  static async #onAddLanguage() {
    const weitere = foundry.utils.deepClone(this.actor.system.sprachen.weitere);
    weitere.push({ name: game.i18n.localize("SCUVANYA.Language.NewName"), level: 0 });
    await this.actor.update({ "system.sprachen.weitere": weitere });
  }

  static async #onRemoveLanguage(event, target) {
    const index = Number(target.closest("[data-index]")?.dataset.index);
    const weitere = foundry.utils.deepClone(this.actor.system.sprachen.weitere);
    weitere.splice(index, 1);
    await this.actor.update({ "system.sprachen.weitere": weitere });
  }
}
