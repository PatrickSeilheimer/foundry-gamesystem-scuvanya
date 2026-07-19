import { SCUVANYA } from "../config.mjs";

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

/**
 * Geführte Charaktererstellung: Rasse wählen -> Rassen-Details (Attributboni-Vorschau,
 * Körpermaß-Slider, freie Attributpunkte, Wahlmöglichkeiten) -> Beruf wählen -> Berufs-
 * Details -> Zusammenfassung/Übernehmen. Arbeitet auf einem lokalen State (this.state) und
 * schreibt erst beim Fertigstellen auf den Actor -- ein Abbruch verändert nichts.
 *
 * Rassen/Berufe kommen aus game.items (Welt-Items), damit die SL beliebig neue Rassen/
 * Berufe im Items-Verzeichnis anlegen kann, ohne Code anzufassen (siehe item-sheet.hbs).
 */
export default class CharacterCreationWizard extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    classes: ["scuvanya", "character-creation"],
    position: { width: 640, height: 720 },
    window: { resizable: true },
    actions: {
      pickRace: CharacterCreationWizard.#onPickRace,
      pickProfession: CharacterCreationWizard.#onPickProfession,
      clearProfession: CharacterCreationWizard.#onClearProfession,
      allocatePoint: CharacterCreationWizard.#onAllocatePoint,
      chooseOption: CharacterCreationWizard.#onChooseOption,
      nextStep: CharacterCreationWizard.#onNextStep,
      prevStep: CharacterCreationWizard.#onPrevStep,
      finish: CharacterCreationWizard.#onFinish,
      cancel: CharacterCreationWizard.#onCancel
    }
  };

  static PARTS = {
    form: { template: "systems/scuvanya/templates/apps/character-creation.hbs", scrollable: [""] }
  };

  constructor(actor, options = {}) {
    super({ id: `scuvanya-character-creation-${actor.id}`, ...options });
    this.actor = actor;
    this.step = 1;

    const existingRace = actor.items.find(i => i.type === "race");
    const existingProfession = actor.items.find(i => i.type === "profession");

    this.state = {
      raceId: existingRace?.flags?.scuvanya?.sourceId ?? null,
      professionId: existingProfession?.flags?.scuvanya?.sourceId ?? null,
      body: {
        height: actor.system.body?.height ?? 0,
        weight: actor.system.body?.weight ?? 0,
        age: actor.system.body?.age ?? 0
      },
      allocation: foundry.utils.deepClone(actor.system.attributeAllocation ?? {}),
      raceChoices: foundry.utils.deepClone(existingRace?.system.choiceSelections ?? {}),
      professionChoices: foundry.utils.deepClone(existingProfession?.system.choiceSelections ?? {})
    };
  }

  get title() {
    return game.i18n.format("SCUVANYA.Wizard.Title", { name: this.actor.name });
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.step = this.step;
    context.config = SCUVANYA;

    context.races = game.items.filter(i => i.type === "race");
    context.professions = game.items.filter(i => i.type === "profession");
    context.selectedRace = this.state.raceId ? game.items.get(this.state.raceId) ?? null : null;
    context.selectedProfession = this.state.professionId ? game.items.get(this.state.professionId) ?? null : null;

    context.body = this.state.body;

    const freeFromRace = context.selectedRace?.system.freeAttributePoints ?? 0;
    const freeFromProfession = context.selectedProfession?.system.freeAttributePoints ?? 0;
    context.freeAttributePointsAvailable = freeFromRace + freeFromProfession;
    context.freeAttributePointsSpent = Object.values(this.state.allocation).reduce((s, v) => s + v, 0);
    context.attributeAllocation = Object.entries(SCUVANYA.attributes).map(([key, cfg]) => ({
      key, abbr: cfg.abbr, allocation: this.state.allocation[key] ?? 0
    }));

    context.raceBonusPreview = this._bonusPreview(context.selectedRace?.system);
    context.professionBonusPreview = this._bonusPreview(context.selectedProfession?.system);

    context.raceChoices = this._mapChoices(context.selectedRace?.system, this.state.raceChoices);
    context.professionChoices = this._mapChoices(context.selectedProfession?.system, this.state.professionChoices);

    return context;
  }

  _bonusPreview(itemSystem) {
    if (!itemSystem) return null;
    const attributes = Object.entries(SCUVANYA.attributes)
      .map(([key, cfg]) => ({ abbr: cfg.abbr, bonus: itemSystem.attributeBonuses?.[key] ?? 0 }))
      .filter(a => a.bonus !== 0);
    const skills = (itemSystem.skillBonuses ?? [])
      .map(entry => `${this._describeOption("skill", entry.path)} +${entry.bonus}`);
    const resistances = Object.entries(itemSystem.resistanceBonuses ?? {})
      .filter(([, v]) => v)
      .map(([key, v]) => `${game.i18n.localize(SCUVANYA.damageTypes[key].label)} ${v > 0 ? "+" : ""}${v}%`);
    const extra = (itemSystem.extraGrants ?? [])
      .map(key => game.i18n.localize(`SCUVANYA.Skill.${key}`));
    return { attributes, skills, resistances, extra };
  }

  _mapChoices(itemSystem, selections) {
    return (itemSystem?.choices ?? []).map(choice => ({
      key: choice.key,
      label: choice.label,
      amount: choice.amount,
      selected: selections?.[choice.key] ?? null,
      options: choice.options.map(value => ({ value, label: this._describeOption(choice.kind, value) }))
    }));
  }

  _describeOption(kind, path) {
    if (kind === "attribute") {
      const cfg = SCUVANYA.attributes[path];
      return cfg ? game.i18n.localize(cfg.label) : path;
    }
    if (kind === "discipline") {
      const key = path.split(".").pop();
      const cfg = SCUVANYA.combatDisciplines[key] ?? SCUVANYA.magicDisciplines[key];
      return cfg ? game.i18n.localize(cfg.label) : path;
    }
    const key = path.split(".").pop();
    const localized = game.i18n.localize(`SCUVANYA.Skill.${key}`);
    return localized.startsWith("SCUVANYA.") ? path : localized;
  }

  _onRender(context, options) {
    super._onRender(context, options);
    for (const key of ["height", "weight", "age"]) {
      const input = this.element.querySelector(`input[name="body.${key}"]`);
      const output = this.element.querySelector(`output[data-body="${key}"]`);
      if (!input) continue;
      input.addEventListener("input", () => {
        const value = Number(input.value);
        this.state.body[key] = value;
        if (output) output.textContent = value;
      });
    }
  }

  static #onPickRace(event, target) {
    const id = target.closest("[data-id]")?.dataset.id;
    this.state.raceId = id;
    this.state.raceChoices = {};
    const race = game.items.get(id);
    if (race) {
      const b = race.system.body;
      this.state.body = {
        height: Math.round(((b.heightMin + b.heightMax) / 2) * 100) / 100,
        weight: Math.round(((b.weightMin + b.weightMax) / 2) * 10) / 10,
        age: Math.round((b.ageMin + b.ageMax) / 2)
      };
    }
    this.render();
  }

  static #onPickProfession(event, target) {
    const id = target.closest("[data-id]")?.dataset.id;
    this.state.professionId = id;
    this.state.professionChoices = {};
    this.render();
  }

  static #onClearProfession() {
    this.state.professionId = null;
    this.state.professionChoices = {};
    this.render();
  }

  static #onAllocatePoint(event, target) {
    const key = target.dataset.key;
    const delta = Number(target.dataset.delta);
    const current = this.state.allocation[key] ?? 0;
    const next = Math.max(0, current + delta);

    const race = this.state.raceId ? game.items.get(this.state.raceId) : null;
    const profession = this.state.professionId ? game.items.get(this.state.professionId) : null;
    const available = (race?.system.freeAttributePoints ?? 0) + (profession?.system.freeAttributePoints ?? 0);
    const spent = Object.values(this.state.allocation).reduce((s, v) => s + v, 0) - current + next;
    if (delta > 0 && spent > available) {
      ui.notifications.warn(game.i18n.localize("SCUVANYA.Warning.NoFreePoints"));
      return;
    }
    this.state.allocation[key] = next;
    this.render();
  }

  static #onChooseOption(event, target) {
    const scope = target.dataset.scope;
    const bucket = scope === "race" ? "raceChoices" : "professionChoices";
    this.state[bucket][target.dataset.choiceKey] = target.dataset.option;
    this.render();
  }

  static #onNextStep() {
    if (this.step === 1 && !this.state.raceId) {
      ui.notifications.warn(game.i18n.localize("SCUVANYA.Wizard.NeedRace"));
      return;
    }
    if (this.step === 2) {
      const race = game.items.get(this.state.raceId);
      for (const choice of race?.system.choices ?? []) {
        if (!this.state.raceChoices[choice.key]) {
          ui.notifications.warn(game.i18n.format("SCUVANYA.Wizard.NeedChoice", { label: choice.label }));
          return;
        }
      }
    }
    if (this.step === 4 && this.state.professionId) {
      const profession = game.items.get(this.state.professionId);
      for (const choice of profession?.system.choices ?? []) {
        if (!this.state.professionChoices[choice.key]) {
          ui.notifications.warn(game.i18n.format("SCUVANYA.Wizard.NeedChoice", { label: choice.label }));
          return;
        }
      }
    }
    this.step = Math.min(5, this.step + 1);
    this.render();
  }

  static #onPrevStep() {
    this.step = Math.max(1, this.step - 1);
    this.render();
  }

  static #onCancel() {
    this.close();
  }

  static async #onFinish() {
    const actor = this.actor;
    const existingIds = actor.items
      .filter(i => i.type === "race" || i.type === "profession")
      .map(i => i.id);
    if (existingIds.length) await actor.deleteEmbeddedDocuments("Item", existingIds);

    const toCreate = [];
    if (this.state.raceId) {
      const source = game.items.get(this.state.raceId);
      if (source) {
        const data = source.toObject();
        delete data._id;
        data.system.choiceSelections = this.state.raceChoices;
        data.flags = foundry.utils.mergeObject(data.flags ?? {}, { scuvanya: { sourceId: source.id } });
        toCreate.push(data);
      }
    }
    if (this.state.professionId) {
      const source = game.items.get(this.state.professionId);
      if (source) {
        const data = source.toObject();
        delete data._id;
        data.system.choiceSelections = this.state.professionChoices;
        data.flags = foundry.utils.mergeObject(data.flags ?? {}, { scuvanya: { sourceId: source.id } });
        toCreate.push(data);
      }
    }
    if (toCreate.length) await actor.createEmbeddedDocuments("Item", toCreate);

    await actor.update({
      "system.body": this.state.body,
      "system.attributeAllocation": this.state.allocation
    });

    ui.notifications.info(game.i18n.localize("SCUVANYA.Wizard.Done"));
    this.close();
  }
}
