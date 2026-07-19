import { SCUVANYA } from "../../config.mjs";
import { baseItemSchema } from "./base-item.mjs";

const fields = foundry.data.fields;

/**
 * Gemeinsames Schema für Rasse- und Beruf-Items: beide verleihen feste Attributboni,
 * optional freie Punkte zum Selbstverteilen (z.B. Mensch: +2 frei) und eine flexible
 * Liste von Skill-Boni (statt jede Talentkategorie einzeln abzubilden) -- damit neue
 * Rassen/Berufe rein datengetrieben angelegt werden können, ohne Codeänderungen.
 *
 * "choices" bildet Wahlmöglichkeiten ab (z.B. "+1 auf STR, DEX oder MAG, wähle eins"):
 * beim Anlegen des Items (in Foundry) definiert man die Optionen, beim Anwenden auf
 * einen Charakter (im Erstellungs-Wizard) wählt der Spieler eine Option; die Wahl wird
 * in choiceSelections auf der jeweiligen Item-INSTANZ (dem embedded Item des Charakters)
 * gespeichert, nicht auf der Vorlage im Items-Verzeichnis.
 */
export function progressionItemSchema() {
  const attributeBonuses = {};
  for (const key of Object.keys(SCUVANYA.attributes)) {
    attributeBonuses[key] = new fields.NumberField({ required: true, integer: true, initial: 0 });
  }

  return {
    ...baseItemSchema(),
    attributeBonuses: new fields.SchemaField(attributeBonuses),
    freeAttributePoints: new fields.NumberField({ required: true, integer: true, initial: 0, min: 0 }),
    skillBonuses: new fields.ArrayField(new fields.SchemaField({
      // Punktweg zum Talent innerhalb von system.talents, z.B. "sozial.positiv.charme"
      // oder "handwerk.alchemist". Wird beim Anwenden per Punktnotation aufgelöst.
      path: new fields.StringField({ required: true, blank: false }),
      bonus: new fields.NumberField({ required: true, integer: true, initial: 0 })
    })),
    resistanceBonuses: (() => {
      const schema = {};
      for (const key of Object.keys(SCUVANYA.damageTypes)) {
        schema[key] = new fields.NumberField({ required: true, integer: true, initial: 0, min: -100, max: 100 });
      }
      return new fields.SchemaField(schema);
    })(),

    // Extra-Fähigkeiten (Lesen, Schreiben, ...), die durch Rasse/Beruf automatisch als
    // vorhanden gelten -- unabhängig vom persistierten "known"-Wert (siehe character.mjs).
    extraGrants: new fields.ArrayField(new fields.StringField({ required: true, blank: false, choices: SCUVANYA.extraSkills })),

    // Körpermaß-Bereiche (nur für Rassen relevant; bei Berufen einfach ungenutzt/0).
    // heightMin/Max in Metern, weightMin/Max in kg, ageMin/Max in Jahren.
    body: new fields.SchemaField({
      heightMin: new fields.NumberField({ required: true, initial: 0, min: 0 }),
      heightMax: new fields.NumberField({ required: true, initial: 0, min: 0 }),
      weightMin: new fields.NumberField({ required: true, initial: 0, min: 0 }),
      weightMax: new fields.NumberField({ required: true, initial: 0, min: 0 }),
      ageMin: new fields.NumberField({ required: true, integer: true, initial: 0, min: 0 }),
      ageMax: new fields.NumberField({ required: true, integer: true, initial: 0, min: 0 })
    }),

    // Wahlmöglichkeiten, die im Erstellungs-Wizard aufgelöst werden (siehe Kommentar oben).
    choices: new fields.ArrayField(new fields.SchemaField({
      key: new fields.StringField({ required: true, blank: false }),
      label: new fields.StringField({ required: true, blank: false }),
      kind: new fields.StringField({ required: true, choices: SCUVANYA.choiceKinds, initial: "attribute" }),
      options: new fields.ArrayField(new fields.StringField({ required: true, blank: false })),
      amount: new fields.NumberField({ required: true, integer: true, initial: 0 })
    })),

    // Getroffene Wahl je choice.key, z.B. { combatAttribute: "str" }. Nur auf der
    // Item-INSTANZ eines Charakters relevant, nicht auf der Vorlage.
    choiceSelections: new fields.ObjectField({ required: true, initial: {} })
  };
}
