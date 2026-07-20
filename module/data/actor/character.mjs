import { SCUVANYA } from "../../config.mjs";
import {
  attributesSchema,
  resourcesSchema,
  armorSchema,
  armorClassSchema,
  resistancesSchema,
  biographySchema,
  tieredSkillsField,
  leveledSkillsField,
  booleanSkillsField,
  disciplinesField
} from "../templates.mjs";
import {
  attributeSpentCost,
  talentUpgradeCost,
  tieredUpgradeCost,
  specialtyUpgradeCost,
  EXTRA_TALENT_COST
} from "../../rules/costs.mjs";
import { resolveRaceBonuses } from "../item/race-resolve.mjs";

const fields = foundry.data.fields;

/**
 * Datenmodell für Spielercharaktere. Trägt den vollen Talentbaum.
 * NPCs nutzen absichtlich ein eigenes, schlankeres Modell (siehe npc.mjs) --
 * ein SL, der einen voll ausgebauten NSC braucht, weist sich stattdessen
 * selbst einen Character-Actor zu.
 */
export default class CharacterData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      attributes: attributesSchema(),
      resources: resourcesSchema(),
      armor: armorSchema(),
      ac: armorClassSchema(),
      resistances: resistancesSchema(),
      biography: biographySchema(),

      // Bestimmt, welches Geschlechter-Bündel der Rasse (RaceData.maennlich/weiblich)
      // zusätzlich zur Basis aktiv ist, siehe _computeProgressionBonus/race-resolve.mjs.
      geschlecht: new fields.StringField({
        required: true, choices: ["maennlich", "weiblich"], initial: "maennlich"
      }),

      // Körpermaße, im Erstellungs-Wizard per Slider innerhalb der Rassen-Bereiche gewählt
      // (siehe RaceData.body), danach frei editierbar.
      body: new fields.SchemaField({
        height: new fields.NumberField({ required: true, initial: 0, min: 0 }),
        weight: new fields.NumberField({ required: true, initial: 0, min: 0 }),
        age: new fields.NumberField({ required: true, integer: true, initial: 0, min: 0 })
      }),

      // Skillpunkt-Guthaben: "total" wird von der SL gesetzt, "spent"/"available" werden
      // aus den investierten Stufen über alle Kategorien errechnet (siehe _computeSkillPoints).
      skillPoints: new fields.SchemaField({
        total: new fields.NumberField({ required: true, integer: true, initial: 0, min: 0 })
      }),

      // Punkte, die aus Rasse/Beruf frei auf Attribute verteilt werden dürfen
      // (z.B. Mensch: 2 freie Punkte). Manuell vom Spieler zugewiesen, siehe Sheet.
      attributeAllocation: (() => {
        const schema = {};
        for (const key of Object.keys(SCUVANYA.attributes)) {
          schema[key] = new fields.NumberField({ required: true, integer: true, initial: 0, min: 0 });
        }
        return new fields.SchemaField(schema);
      })(),

      talents: new fields.SchemaField({
        sozial: new fields.SchemaField({
          positiv: leveledSkillsField(SCUVANYA.socialSkills.positive),
          negativ: leveledSkillsField(SCUVANYA.socialSkills.negative)
        }),
        wissenschaften: new fields.SchemaField({
          sozial: leveledSkillsField(SCUVANYA.scienceSkills.sozial),
          natur: leveledSkillsField(SCUVANYA.scienceSkills.natur)
        }),
        koerperlich: leveledSkillsField(SCUVANYA.physicalSkills),
        sonder: leveledSkillsField(Object.keys(SCUVANYA.sonderSkills)),
        handwerk: tieredSkillsField(SCUVANYA.craftSkills, SCUVANYA.craftStartingLevel),
        spezial: tieredSkillsField(SCUVANYA.spezialSkills, SCUVANYA.specialtyStartingLevel),
        extra: booleanSkillsField(SCUVANYA.extraSkills)
      }),

      sprachen: new fields.SchemaField({
        gemeinsprache: new fields.SchemaField({
          level: new fields.NumberField({
            required: true, integer: true, initial: SCUVANYA.commonLanguageLevel,
            min: SCUVANYA.languageMinLevel, max: SCUVANYA.languageMaxLevel
          })
        }),
        weitere: new fields.ArrayField(new fields.SchemaField({
          name: new fields.StringField({ required: true, blank: false }),
          level: new fields.NumberField({
            required: true, integer: true, initial: 0,
            min: SCUVANYA.languageMinLevel, max: SCUVANYA.languageMaxLevel
          })
        }))
      }),

      disziplinen: new fields.SchemaField({
        kampf: disciplinesField(Object.keys(SCUVANYA.combatDisciplines)),
        magie: disciplinesField(Object.keys(SCUVANYA.magicDisciplines))
      })
    };
  }

  prepareBaseData() {
    // Platz für Basiswerte, die vor eingebetteten Dokumenten/Effekten stehen müssen.
    // Rassen-/Berufsboni laufen über Active Effects und greifen zwischen Base- und
    // Derived-Data automatisch (Foundry-Standardablauf: Base -> Effects -> Derived).
  }

  prepareDerivedData() {
    this._progressionBonus = this._computeProgressionBonus();
    this._prepareAttributes();
    this._prepareResources();
    this._prepareResistances();
    this._prepareSkillBonusDisplay();
    this._prepareDisciplineBonusDisplay();
    this._prepareExtraGrants();
    this._preparePhysicalSkillBonus();
    this._computeSkillPoints();
  }

  /**
   * WICHTIG: Alle hier berechneten Rassen-/Berufsboni werden NICHT in die persistierten
   * Basisfelder (attributes.*.value, resistances.*, talents.*.level) zurückgeschrieben,
   * sondern als separate "effectiveValue"/"raceBonus"-Felder abgelegt. Grund: das Sheet-Form
   * sendet bei jeder Änderung (submitOnChange) den kompletten Formularinhalt inkl. aller
   * sichtbaren Werte. Würde ein Input direkt an ein derived-bemaltes Feld gebunden, würde
   * der (bereits geboostete) Anzeigewert bei jedem Speichern erneut als neue Basis
   * persistiert -- der Bonus würde sich mit jedem Klick aufaddieren. Editierbare Inputs
   * binden deshalb ausschließlich an die reinen Basisfelder.
   */
  _computeProgressionBonus() {
    const attribute = {};
    const resistance = {};
    const skill = {};
    const discipline = {};
    const extraGrants = new Set();
    for (const key of Object.keys(SCUVANYA.attributes)) attribute[key] = 0;
    for (const key of Object.keys(SCUVANYA.damageTypes)) resistance[key] = 0;

    const items = this.parent?.items ?? [];
    for (const item of items) {
      if (item.type !== "race" && item.type !== "profession") continue;
      // Eine Rasse ist mehrere gleichzeitig aktive Bonus-Bündel (Basis + Geschlecht + ggf.
      // Subrasse), zu einem Netto-Bündel verrechnet (siehe race-resolve.mjs). Ein Beruf ist
      // schlicht der Sonderfall "ein einzelnes Bündel" -- ab hier identisch behandelt.
      const data = item.type === "race"
        ? resolveRaceBonuses(item.system, this.geschlecht, item.system.subraceKey)
        : item.system;

      for (const key of Object.keys(SCUVANYA.attributes)) {
        attribute[key] += data.attributeBonuses?.[key] ?? 0;
      }
      for (const key of Object.keys(SCUVANYA.damageTypes)) {
        resistance[key] += data.resistanceBonuses?.[key] ?? 0;
      }
      for (const entry of data.skillBonuses ?? []) {
        skill[entry.path] = (skill[entry.path] ?? 0) + entry.bonus;
      }
      for (const key of data.extraGrants ?? []) {
        extraGrants.add(key);
      }

      // Wahlmöglichkeiten (choices): die getroffene Wahl liegt auf der Item-INSTANZ selbst
      // (item.system.choiceSelections -- nicht Teil des Bündels, gilt für alle Bündel eines
      // Items gemeinsam), die Optionsliste/Betrag auf der jeweiligen choice-Definition.
      for (const choice of data.choices ?? []) {
        const selected = item.system.choiceSelections?.[choice.key];
        if (!selected || !choice.options?.includes(selected)) continue;
        if (choice.kind === "attribute") {
          attribute[selected] = (attribute[selected] ?? 0) + choice.amount;
        } else if (choice.kind === "skill") {
          skill[selected] = (skill[selected] ?? 0) + choice.amount;
        } else if (choice.kind === "discipline") {
          discipline[selected] = (discipline[selected] ?? 0) + choice.amount;
        }
      }
    }
    return { attribute, resistance, skill, discipline, extraGrants };
  }

  _prepareResistances() {
    const { resistance } = this._progressionBonus;
    this.resistancesEffective = {};
    for (const key of Object.keys(SCUVANYA.damageTypes)) {
      this.resistancesEffective[key] = (this.resistances[key] ?? 0) + (resistance[key] ?? 0);
    }
  }

  _prepareSkillBonusDisplay() {
    const { skill } = this._progressionBonus;
    for (const [path, bonus] of Object.entries(skill)) {
      const target = foundry.utils.getProperty(this.talents, path);
      if (target) target.raceBonus = bonus;
    }
  }

  /** Wie _prepareSkillBonusDisplay, aber für Disziplinen (Pfad relativ zu disziplinen, z.B. "magie.pyrokinet"). */
  _prepareDisciplineBonusDisplay() {
    const { discipline } = this._progressionBonus;
    for (const [path, bonus] of Object.entries(discipline)) {
      const target = foundry.utils.getProperty(this.disziplinen, path);
      if (target) target.raceBonus = bonus;
    }
  }

  /**
   * Extra-Fähigkeiten (Lesen, Schreiben, ...), die Rasse/Beruf automatisch gewähren:
   * angezeigt als "granted", ohne den persistierten "known"-Wert zu überschreiben
   * (gleiche Non-Destruktiv-Logik wie bei Attributen/Talenten, siehe Klassenkommentar oben).
   */
  _prepareExtraGrants() {
    const { extraGrants } = this._progressionBonus;
    for (const key of SCUVANYA.extraSkills) {
      this.talents.extra[key].granted = extraGrants.has(key);
    }
  }

  /** Summe der freien Attributpunkte, die Rasse (Basis+Geschlecht+Subrasse) und Beruf insgesamt gewähren. */
  get freeAttributePointsAvailable() {
    const items = this.parent?.items ?? [];
    return items
      .filter(i => i.type === "race" || i.type === "profession")
      .reduce((sum, i) => {
        const data = i.type === "race"
          ? resolveRaceBonuses(i.system, this.geschlecht, i.system.subraceKey)
          : i.system;
        return sum + (data.freeAttributePoints ?? 0);
      }, 0);
  }

  get freeAttributePointsSpent() {
    return Object.values(this.attributeAllocation).reduce((sum, v) => sum + v, 0);
  }

  _prepareAttributes() {
    const { attribute } = this._progressionBonus;
    for (const key of Object.keys(SCUVANYA.attributes)) {
      const attr = this.attributes[key];
      attr.raceBonus = attribute[key] ?? 0;
      attr.effectiveValue = attr.value + (this.attributeAllocation[key] ?? 0) + attr.raceBonus;
      attr.mod = attr.effectiveValue - 10;
    }
  }

  _prepareResources() {
    const attr = this.attributes;
    this.resources.hp.max = 4 * attr.con.effectiveValue + attr.str.effectiveValue;
    this.resources.mana.max = 2 * attr.mnd.effectiveValue + 2 * attr.mag.effectiveValue + attr.con.effectiveValue;
    this.resources.mentalHealth.max = 3 * attr.mnd.effectiveValue + attr.int.effectiveValue + attr.con.effectiveValue;
  }

  /**
   * Körperliche Talente teilen sich einen Bonus: Durchschnitt der investierten Punkte
   * über alle 5 Talente (abgerundet). Annahme bei Nicht-Teilbarkeit: Math.floor --
   * muss noch bestätigt werden, sobald die Skillpunkt-Kosten final stehen.
   */
  _preparePhysicalSkillBonus() {
    const skills = this.talents.koerperlich;
    const keys = SCUVANYA.physicalSkills;
    const total = keys.reduce((sum, key) => sum + (skills[key]?.level ?? 0), 0);
    const bonus = Math.floor(total / keys.length);
    for (const key of keys) {
      skills[key].bonus = bonus;
    }
  }

  /**
   * Errechnet, wie viele Skillpunkte bereits investiert sind (über alle kaufbaren
   * Kategorien) und stellt sie neben dem SL-gesetzten Guthaben (skillPoints.total) dar.
   * Rassen-/Berufsboni fließen hier NICHT ein -- die sind kostenlose Overlays, siehe oben.
   */
  _computeSkillPoints() {
    let spent = 0;

    for (const key of Object.keys(SCUVANYA.attributes)) {
      spent += attributeSpentCost(this.attributes[key].value, SCUVANYA.attributeStartingValue);
    }

    const leveledGroups = [
      this.talents.sozial.positiv, this.talents.sozial.negativ,
      this.talents.wissenschaften.sozial, this.talents.wissenschaften.natur,
      this.talents.koerperlich, this.talents.sonder
    ];
    for (const group of leveledGroups) {
      for (const skill of Object.values(group)) {
        spent += talentUpgradeCost(0, skill.level);
      }
    }

    for (const skill of Object.values(this.talents.handwerk)) {
      spent += tieredUpgradeCost(SCUVANYA.craftStartingLevel, skill.level);
    }
    for (const skill of Object.values(this.talents.spezial)) {
      spent += specialtyUpgradeCost(SCUVANYA.specialtyStartingLevel, skill.level);
    }
    for (const skill of Object.values(this.talents.extra)) {
      if (skill.known) spent += EXTRA_TALENT_COST;
    }

    for (const discipline of Object.values(this.disziplinen.kampf)) {
      spent += tieredUpgradeCost(0, discipline.level);
    }
    for (const discipline of Object.values(this.disziplinen.magie)) {
      spent += tieredUpgradeCost(0, discipline.level);
    }

    this.skillPoints.spent = spent;
    this.skillPoints.available = this.skillPoints.total - spent;
  }
}
