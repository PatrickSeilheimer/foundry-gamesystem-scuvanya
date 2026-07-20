/**
 * Standard-Rassen/-Berufe, die mit dem System ausgeliefert werden -- Quelle für die
 * Compendium-Packs unter packs/races und packs/professions (siehe generate-pack-sources.mjs
 * und package.json "build:packs"). Nur zur Build-Zeit genutzt, ist kein Teil des laufenden
 * Systems (die Packs selbst werden über system.json geladen, siehe scuvanya.mjs).
 *
 * Die Liste ist bewusst noch nicht final (siehe Auftrag: weitere Rassen folgen). Um einen
 * Eintrag zu ändern oder zu ergänzen: hier bearbeiten, dann `npm run build:packs` ausführen
 * und die neu kompilierten packs/races bzw. packs/professions committen.
 *
 * Jedes Bündel hat "attributeStart" (feste Attributboni OHNE Namen/Beschreibung -- die sind
 * einfach da) und eine Liste "Eigenschaften" (Name + Beschreibung + Boni-Liste, siehe
 * bonusBundleSchema in module/data/item/progression-shared.mjs). Wahlmöglichkeiten, die
 * zufällig ein Attribut betreffen (z.B. "wähle ein Kampfattribut"), bleiben trotzdem in
 * einer Eigenschaft, weil der Wizard dafür einen Namen zum Beschriften braucht. Boni-Pfade
 * sind relativ zu system, z.B. "attributes.mag", "talents.koerperlich.klettern",
 * "disziplinen.magie.pyrokinet".
 */
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
      // Platzhalterwerte (Körpermaße + die drei Alters-Ankerpunkte Mündigkeit/Erwachsen/
      // Lebenserwartung), bis echte Werte gepflegt sind -- dieselben für beide Geschlechter.
      body: {
        maennlich: { heightMin: 1.50, heightMax: 2.10, weightMin: 40, weightMax: 150, muendigkeitsalter: 14, erwachsenenalter: 18, lebenserwartung: 65 },
        weiblich: { heightMin: 1.50, heightMax: 2.10, weightMin: 40, weightMax: 150, muendigkeitsalter: 14, erwachsenenalter: 18, lebenserwartung: 65 }
      },
      base: {
        attributeStart: { str: 1, dex: 1, con: 2, spd: 1, int: 1, mnd: 1, mag: 1, cha: 2 },
        eigenschaften: [
          {
            key: "anpassungsfaehigkeit",
            name: "Anpassungsfähigkeit",
            description: "Verteile 2 Punkte komplett frei auf beliebige Attribute (auch beide auf dasselbe).",
            boni: [
              {
                kind: "distribute", key: "menschAnpassung",
                options: ["str", "dex", "con", "spd", "int", "mnd", "mag", "cha"].map(k => `attributes.${k}`),
                amount: 2, perOptionMax: 0
              }
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
      // Reifen langsamer als Menschen und werden deutlich älter -- Mündigkeit und
      // körperliches Erwachsensein fallen hier bewusst auseinander.
      body: {
        maennlich: { heightMin: 0.90, heightMax: 1.25, weightMin: 40, weightMax: 70, muendigkeitsalter: 20, erwachsenenalter: 30, lebenserwartung: 90 },
        weiblich: { heightMin: 0.90, heightMax: 1.25, weightMin: 40, weightMax: 70, muendigkeitsalter: 20, erwachsenenalter: 30, lebenserwartung: 90 }
      },
      base: {
        // Startattribute 5,6,8,5,10,9,11,6 -- als Bonus relativ zum Standardwert 6 hinterlegt.
        attributeStart: { str: -1, con: 2, spd: -1, int: 4, mnd: 3, mag: 5 },
        eigenschaften: [
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
        attributeStart: { mag: -1, mnd: 1 }
      }
    }
  },
  {
    name: "Militär",
    type: "profession",
    system: {
      description: "<p>Ausbildung an Waffen, Erste Hilfe im Feld und die Fähigkeit, Widerstand zu brechen.</p>",
      attributeStart: { con: 2 },
      eigenschaften: [
        {
          key: "kampfausbildung",
          name: "Kampfausbildung",
          description: "Drill und Felderfahrung stärken Erste-Hilfe-Kenntnisse und Durchsetzungsvermögen.",
          boni: [
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
      attributeStart: { int: 2, mnd: 1 },
      eigenschaften: [
        {
          key: "wissenschaftlicheBildung",
          name: "Wissenschaftliche Bildung",
          description: "Jahrelange akademische Ausbildung schärft die Konzentrationsfähigkeit.",
          boni: [
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
