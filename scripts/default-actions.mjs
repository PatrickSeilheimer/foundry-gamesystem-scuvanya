/**
 * Beispiel-Aktionen/Zauber, die das Aktionssystem demonstrieren -- Quelle für das Compendium-
 * Pack "actions" (siehe generate-pack-sources.mjs und package.json "build:packs"). Aktionen
 * sind NICHT pro Charakter eingebettet, sondern ein zentraler Katalog (siehe module/actions/
 * catalog.mjs) -- jeder Charakterbogen filtert selbst nach Verfügbarkeit (siehe
 * module/documents/actor.mjs isActionAvailable).
 *
 * "unlockConditions" ist ein beliebig verschachtelter UND-/ODER-Baum (siehe module/rules/
 * conditions.mjs) -- {} bzw. weglassen bedeutet "immer verfügbar". "key" identifiziert eine
 * Aktion eindeutig für "unlockAction"-Effekte auf Items (siehe scripts/default-items.mjs
 * "[TEST] Umhang des Pyromanen" -> gewährt "feuerball" unabhängig von dessen unlockConditions).
 *
 * Um einen Eintrag zu ändern oder zu ergänzen: hier bearbeiten, dann `npm run build:packs`
 * ausführen und das neu kompilierte packs/actions committen.
 */
const gte = (path, value) => ({ type: "compare", path, operator: "gte", value });
const and = (...children) => ({ type: "and", children });
const or = (...children) => ({ type: "or", children });
const hasWeaponFlag = flag => ({ type: "hasEquippedWeaponFlag", flag });
const hasWeapon = () => ({ type: "hasEquippedWeapon" });

