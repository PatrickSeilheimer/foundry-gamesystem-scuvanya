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
    // Initiative-Boni aus Eigenschaften (Pfad "initiative", siehe path-resolve.mjs) --
    // nur Charaktere kennen das, NSCs bleiben bei 0 (kein Eigenschaften-System dort).
    data.initiativeBonus = this.system.initiativeBonus ?? 0;
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
    const bonus = (skill.raceBonus ?? 0) + (skill.itemBonus ?? 0);
    return rollToChat(this, `1d20 + ${skill.level} + ${chaMod} + ${bonus}`, `${this._skillLabel(key)}`);
  }

  async rollScienceSkill(branch, key) {
    const skill = this.system.talents.wissenschaften[branch][key];
    const intMod = this.system.attributes.int.mod;
    const bonus = (skill.raceBonus ?? 0) + (skill.itemBonus ?? 0);
    return rollToChat(this, `1d20 + ${skill.level} + ${intMod} + ${bonus}`, `${this._skillLabel(key)}`);
  }

  async rollPhysicalSkill(key) {
    const skill = this.system.talents.koerperlich[key];
    const bonus = (skill.raceBonus ?? 0) + (skill.itemBonus ?? 0);
    return rollToChat(this, `1d20 + ${skill.bonus} + ${bonus}`, `${this._skillLabel(key)}`);
  }

  async rollSonderSkill(key) {
    const skill = this.system.talents.sonder[key];
    // PLATZHALTER: Bonusattribut je Sondertalent aus SCUVANYA.sonderSkills, aktuell alles MAG.
    const attrKey = SCUVANYA.sonderSkills[key] ?? "mag";
    const attrMod = this.system.attributes[attrKey].mod;
    const bonus = (skill.raceBonus ?? 0) + (skill.itemBonus ?? 0);
    return rollToChat(this, `1d20 + ${skill.level} + ${attrMod} + ${bonus}`, `${this._skillLabel(key)}`);
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
    const bonus = (skill.raceBonus ?? 0) + (skill.itemBonus ?? 0);
    if (bonus) formula += ` + ${bonus}`;
    return rollToChat(this, formula, `${this._skillLabel(key)}`);
  }

  async rollDiscipline(kind, key) {
    const discipline = this.system.disziplinen[kind][key];
    const bonus = (discipline.raceBonus ?? 0) + (discipline.itemBonus ?? 0);
    return rollToChat(this, `1d20 + ${discipline.level} + ${bonus}`, `${this._disciplineLabel(kind, key)}`);
  }

  /**
   * Zieht Rüstung (physisch/magisch je nach Schadensart-Kategorie) und Resistenz/
   * Verwundbarkeit ab und reduziert die HP entsprechend.
   */
  async applyDamage(amount, damageType) {
    const config = SCUVANYA.damageTypes[damageType];
    if (!config) throw new Error(`Unbekannte Schadensart: ${damageType}`);

    const armorValue = config.category === "physisch"
      ? (this.system.armorEffective?.physical ?? this.system.armor.physical)
      : (this.system.armorEffective?.magical ?? this.system.armor.magical);
    const afterArmor = Math.max(0, amount - armorValue);

    const resistanceStep = this.system.resistancesEffective?.[damageType] ?? this.system.resistances[damageType] ?? 0;
    const multiplier = SCUVANYA.resistanceMultiplier(resistanceStep);
    const finalDamage = Math.round(afterArmor * multiplier);

    const hp = this.system.resources.hp;
    return this.update({ "system.resources.hp.value": Math.max(0, hp.value - finalDamage) });
  }

  static #CONDITION_COMPARATORS = {
    gte: (a, b) => a >= b,
    lte: (a, b) => a <= b,
    eq: (a, b) => a === b,
    gt: (a, b) => a > b,
    lt: (a, b) => a < b
  };

  /**
   * Liest den aktuellen (effektiven) Wert für einen Bedingungs-Pfad. Attribute lösen bewusst
   * auf "effectiveValue" auf (Basis + Rassen-/Berufsbonus + Ausrüstungsbonus), damit z.B. eine
   * STR-Bedingung den tatsächlich wirksamen Wert prüft, nicht nur die reine Basis.
   */
  _resolveConditionValue(path) {
    if (path.startsWith("attributes.")) {
      const key = path.slice("attributes.".length);
      return this.system.attributes[key]?.effectiveValue ?? 0;
    }
    const current = foundry.utils.getProperty(this.system, path);
    return typeof current === "number" ? current : 0;
  }

  /**
   * Wertet jede einzelne Ausrüstungs-Voraussetzung eines Items aus und gibt sie MIT
   * Erfüllungsstatus zurück (für den Item-Tooltip, siehe character-sheet.mjs) -- anders als
   * canEquipItem, das nur das Gesamtergebnis (alle erfüllt?) liefert.
   */
  evaluateConditions(item) {
    return (item.system.conditions ?? []).filter(c => c.path).map(condition => {
      const compare = ScuvanyaActor.#CONDITION_COMPARATORS[condition.operator] ?? ScuvanyaActor.#CONDITION_COMPARATORS.gte;
      const actual = this._resolveConditionValue(condition.path);
      return { ...condition, actual, met: compare(actual, condition.value) };
    });
  }

  /** Prüft, ob alle Ausrüstungs-Voraussetzungen eines Items erfüllt sind (siehe equipment-shared.mjs). */
  canEquipItem(item) {
    return this.evaluateConditions(item).every(c => c.met);
  }

  /**
   * Rüstet ein Item in einem Slot aus (ersetzt ggf. das vorher dort steckende Item). Prüft
   * Slot-Kompatibilität (item.system.slot muss in SCUVANYA.equipSlots[slotKey].accepts stehen)
   * und die Ausrüstungs-Voraussetzungen (canEquipItem). Gibt false zurück und zeigt eine Warnung,
   * wenn eine der beiden Prüfungen fehlschlägt.
   *
   * Zweihändige Waffen (item.system.slot === "beidhaendig") belegen IMMER beide Hand-Slots
   * gleichzeitig, egal über welche der beiden Popups sie ausgerüstet wurden -- was auch immer
   * vorher in Haupt-/Nebenhand steckte, weicht dafür vollständig.
   */
  async equipItem(slotKey, itemId) {
    const slotConfig = SCUVANYA.equipSlots[slotKey];
    if (!slotConfig) return false;
    const item = this.items.get(itemId);
    if (!item || !slotConfig.accepts.includes(item.system.slot)) {
      ui.notifications.warn(game.i18n.localize("SCUVANYA.Warning.SlotMismatch"));
      return false;
    }
    if (!this.canEquipItem(item)) {
      ui.notifications.warn(game.i18n.format("SCUVANYA.Warning.ConditionsNotMet", { item: item.name }));
      return false;
    }

    const isTwoHanded = item.system.slot === "beidhaendig";
    const slots = foundry.utils.deepClone(this.system.equipment.slots);
    if (isTwoHanded) {
      slots.hauptHand = "";
      slots.nebenHand = "";
    } else {
      this.#clearStaleTwoHander(slots, slotKey);
    }
    for (const key of isTwoHanded ? ["hauptHand", "nebenHand"] : [slotKey]) slots[key] = itemId;

    await this.update({ "system.equipment.slots": slots });
    return true;
  }

  async unequipSlot(slotKey) {
    if (!SCUVANYA.equipSlots[slotKey]) return;
    const slots = foundry.utils.deepClone(this.system.equipment.slots);
    this.#clearStaleTwoHander(slots, slotKey) || (slots[slotKey] = "");
    await this.update({ "system.equipment.slots": slots });
  }

  /**
   * Falls slotKey Haupt- oder Nebenhand ist UND beide Hände aktuell auf dieselbe Item-ID
   * zeigen (= eine Zweihandwaffe steckt dort), müssen BEIDE geleert werden -- sonst "geistert"
   * die Zweihandwaffe in der jeweils anderen Hand weiter. Gibt true zurück, wenn genau das
   * passiert ist (Aufrufer muss dann slotKey nicht mehr separat leeren).
   */
  #clearStaleTwoHander(slots, slotKey) {
    const isHandSlot = slotKey === "hauptHand" || slotKey === "nebenHand";
    const twoHandedEquipped = isHandSlot && slots.hauptHand && slots.hauptHand === slots.nebenHand;
    if (!twoHandedEquipped) return false;
    slots.hauptHand = "";
    slots.nebenHand = "";
    return true;
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
