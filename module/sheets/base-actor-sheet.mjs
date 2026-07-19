const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

/**
 * Gemeinsame Basis für Character- und NPC-Sheet: Item-CRUD und ein selbstgebautes,
 * einfaches Tab-System (bewusst nicht auf Foundrys interne TabsV2-Mechanik gestützt,
 * um Kopplung an API-Details zu vermeiden, die sich zwischen Versionen ändern können).
 */
export default class BaseActorSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["scuvanya", "sheet", "actor"],
    position: { width: 720, height: 800 },
    window: { resizable: true },
    actions: {
      changeTab: BaseActorSheet.#onChangeTab,
      itemCreate: BaseActorSheet.#onItemCreate,
      itemEdit: BaseActorSheet.#onItemEdit,
      itemDelete: BaseActorSheet.#onItemDelete,
      itemToggleEquip: BaseActorSheet.#onItemToggleEquip
    },
    form: { submitOnChange: true }
  };

  constructor(...args) {
    super(...args);
    this.activeTab = this.constructor.DEFAULT_TAB ?? "attribute";
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.actor = this.actor;
    context.system = this.actor.system;
    context.activeTab = this.activeTab;
    return context;
  }

  static #onChangeTab(event, target) {
    this.activeTab = target.dataset.tab;
    this.render();
  }

  static async #onItemCreate(event, target) {
    const type = target.dataset.type;
    if ((type === "race" || type === "profession") && this.actor.items.some(i => i.type === type)) {
      ui.notifications.warn(game.i18n.format("SCUVANYA.Warning.OnlyOne", { type }));
      return;
    }
    const name = game.i18n.format("SCUVANYA.Item.NewName", { type: game.i18n.localize(`SCUVANYA.ItemType.${type}`) });
    await this.actor.createEmbeddedDocuments("Item", [{ name, type }]);
  }

  static #onItemEdit(event, target) {
    const itemId = target.closest("[data-item-id]")?.dataset.itemId;
    this.actor.items.get(itemId)?.sheet.render(true);
  }

  static async #onItemDelete(event, target) {
    const itemId = target.closest("[data-item-id]")?.dataset.itemId;
    await this.actor.items.get(itemId)?.delete();
  }

  static async #onItemToggleEquip(event, target) {
    const itemId = target.closest("[data-item-id]")?.dataset.itemId;
    const item = this.actor.items.get(itemId);
    if (item) await item.update({ "system.equipped": !item.system.equipped });
  }
}
