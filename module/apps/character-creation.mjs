import { SCUVANYA } from "../config.mjs";
import { buildBadge, EMBER_STYLES } from "./badge-util.mjs";
import { activeRaceBundles } from "../data/item/race-resolve.mjs";
import { resolveBundles } from "../data/item/path-resolve.mjs";
import { describePath } from "../path-labels.mjs";
import {
  attributeLevelCost, attributeSpentCost,
  talentLevelCost, talentSpentCost,
  tieredLevelCost, tieredSpentCost,
  specialtyLevelCost, specialtySpentCost,
  EXTRA_TALENT_COST
} from "../rules/costs.mjs";

const seedLevels = (source, keys) => Object.fromEntries(keys.map(k => [k, source?.[k]?.level ?? 0]));
const seedKnown = (source, keys) => Object.fromEntries(keys.map(k => [k, source?.[k]?.known ?? false]));

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
      setGender: CharacterCreationWizard.#onSetGender,
      selectSubrace: CharacterCreationWizard.#onSelectSubrace,
      chooseOption: CharacterCreationWizard.#onChooseOption,
      distributePoint: CharacterCreationWizard.#onDistributePoint,
      buyPoint: CharacterCreationWizard.#onBuyPoint,
      sellPoint: CharacterCreationWizard.#onSellPoint,
      toggleExtra: CharacterCreationWizard.#onToggleExtra,
      nextStep: CharacterCreationWizard.#onNextStep,
      prevStep: CharacterCreationWizard.#onPrevStep,
      finish: CharacterCreationWizard.#onFinish,
      cancel: CharacterCreationWizard.#onCancel
    }
  };

  static PARTS = {
    form: { template: "systems/scuvanya/templates/apps/character-creation.hbs", scrollable: [".wizard-body"] }
  };

  // Hover-Popup für Rassen-Karten/Subrassen-Chips (siehe _wireHoverTooltips) -- vor jedem
  // Re-Render entfernt, sonst würde bei jeder Änderung ein weiteres Element angehängt.
  #hoverTooltipEl = null;

  constructor(actor, options = {}) {
    super({ id: `scuvanya-character-creation-${actor.id}`, ...options });
    this.actor = actor;
    this.step = 1;

    const existingRace = actor.items.find(i => i.type === "race");
    const existingProfession = actor.items.find(i => i.type === "profession");
    const sys = actor.system;

    // Nur bei einem BEREITS FERTIGEN Charakter (schon einmal durch den Wizard gelaufen, hat also
    // Rasse UND Beruf) soll ein Rassen-/Berufswechsel die HÖHE jedes Skills bewahren (siehe
    // _withShiftReconciliation) -- bei einer frischen Ersterstellung ist noch nichts "investiert",
    // ein Attribut soll dort einfach roh(Schema-Standard) + Verschiebung zeigen, ohne künstlich
    // gegen einen negativen Rassenbonus geschützt zu werden. Bewusst EINMALIG beim Öffnen
    // festgehalten, nicht während der Sitzung neu bewertet.
    this._preserveSkillHeights = Boolean(existingRace && existingProfession);

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
      professionChoices: foundry.utils.deepClone(existingProfession?.system.choiceSelections ?? {}),

      // Vorbelegt mit den AKTUELL gespeicherten Rohwerten des Charakters (bei einem brandneuen
      // Charakter sind das die Schema-Standardwerte, siehe character.mjs) -- so verliert ein
      // erneutes Öffnen des Wizards (z.B. für ein künftiges Level-Up) bereits getätigte Käufe
      // nicht. Siehe _prepareSkillPointsContext/#onFinish für die Verwendung.
      purchases: {
        attributes: Object.fromEntries(Object.keys(SCUVANYA.attributes).map(k => [k, sys.attributes[k]?.value ?? SCUVANYA.attributeStartingValue])),
        talents: {
          sozial: {
            positiv: seedLevels(sys.talents.sozial.positiv, SCUVANYA.socialSkills.positive),
            negativ: seedLevels(sys.talents.sozial.negativ, SCUVANYA.socialSkills.negative)
          },
          wissenschaften: {
            sozial: seedLevels(sys.talents.wissenschaften.sozial, SCUVANYA.scienceSkills.sozial),
            natur: seedLevels(sys.talents.wissenschaften.natur, SCUVANYA.scienceSkills.natur)
          },
          koerperlich: seedLevels(sys.talents.koerperlich, SCUVANYA.physicalSkills),
          sonder: seedLevels(sys.talents.sonder, Object.keys(SCUVANYA.sonderSkills)),
          handwerk: seedLevels(sys.talents.handwerk, SCUVANYA.craftSkills),
          spezial: seedLevels(sys.talents.spezial, SCUVANYA.spezialSkills),
          extra: seedKnown(sys.talents.extra, SCUVANYA.extraSkills)
        },
        disziplinen: {
          kampf: seedLevels(sys.disziplinen.kampf, Object.keys(SCUVANYA.combatDisciplines)),
          magie: seedLevels(sys.disziplinen.magie, Object.keys(SCUVANYA.magicDisciplines))
        }
      }
    };

    // Pfad -> {min, max, levelCostFn}, gefüllt von _buildCounterRow bei jedem _prepareContext --
    // erlaubt buyPoint/sellPoint, Grenzen/Kostenformel eines Pfads nachzuschlagen, ohne Funktionen
    // durch data-Attribute schleusen zu müssen (siehe #onBuyPoint/#onSellPoint).
    this._skillPointMeta = new Map();
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
      category: race.system.category,
      // Für das Hover-Popup auf der Rassen-Karte (siehe _wireHoverTooltips) -- die vollständige,
      // rassenweite Beschreibung, unabhängig vom gewählten Geschlecht.
      description: race.system.description ?? ""
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

    await this._prepareSkillPointsContext(context);

    return context;
  }

  /**
   * Löst Rassen-/Berufsboni (inkl. der bisher getroffenen Wahlmöglichkeiten) zu EINEM flachen
   * { [path]: amount }-Satz auf -- exakt dieselbe Funktion, die auch CharacterData.
   * _computeProgressionBonus für den fertigen Charakter nutzt (siehe path-resolve.mjs), damit
   * die Vorschau im Wizard 1:1 dem entspricht, was nach dem Fertigstellen tatsächlich gilt.
   */
  async _computeShiftMap() {
    const raceBundles = await this._raceBundles();
    const profession = this.wizardData.professionId ? await this._getSourceItem(this.wizardData.professionId) : null;
    const professionBundles = profession ? [profession.system] : [];

    const raceResolved = resolveBundles(raceBundles, this.wizardData.raceChoices);
    const professionResolved = resolveBundles(professionBundles, this.wizardData.professionChoices);

    const shifts = {};
    for (const [path, amount] of Object.entries(raceResolved.pathBonuses)) shifts[path] = (shifts[path] ?? 0) + amount;
    for (const [path, amount] of Object.entries(professionResolved.pathBonuses)) shifts[path] = (shifts[path] ?? 0) + amount;
    return shifts;
  }

  /**
   * Führt eine Rassen-/Berufs-/Wahl-Änderung aus und gleicht dabei -- NUR bei einem bereits
   * fertigen Charakter (siehe _preserveSkillHeights im Konstruktor) -- wizardData.purchases so
   * an, dass sich an der HÖHE jedes Skills (Start + investierte Punkte) NICHTS ändert (siehe
   * Konversation): nur die Aufteilung zwischen "kostenlos durch Rasse/Beruf" und "gekauft"
   * verschiebt sich, was beim nächsten _computeTotalSpent automatisch zur erwarteten
   * Rückerstattung (oder Mehrkosten) führt. Bei einer frischen Ersterstellung bleibt
   * wizardData.purchases unangetastet -- ein Attribut zeigt dort einfach roh + neue
   * Verschiebung, ohne künstlichen Schutz vor einem negativen Rassenbonus.
   *
   * Jeder Klick, der raceId/professionId/gender/subraceKey/raceChoices/professionChoices
   * verändert, muss durch diesen Wrapper laufen.
   */
  async _withShiftReconciliation(mutate) {
    if (!this._preserveSkillHeights) {
      await mutate();
      return;
    }
    const oldShifts = await this._computeShiftMap();
    await mutate();
    const newShifts = await this._computeShiftMap();
    this._rebalancePurchases(oldShifts, newShifts);
  }

  /**
   * Passt jeden rohen (gekauften) Wert um genau die Differenz der Verschiebung an:
   * neuerWert = alterWert - (neueVerschiebung - alteVerschiebung), sodass
   * neuerWert + neueVerschiebung === alterWert + alteVerschiebung (die Höhe bleibt gleich).
   * Nur am natürlichen Boden (bzw. Deckel, wo das Schema einen hat) geklemmt -- reicht der
   * Boden allein schon über den alten Effektivwert hinaus, darf der Effektivwert steigen
   * (reines Plus durch eine großzügigere Rasse/Beruf, kein "Wegkämpfen" nötig). Extra-
   * Fähigkeiten sind Booleans (gewährt statt gekauft) und brauchen diesen Ausgleich nicht.
   */
  _rebalancePurchases(oldShifts, newShifts) {
    const p = this.wizardData.purchases;

    const rebalance = (tree, keys, pathPrefix, min, max = Infinity) => {
      for (const key of keys) {
        const path = `${pathPrefix}.${key}`;
        const delta = (newShifts[path] ?? 0) - (oldShifts[path] ?? 0);
        if (!delta) continue;
        tree[key] = Math.min(max, Math.max(min, tree[key] - delta));
      }
    };

    const attributesAsTree = p.attributes;
    rebalance(attributesAsTree, Object.keys(SCUVANYA.attributes), "attributes", SCUVANYA.attributeStartingValue);

    rebalance(p.talents.sozial.positiv, SCUVANYA.socialSkills.positive, "talents.sozial.positiv", 0);
    rebalance(p.talents.sozial.negativ, SCUVANYA.socialSkills.negative, "talents.sozial.negativ", 0);
    rebalance(p.talents.wissenschaften.sozial, SCUVANYA.scienceSkills.sozial, "talents.wissenschaften.sozial", 0);
    rebalance(p.talents.wissenschaften.natur, SCUVANYA.scienceSkills.natur, "talents.wissenschaften.natur", 0);
    rebalance(p.talents.koerperlich, SCUVANYA.physicalSkills, "talents.koerperlich", 0);
    rebalance(p.talents.sonder, Object.keys(SCUVANYA.sonderSkills), "talents.sonder", 0);
    rebalance(p.talents.handwerk, SCUVANYA.craftSkills, "talents.handwerk", SCUVANYA.craftStartingLevel, SCUVANYA.tieredSkillMaxLevel);
    rebalance(p.talents.spezial, SCUVANYA.spezialSkills, "talents.spezial", SCUVANYA.specialtyStartingLevel, SCUVANYA.tieredSkillMaxLevel);
    rebalance(p.disziplinen.kampf, Object.keys(SCUVANYA.combatDisciplines), "disziplinen.kampf", 0, SCUVANYA.disciplineMaxLevel);
    rebalance(p.disziplinen.magie, Object.keys(SCUVANYA.magicDisciplines), "disziplinen.magie", 0, SCUVANYA.disciplineMaxLevel);
  }

  /**
   * Summe aller bereits ausgegebenen Skillpunkte über Attribute/Talente/Disziplinen (siehe
   * character.mjs _computeSkillPoints, hier auf wizardData.purchases statt echten Actor-Daten
   * angewendet, weil vor dem Fertigstellen noch nichts gespeichert wird).
   */
  _computeTotalSpent(shifts) {
    const p = this.wizardData.purchases;
    let spent = 0;

    for (const key of Object.keys(SCUVANYA.attributes)) {
      spent += attributeSpentCost(p.attributes[key], SCUVANYA.attributeStartingValue, shifts[`attributes.${key}`] ?? 0);
    }

    const leveledGroups = [
      [p.talents.sozial.positiv, "talents.sozial.positiv"],
      [p.talents.sozial.negativ, "talents.sozial.negativ"],
      [p.talents.wissenschaften.sozial, "talents.wissenschaften.sozial"],
      [p.talents.wissenschaften.natur, "talents.wissenschaften.natur"],
      [p.talents.koerperlich, "talents.koerperlich"],
      [p.talents.sonder, "talents.sonder"]
    ];
    for (const [tree, prefix] of leveledGroups) {
      for (const [key, level] of Object.entries(tree)) {
        spent += talentSpentCost(level, shifts[`${prefix}.${key}`] ?? 0);
      }
    }

    for (const [key, level] of Object.entries(p.talents.handwerk)) {
      spent += tieredSpentCost(level, SCUVANYA.craftStartingLevel, shifts[`talents.handwerk.${key}`] ?? 0);
    }
    for (const [key, level] of Object.entries(p.talents.spezial)) {
      spent += specialtySpentCost(level, SCUVANYA.specialtyStartingLevel, shifts[`talents.spezial.${key}`] ?? 0);
    }
    for (const known of Object.values(p.talents.extra)) {
      if (known) spent += EXTRA_TALENT_COST;
    }

    for (const [key, level] of Object.entries(p.disziplinen.kampf)) {
      spent += tieredSpentCost(level, 0, shifts[`disziplinen.kampf.${key}`] ?? 0);
    }
    for (const [key, level] of Object.entries(p.disziplinen.magie)) {
      spent += tieredSpentCost(level, 0, shifts[`disziplinen.magie.${key}`] ?? 0);
    }

    return spent;
  }

  /**
   * Baut EINE Zähler-Zeile (Attribut/Talent/Handwerk/Spezial/Disziplin) für die Fähigkeiten-
   * Verteilung (Schritt 5) und merkt sich gleichzeitig Grenzen + Kostenformel unter "path" in
   * this._skillPointMeta -- damit buyPoint/sellPoint dieselbe Formel nutzen, ohne Funktionen
   * durch data-Attribute schleusen zu müssen.
   */
  _buildCounterRow({ key, path, label, value, shift, min, max, levelCostFn }) {
    this._skillPointMeta.set(path, { min, max, levelCostFn });
    const nextCost = value < max ? levelCostFn(value + shift + 1) : null;
    const refund = value > min ? levelCostFn(value + shift) : null;
    return {
      key, path, label, value, shift, effective: value + shift,
      nextCost, refund, canBuy: nextCost !== null, canSell: refund !== null
    };
  }

  /** Baut alle Kategorien für Schritt 5 (Fähigkeiten verteilen) -- siehe character-creation.hbs. */
  async _prepareSkillPointsContext(context) {
    this._skillPointMeta.clear();
    const shifts = await this._computeShiftMap();
    const p = this.wizardData.purchases;

    const buildLeveled = (keys, tree, pathPrefix) => keys.map(key => this._buildCounterRow({
      key, path: `${pathPrefix}.${key}`,
      label: game.i18n.localize(`SCUVANYA.Skill.${key}`),
      value: tree[key], shift: shifts[`${pathPrefix}.${key}`] ?? 0,
      min: 0, max: 30, levelCostFn: talentLevelCost
    }));

    const attributeRows = Object.entries(SCUVANYA.attributes).map(([key, cfg]) => this._buildCounterRow({
      key, path: `attributes.${key}`,
      label: `${cfg.abbr} · ${game.i18n.localize(cfg.label)}`,
      value: p.attributes[key], shift: shifts[`attributes.${key}`] ?? 0,
      min: SCUVANYA.attributeStartingValue, max: 30, levelCostFn: attributeLevelCost
    }));

    const handwerkRows = SCUVANYA.craftSkills.map(key => this._buildCounterRow({
      key, path: `talents.handwerk.${key}`,
      label: game.i18n.localize(`SCUVANYA.Skill.${key}`),
      value: p.talents.handwerk[key], shift: shifts[`talents.handwerk.${key}`] ?? 0,
      min: SCUVANYA.craftStartingLevel, max: SCUVANYA.tieredSkillMaxLevel, levelCostFn: tieredLevelCost
    }));

    const spezialRows = SCUVANYA.spezialSkills.map(key => this._buildCounterRow({
      key, path: `talents.spezial.${key}`,
      label: game.i18n.localize(`SCUVANYA.Skill.${key}`),
      value: p.talents.spezial[key], shift: shifts[`talents.spezial.${key}`] ?? 0,
      min: SCUVANYA.specialtyStartingLevel, max: SCUVANYA.tieredSkillMaxLevel, levelCostFn: specialtyLevelCost
    }));

    const kampfRows = Object.entries(SCUVANYA.combatDisciplines).map(([key, cfg]) => this._buildCounterRow({
      key, path: `disziplinen.kampf.${key}`,
      label: game.i18n.localize(cfg.label),
      value: p.disziplinen.kampf[key], shift: shifts[`disziplinen.kampf.${key}`] ?? 0,
      min: 0, max: SCUVANYA.disciplineMaxLevel, levelCostFn: tieredLevelCost
    }));

    const magieRows = Object.entries(SCUVANYA.magicDisciplines).map(([key, cfg]) => this._buildCounterRow({
      key, path: `disziplinen.magie.${key}`,
      label: game.i18n.localize(cfg.label),
      value: p.disziplinen.magie[key], shift: shifts[`disziplinen.magie.${key}`] ?? 0,
      min: 0, max: SCUVANYA.disciplineMaxLevel, levelCostFn: tieredLevelCost
    }));

    // Einzeln benannte Zeilen-Arrays statt einer generischen Liste -- die Vorlage paart sie
    // explizit genauso wie der Bogen (siehe character-sheet.hbs .cc-category-pair), Attribute
    // und Disziplinen bewusst NICHT gepaart (siehe Konversation). Disziplinen kombiniert in
    // EINEM 3-Spalten-Raster: 3 Kampf- oben, darunter 9 Magiedisziplinen in 3 Zeilen.
    context.spAttributeRows = attributeRows;
    context.spKoerperlichRows = buildLeveled(SCUVANYA.physicalSkills, p.talents.koerperlich, "talents.koerperlich");
    context.spSpezialRows = spezialRows;
    context.spSozialPositivRows = buildLeveled(SCUVANYA.socialSkills.positive, p.talents.sozial.positiv, "talents.sozial.positiv");
    context.spSozialNegativRows = buildLeveled(SCUVANYA.socialSkills.negative, p.talents.sozial.negativ, "talents.sozial.negativ");
    context.spWissenschaftenNaturRows = buildLeveled(SCUVANYA.scienceSkills.natur, p.talents.wissenschaften.natur, "talents.wissenschaften.natur");
    context.spWissenschaftenSozialRows = buildLeveled(SCUVANYA.scienceSkills.sozial, p.talents.wissenschaften.sozial, "talents.wissenschaften.sozial");
    context.spSonderRows = buildLeveled(Object.keys(SCUVANYA.sonderSkills), p.talents.sonder, "talents.sonder");
    context.spHandwerkRows = handwerkRows;
    context.spDisziplinenRows = [...kampfRows, ...magieRows];

    context.extraSkillRows = SCUVANYA.extraSkills.map(key => {
      const granted = (shifts[`talents.extra.${key}`] ?? 0) > 0;
      const requiredKey = SCUVANYA.extraSkillDependencies[key] ?? null;
      const requiredActive = !requiredKey || p.talents.extra[requiredKey] || (shifts[`talents.extra.${requiredKey}`] ?? 0) > 0;
      return {
        key,
        label: game.i18n.localize(`SCUVANYA.Skill.${key}`),
        checked: granted || p.talents.extra[key],
        granted,
        disabled: granted || !requiredActive,
        hintText: !granted && !requiredActive
          ? game.i18n.format("SCUVANYA.Hint.RequiresSkill", { skill: game.i18n.localize(`SCUVANYA.Skill.${requiredKey}`) })
          : null,
        cost: EXTRA_TALENT_COST
      };
    });

    context.skillPointsTotal = SCUVANYA.startingSkillPoints;
    context.skillPointsSpent = this._computeTotalSpent(shifts);
    context.skillPointsAvailable = context.skillPointsTotal - context.skillPointsSpent;
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
            // Zuteilung ist ein ARRAY aus { path, points } (siehe path-resolve.mjs resolveBundles
            // für den ausführlichen Grund: dotted-path-Objekt-Schlüssel würden von Foundrys
            // expandObject beim Speichern zerlegt). Number(v) statt v zusätzlich als Schutz gegen
            // eine ältere/fehlerhafte Zuteilung -- ein einzelner kaputter Eintrag darf
            // "spent"/"remaining" nie auf NaN kippen lassen (siehe Konversation).
            const allocation = Array.isArray(selections?.[bonus.key]) ? selections[bonus.key] : [];
            const pointsByPath = new Map(allocation.map(e => [e.path, Number(e.points) || 0]));
            const spent = allocation.reduce((s, e) => s + (Number(e.points) || 0), 0);
            const amount = Number(bonus.amount) || 0;
            decisions.push({
              key: bonus.key, kind: "distribute", eigenschaftName: eig.name, eigenschaftDescription: eig.description,
              amount, perOptionMax: bonus.perOptionMax, spent, remaining: amount - spent,
              options: options.map(o => ({ ...o, points: pointsByPath.get(o.path) ?? 0 }))
            });
          }
        }
      }
    }
    return decisions;
  }

  /** Siehe module/path-labels.mjs -- gemeinsam mit dem Charakterbogen genutzt (Item-Tooltips). */
  _describePath(path, amount) {
    return describePath(path, amount);
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
    this._wireHoverTooltips();
  }

  /**
   * 1-Sekunde-Hover-Popup für Rassen-Karten/Subrassen-Chips (siehe Konversation) -- dieselbe
   * .scv-tooltip-Karte wie auf dem Charakterbogen (siehe character-sheet.mjs _wireTooltips),
   * hier aber bewusst als eigene, einfachere Kopie: der Wizard kennt nur einen einzigen
   * Trigger-Typ (verzögerter Hover), kein Klick-Toggle und keinen Außenklick-Handler.
   */
  _wireHoverTooltips() {
    this.#hoverTooltipEl?.remove();

    const tooltip = document.createElement("div");
    tooltip.className = "scv-tooltip";
    this.element.appendChild(tooltip);
    this.#hoverTooltipEl = tooltip;

    const hide = () => tooltip.classList.remove("scv-tooltip--visible");
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

    for (const el of this.element.querySelectorAll("[data-hover-tooltip]")) {
      let timer = null;
      el.addEventListener("mouseenter", () => { timer = setTimeout(() => show(el), 1000); });
      el.addEventListener("mouseleave", () => { clearTimeout(timer); hide(); });
    }
  }

  /** @override -- entfernt das Tooltip-Element, damit es nicht als Deko-Leiche im DOM bleibt. */
  async close(options) {
    this.#hoverTooltipEl?.remove();
    return super.close(options);
  }

  static async #onPickRace(event, target) {
    const id = target.closest("[data-id]")?.dataset.id;
    await this._withShiftReconciliation(async () => {
      this.wizardData.raceId = id;
      this.wizardData.raceChoices = {};
      this.wizardData.subraceKey = "";
      const race = await this._getSourceItem(id);
      if (race) this.wizardData.body = this._bodyMidpoint(race, this.wizardData.gender);
    });
    this.render();
  }

  static async #onSetGender(event, target) {
    await this._withShiftReconciliation(async () => {
      this.wizardData.gender = target.dataset.gender;
      // Geschlecht kann eigene Wahl-/Verteil-Boni mitbringen -- bei Wechsel sollen alte, nicht
      // mehr angebotene Auswahlen nicht unsichtbar weiter aktiv bleiben.
      this.wizardData.raceChoices = {};
      // Körpermaß-Bereiche sind pro Geschlecht getrennt -- bereits gewählte Werte auf den
      // Mittelwert des neuen Geschlechts zurücksetzen, statt sie außerhalb der neuen Grenzen zu lassen.
      const race = await this._getSourceItem(this.wizardData.raceId);
      if (race) this.wizardData.body = this._bodyMidpoint(race, this.wizardData.gender);
    });
    this.render();
  }

  static async #onSelectSubrace(event, target) {
    await this._withShiftReconciliation(() => {
      // Wahl bleibt erhalten, wenn dieselbe Subrasse erneut angeklickt wird; "" (Keine) via
      // eigenem Chip mit data-key="" wählbar (siehe character-creation.hbs).
      this.wizardData.subraceKey = target.dataset.key ?? "";
      // Subrasse kann eigene Wahl-/Verteil-Boni mitbringen -- bei Wechsel sollen alte, nicht
      // mehr angebotene Auswahlen nicht unsichtbar weiter aktiv bleiben.
      this.wizardData.raceChoices = {};
    });
    this.render();
  }

  static async #onPickProfession(event, target) {
    const id = target.closest("[data-id]")?.dataset.id;
    await this._withShiftReconciliation(() => {
      this.wizardData.professionId = id;
      this.wizardData.professionChoices = {};
    });
    this.render();
  }

  static async #onChooseOption(event, target) {
    await this._withShiftReconciliation(() => {
      const scope = target.dataset.scope;
      const bucket = scope === "race" ? "raceChoices" : "professionChoices";
      this.wizardData[bucket][target.dataset.key] = target.dataset.option;
    });
    this.render();
  }

  static async #onDistributePoint(event, target) {
    const scope = target.dataset.scope;
    const bucket = scope === "race" ? "raceChoices" : "professionChoices";
    const key = target.dataset.key;
    const path = target.dataset.path;
    const delta = Number(target.dataset.delta);
    const amount = Number(target.dataset.amount);
    const perOptionMax = Number(target.dataset.perOptionMax);

    // Zuteilung als Array aus { path, points } statt eines { [path]: points }-Objekts (siehe
    // path-resolve.mjs resolveBundles): ein Objekt-Schlüssel wie "talents.koerperlich.klettern"
    // enthält Punkte und würde von Foundrys expandObject beim Speichern in verschachtelte
    // Objekte zerlegt, sodass die Zuteilung beim nächsten Öffnen des Wizards leer erscheint.
    const current = Array.isArray(this.wizardData[bucket][key]) ? this.wizardData[bucket][key] : [];
    const currentPoints = current.find(e => e.path === path)?.points ?? 0;
    const nextPoints = Math.max(0, currentPoints + delta);
    if (perOptionMax > 0 && nextPoints > perOptionMax) return;

    const otherSpent = current.reduce((s, e) => s + (e.path === path ? 0 : e.points), 0);
    if (delta > 0 && otherSpent + nextPoints > amount) {
      ui.notifications.warn(game.i18n.localize("SCUVANYA.Warning.NoFreePoints"));
      return;
    }

    await this._withShiftReconciliation(() => {
      const updated = current.filter(e => e.path !== path);
      if (nextPoints > 0) updated.push({ path, points: nextPoints });
      this.wizardData[bucket][key] = updated;
    });
    this.render();
  }

  static async #onNextStep() {
    if (this.step === 1 && !this.wizardData.raceId) {
      ui.notifications.warn(game.i18n.localize("SCUVANYA.Wizard.NeedRace"));
      return;
    }
    if (this.step === 1 && this.wizardData.raceId && !this.wizardData.subraceKey) {
      const race = await this._getSourceItem(this.wizardData.raceId);
      if (race?.system.subraces?.length) {
        ui.notifications.warn(game.i18n.localize("SCUVANYA.Wizard.NeedSubrace"));
        return;
      }
    }
    if (this.step === 2 && !this._decisionsComplete(await this._raceBundles(), this.wizardData.raceChoices)) {
      ui.notifications.warn(game.i18n.localize("SCUVANYA.Wizard.NeedChoice"));
      return;
    }
    if (this.step === 3) {
      // Beruf wählen + Details sind zu EINEM Schritt zusammengelegt (siehe Konversation).
      if (!this.wizardData.professionId) {
        ui.notifications.warn(game.i18n.localize("SCUVANYA.Wizard.NeedProfession"));
        return;
      }
      const profession = await this._getSourceItem(this.wizardData.professionId);
      if (!this._decisionsComplete([profession?.system], this.wizardData.professionChoices)) {
        ui.notifications.warn(game.i18n.localize("SCUVANYA.Wizard.NeedChoice"));
        return;
      }
    }
    if (this.step === 4) {
      // Sicherheitsnetz: buyPoint verhindert Überkauf bereits beim Klick, aber ein Sprung zurück
      // zu Schritt 1 (Rassenwechsel) kann die Verschiebung nachträglich ändern und bereits
      // getätigte Käufe teurer machen -- vor dem Weitergehen noch einmal frisch prüfen.
      const shifts = await this._computeShiftMap();
      if (this._computeTotalSpent(shifts) > SCUVANYA.startingSkillPoints) {
        ui.notifications.warn(game.i18n.localize("SCUVANYA.Warning.SkillPointsOverspent"));
        return;
      }
    }
    this.step = Math.min(5, this.step + 1);
    this.render();
  }

  /** Schaut Grenzen/Kostenformel eines Pfads nach (siehe _buildCounterRow), inklusive Fallback für den Fall, dass noch nicht gerendert wurde. */
  _skillMeta(path) {
    return this._skillPointMeta.get(path) ?? null;
  }

  static async #onBuyPoint(event, target) {
    const path = target.dataset.path;
    const meta = this._skillMeta(path);
    if (!meta) return;
    const current = foundry.utils.getProperty(this.wizardData.purchases, path) ?? 0;
    if (current >= meta.max) return;

    const shifts = await this._computeShiftMap();
    const shift = shifts[path] ?? 0;
    const cost = meta.levelCostFn(current + shift + 1);
    const spent = this._computeTotalSpent(shifts);
    if (spent + cost > SCUVANYA.startingSkillPoints) {
      ui.notifications.warn(game.i18n.format("SCUVANYA.Warning.NotEnoughSkillPoints", {
        cost, available: SCUVANYA.startingSkillPoints - spent
      }));
      return;
    }

    foundry.utils.setProperty(this.wizardData.purchases, path, current + 1);
    this.render();
  }

  static #onSellPoint(event, target) {
    const path = target.dataset.path;
    const meta = this._skillMeta(path);
    if (!meta) return;
    const current = foundry.utils.getProperty(this.wizardData.purchases, path) ?? 0;
    if (current <= meta.min) return;
    foundry.utils.setProperty(this.wizardData.purchases, path, current - 1);
    this.render();
  }

  static async #onToggleExtra(event, target) {
    const key = target.dataset.key;
    const extra = this.wizardData.purchases.talents.extra;

    if (extra[key]) {
      extra[key] = false;
      this.render();
      return;
    }

    const shifts = await this._computeShiftMap();
    if ((shifts[`talents.extra.${key}`] ?? 0) > 0) return; // bereits durch Rasse/Beruf gewährt

    const requiredKey = SCUVANYA.extraSkillDependencies[key];
    const requiredActive = !requiredKey || extra[requiredKey] || (shifts[`talents.extra.${requiredKey}`] ?? 0) > 0;
    if (!requiredActive) {
      ui.notifications.warn(game.i18n.format("SCUVANYA.Hint.RequiresSkill", {
        skill: game.i18n.localize(`SCUVANYA.Skill.${requiredKey}`)
      }));
      return;
    }

    const spent = this._computeTotalSpent(shifts);
    if (spent + EXTRA_TALENT_COST > SCUVANYA.startingSkillPoints) {
      ui.notifications.warn(game.i18n.format("SCUVANYA.Warning.NotEnoughSkillPoints", {
        cost: EXTRA_TALENT_COST, available: SCUVANYA.startingSkillPoints - spent
      }));
      return;
    }

    extra[key] = true;
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

    // Letzte Sicherheitsprüfung -- verhindert ein Übernehmen, falls ein Rassen-/Berufswechsel
    // nach dem Verteilen der Punkte die Verschiebung nachträglich geändert hat (siehe #onNextStep).
    const shifts = await this._computeShiftMap();
    if (this._computeTotalSpent(shifts) > SCUVANYA.startingSkillPoints) {
      ui.notifications.warn(game.i18n.localize("SCUVANYA.Warning.SkillPointsOverspent"));
      return;
    }

    const p = this.wizardData.purchases;
    const toValueObject = flat => Object.fromEntries(Object.entries(flat).map(([k, v]) => [k, { value: v }]));
    const toLevelObject = flat => Object.fromEntries(Object.entries(flat).map(([k, v]) => [k, { level: v }]));
    const toKnownObject = flat => Object.fromEntries(Object.entries(flat).map(([k, v]) => [k, { known: v }]));

    await actor.update({
      "system.body": this.wizardData.body,
      "system.geschlecht": this.wizardData.gender,
      "system.attributes": toValueObject(p.attributes),
      "system.talents.sozial.positiv": toLevelObject(p.talents.sozial.positiv),
      "system.talents.sozial.negativ": toLevelObject(p.talents.sozial.negativ),
      "system.talents.wissenschaften.sozial": toLevelObject(p.talents.wissenschaften.sozial),
      "system.talents.wissenschaften.natur": toLevelObject(p.talents.wissenschaften.natur),
      "system.talents.koerperlich": toLevelObject(p.talents.koerperlich),
      "system.talents.sonder": toLevelObject(p.talents.sonder),
      "system.talents.handwerk": toLevelObject(p.talents.handwerk),
      "system.talents.spezial": toLevelObject(p.talents.spezial),
      "system.talents.extra": toKnownObject(p.talents.extra),
      "system.disziplinen.kampf": toLevelObject(p.disziplinen.kampf),
      "system.disziplinen.magie": toLevelObject(p.disziplinen.magie)
    });

    ui.notifications.info(game.i18n.localize("SCUVANYA.Wizard.Done"));
    this.close();
  }
}
