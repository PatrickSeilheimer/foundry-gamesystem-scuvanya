import { baseItemSchema } from "./base-item.mjs";
import { bonusBundleSchema } from "./progression-shared.mjs";

const fields = foundry.data.fields;

/**
 * Rassen bestehen aus einem Basis-Bündel (immer aktiv) plus einem Geschlechter-Bündel
 * (männlich/weiblich, je nach Charakter) und optional mehreren Subrassen-Bündeln (per
 * Wahl im Erstellungs-Wizard, siehe subraceKey) -- alle gleichzeitig aktiven Bündel werden
 * additiv verrechnet (siehe race-resolve.mjs), z.B. Basis +5 Magie und weiblich -1 Magie
 * ergeben netto +4, nicht zwei separate Boni.
 *
 * Körpermaß-Bereiche (body) gelten für beide Geschlechter gleich -- falls das für eine
 * künftige Rasse nicht reicht, müsste body ebenfalls pro Geschlecht aufgeteilt werden.
 */
export default class RaceData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      ...baseItemSchema(),

      body: new fields.SchemaField({
        heightMin: new fields.NumberField({ required: true, initial: 0, min: 0 }),
        heightMax: new fields.NumberField({ required: true, initial: 0, min: 0 }),
        weightMin: new fields.NumberField({ required: true, initial: 0, min: 0 }),
        weightMax: new fields.NumberField({ required: true, initial: 0, min: 0 }),
        ageMin: new fields.NumberField({ required: true, integer: true, initial: 0, min: 0 }),
        ageMax: new fields.NumberField({ required: true, integer: true, initial: 0, min: 0 })
      }),

      base: new fields.SchemaField(bonusBundleSchema()),
      maennlich: new fields.SchemaField(bonusBundleSchema()),
      weiblich: new fields.SchemaField(bonusBundleSchema()),

      subraces: new fields.ArrayField(new fields.SchemaField({
        key: new fields.StringField({ required: true, blank: false }),
        name: new fields.StringField({ required: true, blank: false }),
        bonuses: new fields.SchemaField(bonusBundleSchema())
      })),

      // Gewählte Subrasse (key aus subraces) -- nur auf der Item-INSTANZ eines Charakters
      // relevant, nicht auf der Vorlage im Items-Verzeichnis. Leer = keine Subrasse gewählt.
      subraceKey: new fields.StringField({ required: false, blank: true, initial: "" }),

      // Getroffene Wahl je choice.key aus JEDEM aktiven Bündel (Basis/Geschlecht/Subrasse),
      // z.B. { magieDisziplin: "magie.pyrokinet" }. Nur auf der Item-INSTANZ relevant.
      choiceSelections: new fields.ObjectField({ required: true, initial: {} })
    };
  }
}
