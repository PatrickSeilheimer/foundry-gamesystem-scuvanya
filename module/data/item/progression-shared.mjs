import { SCUVANYA } from "../../config.mjs";
import { baseItemSchema } from "./base-item.mjs";

const fields = foundry.data.fields;

/**
 * Ein "Bonus-Bündel": Attribut-/Resistenz-/Talentboni, freie Attributpunkte, automatische
 * Extra-Fähigkeiten und Wahlmöglichkeiten. Das ist die wiederverwendbare Grundeinheit für
 * Boni -- ein Beruf hat genau eins (siehe professionItemSchema), eine Rasse dagegen mehrere
 * gleichzeitig aktive Bündel (Basis + Geschlecht + ggf. Subrasse, siehe race.mjs/race-resolve.mjs),
 * die am Ende zu genau den gleichen Feldern aufsummiert werden.
 */
export function bonusBundleSchema() {
  const attributeBonuses = {};
  for (const key of Object.keys(SCUVANYA.attributes)) {
    attributeBonuses[key] = new fields.NumberField({ required: true, integer: true, initial: 0 });
  }

  const resistanceBonuses = {};
  for (const key of Object.keys(SCUVANYA.damageTypes)) {
    resistanceBonuses[key] = new fields.NumberField({ required: true, integer: true, initial: 0, min: -100, max: 100 });
  }

  return {
    attributeBonuses: new fields.SchemaField(attributeBonuses),
    freeAttributePoints: new fields.NumberField({ required: true, integer: true, initial: 0, min: 0 }),
    skillBonuses: new fields.ArrayField(new fields.SchemaField({
      // Punktweg relativ zu system.talents, z.B. "sozial.positiv.charme" oder "handwerk.alchemist".
      path: new fields.StringField({ required: true, blank: false }),
      bonus: new fields.NumberField({ required: true, integer: true, initial: 0 })
    })),
    resistanceBonuses: new fields.SchemaField(resistanceBonuses),
    extraGrants: new fields.ArrayField(new fields.StringField({ required: true, blank: false, choices: SCUVANYA.extraSkills })),
    choices: new fields.ArrayField(new fields.SchemaField({
      key: new fields.StringField({ required: true, blank: false }),
      label: new fields.StringField({ required: true, blank: false }),
      kind: new fields.StringField({ required: true, choices: SCUVANYA.choiceKinds, initial: "attribute" }),
      options: new fields.ArrayField(new fields.StringField({ required: true, blank: false })),
      amount: new fields.NumberField({ required: true, integer: true, initial: 0 })
    }))
  };
}

/**
 * Schema für Berufe: ein einzelnes, immer aktives Bonus-Bündel plus Beschreibung und die
 * getroffenen Wahlmöglichkeiten (choiceSelections). Berufe kennen -- anders als Rassen --
 * keine Geschlechter-/Subrassen-Varianten.
 */
export function professionItemSchema() {
  return {
    ...baseItemSchema(),
    ...bonusBundleSchema(),
    // Getroffene Wahl je choice.key, z.B. { combatAttribute: "str" }. Nur auf der
    // Item-INSTANZ eines Charakters relevant, nicht auf der Vorlage im Items-Verzeichnis.
    choiceSelections: new fields.ObjectField({ required: true, initial: {} })
  };
}
