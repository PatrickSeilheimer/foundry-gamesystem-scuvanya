import { SCUVANYA } from "../config.mjs";
import BaseActorSheet from "./base-actor-sheet.mjs";
import {
  mapLeveledSkills,
  mapTieredSkills,
  mapBooleanSkills,
  mapDisciplines,
  mapAttributes
} from "./context-helpers.mjs";
import CharacterCreationWizard from "../apps/character-creation.mjs";
import EquipPickerApp from "../apps/equip-picker.mjs";

/**
 * Der Bogen ist bewusst rein lesend/würfelnd für Attribute, Talente und Disziplinen --
 * Punkte verteilen (Attribut-/Talent-/Disziplin-Käufe) passiert bis zu einem künftigen
 * Level-Up-Modus ausschließlich im Charaktererstellungs-Wizard (siehe "Edit"-Button im
 * Header). Das Sheet zeigt deshalb überall die bereits verschmolzene Summe aus Basiswert
 * und Rassen-/Berufsbonus (siehe context-helpers.mjs), nie eine Aufschlüsselung.
 */
export default class ScuvanyaCharacterSheet extends BaseActorSheet {
  static DEFAULT_TAB = "attribute";

  static DEFAULT_OPTIONS = {
    classes: ["scuvanya", "sheet", "actor", "character"],
    position: { width: 900, height: 820 },
    actions: {
      rollAttribute: ScuvanyaCharacterSheet.#onRollAttribute,
      rollSocialSkill: ScuvanyaCharacterSheet.#onRollSocialSkill,
      rollScienceSkill: ScuvanyaCharacterSheet.#onRollScienceSkill,
      rollPhysicalSkill: ScuvanyaCharacterSheet.#onRollPhysicalSkill,
      rollSonderSkill: ScuvanyaCharacterSheet.#onRollSonderSkill,
      rollHandwerkSkill: ScuvanyaCharacterSheet.#onRollHandwerkSkill,
      rollSpezialSkill: ScuvanyaCharacterSheet.#onRollSpezialSkill,
      rollDiscipline: ScuvanyaCharacterSheet.#onRollDiscipline,
      openCreationWizard: ScuvanyaCharacterSheet.#onOpenCreationWizard,
      openSlot: ScuvanyaCharacterSheet.#onOpenSlot
    }
  };

  // Überlebt Re-Renders (z.B. nach dem Ausrüsten eines Items), damit Suchtext/Filter-Auswahl
  // im Inventar nicht bei jeder Aktion zurückgesetzt werden -- siehe _wireInventoryToolbar.
  #inventoryFilter = { search: "", flags: new Set() };

  static PARTS = {
    form: { template: "systems/scuvanya/templates/actor/character-sheet.hbs", scrollable: [".sheet-body"] }
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
    context.handwerk = mapTieredSkills(SCUVANYA.craftSkills, sys.talents.handwerk);
    context.spezial = mapTieredSkills(SCUVANYA.spezialSkills, sys.talents.spezial);
    context.extra = mapBooleanSkills(SCUVANYA.extraSkills, sys.talents.extra);

    context.kampfDisziplinen = mapDisciplines(SCUVANYA.combatDisciplines, sys.disziplinen.kampf);
    context.magieDisziplinen = mapDisciplines(SCUVANYA.magicDisciplines, sys.disziplinen.magie);

    // Kategorie-Bonus, der auf JEDEN Wurf der Kategorie addiert wird (siehe documents/actor.mjs
    // rollSocialSkill/rollScienceSkill/rollSonderSkill) -- wird im Card-Header angezeigt statt
    // redundant in jeder einzelnen Zeile.
    const signed = n => `${n >= 0 ? "+" : ""}${n}`;
    const bonusLabel = (mod, suffixKey) =>
      `${game.i18n.localize("SCUVANYA.Bonus")}: ${signed(mod)} (${game.i18n.localize(suffixKey)})`;
    context.sozialBonusLabel = bonusLabel(sys.attributes.cha.mod, "SCUVANYA.Category.bonusChaMod");
    context.wissenschaftBonusLabel = bonusLabel(sys.attributes.int.mod, "SCUVANYA.Category.bonusIntMod");
    context.sonderBonusLabel = bonusLabel(sys.attributes.mag.mod, "SCUVANYA.Category.bonusMagMod");
    context.koerperlichBonusLabel = bonusLabel(context.koerperlich[0]?.bonus ?? 0, "SCUVANYA.Category.bonusAverage");

    context.gemeinsprache = sys.sprachen.gemeinsprache;
    // Nur tatsächlich beherrschte Sprachen (Stufe >= 1) -- die Übersicht ist eine reine
    // Zusammenfassung, keine Bearbeitungsmaske (siehe Klassenkommentar).
    context.weitereSprachen = sys.sprachen.weitere.filter(s => s.level >= 1);

    context.items = {
      weapon: this.actor.items.filter(i => i.type === "weapon"),
      armor: this.actor.items.filter(i => i.type === "armor"),
      consumable: this.actor.items.filter(i => i.type === "consumable"),
      equipment: this.actor.items.filter(i => i.type === "equipment"),
      race: this.actor.items.find(i => i.type === "race") ?? null,
      profession: this.actor.items.find(i => i.type === "profession") ?? null
    };

    context.resistanceChips = this._resistanceChips(sys.resistancesEffective);

    const race = context.items.race;
    const subraceKey = race?.system.subraceKey;
    context.subraceName = subraceKey
      ? race.system.subraces.find(s => s.key === subraceKey)?.name ?? null
      : null;

    this._prepareEquipmentContext(context, sys);

    return context;
  }

