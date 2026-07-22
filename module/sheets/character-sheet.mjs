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
import { describePath } from "../path-labels.mjs";
import { describeConditionNode } from "../rules/conditions.mjs";
import { getActionCatalog } from "../actions/catalog.mjs";

const signed = n => `${n >= 0 ? "+" : ""}${n}`;

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
      openSlot: ScuvanyaCharacterSheet.#onOpenSlot,
      useAction: ScuvanyaCharacterSheet.#onUseAction
    }
  };

  // Überlebt Re-Renders (z.B. nach dem Ausrüsten eines Items), damit Suchtext/Filter-Auswahl
  // im Inventar nicht bei jeder Aktion zurückgesetzt werden -- siehe _wireInventoryToolbar.
  #inventoryFilter = { search: "", flags: new Set() };

  // Ein einzelnes .scv-tooltip-Element pro Render, wiederverwendet für Item- UND Rechen-
  // Tooltips (siehe _wireTooltips). #outsideClickHandler wird vor jedem Neuaufbau entfernt,
  // sonst würden sich bei jedem Re-Render weitere document-Listener ansammeln.
  #tooltipEl = null;
  #outsideClickHandler = null;
  #openTooltipItemId = null;

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

    // Geteilter Attribut-/Kategoriebonus als eigene Tooltip-Zeile (z.B. "Bonus Charisma: 2"),
    // siehe context-helpers.mjs mapLeveledSkills -- fließt in den Wurf ein (siehe
    // documents/actor.mjs _socialSkillFormula etc.), aber NICHT in den auf der Kachel gezeigten
    // Talentwert, der bleibt der reine Talentwert.
    const attrBonusRow = attrKey => {
      const mod = sys.attributes[attrKey].mod;
      const label = `${game.i18n.localize("SCUVANYA.Bonus")} ${game.i18n.localize(SCUVANYA.attributes[attrKey].label)}`;
      return () => ({ label, amount: mod });
    };
    const koerperlichBonusRow = key => {
      const amount = sys.talents.koerperlich[key]?.bonus ?? 0;
      const label = `${game.i18n.localize("SCUVANYA.Bonus")} (${game.i18n.localize("SCUVANYA.Category.bonusAverage")})`;
      return { label, amount };
    };
    const sonderBonusRow = key => {
      const attrKey = SCUVANYA.sonderSkills[key] ?? "mag";
      return attrBonusRow(attrKey)();
    };

    context.sozialPositiv = mapLeveledSkills(SCUVANYA.socialSkills.positive, sys.talents.sozial.positiv, attrBonusRow("cha"));
    context.sozialNegativ = mapLeveledSkills(SCUVANYA.socialSkills.negative, sys.talents.sozial.negativ, attrBonusRow("cha"));
    context.wissenschaftenSozial = mapLeveledSkills(SCUVANYA.scienceSkills.sozial, sys.talents.wissenschaften.sozial, attrBonusRow("int"));
    context.wissenschaftenNatur = mapLeveledSkills(SCUVANYA.scienceSkills.natur, sys.talents.wissenschaften.natur, attrBonusRow("int"));
    context.koerperlich = mapLeveledSkills(SCUVANYA.physicalSkills, sys.talents.koerperlich, koerperlichBonusRow);
    context.sonder = mapLeveledSkills(Object.keys(SCUVANYA.sonderSkills), sys.talents.sonder, sonderBonusRow);
    context.handwerk = mapTieredSkills(SCUVANYA.craftSkills, sys.talents.handwerk);
    context.spezial = mapTieredSkills(SCUVANYA.spezialSkills, sys.talents.spezial);
    context.extra = mapBooleanSkills(SCUVANYA.extraSkills, sys.talents.extra);

    context.kampfDisziplinen = mapDisciplines(SCUVANYA.combatDisciplines, sys.disziplinen.kampf);
    context.magieDisziplinen = mapDisciplines(SCUVANYA.magicDisciplines, sys.disziplinen.magie);

    // Kategorie-Bonus, der auf JEDEN Wurf der Kategorie addiert wird (siehe documents/actor.mjs
    // rollSocialSkill/rollScienceSkill/rollSonderSkill) -- wird im Card-Header angezeigt statt
    // redundant in jeder einzelnen Zeile.
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
    await this._prepareActionsContext(context);

    return context;
  }

  /**
   * Baut die gruppierte "Seite für verfügbare Aktionen" (siehe Konversation): lädt den
   * zentralen Aktionskatalog (siehe module/actions/catalog.mjs) und behält NUR die Aktionen,
   * die dieser Charakter aktuell nutzen kann (siehe actor.isActionAvailable) -- gesperrte
   * Aktionen werden gar nicht erst angezeigt, es gibt keinen "ausgegraut"-Zustand.
   */
  async _prepareActionsContext(context) {
    const catalog = await getActionCatalog();
    const byCategory = { talenteinsatz: [], attacke: [], zauber: [] };

    for (const action of catalog) {
      const availability = this.actor.isActionAvailable(action);
      if (!availability.unlocked) continue;
      byCategory[action.system.category]?.push(this._buildActionTileData(action, availability));
    }

    context.actionGroups = Object.entries(SCUVANYA.actionCategories).map(([key, cfg]) => ({
      key,
      label: game.i18n.localize(cfg.label),
      actions: byCategory[key] ?? []
    }));
  }

  /**
   * Aufbereitung EINER Aktion für Kachel + Tooltip: die Kachel zeigt nur die bereits
   * verschmolzenen, effektiven AP-/Mana-Kosten (siehe Konversation: "Die Beschriftung in der UI
   * zeigt aber immer den vollständigen Bonus an"); die itemisierte Rechnung (Basis + je
   * Modifikator-Quelle + Gesamt) liefert der Tooltip über dieselbe breakdown-tooltip.hbs wie
   * Attribute/Talente (siehe actor.effectiveActionCostBreakdown).
   */
  _buildActionTileData(action, availability) {
    const sys = action.system;
    const apBreakdown = this.actor.effectiveActionCostBreakdown(action, "ap");
    const manaBreakdown = this.actor.effectiveActionCostBreakdown(action, "mana");

    const weapon = sys.rollSource === "weaponCategory" ? this.actor._primaryEquippedWeapon() : null;
    const damageFormula = sys.damageFromWeapon ? (weapon?.system.damageFormula ?? null) : (sys.damageFormula || null);

    return {
      uuid: action.uuid,
      name: action.name,
      img: action.img,
      category: sys.category,
      costAp: apBreakdown.total,
      costMana: manaBreakdown.total,
      rollLabel: this._actionRollLabel(action, weapon),
      tooltip: {
        description: sys.description ?? "",
        apBreakdown: sys.costAp || apBreakdown.rows.length > 1 ? apBreakdown : null,
        manaBreakdown: sys.costMana || manaBreakdown.rows.length > 1 ? manaBreakdown : null,
        unlockReason: availability.reason,
        unlockedByText: availability.source
          ? game.i18n.format("SCUVANYA.Action.UnlockedBy", { source: availability.source })
          : null,
        conditionsText: sys.unlockConditions?.type ? describeConditionNode(sys.unlockConditions) : null,
        effects: sys.effects ?? [],
        damageFormula
      }
    };
  }

  /** Beschriftet, worauf eine Aktion tatsächlich würfelt -- bei "weaponCategory" abhängig von der ausgerüsteten Waffe. */
  _actionRollLabel(action, weapon) {
    const sys = action.system;
    if (sys.rollSource === "discipline" || sys.rollSource === "skill") return describePath(sys.rollPath);
    if (sys.rollSource === "attribute") return describePath(sys.rollPath);
    if (sys.rollSource === "weaponCategory") {
      return weapon?.system.discipline ? this.actor._disciplineLabel("kampf", weapon.system.discipline) : null;
    }
    return null;
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

    const equippedSlotLabelByItemId = {};
    for (const [slotKey, itemId] of Object.entries(sys.equipment.slots)) {
      if (itemId) equippedSlotLabelByItemId[itemId] = game.i18n.localize(SCUVANYA.equipSlots[slotKey].label);
    }

    const slotsByCategory = { ruestung: [], schmuck: [], hand: [] };
    for (const [key, cfg] of Object.entries(SCUVANYA.equipSlots)) {
      const itemId = sys.equipment.slots[key];
      const item = itemId ? this.actor.items.get(itemId) : null;
      slotsByCategory[cfg.category].push({
        key,
        label: game.i18n.localize(cfg.label),
        iconKey: ICON_KEYS[key],
        item: item ? { id: item.id, name: item.name, img: item.img, tooltip: this._buildItemTooltipData(item, true) } : null
      });
    }
    context.slotsRuestung = slotsByCategory.ruestung;
    context.slotsSchmuck = slotsByCategory.schmuck;
    context.slotsHand = slotsByCategory.hand;

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
          equippedSlotLabel: equippedSlotLabelByItemId[i.id] ?? null,
          tooltip: this._buildItemTooltipData(i, Boolean(equippedSlotLabelByItemId[i.id]))
        };
      });
    context.allFlags = [...new Set(context.inventoryItems.flatMap(i => i.flags))].sort();
  }

  /**
   * Alle Infos für den Item-Tooltip (siehe templates/actor/parts/item-tooltip.hbs): Flags,
   * Slot, Bedingungen MIT Erfüllungsstatus (siehe actor.evaluateConditions) und Effekte MIT
   * aktivem/inaktivem Status (ein "equipped"-Effekt zählt nur, wenn isEquipped true ist).
   */
  _buildItemTooltipData(item, isEquipped) {
    const conditions = this.actor.evaluateConditions(item).map(c => ({
      text: `${describePath(c.path)} ${game.i18n.localize(SCUVANYA.conditionOperators[c.operator])} ${c.value} ` +
        game.i18n.format("SCUVANYA.Item.ConditionActual", { value: c.actual }),
      met: c.met
    }));

    const effects = (item.system.effects ?? []).map(effect => ({
      text: effect.kind === "text" ? effect.text : `${describePath(effect.path, effect.amount)} ${signed(effect.amount)}`,
      conditionLabel: game.i18n.localize(effect.condition === "carried" ? "SCUVANYA.Equipment.conditionCarried" : "SCUVANYA.Equipment.conditionEquipped"),
      active: effect.condition === "carried" || isEquipped
    }));

    return {
      description: item.system.description ?? "",
      typeLabel: game.i18n.localize(`SCUVANYA.ItemType.${item.type}`),
      flags: (item.system.flags ?? []).filter(Boolean),
      slotLabel: item.system.slot ? game.i18n.localize(`SCUVANYA.ItemSlotValue.${item.system.slot}`) : null,
      conditions,
      effects
    };
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

  static async #onUseAction(event, target) {
    const uuid = target.closest("[data-action-uuid]")?.dataset.actionUuid;
    if (!uuid) return;
    const action = await fromUuid(uuid);
    if (action) await this.actor.useAction(action);
  }

  _onRender(context, options) {
    super._onRender(context, options);
    this._wireInventoryToolbar();
    this._wireTooltips();
  }

  /** @override -- Verhindert einen liegenbleibenden document-Klick-Listener nach Sheet-Schließen. */
  async close(options) {
    if (this.#outsideClickHandler) document.removeEventListener("click", this.#outsideClickHandler);
    return super.close(options);
  }

  /**
   * Grundlegender, überall wiederverwendeter Tooltip-Mechanismus (siehe .scv-tooltip in
   * scuvanya.css): EIN Tooltip-Element pro Render, dessen Inhalt beim Öffnen aus einem
   * versteckten, vorgerenderten ".tooltip-content"-Block direkt im auslösenden Element
   * geklont wird (siehe item-tooltip.hbs/breakdown-tooltip.hbs) -- kein HTML-Bau in JS nötig.
   *
   * [data-item-tooltip="click"]  -- Inventarliste: Klick auf das Item-Bild öffnet/schließt.
   * [data-item-tooltip="hover"]  -- Ausgerüstete Slot-Plättchen: sofort bei Hover.
   * [data-breakdown-tooltip]     -- Attribute/Talente/Disziplinen: erst nach 2s Hover.
   */
  _wireTooltips() {
    if (this.#outsideClickHandler) document.removeEventListener("click", this.#outsideClickHandler);
    // this.element (der Application-Rahmen) überlebt Re-Renders unverändert -- nur der
    // Inhalt von .window-content wird ersetzt. Ohne dieses Aufräumen würde bei JEDEM Render
    // (z.B. nach dem Ausrüsten eines Items) ein weiteres .scv-tooltip-Element angehängt, das
    // nie wieder entfernt wird und sich unten im Fenster als sichtbarer Block stapelt.
    this.#tooltipEl?.remove();

    const tooltip = document.createElement("div");
    tooltip.className = "scv-tooltip";
    this.element.appendChild(tooltip);
    this.#tooltipEl = tooltip;
    this.#openTooltipItemId = null;

    const hide = () => {
      tooltip.classList.remove("scv-tooltip--visible");
      this.#openTooltipItemId = null;
    };

    const show = el => {
      const contentEl = el.querySelector(":scope > .tooltip-content");
      if (!contentEl) return;
      tooltip.innerHTML = contentEl.innerHTML;
      tooltip.classList.add("scv-tooltip--visible");

      const rect = el.getBoundingClientRect();
      const tw = tooltip.offsetWidth;
      const th = tooltip.offsetHeight;
      let left = rect.left;
      let top = rect.bottom + 8;
      if (left + tw > window.innerWidth - 8) left = window.innerWidth - tw - 8;
      if (top + th > window.innerHeight - 8) top = rect.top - th - 8;
      tooltip.style.left = `${Math.max(8, left)}px`;
      tooltip.style.top = `${Math.max(8, top)}px`;
    };

    for (const el of this.element.querySelectorAll('[data-item-tooltip="click"]')) {
      el.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        const itemId = el.closest("[data-item-id]")?.dataset.itemId;
        if (this.#openTooltipItemId === itemId) { hide(); return; }
        this.#openTooltipItemId = itemId;
        show(el);
      });
    }

    for (const el of this.element.querySelectorAll('[data-item-tooltip="hover"]')) {
      el.addEventListener("mouseenter", () => show(el));
      el.addEventListener("mouseleave", hide);
    }

    for (const el of this.element.querySelectorAll("[data-breakdown-tooltip]")) {
      let timer = null;
      el.addEventListener("mouseenter", () => {
        timer = setTimeout(() => show(el), 2000);
      });
      el.addEventListener("mouseleave", () => {
        clearTimeout(timer);
        hide();
      });
    }

    this.#outsideClickHandler = event => {
      if (!tooltip.contains(event.target) && !event.target.closest('[data-item-tooltip="click"]')) hide();
    };
    document.addEventListener("click", this.#outsideClickHandler);
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
