import { SCUVANYA } from "../../config.mjs";
import { baseItemSchema } from "./base-item.mjs";

const fields = foundry.data.fields;

/**
 * Ein Bonus innerhalb einer Eigenschaft (siehe eigenschaftSchema). "kind" bestimmt, welche
 * der übrigen Felder tatsächlich benutzt werden -- siehe SCUVANYA.bonusKinds:
 *   fixed:      path + amount (fester Bonus auf genau ein Ziel)
 *   choice:     options + amount (Spieler wählt EIN Ziel aus options, erhält amount)
 *   distribute: options + amount + perOptionMax (Spieler verteilt amount Punkte frei auf
 *               options, je Ziel maximal perOptionMax -- 0 = unbegrenzt, z.B. um zu
 *               verhindern, dass beide freien Punkte auf dasselbe Attribut wandern)
 *   text:       text (reiner RP-Text ohne Zahlenwert)
 *
 * "path" (und die Einträge von "options") sind Pfade relativ zu system, z.B.
 * "attributes.mag", "talents.koerperlich.klettern", "disziplinen.magie.pyrokinet",
 * "resistances.feuer", "armor.physical", "ac.value", "initiative", "talents.extra.lesen" --
 * siehe path-resolve.mjs für die vollständige Auflösung. "key" identifiziert einen
 * interaktiven Bonus (choice/distribute) eindeutig für choiceSelections auf der Item-Instanz.
 */
function bonusSchema() {
  return new fields.SchemaField({
    key: new fields.StringField({ required: true, blank: true }),
    kind: new fields.StringField({ required: true, choices: SCUVANYA.bonusKinds, initial: "fixed" }),
    path: new fields.StringField({ required: true, blank: true }),
    options: new fields.ArrayField(new fields.StringField({ required: true, blank: true })),
    amount: new fields.NumberField({ required: true, integer: true, initial: 0 }),
    perOptionMax: new fields.NumberField({ required: true, integer: true, initial: 0, min: 0 }),
    text: new fields.StringField({ required: true, blank: true })
  });
}

function eigenschaftSchema() {
  return new fields.SchemaField({
    key: new fields.StringField({ required: true, blank: true }),
    name: new fields.StringField({ required: true, blank: true }),
    description: new fields.StringField({ required: true, blank: true }),
    boni: new fields.ArrayField(bonusSchema())
  });
}

/**
 * Ein "Bonus-Bündel": feste Start-Attributwerte OHNE Namen/Beschreibung (die sind einfach da,
 * siehe attributeStart) plus eine Liste benannter Eigenschaften (Name + Beschreibung + Boni).
 * Das ist die wiederverwendbare Grundeinheit für Boni -- ein Beruf hat genau eins (siehe
 * professionItemSchema), eine Rasse dagegen mehrere gleichzeitig aktive Bündel (Basis +
 * Geschlecht + ggf. Subrasse, siehe race.mjs/race-resolve.mjs), die am Ende zu einem
 * gemeinsamen Boni-Satz aufgelöst werden (siehe path-resolve.mjs).
 *
 * Wahlmöglichkeiten, die (zufällig) ein Attribut treffen (choice/distribute, z.B. "wähle ein
 * Kampfattribut"), bleiben in den Eigenschaften -- die brauchen weiterhin einen Namen, damit
 * der Wizard die Entscheidung beschriften kann. Nur FESTE Attributboni ohne jede Wahl gehören
 * in attributeStart.
 */
export function bonusBundleSchema() {
  const attributeStart = {};
  for (const key of Object.keys(SCUVANYA.attributes)) {
    attributeStart[key] = new fields.NumberField({ required: true, integer: true, initial: 0 });
  }

  return {
    attributeStart: new fields.SchemaField(attributeStart),
    eigenschaften: new fields.ArrayField(eigenschaftSchema())
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
    // Getroffene Wahl/Verteilung je bonus.key, z.B. { kampfattribut: "attributes.str" } für
    // "choice" oder { freiePunkte: { "attributes.str": 1, "attributes.dex": 1 } } für
    // "distribute". Nur auf der Item-INSTANZ eines Charakters relevant, nicht auf der
    // Vorlage im Items-Verzeichnis.
    choiceSelections: new fields.ObjectField({ required: true, initial: {} })
  };
}
