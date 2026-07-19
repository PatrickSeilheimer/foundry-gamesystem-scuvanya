import { SCUVANYA } from "../config.mjs";
import { tieredSkillFormula, rollToChat } from "../dice.mjs";

export default class ScuvanyaActor extends Actor {
  /** @override */
  getRollData() {
    const data = super.getRollData();
    // Kurzform @str/@dex/... zusätzlich zu @attributes.str.value für einfachere Formeln.
    for (const key of Object.keys(SCUVANYA.attributes)) {
      const attr = this.system.attributes?.[key];
      data[key] = attr?.effectiveValue ?? attr?.value ?? 0;
    }
    return data;
  }

  async rollAttribute(key) {
    const attr = this.system.attributes[key];
    const label = game.i18n.localize(SCUVANYA.attributes[key].label);
    return rollToChat(this, `1d20 + ${attr.mod}`, `${label}-Probe`);
  }

  async rollSocialSkill(polarity, key) {
    const skill = this.system.talents.sozial[polarity][key];
    const chaMod = this.system.attributes.cha.mod;
    const raceBonus = skill.raceBonus ?? 0;
    return rollToChat(this, `1d20 + ${skill.level} + ${chaMod} + ${raceBonus}`, `${this._skillLabel(key)}`);
  }

  async rollScienceSkill(branch, key) {
    const skill = this.system.talents.wissenschaften[branch][key];
    const intMod = this.system.attributes.int.mod;
    const raceBonus = skill.raceBonus ?? 0;
    return rollToChat(this, `1d20 + ${skill.level} + ${intMod} + ${raceBonus}`, `${this._skillLabel(key)}`);
  }

  async rollPhysicalSkill(key) {
    const skill = this.system.talents.koerperlich[key];
    const raceBonus = skill.raceBonus ?? 0;
    return rollToChat(this, `1d20 + ${skill.bonus} + ${raceBonus}`, `${this._skillLabel(key)}`);
  }

  async rollSonderSkill(key) {
    const skill = this.system.talents.sonder[key];
    // PLATZHALTER: Bonusattribut je Sondertalent aus SCUVANYA.sonderSkills, aktuell alles MAG.
    const attrKey = SCUVANYA.sonderSkills[key] ?? "mag";
    const attrMod = this.system.attributes[attrKey].mod;
    const raceBonus = skill.raceBonus ?? 0;
    return rollToChat(this, `1d20 + ${skill.level} + ${attrMod} + ${raceBonus}`, `${this._skillLabel(key)}`);
  }

  async rollHandwerkSkill(key) {
    return this._rollTieredSkill("handwerk", key);
  }

  async rollSpezialSkill(key) {
    return this._rollTieredSkill("spezial", key);
  }

  async _rollTieredSkill(category, key) {
    const skill = this.system.talents[category][key];
    let formula = tieredSkillFormula(skill.level);
    if (!formula) {
      ui.notifications.warn(game.i18n.format("SCUVANYA.Warning.Untrained", { skill: this._skillLabel(key) }));
      return null;
    }
    const raceBonus = skill.raceBonus ?? 0;
    if (raceBonus) formula += ` + ${raceBonus}`;
    return rollToChat(this, formula, `${this._skillLabel(key)}`);
  }

  async rollDiscipline(kind, key) {
    const discipline = this.system.disziplinen[kind][key];
    const raceBonus = discipline.raceBonus ?? 0;
    return rollToChat(this, `1d20 + ${discipline.level} + ${raceBonus}`, `${this._disciplineLabel(kind, key)}`);
  }

  /**
   * Zieht Rüstung (physisch/magisch je nach Schadensart-Kategorie) und Resistenz/
   * Verwundbarkeit ab und reduziert die HP entsprechend.
   */
  async applyDamage(amount, damageType) {
    const config = SCUVANYA.damageTypes[damageType];
    if (!config) throw new Error(`Unbekannte Schadensart: ${damageType}`);

    const armorValue = config.category === "physisch"
      ? this.system.armor.physical
      : this.system.armor.magical;
    const afterArmor = Math.max(0, amount - armorValue);

    const resistanceStep = this.system.resistancesEffective?.[damageType] ?? this.system.resistances[damageType] ?? 0;
    const multiplier = SCUVANYA.resistanceMultiplier(resistanceStep);
    const finalDamage = Math.round(afterArmor * multiplier);

    const hp = this.system.resources.hp;
    return this.update({ "system.resources.hp.value": Math.max(0, hp.value - finalDamage) });
  }

  _skillLabel(key) {
    const localized = game.i18n.localize(`SCUVANYA.Skill.${key}`);
    return localized.startsWith("SCUVANYA.") ? key : localized;
  }

  _disciplineLabel(kind, key) {
    const config = kind === "kampf" ? SCUVANYA.combatDisciplines[key] : SCUVANYA.magicDisciplines[key];
    return config ? game.i18n.localize(config.label) : key;
  }
}