export const DEFAULT_ACTIONS = [
  {
    name: "Funkenstoß",
    type: "action",
    img: "icons/magic/fire/projectile-meteor-comet-orange.webp",
    system: {
      key: "funkenstoss",
      description: "<p>Ein kurzer, greller Funkenstoß schießt aus deiner Hand und versengt, was er trifft.</p>",
      category: "zauber",
      tags: ["pyro"],
      rollSource: "discipline",
      rollPath: "disziplinen.magie.pyrokinet",
      costAp: 1,
      costMana: 2,
      damageFormula: "1d6",
      damageType: "feuer",
      damageFromWeapon: false,
      effects: [],
      unlockConditions: gte("disziplinen.magie.pyrokinet", 1)
    }
  },
  {
    name: "Feuerball",
    type: "action",
    img: "icons/magic/fire/orb-lightning-teal.webp",
    system: {
      key: "feuerball",
      description: "<p>Schleudere eine Kugel aus Flammen auf ein Ziel und stecke es in Brand.</p>",
      category: "zauber",
      tags: ["pyro"],
      rollSource: "discipline",
      rollPath: "disziplinen.magie.pyrokinet",
      costAp: 2,
      costMana: 4,
      damageFormula: "2d6",
      damageType: "feuer",
      damageFromWeapon: false,
      effects: ["Das Ziel brennt: zusätzlich 1W6 Feuerschaden zu Beginn seines nächsten Zuges."],
      unlockConditions: gte("disziplinen.magie.pyrokinet", 4)
    }
  },
  {
    name: "Feuerelementar beschwören",
    type: "action",
    img: "icons/creatures/magical/spirit-fire-orange.webp",
    system: {
      key: "feuerelementarBeschwoeren",
      description: "<p>Du reißt einen Riss zur Elementarebene des Feuers auf und bindest einen Elementar an deinen Willen.</p>",
      category: "zauber",
      tags: ["pyro", "beschwoerung"],
      rollSource: "discipline",
      rollPath: "disziplinen.magie.beschwoerer",
      costAp: 3,
      costMana: 6,
      damageFormula: "",
      damageType: "",
      damageFromWeapon: false,
      effects: ["Beschwört einen Feuerelementar, der für die Dauer der Szene an deiner Seite kämpft."],
      unlockConditions: and(
        gte("disziplinen.magie.beschwoerer", 3),
        gte("disziplinen.magie.pyrokinet", 5)
      )
    }
  },
  {
    name: "Wall aus Stein",
    type: "action",
    img: "icons/magic/earth/barrier-wall-stone-gray.webp",
    system: {
      key: "wallAusStein",
      description: "<p>Der Boden erhebt sich auf deinen Befehl zu einer massiven Mauer aus Fels.</p>",
      category: "zauber",
      tags: ["erde"],
      rollSource: "discipline",
      rollPath: "disziplinen.magie.geomant",
      costAp: 2,
      costMana: 5,
      damageFormula: "",
      damageType: "",
      damageFromWeapon: false,
      effects: ["Erschafft eine 3m breite, 2m hohe Steinwand für die Dauer des Kampfes."],
      unlockConditions: gte("disziplinen.magie.geomant", 3)
    }
  },
  {
    name: "Wasserpeitsche",
    type: "action",
    img: "icons/magic/water/pillar-water-blue.webp",
    system: {
      key: "wasserpeitsche",
      description: "<p>Eine peitschende Woge aus geformtem Wasser schlägt auf dein Ziel ein.</p>",
      category: "zauber",
      tags: ["wasser"],
      rollSource: "discipline",
      rollPath: "disziplinen.magie.hydrosoph",
      costAp: 1,
      costMana: 2,
      damageFormula: "1d8",
      damageType: "wasser",
      damageFromWeapon: false,
      effects: [],
      unlockConditions: gte("disziplinen.magie.hydrosoph", 2)
    }
  },
  {
    name: "Gegner entwaffnen",
    type: "action",
    img: "icons/skills/melee/strike-slashes-red.webp",
    system: {
      key: "gegnerEntwaffnen",
      description: "<p>Ein gezielter Schlag oder Griff lässt dem Gegner die Waffe aus der Hand fliegen.</p>",
      category: "attacke",
      tags: ["nahkampf"],
      rollSource: "weaponCategory",
      rollPath: "",
      costAp: 4,
      costMana: 0,
      damageFormula: "",
      damageType: "",
      damageFromWeapon: false,
      effects: ["Bei Erfolg verliert das Ziel seine ausgerüstete Waffe -- sie landet 1W3 Meter entfernt am Boden."],
      unlockConditions: or(
        and(gte("disziplinen.kampf.gauner", 6), hasWeaponFlag("geschickwaffe")),
        and(gte("disziplinen.kampf.krieger", 8), hasWeaponFlag("stärkewaffe"))
      )
    }
  },
  {
    name: "Waffenangriff",
    type: "action",
    img: "icons/skills/melee/strike-sword-slashing-red.webp",
    system: {
      key: "waffenangriff",
      description: "<p>Ein Angriff mit deiner ausgerüsteten Waffe.</p>",
      category: "attacke",
      tags: [],
      rollSource: "weaponCategory",
      rollPath: "",
      costAp: 2,
      costMana: 0,
      damageFormula: "",
      damageType: "",
      damageFromWeapon: true,
      effects: [],
      unlockConditions: hasWeapon()
    }
  },
  {
    name: "Gezielter Schuss",
    type: "action",
    img: "icons/skills/ranged/arrow-flying-explosion-purple.webp",
    system: {
      key: "gezielterSchuss",
      description: "<p>Du nimmst dir einen Moment, um einen Fernkampfangriff mit äußerster Präzision zu setzen.</p>",
      category: "attacke",
      tags: ["fernkampf"],
      rollSource: "discipline",
      rollPath: "disziplinen.kampf.schuetze",
      costAp: 3,
      costMana: 0,
      damageFormula: "",
      damageType: "",
      damageFromWeapon: true,
      effects: ["Bei Erfolg zählt der Treffer als kritisch: Schaden wird verdoppelt."],
      unlockConditions: and(gte("disziplinen.kampf.schuetze", 4), hasWeapon())
    }
  },
  {
    name: "Gegner analysieren – magische Resistenzen",
    type: "action",
    img: "icons/magic/perception/eye-ringed-glow-angry-large-red.webp",
    system: {
      key: "gegnerAnalysierenResistenzen",
      description: "<p>Ein geschulter Blick verrät dir, gegen welche Magie dein Gegenüber besonders empfindlich oder gefeit ist.</p>",
      category: "talenteinsatz",
      tags: [],
      rollSource: "skill",
      rollPath: "talents.wissenschaften.sozial.mythologie",
      costAp: 1,
      costMana: 0,
      damageFormula: "",
      damageType: "",
      damageFromWeapon: false,
      effects: [],
      unlockConditions: gte("talents.wissenschaften.sozial.mythologie", 3)
    }
  },
  {
    name: "Gesundheit einschätzen",
    type: "action",
    img: "icons/magic/life/heart-cross-strong-flame-green.webp",
    system: {
      key: "gesundheitEinschaetzen",
      description: "<p>Ein kurzer, fachkundiger Blick verrät dir den ungefähren Gesundheitszustand einer Person.</p>",
      category: "talenteinsatz",
      tags: [],
      rollSource: "skill",
      rollPath: "talents.wissenschaften.natur.medizin",
      costAp: 1,
      costMana: 0,
      damageFormula: "",
      damageType: "",
      damageFromWeapon: false,
      effects: [],
      unlockConditions: {}
    }
  },
  {
    name: "Zweiter Atem",
    type: "action",
    img: "icons/magic/life/heart-cross-strong-blue.webp",
    system: {
      key: "zweiterAtem",
      description: "<p>Du sammelst deinen Willen und schöpfst neue Kraft aus schierer Entschlossenheit.</p>",
      category: "talenteinsatz",
      tags: [],
      rollSource: "skill",
      rollPath: "talents.sonder.selbstvertrauen",
      costAp: 2,
      costMana: 0,
      damageFormula: "",
      damageType: "",
      damageFromWeapon: false,
      effects: ["Bei Erfolg: heile 1W6 HP."],
      unlockConditions: gte("talents.sonder.selbstvertrauen", 2)
    }
  }
];
