import { SCUVANYA } from "../config.mjs";
import { buildBadge, EMBER_STYLES } from "./badge-util.mjs";
import { activeRaceBundles } from "../data/item/race-resolve.mjs";

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

/**
 * Geführte Charaktererstellung: Rasse (+Geschlecht+Subrasse) wählen -> Rassen-Entscheidungen
 * (Körpermaß-Slider, Wahl-/Verteil-Boni) -> Beruf wählen -> Berufs-Entscheidungen ->
 * Zusammenfassung/Übernehmen. Arbeitet auf einem lokalen State (this.wizardData) und schreibt
 * erst beim Fertigstellen auf den Actor -- ein Abbruch verändert nichts.
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
      setGender: CharacterCreationWizard.#onSetGender,
      selectSubrace: CharacterCreationWizard.#onSelectSubrace,
      chooseOption: CharacterCreationWizard.#onChooseOption,
      distributePoint: CharacterCreationWizard.#onDistributePoint,
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

    this.wizardData = {
      raceId: existingRace?.flags?.scuvanya?.sourceId ?? null,
      professionId: existingProfession?.flags?.scuvanya?.sourceId ?? null,
      gender: actor.system.geschlecht ?? "maennlich",
      subraceKey: existingRace?.system.subraceKey ?? "",
      body: {
        height: actor.system.body?.height ?? 0,
        weight: actor.system.body?.weight ?? 0,
        age: actor.system.body?.age ?? 0
      },
      // Je bonus.key: ein String (choice) oder ein { [optionPath]: punkte }-Objekt (distribute).
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

    context.gender = this.wizardData.gender;

    // Kartenbild hängt vom aktuell gewählten Geschlecht ab (siehe #onSetGender) --
    // fällt auf das allgemeine Item-Bild zurück, falls für ein Geschlecht keins gepflegt ist.
    context.races = game.items.filter(i => i.type === "race").map(race => ({
      id: race.id,
      name: race.name,
      img: this._genderImage(race, this.wizardData.gender)
    }));
    context.professions = game.items.filter(i => i.type === "profession");
    context.selectedRace = this.wizardData.raceId ? game.items.get(this.wizardData.raceId) ?? null : null;
    context.selectedProfession = this.wizardData.professionId ? game.items.get(this.wizardData.professionId) ?? null : null;

    context.body = this.wizardData.body;
    context.selectedRaceBody = context.selectedRace?.system.body?.[this.wizardData.gender] ?? null;
    context.embers = EMBER_STYLES;

    context.subraces = context.selectedRace?.system.subraces ?? [];
    context.subraceKey = this.wizardData.subraceKey;

    const raceBundles = context.selectedRace
      ? activeRaceBundles(context.selectedRace.system, this.wizardData.gender, this.wizardData.subraceKey)
      : [];
    const professionBundles = context.selectedProfession ? [context.selectedProfession.system] : [];

    context.raceBonusPreview = this._bonusPreview(raceBundles);
    context.professionBonusPreview = this._bonusPreview(professionBundles);

    context.raceDecisions = this._collectDecisions(raceBundles, this.wizardData.raceChoices);
    context.professionDecisions = this._collectDecisions(professionBundles, this.wizardData.professionChoices);

    return context;
  }

  _genderImage(race, gender) {
    const genderImage = gender === "weiblich" ? race.system.imageWeiblich : race.system.imageMaennlich;
    return genderImage || race.img;
  }

  _bodyMidpoint(race, gender) {
    const b = race.system.body?.[gender];
    if (!b) return { height: 0, weight: 0, age: 0 };
    return {
      height: Math.round(((b.heightMin + b.heightMax) / 2) * 100) / 100,
      weight: Math.round(((b.weightMin + b.weightMax) / 2) * 10) / 10,
      age: Math.round((b.ageMin + b.ageMax) / 2)
    };
  }

  /** Vorschau der GARANTIERTEN Boni (fixed/text) über alle aktiven Bündel -- keine Wahl nötig. */
  _bonusPreview(bundles) {
    const chips = [];
    for (const bundle of bundles) {
      for (const eig of bundle?.eigenschaften ?? []) {
        for (const bonus of eig.boni ?? []) {
          if (bonus.kind === "fixed" && bonus.path && bonus.amount) {
            chips.push(buildBadge({ label: this._describePath(bonus.path), bonus: bonus.amount }, true));
          } else if (bonus.kind === "text" && bonus.text) {
            chips.push(buildBadge({ label: eig.name || bonus.text, bonus: 0, binaer: true }, true));
          }
        }
      }
    }
    return chips;
  }

  /** Interaktive choice-/distribute-Boni über alle aktiven Bündel, gruppiert nach Eigenschaft. */
  _collectDecisions(bundles, selections) {
    const decisions = [];
    for (const bundle of bundles) {
      for (const eig of bundle?.eigenschaften ?? []) {
        for (const bonus of eig.boni ?? []) {
          if (bonus.kind !== "choice" && bonus.kind !== "distribute") continue;
          const options = (bonus.options ?? []).map(path => ({ path, label: this._describePath(path) }));

          if (bonus.kind === "choice") {
            decisions.push({
              key: bonus.key, kind: "choice", eigenschaftName: eig.name, eigenschaftDescription: eig.description,
              amount: bonus.amount, options, selected: selections?.[bonus.key] ?? null
            });
          } else {
            const allocation = (selections?.[bonus.key] && typeof selections[bonus.key] === "object") ? selections[bonus.key] : {};
            const spent = Object.values(allocation).reduce((s, v) => s + v, 0);
            decisions.push({
              key: bonus.key, kind: "distribute", eigenschaftName: eig.name, eigenschaftDescription: eig.description,
              amount: bonus.amount, perOptionMax: bonus.perOptionMax, spent, remaining: bonus.amount - spent,
              options: options.map(o => ({ ...o, points: allocation[o.path] ?? 0 }))
            });
          }
        }
      }
    }
    return decisions;
  }

  _describePath(path) {
    if (path.startsWith("attributes.")) {
      const cfg = SCUVANYA.attributes[path.slice("attributes.".length)];
      return cfg ? game.i18n.localize(cfg.label) : path;
    }
    if (path.startsWith("disziplinen.")) {
      const key = path.split(".").pop();
      const cfg = SCUVANYA.combatDisciplines[key] ?? SCUVANYA.magicDisciplines[key];
      return cfg ? game.i18n.localize(cfg.label) : path;
    }
    if (path.startsWith("talents.extra.")) {
      return game.i18n.localize(`SCUVANYA.Skill.${path.slice("talents.extra.".length)}`);
    }
    if (path.startsWith("talents.")) {
      const key = path.split(".").pop();
      const localized = game.i18n.localize(`SCUVANYA.Skill.${key}`);
      return localized.startsWith("SCUVANYA.") ? path : localized;
    }
    if (path.startsWith("resistances.")) {
      const cfg = SCUVANYA.damageTypes[path.slice("resistances.".length)];
      return cfg ? game.i18n.localize(cfg.label) : path;
    }
    if (path === "armor.physical") return game.i18n.localize("SCUVANYA.Armor.physical");
    if (path === "armor.magical") return game.i18n.localize("SCUVANYA.Armor.magical");
    if (path === "ac.value") return game.i18n.localize("SCUVANYA.AC");
    if (path === "initiative") return game.i18n.localize("SCUVANYA.Initiative");
    return path;
  }

  _onRender(context, options) {
    super._onRender(context, options);
    for (const key of ["height", "weight", "age"]) {
      const input = this.element.querySelector(`input[name="body.${key}"]`);
      const output = this.element.querySelector(`output[data-body="${key}"]`);
      if (!input) continue;
      input.addEventListener("input", () => {
        const value = Number(input.value);
        this.wizardData.body[key] = value;
        if (output) output.textContent = value;
      });
    }
  }

  static #onPickRace(event, target) {
    const id = target.closest("[data-id]")?.dataset.id;
    this.wizardData.raceId = id;
    this.wizardData.raceChoices = {};
    this.wizardData.subraceKey = "";
    const race = game.items.get(id);
    if (race) this.wizardData.body = this._bodyMidpoint(race, this.wizardData.gender);
    this.render();
  }

  static #onSetGender(event, target) {
    this.wizardData.gender = target.dataset.gender;
    // Geschlecht kann eigene Wahl-/Verteil-Boni mitbringen -- bei Wechsel sollen alte, nicht
    // mehr angebotene Auswahlen nicht unsichtbar weiter aktiv bleiben.
    this.wizardData.raceChoices = {};
    // Körpermaß-Bereiche sind pro Geschlecht getrennt -- bereits gewählte Werte auf den
    // Mittelwert des neuen Geschlechts zurücksetzen, statt sie außerhalb der neuen Grenzen zu lassen.
    const race = this.wizardData.raceId ? game.items.get(this.wizardData.raceId) : null;
    if (race) this.wizardData.body = this._bodyMidpoint(race, this.wizardData.gender);
    this.render();
  }

  static #onSelectSubrace(event, target) {
    // Wahl bleibt erhalten, wenn dieselbe Subrasse erneut angeklickt wird; "" (Keine) via
    // eigenem Chip mit data-key="" wählbar (siehe character-creation.hbs).
    this.wizardData.subraceKey = target.dataset.key ?? "";
    // Subrasse kann eigene Wahl-/Verteil-Boni mitbringen -- bei Wechsel sollen alte, nicht
    // mehr angebotene Auswahlen nicht unsichtbar weiter aktiv bleiben.
    this.wizardData.raceChoices = {};
    this.render();
  }

  static #onPickProfession(event, target) {
    const id = target.closest("[data-id]")?.dataset.id;
    this.wizardData.professionId = id;
    this.wizardData.professionChoices = {};
    this.render();
  }

  static #onClearProfession() {
    this.wizardData.professionId = null;
    this.wizardData.professionChoices = {};
    this.render();
  }

  static #onChooseOption(event, target) {
    const scope = target.dataset.scope;
    const bucket = scope === "race" ? "raceChoices" : "professionChoices";
    this.wizardData[bucket][target.dataset.key] = target.dataset.option;
    this.render();
  }

  static #onDistributePoint(event, target) {
    const scope = target.dataset.scope;
    const bucket = scope === "race" ? "raceChoices" : "professionChoices";
    const key = target.dataset.key;
    const path = target.dataset.path;
    const delta = Number(target.dataset.delta);
    const amount = Number(target.dataset.amount);
    const perOptionMax = Number(target.dataset.perOptionMax);

    const current = (this.wizardData[bucket][key] && typeof this.wizardData[bucket][key] === "object")
      ? this.wizardData[bucket][key] : {};
    const currentPoints = current[path] ?? 0;
    const nextPoints = Math.max(0, currentPoints + delta);
    if (perOptionMax > 0 && nextPoints > perOptionMax) return;

    const otherSpent = Object.entries(current).reduce((s, [p, v]) => s + (p === path ? 0 : v), 0);
    if (delta > 0 && otherSpent + nextPoints > amount) {
      ui.notifications.warn(game.i18n.localize("SCUVANYA.Warning.NoFreePoints"));
      return;
    }

    const updated = { ...current, [path]: nextPoints };
    if (nextPoints === 0) delete updated[path];
    this.wizardData[bucket][key] = updated;
    this.render();
  }

  static #onNextStep() {
    if (this.step === 1 && !this.wizardData.raceId) {
      ui.notifications.warn(game.i18n.localize("SCUVANYA.Wizard.NeedRace"));
      return;
    }
    if (this.step === 2 && !this._decisionsComplete(this._raceBundles(), this.wizardData.raceChoices)) {
      ui.notifications.warn(game.i18n.localize("SCUVANYA.Wizard.NeedChoice"));
      return;
    }
    if (this.step === 4 && this.wizardData.professionId) {
      const profession = game.items.get(this.wizardData.professionId);
      if (!this._decisionsComplete([profession?.system], this.wizardData.professionChoices)) {
        ui.notifications.warn(game.i18n.localize("SCUVANYA.Wizard.NeedChoice"));
        return;
      }
    }
    this.step = Math.min(5, this.step + 1);
    this.render();
  }

  _raceBundles() {
    const race = this.wizardData.raceId ? game.items.get(this.wizardData.raceId) : null;
    return race ? activeRaceBundles(race.system, this.wizardData.gender, this.wizardData.subraceKey) : [];
  }

  _decisionsComplete(bundles, selections) {
    return this._collectDecisions(bundles, selections).every(decision =>
      decision.kind === "choice" ? !!decision.selected : decision.remaining <= 0
    );
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
    if (this.wizardData.raceId) {
      const source = game.items.get(this.wizardData.raceId);
      if (source) {
        const data = source.toObject();
        delete data._id;
        data.system.choiceSelections = this.wizardData.raceChoices;
        data.system.subraceKey = this.wizardData.subraceKey;
        data.flags = foundry.utils.mergeObject(data.flags ?? {}, { scuvanya: { sourceId: source.id } });
        toCreate.push(data);
      }
    }
    if (this.wizardData.professionId) {
      const source = game.items.get(this.wizardData.professionId);
      if (source) {
        const data = source.toObject();
        delete data._id;
        data.system.choiceSelections = this.wizardData.professionChoices;
        data.flags = foundry.utils.mergeObject(data.flags ?? {}, { scuvanya: { sourceId: source.id } });
        toCreate.push(data);
      }
    }
    if (toCreate.length) await actor.createEmbeddedDocuments("Item", toCreate);

    await actor.update({
      "system.body": this.wizardData.body,
      "system.geschlecht": this.wizardData.gender
    });

    ui.notifications.info(game.i18n.localize("SCUVANYA.Wizard.Done"));
    this.close();
  }
}
