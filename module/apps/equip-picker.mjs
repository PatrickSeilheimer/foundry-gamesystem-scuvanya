import { SCUVANYA } from "../config.mjs";

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

/**
 * Popup zum Aus-/Umrüsten eines einzelnen Ausrüstungs-Slots (siehe SCUVANYA.equipSlots):
 * zeigt das aktuell ausgerüstete Item (mit einer "Ausziehen"-Option) und darunter eine
 * scrollbare Liste aller passenden, noch nicht ausgerüsteten Items im Besitz des Charakters.
 * Ein Klick auf ein Listenitem ersetzt den Slot-Inhalt sofort (siehe actor.equipItem).
 */
export default class EquipPickerApp extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    classes: ["scuvanya", "character-creation", "equip-picker"],
    position: { width: 380, height: "auto" },
    window: { resizable: false },
    actions: {
      pick: EquipPickerApp.#onPick,
      unequip: EquipPickerApp.#onUnequip
    }
  };

  static PARTS = {
    form: { template: "systems/scuvanya/templates/apps/equip-picker.hbs", scrollable: [".equip-picker-list"] }
  };

  constructor(actor, slotKey, options = {}) {
    super({ id: `scuvanya-equip-picker-${actor.id}-${slotKey}`, ...options });
    this.actor = actor;
    this.slotKey = slotKey;
  }

  get title() {
    return game.i18n.format("SCUVANYA.EquipPicker.Title", {
      slot: game.i18n.localize(SCUVANYA.equipSlots[this.slotKey]?.label ?? this.slotKey)
    });
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const slotConfig = SCUVANYA.equipSlots[this.slotKey];
    const slots = this.actor.system.equipment.slots;
    const equippedIds = new Set(Object.values(slots).filter(Boolean));

    const currentId = slots[this.slotKey];
    context.current = currentId ? this.actor.items.get(currentId) ?? null : null;

    context.candidates = this.actor.items.filter(item =>
      ["weapon", "armor", "equipment"].includes(item.type) &&
      slotConfig.accepts.includes(item.system.slot) &&
      item.id !== currentId &&
      !equippedIds.has(item.id)
    );

    context.slotLabel = game.i18n.localize(slotConfig.label);
    return context;
  }

  static async #onPick(event, target) {
    const itemId = target.closest("[data-item-id]")?.dataset.itemId;
    const ok = await this.actor.equipItem(this.slotKey, itemId);
    if (ok) this.close();
  }

  static async #onUnequip() {
    await this.actor.unequipSlot(this.slotKey);
    this.close();
  }
}
