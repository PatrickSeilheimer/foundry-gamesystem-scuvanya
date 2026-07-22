import { SCUVANYA } from "../config.mjs";

/**
 * Wiederverwendbare Schema-Bausteine für Actor-Datenmodelle.
 * Zentral gehalten, damit Character- und NPC-Datenmodell dieselbe Struktur für
 * Attribute/Ressourcen/Rüstung/Resistenzen teilen und Erweiterungen (neue Rassen-Effekte,
 * neue Schadensarten, ...) an einer Stelle vorgenommen werden können.
 */

const fields = foundry.data.fields;

export function attributesSchema() {
  const schema = {};
  for (const key of Object.keys(SCUVANYA.attributes)) {
    schema[key] = new fields.SchemaField({
      value: new fields.NumberField({
        required: true,
        integer: true,
        initial: SCUVANYA.attributeStartingValue,
        min: 1
      })
    });
  }
  return new fields.SchemaField(schema);
}

export function resourcesSchema() {
  return new fields.SchemaField({
    hp: new fields.SchemaField({
      value: new fields.NumberField({ required: true, integer: true, initial: 10, min: 0 })
    }),
    mana: new fields.SchemaField({
      value: new fields.NumberField({ required: true, integer: true, initial: 10, min: 0 })
    }),
    mentalHealth: new fields.SchemaField({
      value: new fields.NumberField({ required: true, integer: true, initial: 10, min: 0 })
    }),
    // Aktionspunkte: kein von Attributen abgeleitetes Maximum wie HP/Mana/MG, sondern ein fester
    // Wert (SCUVANYA.turnStartAP), auf den zu Rundenbeginn zurückgesetzt wird (siehe scuvanya.mjs
    // Hooks.on("combatTurn")) -- verbraucht wird der Wert beim Einsatz einer Aktion, siehe
    // documents/actor.mjs useAction.
    ap: new fields.SchemaField({
      value: new fields.NumberField({ required: true, integer: true, initial: 5, min: 0 })
    })
  });
}

export function armorSchema() {
  return new fields.SchemaField({
    physical: new fields.NumberField({ required: true, integer: true, initial: 0, min: 0 }),
    magical: new fields.NumberField({ required: true, integer: true, initial: 0, min: 0 })
  });
}

/**
 * AC-Berechnung ist laut Regelwerk noch nicht final. Vorerst ein manuell editierbares
 * Feld statt einer Formel, damit die SL den Wert selbst setzen kann bis die Regel steht.
 */
export function armorClassSchema() {
  return new fields.SchemaField({
    value: new fields.NumberField({ required: true, integer: true, initial: 10, min: 0 })
  });
}

export function resistancesSchema() {
  const schema = {};
  for (const key of Object.keys(SCUVANYA.damageTypes)) {
    schema[key] = new fields.NumberField({
      required: true,
      integer: true,
      initial: 0,
      min: -100,
      max: 100
    });
  }
  return new fields.SchemaField(schema);
}

export function biographySchema() {
  return new fields.HTMLField({ required: false, blank: true });
}

/** Skills mit Level 0-5 (oder abweichendem Startwert), gewürfelt mit Stufenwürfel (Handwerk/Spezial). */
export function tieredSkillsField(skillKeys, startingLevel) {
  const schema = {};
  for (const key of skillKeys) {
    schema[key] = new fields.SchemaField({
      level: new fields.NumberField({
        required: true,
        integer: true,
        initial: startingLevel,
        min: SCUVANYA.tieredSkillMinLevel,
        max: SCUVANYA.tieredSkillMaxLevel
      })
    });
  }
  return new fields.SchemaField(schema);
}

/** Skills mit einfachem Level-Feld (Sozial, Wissenschaften, Körperlich, Sonder). */
export function leveledSkillsField(skillKeys) {
  const schema = {};
  for (const key of skillKeys) {
    schema[key] = new fields.SchemaField({
      level: new fields.NumberField({ required: true, integer: true, initial: 0, min: 0 })
    });
  }
  return new fields.SchemaField(schema);
}

/** Extra-Fähigkeiten: reine Booleans, kein Wurf. */
export function booleanSkillsField(skillKeys) {
  const schema = {};
  for (const key of skillKeys) {
    schema[key] = new fields.SchemaField({
      known: new fields.BooleanField({ required: true, initial: false })
    });
  }
  return new fields.SchemaField(schema);
}

/** Kampf-/Magiedisziplinen: Stufe 0-10. */
export function disciplinesField(disciplineKeys) {
  const schema = {};
  for (const key of disciplineKeys) {
    schema[key] = new fields.SchemaField({
      level: new fields.NumberField({
        required: true,
        integer: true,
        initial: 0,
        min: SCUVANYA.disciplineMinLevel,
        max: SCUVANYA.disciplineMaxLevel
      })
    });
  }
  return new fields.SchemaField(schema);
}
