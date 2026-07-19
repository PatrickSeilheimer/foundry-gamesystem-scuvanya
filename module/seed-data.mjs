/**
 * Standard-Rassen/-Berufe als Welt-Items. Werden einmalig (idempotent, per Name+Typ geprüft)
 * beim ersten Start durch die SL angelegt -- es gibt noch keine Compendium-Pack-Pipeline für
 * dieses System, daher der pragmatische Weg über das Items-Verzeichnis. Die Liste ist bewusst
 * noch nicht final (siehe Auftrag: weitere Rassen folgen), neue Einträge können jederzeit direkt
 * in Foundry über das Item-Sheet ergänzt werden, ohne dass hier etwas geändert werden muss.
 */
const MAGIC_DISCIPLINE_PATHS = [
  "magie.pyrokinet", "magie.geomant", "magie.hydrosoph", "magie.aerothurg", "magie.nekromant",
  "magie.polymorph", "magie.beschwoerer", "magie.spiritualist", "magie.schwarzmagier"
];

const NATURE_SCIENCE_PATHS = [
  "wissenschaften.natur.botanik", "wissenschaften.natur.geologie", "wissenschaften.natur.mechanik",
  "wissenschaften.natur.medizin", "wissenschaften.natur.zoologie"
];

const PHYSICAL_SKILL_PATHS = [
  "koerperlich.klettern", "koerperlich.laufen", "koerperlich.schwimmen", "koerperlich.springen", "koerperlich.werfen"
];

export const DEFAULT_ITEMS = [
  {
    name: "Mensch",
    type: "race",
    system: {
      description: "<p>Vielseitig und anpassungsfähig -- ohne ausgeprägte Schwächen, dafür ohne Spezialisierung.</p>",
      attributeBonuses: { str: 1, dex: 1, con: 2, spd: 1, int: 1, mnd: 1, mag: 1, cha: 2 },
      freeAttributePoints: 2,
      body: { heightMin: 1.50, heightMax: 2.10, weightMin: 40, weightMax: 150, ageMin: 18, ageMax: 80 }
    }
  },
  {
    name: "Namaren",
    type: "race",
    system: {
      description: "<p>Klein, langlebig und von Kindheit an in Schrift und arkanem Wissen geschult.</p>",
      // Startattribute 5,6,8,5,10,9,11,6 -- als Bonus relativ zum Standardwert 6 hinterlegt.
      attributeBonuses: { str: -1, dex: 0, con: 2, spd: -1, int: 4, mnd: 3, mag: 5, cha: 0 },
      freeAttributePoints: 0,
      body: { heightMin: 0.90, heightMax: 1.25, weightMin: 40, weightMax: 70, ageMin: 20, ageMax: 90 },
      extraGrants: ["lesen", "schreiben"],
      skillBonuses: [
        { path: "wissenschaften.sozial.arkana", bonus: 3 }
      ],
      choices: [
        {
          key: "magieDisziplin",
          label: "Magiedisziplin (Wahl, Stufe 3)",
          kind: "discipline",
          options: MAGIC_DISCIPLINE_PATHS,
          amount: 3
        }
      ]
    }
  },
  {
    name: "Militär",
    type: "profession",
    system: {
      description: "<p>Ausbildung an Waffen, Erste Hilfe im Feld und die Fähigkeit, Widerstand zu brechen.</p>",
      attributeBonuses: { con: 2 },
      skillBonuses: [
        { path: "wissenschaften.natur.medizin", bonus: 2 },
        { path: "sozial.negativ.einschuechtern", bonus: 4 }
      ],
      choices: [
        {
          key: "kampfattribut",
          label: "Kampfattribut (Wahl)",
          kind: "attribute",
          options: ["str", "dex", "mag"],
          amount: 1
        },
        {
          key: "koerperlichesTalent",
          label: "Körperliches Talent (Wahl)",
          kind: "skill",
          options: PHYSICAL_SKILL_PATHS,
          amount: 5
        }
      ]
    }
  },
  {
    name: "Wissenschaftler",
    type: "profession",
    system: {
      description: "<p>Systematische Bildung in Naturwissenschaften und methodischem Denken.</p>",
      attributeBonuses: { int: 2, mnd: 1 },
      skillBonuses: [
        { path: "sonder.konzentration", bonus: 6 }
      ],
      choices: [
        {
          key: "naturwissenschaft",
          label: "Naturwissenschaftstalent (Wahl)",
          kind: "skill",
          options: NATURE_SCIENCE_PATHS,
          amount: 8
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
