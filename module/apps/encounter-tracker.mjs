import {
  getInitCounter, isCombatantReady, isRoundOver,
  advanceInitCounter, startNextRound, rollOwnInitiative, rerollNpcs, rerollCharacters
} from "../rules/encounter.mjs";

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

/**
 * Eigenständiges Encounter-Tracker-Fenster (siehe Konversation) -- bewusst KEIN Ersatz für
 * Foundrys eingebaute Combat-Tracker-Sidebar (die bleibt für Token-Auswahl/Verstecken/etc.
 * nutzbar), sondern eine eigene Ansicht speziell für den Init-Zähler-Ablauf: Kämpfer sortiert
 * nach Initiative, Countdown-Zähler, Rundenwechsel, Einzel-/Sammel-Würfe. Ein Button in der
 * echten Combat-Tracker-Sidebar öffnet dieses Fenster (siehe scuvanya.mjs "renderCombatTracker").
 *
 * Singleton (siehe .open()/.current): so können globale Hooks (Combat-/Combatant-/Actor-Updates,
 * siehe scuvanya.mjs) das offene Fenster gezielt neu rendern, ohne mehrere Instanzen zu verwalten.
 */
export default class EncounterTracker extends HandlebarsApplicationMixin(ApplicationV2) {
  static #instance = null;

  static open() {
    if (!EncounterTracker.#instance) EncounterTracker.#instance = new EncounterTracker();
    EncounterTracker.#instance.render(true);
    return EncounterTracker.#instance;
  }

  static get current() {
    return EncounterTracker.#instance;
  }

  static DEFAULT_OPTIONS = {
    id: "scuvanya-encounter-tracker",
    classes: ["scuvanya", "encounter-tracker"],
    position: { width: 360, height: "auto" },
    window: { resizable: true },
    actions: {
      advanceCounter: EncounterTracker.#onAdvanceCounter,
      nextRound: EncounterTracker.#onNextRound,
      rerollNpcs: EncounterTracker.#onRerollNpcs,
      rerollCharacters: EncounterTracker.#onRerollCharacters,
      rollInit: EncounterTracker.#onRollInit
    }
  };

  static PARTS = {
    form: { template: "systems/scuvanya/templates/apps/encounter-tracker.hbs" }
  };

  get title() {
    return game.i18n.localize("SCUVANYA.Encounter.Title");
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const combat = game.combat;
    context.hasCombat = Boolean(combat);
    context.isGM = game.user.isGM;
    if (!combat) return context;

    const counter = getInitCounter(combat);
    context.round = combat.round;
    context.counter = counter;
    context.roundOver = isRoundOver(combat);

    context.combatants = combat.combatants.contents
      .slice()
      .sort((a, b) => (b.initiative ?? -Infinity) - (a.initiative ?? -Infinity))
      .map(c => ({
        id: c.id,
        name: c.name,
        img: c.img,
        initiative: c.initiative,
        ready: isCombatantReady(c, counter),
        ap: c.actor?.system.resources?.ap ?? null,
        canRoll: game.user.isGM || Boolean(c.actor?.isOwner)
      }));

    return context;
  }

  static async #onAdvanceCounter() {
    if (game.combat) await advanceInitCounter(game.combat);
  }

  static async #onNextRound() {
    if (game.combat) await startNextRound(game.combat);
  }

  static async #onRerollNpcs() {
    if (game.combat) await rerollNpcs(game.combat);
  }

  static async #onRerollCharacters() {
    if (game.combat) await rerollCharacters(game.combat);
  }

  static async #onRollInit(event, target) {
    const id = target.closest("[data-combatant-id]")?.dataset.combatantId;
    const combatant = game.combat?.combatants.get(id);
    if (combatant) await rollOwnInitiative(combatant);
  }
}
