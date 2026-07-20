import { SCUVANYA } from "../config.mjs";
import BaseActorSheet from "./base-actor-sheet.mjs";
import {
  mapLeveledSkills,
  mapTieredSkills,
  mapBooleanSkills,
  mapDisciplines,
  mapAttributes
} from "./context-helpers.mjs";
import {
  attributeSpentCost,
  talentSpentCost,
  tieredSpentCost,
  specialtySpentCost,
  EXTRA_TALENT_COST
} from "../rules/costs.mjs";
import CharacterCreationWizard from "../apps/character-creation.mjs";

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
      addLanguage: ScuvanyaCharacterSheet.#onAddLanguage,
      removeLanguage: ScuvanyaCharacterSheet.#onRemoveLanguage,
      buyAttribute: ScuvanyaCharacterSheet.#onBuyAttribute,
      buyTalent: ScuvanyaCharacterSheet.#onBuyTalent,
      buyTiered: ScuvanyaCharacterSheet.#onBuyTiered,
      buyExtra: ScuvanyaCharacterSheet.#onBuyExtra,
      openCreationWizard: ScuvanyaCharacterSheet.#onOpenCreationWizard
    }
  };

  static PARTS = {
    form: { template: "systems/scuvanya/templates/actor/character-sheet.hbs", scrollable: [""] }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const sys = this.actor.system;

    context.config = SCUVANYA;
    context.skillPoints = sys.skillPoints;
    context.body = sys.body;
    context.attributes = mapAttributes(sys.attributes);

    context.sozialPositiv = mapLeveledSkills(SCUVANYA.socialSkills.positive, sys.talents.sozial.positiv);
    context.sozialNegativ = mapLeveledSkills(SCUVANYA.socialSkills.negative, sys.talents.sozial.negativ);
    context.wissenschaftenSozial = mapLeveledSkills(SCUVANYA.scienceSkills.sozial, sys.talents.wissenschaften.sozial);
    context.wissenschaftenNatur = mapLeveledSkills(SCUVANYA.scienceSkills.natur, sys.talents.wissenschaften.natur);
    context.koerperlich = mapLeveledSkills(SCUVANYA.physicalSkills, sys.talents.koerperlich);
    context.sonder = mapLeveledSkills(Object.keys(SCUVANYA.sonderSkills), sys.talents.sonder);
    context.handwerk = mapTieredSkills(SCUVANYA.craftSkills, sys.talents.handwerk, "handwerk");
    context.spezial = mapTieredSkills(SCUVANYA.spezialSkills, sys.talents.spezial, "spezial");
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

  static #canAfford(actor, cost) {
    if (cost > actor.system.skillPoints.available) {
      ui.notifications.warn(game.i18n.format("SCUVANYA.Warning.NotEnoughSkillPoints", {
        cost, available: actor.system.skillPoints.available
      }));
      return false;
    }
    return true;
  }

  static async #onBuyAttribute(event, target) {
    const key = target.dataset.key;
    const delta = Number(target.dataset.delta);
    const actor = this.actor;
    const current = actor.system.attributes[key].value;
    const next = current + delta;
    if (next < 1) return;
    if (delta > 0) {
      const shift = actor.system.attributes[key].raceBonus ?? 0;
      const cost = attributeSpentCost(next, SCUVANYA.attributeStartingValue, shift)
        - attributeSpentCost(current, SCUVANYA.attributeStartingValue, shift);
      if (!ScuvanyaCharacterSheet.#canAfford(actor, cost)) return;
    }
    await actor.update({ [`system.attributes.${key}.value`]: next });
  }

  /** data-path ist relativ zu system, z.B. "talents.sozial.positiv.charme.level". */
  static async #onBuyTalent(event, target) {
    const path = target.dataset.path;
    const delta = Number(target.dataset.delta);
    const actor = this.actor;
    const current = foundry.utils.getProperty(actor.system, path) ?? 0;
    const next = Math.max(0, current + delta);
    if (next === current) return;
    if (delta > 0) {
      const skill = foundry.utils.getProperty(actor.system, path.replace(/\.level$/, ""));
      const shift = skill?.raceBonus ?? 0;
      const cost = talentSpentCost(next, shift) - talentSpentCost(current, shift);
      if (!ScuvanyaCharacterSheet.#canAfford(actor, cost)) return;
    }
    await actor.update({ [`system.${path}`]: next });
  }

  /** data-category: "handwerk" | "spezial" | "disziplin" -- steuert Grenzen und Kostenformel. */
  static async #onBuyTiered(event, target) {
    const path = target.dataset.path;
    const category = target.dataset.category;
    const delta = Number(target.dataset.delta);
    const actor = this.actor;
    const bounds = {
      handwerk: [SCUVANYA.tieredSkillMinLevel, SCUVANYA.tieredSkillMaxLevel],
      spezial: [SCUVANYA.specialtyStartingLevel, SCUVANYA.tieredSkillMaxLevel],
      disziplin: [SCUVANYA.disciplineMinLevel, SCUVANYA.disciplineMaxLevel]
    }[category];
    const startingLevel = category === "spezial" ? SCUVANYA.specialtyStartingLevel : 0;
    const current = foundry.utils.getProperty(actor.system, path) ?? 0;
    const next = Math.min(bounds[1], Math.max(bounds[0], current + delta));
    if (next === current) return;
    if (delta > 0) {
      const skill = foundry.utils.getProperty(actor.system, path.replace(/\.level$/, ""));
      const shift = skill?.raceBonus ?? 0;
      const spentFn = category === "spezial" ? specialtySpentCost : tieredSpentCost;
      const cost = spentFn(next, startingLevel, shift) - spentFn(current, startingLevel, shift);
      if (!ScuvanyaCharacterSheet.#canAfford(actor, cost)) return;
    }
    await actor.update({ [`system.${path}`]: next });
  }

  static async #onBuyExtra(event, target) {
    const key = target.dataset.key;
    const actor = this.actor;
    const current = actor.system.talents.extra[key].known;
    if (!current && !ScuvanyaCharacterSheet.#canAfford(actor, EXTRA_TALENT_COST)) return;
    await actor.update({ [`system.talents.extra.${key}.known`]: !current });
  }

  static #onOpenCreationWizard() {
    new CharacterCreationWizard(this.actor).render(true);
  }
}
