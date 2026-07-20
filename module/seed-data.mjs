/**
 * Standard-Rassen/-Berufe als Welt-Items. Werden einmalig (idempotent, per Name+Typ geprüft)
 * beim ersten Start durch die SL angelegt -- es gibt noch keine Compendium-Pack-Pipeline für
 * dieses System, daher der pragmatische Weg über das Items-Verzeichnis. Die Liste ist bewusst
 * noch nicht final (siehe Auftrag: weitere Rassen folgen), neue Einträge können jederzeit direkt
 * in Foundry über das Item-Sheet ergänzt werden, ohne dass hier etwas geändert werden muss.
 *
 * Jede Rasse/jeder Beruf besteht aus "Eigenschaften" (Name + Beschreibung + Boni-Liste, siehe
 * bonusBundleSchema in progression-shared.mjs). Boni-Pfade sind relativ zu system, z.B.
 * "attributes.mag", "talents.koerperlich.klettern", "disziplinen.magie.pyrokinet".
 */
const ATTRIBUTE_PATHS = ["str", "dex", "con", "spd", "int", "mnd", "mag", "cha"].map(k => `attributes.${k}`);

const MAGIC_DISCIPLINE_PATHS = [
  "pyrokinet", "geomant", "hydrosoph", "aerothurg", "nekromant",
  "polymorph", "beschwoerer", "spiritualist", "schwarzmagier"
].map(k => `disziplinen.magie.${k}`);

const NATURE_SCIENCE_PATHS = [
  "botanik", "geologie", "mechanik", "medizin", "zoologie"
].map(k => `talents.wissenschaften.natur.${k}`);

const PHYSICAL_SKILL_PATHS = [
  "klettern", "laufen", "schwimmen", "springen", "werfen"
].map(k => `talents.koerperlich.${k}`);

