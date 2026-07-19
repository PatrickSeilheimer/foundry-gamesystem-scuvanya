import { SCUVANYA } from "../../config.mjs";
import { baseItemSchema } from "./base-item.mjs";

const fields = foundry.data.fields;

/**
 * Gemeinsames Schema für Rasse- und Beruf-Items: beide verleihen feste Attributboni,
 * optional freie Punkte zum Selbstverteilen (z.B. Mensch: +2 frei) und eine flexible
 * Liste von Skill-Boni (statt jede Talentkategorie einzeln abzubilden) -- damit neue
 * Rassen/Berufe rein datengetrieben angelegt werden können, ohne Codeänderungen.
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
    })()
  };
}