  /** Slot-Leiste (Übersicht je Slot) + durchsuchbare/filterbare Gesamtliste fürs Inventar. */
  _prepareEquipmentContext(context, sys) {
    // Ring links/rechts teilen sich denselben Platzhalter-Icon-Umriss (siehe slot-chip.hbs),
    // weil beide dieselbe Art Item annehmen (system.slot === "ring").
    const ICON_KEYS = {
      kopf: "kopf", brust: "brust", arme: "arme", beine: "beine", fuesse: "fuesse",
      ohrringe: "ohrringe", halskette: "halskette", armbaender: "armbaender",
      ringLinks: "ring", ringRechts: "ring", hauptHand: "hauptHand", nebenHand: "nebenHand"
    };

    const slotsByCategory = { ruestung: [], schmuck: [], hand: [] };
    for (const [key, cfg] of Object.entries(SCUVANYA.equipSlots)) {
      const itemId = sys.equipment.slots[key];
      const item = itemId ? this.actor.items.get(itemId) : null;
      slotsByCategory[cfg.category].push({
        key,
        label: game.i18n.localize(cfg.label),
        iconKey: ICON_KEYS[key],
        item: item ? { id: item.id, name: item.name, img: item.img } : null
      });
    }
    context.slotsRuestung = slotsByCategory.ruestung;
    context.slotsSchmuck = slotsByCategory.schmuck;
    context.slotsHand = slotsByCategory.hand;

    const equippedSlotLabelByItemId = {};
    for (const [slotKey, itemId] of Object.entries(sys.equipment.slots)) {
      if (itemId) equippedSlotLabelByItemId[itemId] = game.i18n.localize(SCUVANYA.equipSlots[slotKey].label);
    }

    context.inventoryItems = this.actor.items
      .filter(i => ["weapon", "armor", "equipment", "consumable"].includes(i.type))
      .map(i => {
        const flags = (i.system.flags ?? []).filter(Boolean);
        return {
          id: i.id,
          name: i.name,
          img: i.img,
          type: i.type,
          typeLabel: game.i18n.localize(`SCUVANYA.ItemType.${i.type}`),
          flags,
          flagsJoined: flags.join("|"),
          equippedSlotLabel: equippedSlotLabelByItemId[i.id] ?? null
        };
      });
    context.allFlags = [...new Set(context.inventoryItems.flatMap(i => i.flags))].sort();
  }

  /** Nur von 0 abweichende Resistenzen/Verwundbarkeiten -- siehe SCUVANYA.resistanceSteps. */
  _resistanceChips(resistancesEffective) {
    const chips = [];
    for (const [key, cfg] of Object.entries(SCUVANYA.damageTypes)) {
      const value = resistancesEffective[key] ?? 0;
      if (!value) continue;
      const typ = value >= 100 ? "immun" : value > 0 ? "resistent" : "verwundbar";
      const label = typ === "immun"
        ? game.i18n.localize("SCUVANYA.Resistance.immun")
        : `${game.i18n.localize(`SCUVANYA.Resistance.${typ}`)} (${Math.abs(value)}%)`;
      chips.push({ key, name: game.i18n.localize(cfg.label), typ, label });
    }
    return chips;
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

  static #onOpenCreationWizard() {
    new CharacterCreationWizard(this.actor).render(true);
  }

  static #onOpenSlot(event, target) {
    new EquipPickerApp(this.actor, target.dataset.slot).render(true);
  }

  _onRender(context, options) {
    super._onRender(context, options);
    this._wireInventoryToolbar();
  }

  /**
   * Rein clientseitiges Filtern/Sortieren (kein Server-Roundtrip nötig) -- Suchtext und
   * ausgewählte Flag-Filter werden in #inventoryFilter gehalten, damit sie einen Re-Render
   * (z.B. nach dem Ausrüsten eines Items im Popup) überleben.
   */
  _wireInventoryToolbar() {
    const list = this.element.querySelector(".inventory-list");
    if (!list) return;

    const search = this.element.querySelector(".inventory-search");
    if (search) {
      search.value = this.#inventoryFilter.search;
      search.addEventListener("input", () => {
        this.#inventoryFilter.search = search.value;
        this._applyInventoryFilter();
      });
    }

    for (const chip of this.element.querySelectorAll(".inventory-flag-filter")) {
      if (this.#inventoryFilter.flags.has(chip.dataset.flag)) chip.classList.add("selected");
      chip.addEventListener("click", () => {
        const flag = chip.dataset.flag;
        if (this.#inventoryFilter.flags.has(flag)) {
          this.#inventoryFilter.flags.delete(flag);
          chip.classList.remove("selected");
        } else {
          this.#inventoryFilter.flags.add(flag);
          chip.classList.add("selected");
        }
        this._applyInventoryFilter();
      });
    }

    for (const btn of this.element.querySelectorAll(".inventory-sort-btn")) {
      btn.addEventListener("click", () => {
        const key = btn.dataset.sort;
        const rows = Array.from(list.querySelectorAll(".inventory-row"));
        rows.sort((a, b) => (a.dataset[key] ?? "").localeCompare(b.dataset[key] ?? ""));
        for (const row of rows) list.appendChild(row);
      });
    }

    this._applyInventoryFilter();
  }

  _applyInventoryFilter() {
    const list = this.element.querySelector(".inventory-list");
    if (!list) return;
    const term = this.#inventoryFilter.search.toLowerCase();
    const activeFlags = this.#inventoryFilter.flags;
    for (const row of list.querySelectorAll(".inventory-row")) {
      const matchesSearch = !term || (row.dataset.name ?? "").toLowerCase().includes(term);
      const rowFlags = (row.dataset.flags ?? "").split("|").filter(Boolean);
      const matchesFlags = activeFlags.size === 0 || rowFlags.some(f => activeFlags.has(f));
      row.style.display = (matchesSearch && matchesFlags) ? "" : "none";
    }
  }
}