export const DEFAULT_ITEMS = [
  {
    name: "Mensch",
    type: "race",
    system: {
      description: "<p>Vielseitig und anpassungsfähig -- ohne ausgeprägte Schwächen, dafür ohne Spezialisierung.</p>",
      // Platzhalter: dieselbe Spanne für beide Geschlechter, bis echte Werte gepflegt sind
      // (siehe Item-Sheet -- Körpermaße sind jetzt pro Geschlecht editierbar).
      body: {
        maennlich: { heightMin: 1.50, heightMax: 2.10, weightMin: 40, weightMax: 150, ageMin: 18, ageMax: 80 },
        weiblich: { heightMin: 1.50, heightMax: 2.10, weightMin: 40, weightMax: 150, ageMin: 18, ageMax: 80 }
      },
      base: {
        eigenschaften: [
          {
            key: "grundwerte",
            name: "Ausgeglichene Grundwerte",
            description: "Alle Attribute leicht über dem Durchschnitt, Konstitution und Charisma noch etwas mehr.",
            boni: [
              { kind: "fixed", path: "attributes.str", amount: 1 },
              { kind: "fixed", path: "attributes.dex", amount: 1 },
              { kind: "fixed", path: "attributes.con", amount: 2 },
              { kind: "fixed", path: "attributes.spd", amount: 1 },
              { kind: "fixed", path: "attributes.int", amount: 1 },
              { kind: "fixed", path: "attributes.mnd", amount: 1 },
              { kind: "fixed", path: "attributes.mag", amount: 1 },
              { kind: "fixed", path: "attributes.cha", amount: 2 }
            ]
          },
          {
            key: "anpassungsfaehigkeit",
            name: "Anpassungsfähigkeit",
            description: "Verteile 2 Punkte komplett frei auf beliebige Attribute (auch beide auf dasselbe).",
            boni: [
              { kind: "distribute", key: "menschAnpassung", options: ATTRIBUTE_PATHS, amount: 2, perOptionMax: 0 }
            ]
          }
        ]
      }
      // Kein Geschlechter-/Subrassen-Unterschied bei Menschen -- maennlich/weiblich/subraces bleiben leer.
    }
  },
  {
    name: "Namaren",
    type: "race",
    system: {
      description: "<p>Klein, langlebig und von Kindheit an in Schrift und arkanem Wissen geschult.</p>",
      body: {
        maennlich: { heightMin: 0.90, heightMax: 1.25, weightMin: 40, weightMax: 70, ageMin: 20, ageMax: 90 },
        weiblich: { heightMin: 0.90, heightMax: 1.25, weightMin: 40, weightMax: 70, ageMin: 20, ageMax: 90 }
      },
      base: {
        eigenschaften: [
          {
            key: "namarischeAbstammung",
            name: "Namarische Abstammung",
            // Startattribute 5,6,8,5,10,9,11,6 -- als Bonus relativ zum Standardwert 6 hinterlegt.
            description: "Zäh und geistig belastbar, dafür körperlich zurückhaltend, mit ausgeprägter Begabung für Magie.",
            boni: [
              { kind: "fixed", path: "attributes.str", amount: -1 },
              { kind: "fixed", path: "attributes.con", amount: 2 },
              { kind: "fixed", path: "attributes.spd", amount: -1 },
              { kind: "fixed", path: "attributes.int", amount: 4 },
              { kind: "fixed", path: "attributes.mnd", amount: 3 },
              { kind: "fixed", path: "attributes.mag", amount: 5 }
            ]
          },
          {
            key: "schriftgelehrt",
            name: "Schriftgelehrt",
            description: "Von Kindheit an in Lesen und Schreiben unterrichtet.",
            boni: [
              { kind: "fixed", path: "talents.extra.lesen", amount: 1 },
              { kind: "fixed", path: "talents.extra.schreiben", amount: 1 },
              { kind: "fixed", path: "talents.wissenschaften.sozial.arkana", amount: 3 }
            ]
          },
          {
            key: "arkaneBegabung",
            name: "Arkane Begabung",
            description: "Wähle eine Magiedisziplin, in der du bereits Stufe 3 beherrschst.",
            boni: [
              { kind: "choice", key: "magieDisziplin", options: MAGIC_DISCIPLINE_PATHS, amount: 3 }
            ]
          }
        ]
      },
      // Beispiel für Geschlechter-Deltas: Frauen sind etwas weniger magiebegabt, dafür
      // etwas belastbarer als der Basiswert -- Männer bleiben unverändert bei der Basis.
      weiblich: {
        eigenschaften: [
          {
            key: "weiblicheAbstammung",
            name: "Geschlechtstypische Abweichung",
            description: "Namarische Frauen sind etwas weniger magiebegabt, dafür etwas belastbarer.",
            boni: [
              { kind: "fixed", path: "attributes.mag", amount: -1 },
              { kind: "fixed", path: "attributes.mnd", amount: 1 }
            ]
          }
        ]
      }
    }
  },
  {
    name: "Militär",
    type: "profession",
    system: {
      description: "<p>Ausbildung an Waffen, Erste Hilfe im Feld und die Fähigkeit, Widerstand zu brechen.</p>",
      eigenschaften: [
        {
          key: "kampfausbildung",
          name: "Kampfausbildung",
          description: "Drill und Felderfahrung stärken Konstitution, Erste-Hilfe-Kenntnisse und Durchsetzungsvermögen.",
          boni: [
            { kind: "fixed", path: "attributes.con", amount: 2 },
            { kind: "fixed", path: "talents.wissenschaften.natur.medizin", amount: 2 },
            { kind: "fixed", path: "talents.sozial.negativ.einschuechtern", amount: 4 }
          ]
        },
        {
          key: "kampfschwerpunkt",
          name: "Kampfschwerpunkt",
          description: "Wähle ein Kampfattribut, das durch die Ausbildung geschärft wurde.",
          boni: [
            { kind: "choice", key: "kampfattribut", options: ["attributes.str", "attributes.dex", "attributes.mag"], amount: 1 }
          ]
        },
        {
          key: "koerperlicheEignung",
          name: "Körperliche Eignung",
          description: "Wähle ein körperliches Talent, das im Dienst besonders trainiert wurde.",
          boni: [
            { kind: "choice", key: "koerperlichesTalent", options: PHYSICAL_SKILL_PATHS, amount: 5 }
          ]
        }
      ]
    }
  },
  {
    name: "Wissenschaftler",
    type: "profession",
    system: {
      description: "<p>Systematische Bildung in Naturwissenschaften und methodischem Denken.</p>",
      eigenschaften: [
        {
          key: "wissenschaftlicheBildung",
          name: "Wissenschaftliche Bildung",
          description: "Jahrelange akademische Ausbildung schärft Intellekt, Belastbarkeit und Konzentration.",
          boni: [
            { kind: "fixed", path: "attributes.int", amount: 2 },
            { kind: "fixed", path: "attributes.mnd", amount: 1 },
            { kind: "fixed", path: "talents.sonder.konzentration", amount: 6 }
          ]
        },
        {
          key: "fachgebiet",
          name: "Fachgebiet",
          description: "Wähle ein Naturwissenschaftstalent als Spezialgebiet.",
          boni: [
            { kind: "choice", key: "naturwissenschaft", options: NATURE_SCIENCE_PATHS, amount: 8 }
          ]
        }
      ]
    }
  }
];

export async function seedDefaultItems() {
  if (!game.user.isGM) return;
  const missing = DEFAULT_ITEMS.filter(entry =>
    !game.items.find(i => i.name === entry.name && i.type === entry.type)
  );
  if (missing.length) await Item.createDocuments(missing);
}
