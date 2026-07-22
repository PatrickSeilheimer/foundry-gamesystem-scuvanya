import { SCUVANYA } from "../config.mjs";
import { tieredSkillFormula, rollToChat } from "../dice.mjs";
import { CONDITION_COMPARATORS, evaluateConditionNode } from "../rules/conditions.mjs";

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

  _socialSkillFormula(polarity, key) {
    const skill = this.system.talents.sozial[polarity][key];
    const chaMod = this.system.attributes.cha.mod;
    const bonus = (skill.raceBonus ?? 0) + (skill.itemBonus ?? 0);
    return `1d20 + ${skill.level} + ${chaMod} + ${bonus}`;
  }

  async rollSocialSkill(polarity, key) {
    return rollToChat(this, this._socialSkillFormula(polarity, key), `${this._skillLabel(key)}`);
  }

  _scienceSkillFormula(branch, key) {
    const skill = this.system.talents.wissenschaften[branch][key];
    const intMod = this.system.attributes.int.mod;
    const bonus = (skill.raceBonus ?? 0) + (skill.itemBonus ?? 0);
    return `1d20 + ${skill.level} + ${intMod} + ${bonus}`;
  }

  async rollScienceSkill(branch, key) {
    return rollToChat(this, this._scienceSkillFormula(branch, key), `${this._skillLabel(key)}`);
  }

  _physicalSkillFormula(key) {
    const skill = this.system.talents.koerperlich[key];
    const bonus = (skill.raceBonus ?? 0) + (skill.itemBonus ?? 0);
    return `1d20 + ${skill.bonus} + ${bonus}`;
  }

  async rollPhysicalSkill(key) {
    return rollToChat(this, this._physicalSkillFormula(key), `${this._skillLabel(key)}`);
  }

  _sonderSkillFormula(key) {
    const skill = this.system.talents.sonder[key];
    // PLATZHALTER: Bonusattribut je Sondertalent aus SCUVANYA.sonderSkills, aktuell alles MAG.
    const attrKey = SCUVANYA.sonderSkills[key] ?? "mag";
    const attrMod = this.system.attributes[attrKey].mod;
    const bonus = (skill.raceBonus ?? 0) + (skill.itemBonus ?? 0);
    return `1d20 + ${skill.level} + ${attrMod} + ${bonus}`;
  }

  async rollSonderSkill(key) {
    return rollToChat(this, this._sonderSkillFormula(key), `${this._skillLabel(key)}`);
  }

  async rollHandwerkSkill(key) {
    return this._rollTieredSkill("handwerk", key);
  }

  async rollSpezialSkill(key) {
    return this._rollTieredSkill("spezial", key);
  }

  /** Formel für einen Stufenwürfel-Talent (Handwerk/Spezial) -- null, wenn untrained (Stufe 0). */
  _tieredSkillFormula(category, key) {
    const skill = this.system.talents[category][key];
    let formula = tieredSkillFormula(skill.level);
    if (!formula) return null;
    const bonus = (skill.raceBonus ?? 0) + (skill.itemBonus ?? 0);
    if (bonus) formula += ` + ${bonus}`;
    return formula;
  }

  async _rollTieredSkill(category, key) {
    const formula = this._tieredSkillFormula(category, key);
    if (!formula) {
      ui.notifications.warn(game.i18n.format("SCUVANYA.Warning.Untrained", { skill: this._skillLabel(key) }));
      return null;
    }
    return rollToChat(this, formula, `${this._skillLabel(key)}`);
  }

  _disciplineFormula(kind, key) {
    const discipline = this.system.disziplinen[kind][key];
    const bonus = (discipline.raceBonus ?? 0) + (discipline.itemBonus ?? 0);
    return `1d20 + ${discipline.level} + ${bonus}`;
  }

  async rollDiscipline(kind, key) {
    return rollToChat(this, this._disciplineFormula(kind, key), `${this._disciplineLabel(kind, key)}`);
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

  /**
   * Liest den aktuellen (effektiven) Wert für einen Bedingungs-Pfad. Attribute lösen bewusst
   * auf "effectiveValue" auf (Basis + Rassen-/Berufsbonus + Ausrüstungsbonus); Talente/
   * Disziplinen (Objekte mit "level") lösen auf level + raceBonus + itemBonus auf, Booleans
   * (z.B. Extra-Fähigkeiten mit "known") auf 1/0 -- damit sowohl Ausrüstungs-Voraussetzungen
   * (equipment-shared.mjs conditionSchema) als auch Aktions-Freischaltbedingungen (action.mjs
   * unlockConditions, siehe rules/conditions.mjs) denselben, vollständig aufgelösten Wert prüfen.
   */
  _resolveConditionValue(path) {
    if (path.startsWith("attributes.")) {
      const key = path.slice("attributes.".length);
      return this.system.attributes[key]?.effectiveValue ?? 0;
    }
    const current = foundry.utils.getProperty(this.system, path);
    if (current && typeof current === "object") {
      if (typeof current.level === "number") {
        return current.level + (current.raceBonus ?? 0) + (current.itemBonus ?? 0);
      }
      if (typeof current.known === "boolean") return current.known ? 1 : 0;
    }
    return typeof current === "number" ? current : 0;
  }

  /**
   * Wertet jede einzelne Ausrüstungs-Voraussetzung eines Items aus und gibt sie MIT
   * Erfüllungsstatus zurück (für den Item-Tooltip, siehe character-sheet.mjs) -- anders als
   * canEquipItem, das nur das Gesamtergebnis (alle erfüllt?) liefert.
   */
  evaluateConditions(item) {
    return (item.system.conditions ?? []).filter(c => c.path).map(condition => {
      const compare = CONDITION_COMPARATORS[condition.operator] ?? CONDITION_COMPARATORS.gte;
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

  /** Aktuell ausgerüstete Waffen (Haupt-/Nebenhand, dedupliziert -- eine Zweihandwaffe steckt in beiden). */
  _equippedWeapons() {
    const ids = new Set([this.system.equipment?.slots?.hauptHand, this.system.equipment?.slots?.nebenHand].filter(Boolean));
    return [...ids].map(id => this.items.get(id)).filter(i => i?.type === "weapon");
  }

  /** Für Aktionen mit rollSource "weaponCategory"/damageFromWeapon: Haupthand vor Nebenhand. */
  _primaryEquippedWeapon() {
    const hauptId = this.system.equipment?.slots?.hauptHand;
    const nebenId = this.system.equipment?.slots?.nebenHand;
    return (hauptId && this.items.get(hauptId)) || (nebenId && this.items.get(nebenId)) || null;
  }

  hasEquippedWeapon() {
    return this._equippedWeapons().length > 0;
  }

  hasEquippedWeaponWithFlag(flag) {
    return this._equippedWeapons().some(w => (w.system.flags ?? []).includes(flag));
  }

  /**
   * Baut die Würfelformel für einen Talent-Pfad (system.rollPath einer Aktion mit
   * rollSource "skill") -- deckt alle Talent-Kategorien ab, damit ein Aktions-Klick exakt
   * dieselbe Formel würfelt wie ein Klick direkt auf das Talent (siehe rollSocialSkill etc.).
   */
  _buildTalentRollFormula(path) {
    const parts = path.split(".");
    if (parts[0] !== "talents") return null;
    if (parts[1] === "sozial") return this._socialSkillFormula(parts[2], parts[3]);
    if (parts[1] === "wissenschaften") return this._scienceSkillFormula(parts[2], parts[3]);
    if (parts[1] === "koerperlich") return this._physicalSkillFormula(parts[2]);
    if (parts[1] === "sonder") return this._sonderSkillFormula(parts[2]);
    if (parts[1] === "handwerk") return this._tieredSkillFormula("handwerk", parts[2]);
    if (parts[1] === "spezial") return this._tieredSkillFormula("spezial", parts[2]);
    return null;
  }

  /**
   * Baut die Würfelformel für eine Aktion (siehe action.mjs rollSource/rollPath) --
   * "weaponCategory" löst dynamisch anhand der aktuell ausgerüsteten Waffe auf (Waffenangriff:
   * Krieger/Gauner/Schütze je nach Waffe). Gibt null zurück, wenn kein Wurf möglich ist
   * (z.B. rollSource "none", untrained Handwerk/Spezial, oder keine passende Waffe ausgerüstet).
   */
  _buildActionRollFormula(action) {
    const sys = action.system;
    if (sys.rollSource === "attribute") {
      const key = sys.rollPath.slice("attributes.".length);
      const attr = this.system.attributes[key];
      return attr ? `1d20 + ${attr.mod}` : null;
    }
    if (sys.rollSource === "discipline") {
      const parts = sys.rollPath.split(".");
      return this._disciplineFormula(parts[1], parts[2]);
    }
    if (sys.rollSource === "skill") {
      return this._buildTalentRollFormula(sys.rollPath);
    }
    if (sys.rollSource === "weaponCategory") {
      const weapon = this._primaryEquippedWeapon();
      if (!weapon?.system.discipline) return null;
      return this._disciplineFormula("kampf", weapon.system.discipline);
    }
    return null;
  }

  /**
   * Ermittelt die Tag-Menge, gegen die Kostenmodifikatoren einer Aktion greifen (siehe
   * path-resolve.mjs "actions.apCost.<tag>"): "all" (jede Aktion), die Kategorie, bei
   * discipline-Aktionen die Disziplin, bei weaponCategory die Disziplin der ausgerüsteten Waffe,
   * sowie alle system.tags der Aktion selbst.
   */
  _actionTags(action) {
    const sys = action.system;
    const tags = new Set(["all", sys.category]);
    if (sys.rollSource === "discipline" && sys.rollPath) tags.add(sys.rollPath.split(".").pop());
    if (sys.rollSource === "weaponCategory") {
      const weapon = this._primaryEquippedWeapon();
      if (weapon?.system.discipline) tags.add(weapon.system.discipline);
    }
    for (const tag of sys.tags ?? []) tags.add(tag);
    return tags;
  }

  /**
   * Rechnet die tatsächlichen Kosten einer Aktion für eine Ressource ("ap"/"mana") aus einer
   * Basiszahl + Rassen-/Item-Modifikatoren zusammen -- Rückgabeform ist identisch zu
   * context-helpers.mjs buildBreakdown ({rows, total}), damit dieselbe breakdown-tooltip.hbs
   * wiederverwendet werden kann. Der Rassenanteil fließt OHNE eigene Zeile in "Basis" (siehe
   * applyPathBonuses-Kommentar: Rasse ist die neue Norm, kein Bonus), Item-Effekte bekommen je
   * eine benannte Zeile. Nie negativ (min. 0).
   */
  effectiveActionCostBreakdown(action, resource) {
    const resourceKey = resource === "ap" ? "apCost" : "manaCost";
    const base = resource === "ap" ? action.system.costAp : action.system.costMana;
    const tags = this._actionTags(action);

    const raceMods = this.system._actionRaceCostMods?.[resourceKey] ?? {};
    let folded = base;
    for (const tag of tags) folded += raceMods[tag] ?? 0;

    const rows = [{ label: game.i18n.localize("SCUVANYA.Base"), amount: folded }];
    const itemModBreakdown = this.system._actionItemCostModBreakdown?.[resourceKey] ?? {};
    for (const tag of tags) {
      for (const entry of itemModBreakdown[tag] ?? []) rows.push({ label: entry.name, amount: entry.amount });
    }

    const total = Math.max(0, rows.reduce((sum, row) => sum + row.amount, 0));
    return { rows, total };
  }

  /**
   * Prüft, ob eine Aktion für diesen Charakter verfügbar ist -- entweder weil ihre eigenen
   * Freischaltbedingungen erfüllt sind ("conditions"), oder weil ein Item-Effekt (kind
   * "unlockAction") sie unabhängig davon gewährt ("granted", mit Quellenangabe für den Tooltip,
   * siehe Beispiel "Feuerball"/"Umhang des Pyromanen").
   */
  isActionAvailable(action) {
    if (evaluateConditionNode(action.system.unlockConditions, this)) {
      return { unlocked: true, reason: "conditions" };
    }
    const grant = (this.system.unlockedActions ?? []).find(u => u.key === action.system.key && u.key);
    if (grant) return { unlocked: true, reason: "granted", source: grant.itemName };
    return { unlocked: false, reason: "locked" };
  }

  /**
   * Führt eine Aktion aus: prüft Verfügbarkeit, zieht AP/Mana ab (nach Kostenmodifikatoren),
   * würfelt die Probe (Flavor = Aktionsname, damit der Chat-Log die AKTION zeigt, nicht nur ein
   * blankes Talent, siehe Konversation "Gegner analysieren") und danach ggf. einen Schadenswurf
   * (feste Formel oder aus der ausgerüsteten Waffe ausgelesen).
   */
  async useAction(action) {
    const availability = this.isActionAvailable(action);
    if (!availability.unlocked) {
      ui.notifications.warn(game.i18n.format("SCUVANYA.Action.NotUnlocked", { action: action.name }));
      return null;
    }

    const apCost = this.effectiveActionCostBreakdown(action, "ap").total;
    const manaCost = this.effectiveActionCostBreakdown(action, "mana").total;
    if (apCost > this.system.resources.ap.value) {
      ui.notifications.warn(game.i18n.format("SCUVANYA.Action.InsufficientAp", {
        cost: apCost, available: this.system.resources.ap.value
      }));
      return null;
    }
    if (manaCost > this.system.resources.mana.value) {
      ui.notifications.warn(game.i18n.format("SCUVANYA.Action.InsufficientMana", {
        cost: manaCost, available: this.system.resources.mana.value
      }));
      return null;
    }

    const updates = {};
    if (apCost) updates["system.resources.ap.value"] = this.system.resources.ap.value - apCost;
    if (manaCost) updates["system.resources.mana.value"] = this.system.resources.mana.value - manaCost;
    if (Object.keys(updates).length) await this.update(updates);

    const formula = this._buildActionRollFormula(action);
    if (formula) {
      await rollToChat(this, formula, action.name);
    } else {
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this }),
        content: `<b>${action.name}</b>`
      });
    }

    const weapon = action.system.damageFromWeapon ? this._primaryEquippedWeapon() : null;
    const damageFormula = action.system.damageFromWeapon ? weapon?.system.damageFormula : action.system.damageFormula;
    if (damageFormula) {
      const damageLabel = `${action.name} – ${game.i18n.localize("SCUVANYA.Action.DamageRoll")}`;
      await rollToChat(this, damageFormula, damageLabel);
    }

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
