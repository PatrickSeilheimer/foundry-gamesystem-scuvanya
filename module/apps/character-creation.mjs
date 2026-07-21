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
 * Rassen/Berufe kommen sowohl aus den mitgelieferten Compendium-Packs (scuvanya.races/
 * scuvanya.professions -- Standard-Rassen/-Berufe, die in JEDER Welt verfügbar sind) als auch
 * aus game.items (Welt-Items, für eigene Ergänzungen der SL), siehe _availableRaces/
 * _availableProfessions/_getSourceItem.
 */
export default class CharacterCreationWizard extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    classes: ["scuvanya", "character-creation"],
    position: { width: 920, height: 760 },
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
    form: { template: "systems/scuvanya/templates/apps/character-creation.hbs", scrollable: [".wizard-body"] }
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
    const races = await this._availableRaces();
    context.races = races.map(race => ({
      id: race.id,
      name: race.name,
      img: this._genderImage(race, this.wizardData.gender),
      category: race.system.category
    }));
    context.professions = await this._availableProfessions();
    context.selectedRace = this.wizardData.raceId ? await this._getSourceItem(this.wizardData.raceId) : null;
    context.selectedProfession = this.wizardData.professionId ? await this._getSourceItem(this.wizardData.professionId) : null;

    context.body = this.wizardData.body;
    context.selectedRaceBody = context.selectedRace?.system.body?.[this.wizardData.gender] ?? null;
    context.ageMilestones = this._ageMilestones(context.selectedRaceBody);
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

  /** Standard-Rassen aus dem Compendium-Pack + eigene Ergänzungen der SL als Welt-Item. */
  async _availableRaces() {
    const pack = game.packs.get("scuvanya.races");
    const packRaces = pack ? await pack.getDocuments() : [];
    const worldRaces = game.items.filter(i => i.type === "race");
    return [...packRaces, ...worldRaces];
  }

  /** Standard-Berufe aus dem Compendium-Pack + eigene Ergänzungen der SL als Welt-Item. */
  async _availableProfessions() {
    const pack = game.packs.get("scuvanya.professions");
    const packProfessions = pack ? await pack.getDocuments() : [];
    const worldProfessions = game.items.filter(i => i.type === "profession");
    return [...packProfessions, ...worldProfessions];
  }

  /** Löst eine Rasse/Beruf-ID auf: zuerst Welt-Items, dann die mitgelieferten Compendium-Packs. */
  async _getSourceItem(id) {
    if (!id) return null;
    const worldItem = game.items.get(id);
    if (worldItem) return worldItem;
    for (const packName of ["scuvanya.races", "scuvanya.professions"]) {
      const doc = await game.packs.get(packName)?.getDocument(id);
      if (doc) return doc;
    }
    return null;
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
      // Vorbelegung: frisch erwachsen -- sinnvollerer Startwert für einen neuen Charakter
      // als ein Mittelwert über die gesamte Lebensspanne.
      age: b.erwachsenenalter || b.muendigkeitsalter || 0
    };
  }

  /**
   * Baut die Alters-Slider-Grenzen (Mündigkeit bis Lebenserwartung +10%) und die drei
   * Meilensteine (Mündigkeit/Erwachsen/Lebenserwartung) mit ihrer Position auf dem Slider
   * (in %) und einem Tooltip-Text. Fallen zwei Ankerpunkte auf denselben Wert (z.B. Mündigkeit
   * == Erwachsen), werden sie zu EINEM Meilenstein mit beiden Bezeichnungen zusammengefasst.
   */
  _ageMilestones(body) {
    if (!body) return null;
    const min = body.muendigkeitsalter;
    const max = Math.round(body.lebenserwartung * 1.1);

    const anchors = [
      { value: body.muendigkeitsalter, label: game.i18n.localize("SCUVANYA.Body.muendigkeitsalter") },
      { value: body.erwachsenenalter, label: game.i18n.localize("SCUVANYA.Body.erwachsenenalter") },
      { value: body.lebenserwartung, label: game.i18n.localize("SCUVANYA.Body.lebenserwartung") }
    ];

    const markers = [];
    for (const anchor of anchors) {
      const existing = markers.find(m => m.value === anchor.value);
      if (existing) existing.labels.push(anchor.label);
      else markers.push({ value: anchor.value, labels: [anchor.label] });
    }

    const span = Math.max(1, max - min);
    for (const marker of markers) {
      marker.percent = Math.max(0, Math.min(100, ((marker.value - min) / span) * 100));
      marker.tooltip = `${marker.labels.join(" / ")} (${marker.value})`;
    }

    return { min, max, markers };
  }

  /**
   * Vorschau der GARANTIERTEN Boni über alle aktiven Bündel -- keine Wahl nötig (choice/
   * distribute werden erst in _collectDecisions behandelt). Attribut-Start hat keinen Namen
   * ("ist einfach da") und steht separat, nach Stärke sortiert; Eigenschaften kommen mit
   * Name+Beschreibung und ihren eigenen (fixed/text) Badges, falls vorhanden.
   */
  _bonusPreview(bundles) {
    const attributeTotals = {};
    for (const key of Object.keys(SCUVANYA.attributes)) attributeTotals[key] = 0;
    for (const bundle of bundles) {
      for (const key of Object.keys(SCUVANYA.attributes)) {
        attributeTotals[key] += bundle?.attributeStart?.[key] ?? 0;
      }
    }
    const attributeBadges = Object.entries(SCUVANYA.attributes)
      .map(([key, cfg]) => ({ label: cfg.abbr, bonus: attributeTotals[key] }))
      .filter(a => a.bonus !== 0)
      .sort((a, b) => b.bonus - a.bonus)
      .map(chip => buildBadge(chip));

    const eigenschaften = [];
    for (const bundle of bundles) {
      for (const eig of bundle?.eigenschaften ?? []) {
        const badges = [];
        for (const bonus of eig.boni ?? []) {
          if (bonus.kind === "fixed" && bonus.path && bonus.amount) {
            badges.push(buildBadge({ label: this._describePath(bonus.path, bonus.amount), bonus: bonus.amount }, true));
          } else if (bonus.kind === "text" && bonus.text) {
            badges.push(buildBadge({ label: bonus.text, bonus: 0, binaer: true }, true));
          }
        }
        eigenschaften.push({ name: eig.name, description: eig.description, badges });
      }
    }

    return { attributeBadges, eigenschaften };
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

  /**
   * Beschriftet einen Bonus-Pfad menschenlesbar. Für Resistenz-Pfade wird, sofern ein Betrag
   * mitgegeben wird, zusätzlich zwischen Resistenz (positiver Betrag) und Verwundbarkeit
   * (negativer Betrag) unterschieden -- siehe SCUVANYA.resistanceSteps: negative Werte sind
   * Verwundbarkeit, positive Werte Resistenz (config.mjs).
   */
  _describePath(path, amount) {
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
      const label = cfg ? game.i18n.localize(cfg.label) : path;
      if (typeof amount === "number" && amount !== 0) {
        const suffix = game.i18n.localize(amount > 0 ? "SCUVANYA.Damage.ResistanceSuffix" : "SCUVANYA.Damage.VulnerabilitySuffix");
        return `${label}${suffix}`;
      }
      return label;
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

  static async #onPickRace(event, target) {
    const id = target.closest("[data-id]")?.dataset.id;
    this.wizardData.raceId = id;
    this.wizardData.raceChoices = {};
    this.wizardData.subraceKey = "";
    const race = await this._getSourceItem(id);
    if (race) this.wizardData.body = this._bodyMidpoint(race, this.wizardData.gender);
    this.render();
  }

  static async #onSetGender(event, target) {
    this.wizardData.gender = target.dataset.gender;
    // Geschlecht kann eigene Wahl-/Verteil-Boni mitbringen -- bei Wechsel sollen alte, nicht
    // mehr angebotene Auswahlen nicht unsichtbar weiter aktiv bleiben.
    this.wizardData.raceChoices = {};
    // Körpermaß-Bereiche sind pro Geschlecht getrennt -- bereits gewählte Werte auf den
    // Mittelwert des neuen Geschlechts zurücksetzen, statt sie außerhalb der neuen Grenzen zu lassen.
    const race = await this._getSourceItem(this.wizardData.raceId);
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

  static async #onNextStep() {
    if (this.step === 1 && !this.wizardData.raceId) {
      ui.notifications.warn(game.i18n.localize("SCUVANYA.Wizard.NeedRace"));
      return;
    }
    if (this.step === 2 && !this._decisionsComplete(await this._raceBundles(), this.wizardData.raceChoices)) {
      ui.notifications.warn(game.i18n.localize("SCUVANYA.Wizard.NeedChoice"));
      return;
    }
    if (this.step === 4 && this.wizardData.professionId) {
      const profession = await this._getSourceItem(this.wizardData.professionId);
      if (!this._decisionsComplete([profession?.system], this.wizardData.professionChoices)) {
        ui.notifications.warn(game.i18n.localize("SCUVANYA.Wizard.NeedChoice"));
        return;
      }
    }
    this.step = Math.min(5, this.step + 1);
    this.render();
  }

  async _raceBundles() {
    const race = this.wizardData.raceId ? await this._getSourceItem(this.wizardData.raceId) : null;
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
      const source = await this._getSourceItem(this.wizardData.raceId);
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
      const source = await this._getSourceItem(this.wizardData.professionId);
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
