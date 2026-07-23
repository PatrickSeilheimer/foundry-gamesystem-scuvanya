import { baseItemSchema } from "./base-item.mjs";
import { bonusBundleSchema } from "./progression-shared.mjs";

const fields = foundry.data.fields;

const PLACEHOLDER_IMAGE = "icons/svg/mystery-man.svg";

/**
 * Alter wird über drei Ankerpunkte abgebildet statt einer simplen Min/Max-Spanne:
 *  - muendigkeitsalter: Geschlechtsreife + kulturelle Mündigkeit in einem Wert.
 *  - erwachsenenalter:  körperlich voll ausgewachsen (kann von der Mündigkeit abweichen).
 *  - lebenserwartung:   maximales Alter.
 * Der Alters-Slider im Erstellungs-Wizard beginnt bei muendigkeitsalter und endet bei
 * lebenserwartung +10%; alle drei Punkte werden dort als Meilensteine markiert (siehe
 * character-creation.mjs _ageMilestones).
 */
function bodyRangeSchema() {
  return new fields.SchemaField({
    heightMin: new fields.NumberField({ required: true, initial: 0, min: 0 }),
    heightMax: new fields.NumberField({ required: true, initial: 0, min: 0 }),
    weightMin: new fields.NumberField({ required: true, initial: 0, min: 0 }),
    weightMax: new fields.NumberField({ required: true, initial: 0, min: 0 }),
    muendigkeitsalter: new fields.NumberField({ required: true, integer: true, initial: 0, min: 0 }),
    erwachsenenalter: new fields.NumberField({ required: true, integer: true, initial: 0, min: 0 }),
    lebenserwartung: new fields.NumberField({ required: true, integer: true, initial: 0, min: 0 })
  });
}

/**
 * Rassen bestehen aus einem Basis-Bündel (immer aktiv) plus einem Geschlechter-Bündel
 * (männlich/weiblich, je nach Charakter) und optional mehreren Subrassen-Bündeln (per
 * Wahl im Erstellungs-Wizard, siehe subraceKey) -- alle gleichzeitig aktiven Bündel werden
 * additiv verrechnet (siehe race-resolve.mjs), z.B. Basis +5 Magie und weiblich -1 Magie
 * ergeben netto +4, nicht zwei separate Boni.
 *
 * Körpermaß-Bereiche UND Bild sind pro Geschlecht getrennt (body.maennlich/weiblich,
 * imageMaennlich/imageWeiblich) -- der Wizard zeigt beim Umschalten des Geschlechters
 * automatisch das passende Bild und die passenden Slider-Grenzen.
 */
export default class RaceData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      ...baseItemSchema(),

      imageMaennlich: new fields.FilePathField({ categories: ["IMAGE"], required: false, initial: PLACEHOLDER_IMAGE }),
      imageWeiblich: new fields.FilePathField({ categories: ["IMAGE"], required: false, initial: PLACEHOLDER_IMAGE }),

      // Rein kosmetische Einordnung (humanoid, floral, insectoid, ...) -- hat keinerlei
      // mechanischen Effekt, wird nur im Item-Sheet und im Wizard als Untertitel angezeigt.
      category: new fields.StringField({ required: false, blank: true, initial: "" }),

      body: new fields.SchemaField({
        maennlich: bodyRangeSchema(),
        weiblich: bodyRangeSchema()
      }),

      base: new fields.SchemaField(bonusBundleSchema()),
      maennlich: new fields.SchemaField(bonusBundleSchema()),
      weiblich: new fields.SchemaField(bonusBundleSchema()),

      subraces: new fields.ArrayField(new fields.SchemaField({
        // blank:true, damit eine frisch per "+" angelegte Subrasse (noch ohne Name) speicherbar ist.
        key: new fields.StringField({ required: true, blank: true }),
        name: new fields.StringField({ required: true, blank: true }),
        // Kurzer Fließtext für die Subrasse (siehe Wizard-Hover-Popup auf dem Subrassen-Chip) --
        // bewusst kürzer/knapper als die große Rassen-description, daher ein einfaches
        // StringField statt HTMLField (kein Rich-Text-Bedarf für einen Ein-Satz-Teaser).
        description: new fields.StringField({ required: false, blank: true, initial: "" }),
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
