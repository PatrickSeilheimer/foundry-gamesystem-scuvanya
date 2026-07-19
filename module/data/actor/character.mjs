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
    this._preparePhysicalSkillBonus();
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
    for (const key of Object.keys(SCUVANYA.attributes)) attribute[key] = 0;
    for (const key of Object.keys(SCUVANYA.damageTypes)) resistance[key] = 0;

    const items = this.parent?.items ?? [];
    for (const item of items) {
      if (item.type !== "race" && item.type !== "profession") continue;
      const data = item.system;
      for (const key of Object.keys(SCUVANYA.attributes)) {
        attribute[key] += data.attributeBonuses?.[key] ?? 0;
      }
      for (const key of Object.keys(SCUVANYA.damageTypes)) {
        resistance[key] += data.resistanceBonuses?.[key] ?? 0;
      }
      for (const entry of data.skillBonuses ?? []) {
        skill[entry.path] = (skill[entry.path] ?? 0) + entry.bonus;
      }
    }
    return { attribute, resistance, skill };
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

  /** Summe der freien Attributpunkte, die Rasse/Beruf insgesamt gewähren. */
  get freeAttributePointsAvailable() {
    const items = this.parent?.items ?? [];
    return items
      .filter(i => i.type === "race" || i.type === "profession")
      .reduce((sum, i) => sum + (i.system.freeAttributePoints ?? 0), 0);
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
}
