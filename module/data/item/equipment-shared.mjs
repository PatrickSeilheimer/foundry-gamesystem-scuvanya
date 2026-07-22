import { SCUVANYA } from "../../config.mjs";

const fields = foundry.data.fields;

/**
 * Gemeinsame Bausteine für ausrüstbare Items (Waffe/Rüstung/generische Ausrüstung) und,
 * wo sinnvoll, auch Verbrauchsgüter. Bewusst ein eigenes, einfacheres Schema als die
 * Eigenschaften/Boni der Rassen/Berufe (progression-shared.mjs): Items brauchen keine
 * Wahlmöglichkeiten (choice/distribute) mit choiceSelections-Verwaltung, nur feste Boni
 * ("fixed") und reinen RP-Text ("text"), siehe effectSchema.
 */

/** Unbestimmte Anzahl frei vergebener Schlagworte, über die Items im Inventar gefiltert werden. */
export function flagsField() {
  return new fields.ArrayField(new fields.StringField({ required: true, blank: true }));
}

/**
 * Eine Ausrüstungs-Voraussetzung, z.B. { path: "attributes.str", operator: "gte", value: 12 }
 * -- "eine schwere Rüstung kann nur getragen werden, wenn STR >= 12 ist". Wird beim Versuch,
 * das Item auszurüsten, gegen die aktuellen (effektiven) Charakterwerte geprüft, siehe
 * documents/actor.mjs canEquipItem.
 */
export function conditionSchema() {
  return new fields.SchemaField({
    path: new fields.StringField({ required: true, blank: true }),
    operator: new fields.StringField({ required: true, choices: Object.keys(SCUVANYA.conditionOperators), initial: "gte" }),
    value: new fields.NumberField({ required: true, integer: true, initial: 0 })
  });
}

export function conditionsField() {
  return new fields.ArrayField(conditionSchema());
}

/**
 * Ein Effekt eines Items -- "fixed" wirkt auf einen Pfad (siehe path-resolve.mjs für gültige
 * Pfade, u.a. auch "actions.apCost.<tag>"/"actions.manaCost.<tag>" für Aktions-Kostenmodifikatoren),
 * "text" ist reiner RP-Text ohne Zahlenwert, "unlockAction" schaltet unabhängig von deren
 * eigenen Voraussetzungen eine Aktion frei (path = Ziel-Aktion.system.key, siehe action.mjs und
 * documents/actor.mjs isActionAvailable) -- z.B. "Umhang des Pyromanen" gewährt "Feuerball".
 * "condition" bestimmt, WANN der Effekt zählt: "equipped" (Standard, Item muss in einem Slot
 * stecken) oder "carried" (zählt bereits, wenn das Item nur im Besitz ist, ohne ausgerüstet
 * zu sein).
 *
 * "duration" ist ein Platzhalter für künftige temporäre Buffs/Debuffs (siehe Konversation:
 * "ein Effekt besitzt ... optional Bedingungen und eine Dauer") -- aktuell nicht ausgewertet,
 * jeder Effekt gilt als dauerhaft, solange seine "condition" erfüllt ist. Leer = dauerhaft.
 */
export function effectSchema() {
  return new fields.SchemaField({
    key: new fields.StringField({ required: true, blank: true }),
    kind: new fields.StringField({ required: true, choices: ["fixed", "text", "unlockAction"], initial: "fixed" }),
    path: new fields.StringField({ required: true, blank: true }),
    amount: new fields.NumberField({ required: true, integer: true, initial: 0 }),
    text: new fields.StringField({ required: true, blank: true }),
    condition: new fields.StringField({ required: true, choices: SCUVANYA.effectConditions, initial: "equipped" }),
    duration: new fields.StringField({ required: false, blank: true, initial: "" })
  });
}

export function effectsField() {
  return new fields.ArrayField(effectSchema());
}

/** Für ausrüstbare Typen (Waffe/Rüstung/generische Ausrüstung): Slot + Bedingungen + Effekte. */
export function equipableItemSchema() {
  return {
    flags: flagsField(),
    slot: new fields.StringField({ required: false, blank: true, initial: "" }),
    conditions: conditionsField(),
    effects: effectsField()
  };
}
