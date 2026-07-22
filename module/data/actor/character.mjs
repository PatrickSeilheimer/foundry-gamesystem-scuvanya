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
  talentSpentCost,
  tieredSpentCost,
  specialtySpentCost,
  EXTRA_TALENT_COST
} from "../../rules/costs.mjs";
import { activeRaceBundles } from "../item/race-resolve.mjs";
import { resolveBundles, applyPathBonuses, resolveItemEffects } from "../item/path-resolve.mjs";

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
      }),

      // Welches Item (embedded item id, "" = leer) aktuell in welchem Ausrüstungs-Slot steckt,
      // siehe SCUVANYA.equipSlots und module/apps/equip-picker.mjs. Das ist die einzige
      // Quelle der Wahrheit für "ausgerüstet" auf dem Charakterbogen -- das ältere, einfache
      // item.system.equipped-Feld (Waffe/Rüstung) bleibt nur aus Altlast-Gründen bestehen.
      equipment: new fields.SchemaField({
        slots: new fields.SchemaField(
          Object.fromEntries(Object.keys(SCUVANYA.equipSlots).map(key => [
            key, new fields.StringField({ required: false, blank: true, initial: "" })
          ]))
        )
      })
    };
  }

  prepareBaseData() {
    // Platz für Basiswerte, die vor eingebetteten Dokumenten/Effekten stehen müssen.
    // Rassen-/Berufsboni laufen über Active Effects und greifen zwischen Base- und
    // Derived-Data automatisch (Foundry-Standardablauf: Base -> Effects -> Derived).
  }

  prepareDerivedData() {
    // resistancesEffective muss VOR applyPathBonuses existieren, da Resistenz-Boni dort
    // direkt hineinaddiert werden (siehe path-resolve.mjs).
    this.resistancesEffective = foundry.utils.deepClone(this.resistances);
    // Einmaliger Reset VOR beiden applyPathBonuses-Durchläufen (Rasse/Beruf + Ausrüstung) --
    // siehe Kommentar in path-resolve.mjs, warum das nicht mehr in applyPathBonuses selbst passiert.
    this._armorBonus = { physical: 0, magical: 0 };
    this._acBonus = 0;
    this._initiativeBonus = 0;

    const { pathBonuses, texts } = this._computeProgressionBonus();
    this.progressionTexts = texts;
    applyPathBonuses(this, pathBonuses, "raceBonus");

    const { pathBonuses: itemPathBonuses, texts: itemTexts, breakdown: itemBreakdown } = this._computeItemBonus();
    this.itemTexts = itemTexts;
    applyPathBonuses(this, itemPathBonuses, "itemBonus", itemBreakdown);

    this._prepareAttributes();
    this._prepareResources();
    this._prepareArmorAndAc();
    this._preparePhysicalSkillBonus();
    this._computeSkillPoints();
  }

  /**
   * Sammelt die Eigenschaften-Boni aller Rassen-/Berufs-Items zu EINEM flachen
   * { [path]: amount }-Satz (siehe path-resolve.mjs) -- eine Rasse ist dabei mehrere
   * gleichzeitig aktive Bündel (Basis + Geschlecht + ggf. Subrasse), ein Beruf ein
   * einzelnes Bündel. Boni auf denselben Pfad aus verschiedenen Items (z.B. Rasse UND
   * Beruf treffen zufällig dasselbe Attribut) werden aufaddiert.
   */
  _computeProgressionBonus() {
    const pathBonuses = {};
    const texts = [];

    const items = this.parent?.items ?? [];
    for (const item of items) {
      if (item.type !== "race" && item.type !== "profession") continue;
      const bundles = item.type === "race"
        ? activeRaceBundles(item.system, this.geschlecht, item.system.subraceKey)
        : [item.system];
      const resolved = resolveBundles(bundles, item.system.choiceSelections);
      for (const [path, amount] of Object.entries(resolved.pathBonuses)) {
        pathBonuses[path] = (pathBonuses[path] ?? 0) + amount;
      }
      texts.push(...resolved.texts);
    }

    return { pathBonuses, texts };
  }

  /**
   * Sammelt die Effekte aller ausrüstbaren Items (Waffe/Rüstung/Ausrüstung) zu EINEM flachen
   * Boni-Satz -- getrennt von _computeProgressionBonus, weil Ausrüstungsboni ein eigenes
   * Overlay ("itemBonus" statt "raceBonus") bekommen, siehe applyPathBonuses. "equipped"-Effekte
   * zählen nur für Items, deren ID gerade in einem Slot steckt (system.equipment.slots.*),
   * "carried"-Effekte für jedes Item im Besitz, ausgerüstet oder nicht.
   */
  _computeItemBonus() {
    const items = (this.parent?.items ?? []).filter(i =>
      ["weapon", "armor", "equipment"].includes(i.type)
    );
    const equippedItemIds = new Set(Object.values(this.equipment.slots).filter(Boolean));
    return resolveItemEffects(items, equippedItemIds);
  }

  _prepareAttributes() {
    for (const key of Object.keys(SCUVANYA.attributes)) {
      const attr = this.attributes[key];
      attr.raceBonus = attr.raceBonus ?? 0;
      attr.itemBonus = attr.itemBonus ?? 0;
      attr.effectiveValue = attr.value + attr.raceBonus + attr.itemBonus;
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
   * Rüstungshärte/Rüstungsklasse als eigene "Effective"-Overlays -- dieselbe Non-Destruktiv-
   * Logik wie bei Attributen: armor.physical/armor.magical/ac.value bleiben die reinen,
   * editierbaren Basisfelder, armorEffective/acEffective sind reine Anzeigewerte.
   */
  _prepareArmorAndAc() {
    const bonus = this._armorBonus ?? { physical: 0, magical: 0 };
    this.armorEffective = {
      physical: this.armor.physical + (bonus.physical ?? 0),
      magical: this.armor.magical + (bonus.magical ?? 0)
    };
    this.acEffective = this.ac.value + (this._acBonus ?? 0);
    // Öffentlich benannt (statt _initiativeBonus), damit getRollData() in documents/actor.mjs
    // sauber darauf zugreifen kann -- wird in die Initiative-Formel eingerechnet (siehe scuvanya.mjs).
    this.initiativeBonus = this._initiativeBonus ?? 0;
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
   *
   * WICHTIG: Rassen-/Berufsboni verschieben den KOSTENLOSEN Startwert (siehe costs.mjs) --
   * ein Attribut, das dank Rasse bei 11 statt 6 startet, kostet für den nächsten Punkt den
   * Preis von Stufe 12 (absolut), nicht den Preis von Stufe 7. Der "shift" ist deshalb
   * überall der jeweilige raceBonus.
   */
  _computeSkillPoints() {
    let spent = 0;

    for (const key of Object.keys(SCUVANYA.attributes)) {
      const attr = this.attributes[key];
      spent += attributeSpentCost(attr.value, SCUVANYA.attributeStartingValue, attr.raceBonus);
    }

    const leveledGroups = [
      this.talents.sozial.positiv, this.talents.sozial.negativ,
      this.talents.wissenschaften.sozial, this.talents.wissenschaften.natur,
      this.talents.koerperlich, this.talents.sonder
    ];
    for (const group of leveledGroups) {
      for (const skill of Object.values(group)) {
        spent += talentSpentCost(skill.level, skill.raceBonus ?? 0);
      }
    }

    for (const skill of Object.values(this.talents.handwerk)) {
      spent += tieredSpentCost(skill.level, SCUVANYA.craftStartingLevel, skill.raceBonus ?? 0);
    }
    for (const skill of Object.values(this.talents.spezial)) {
      spent += specialtySpentCost(skill.level, SCUVANYA.specialtyStartingLevel, skill.raceBonus ?? 0);
    }
    for (const skill of Object.values(this.talents.extra)) {
      if (skill.known) spent += EXTRA_TALENT_COST;
    }

    for (const discipline of Object.values(this.disziplinen.kampf)) {
      spent += tieredSpentCost(discipline.level, 0, discipline.raceBonus ?? 0);
    }
    for (const discipline of Object.values(this.disziplinen.magie)) {
      spent += tieredSpentCost(discipline.level, 0, discipline.raceBonus ?? 0);
    }

    this.skillPoints.spent = spent;
    this.skillPoints.available = this.skillPoints.total - spent;
  }
}
