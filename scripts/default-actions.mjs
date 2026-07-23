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
  // ── Zauber Pyro (siehe Konversation: vollständige Pyrokinet-Zauberliste 1-10) ──────────
  {
    name: "Handflamme",
    type: "action",
    img: "icons/magic/fire/flame-burning-campfire-yellow-blue.webp",
    system: {
      key: "handflamme",
      description: "<p>Du erzeugst eine kleine Flamme in deiner Handfläche, die Licht spendet und keine Hitze oder Schaden verursacht.</p>",
      category: "zauber",
      tags: ["pyro"],
      rollSource: "discipline",
      rollPath: "disziplinen.magie.pyrokinet",
      costAp: 1,
      costMana: 1,
      range: "Selbst",
      damageFormula: "",
      damageType: "",
      damageFromWeapon: false,
      effects: ["Die Flamme bleibt bestehen, bis du sie löschst."],
      unlockConditions: gte("disziplinen.magie.pyrokinet", 1)
    }
  },
  {
    name: "Funkenschlag",
    type: "action",
    img: "icons/magic/fire/projectile-meteor-comet-orange.webp",
    system: {
      key: "funkenschlag",
      description: "<p>Du schleuderst einen kleinen Funken auf ein Ziel.</p>",
      category: "zauber",
      tags: ["pyro"],
      rollSource: "discipline",
      rollPath: "disziplinen.magie.pyrokinet",
      costAp: 2,
      costMana: 3,
      range: "Sicht",
      damageFormula: "1d6 + @mag",
      damageType: "feuer",
      damageFromWeapon: false,
      effects: [],
      unlockConditions: gte("disziplinen.magie.pyrokinet", 1)
    }
  },
  {
    name: "Feuerfaust",
    type: "action",
    img: "icons/magic/fire/hand-sparks-embers-yellow.webp",
    system: {
      key: "feuerfaust",
      description: "<p>Du schlägst nach vorne, um aus deiner Hand einen Feuerschwall entweichen zu lassen.</p>",
      category: "zauber",
      tags: ["pyro"],
      rollSource: "discipline",
      rollPath: "disziplinen.magie.pyrokinet",
      costAp: 4,
      costMana: 6,
      range: "5 m",
      savingThrow: "con",
      damageFormula: "2d6 + @mag",
      damageType: "feuer",
      damageFromWeapon: false,
      effects: ["Ziel erhält Brennend für 1 Runde."],
      unlockConditions: gte("disziplinen.magie.pyrokinet", 2)
    }
  },
  {
    name: "Hitzewelle",
    type: "action",
    img: "icons/magic/fire/explosion-fireball-medium-red-orange.webp",
    system: {
      key: "hitzewelle",
      description: "<p>Eine gewaltige Druckwelle aus glühender Hitze breitet sich um dich herum aus.</p>",
      category: "zauber",
      tags: ["pyro"],
      rollSource: "discipline",
      rollPath: "disziplinen.magie.pyrokinet",
      costAp: 4,
      costMana: 10,
      range: "Selbst",
      areaShape: "kreis",
      areaSize: "Radius 5 m",
      damageFormula: "1d6 + @mag",
      damageType: "feuer",
      damageFromWeapon: false,
      effects: [],
      unlockConditions: gte("disziplinen.magie.pyrokinet", 3)
    }
  },
  {
    name: "Feuerball",
    type: "action",
    img: "icons/magic/fire/orb-lightning-teal.webp",
    system: {
      key: "feuerball",
      description: "<p>Eine explosive Feuerkugel detoniert am Zielpunkt.</p>",
      category: "zauber",
      tags: ["pyro"],
      rollSource: "discipline",
      rollPath: "disziplinen.magie.pyrokinet",
      costAp: 3,
      costMana: 15,
      range: "Sicht",
      areaShape: "kreis",
      areaSize: "Radius 3 m",
      savingThrow: "con",
      damageFormula: "3d6 + @mag",
      damageType: "feuer",
      damageFromWeapon: false,
      effects: ["Alle Ziele erhalten Brennend für 2 Runden."],
      unlockConditions: gte("disziplinen.magie.pyrokinet", 4)
    }
  },
  {
    name: "Verbrennen",
    type: "action",
    img: "icons/magic/fire/beam-jet-stream-embers.webp",
    system: {
      key: "verbrennen",
      description: "<p>Du lässt die Flammen auf einem bereits brennenden Ziel implodieren.</p>",
      category: "zauber",
      tags: ["pyro"],
      rollSource: "discipline",
      rollPath: "disziplinen.magie.pyrokinet",
      costAp: 2,
      costMana: 3,
      range: "Sicht",
      damageFormula: "4d6 + @mag",
      damageType: "feuer",
      damageFromWeapon: false,
      effects: ["Kann nur auf brennende Ziele gewirkt werden.", "Entfernt den Effekt Brennend nach dem Angriff."],
      unlockConditions: gte("disziplinen.magie.pyrokinet", 5)
    }
  },
  {
    name: "Kettenbrand",
    type: "action",
    img: "icons/magic/fire/dagger-rune-enchant-flame-purple.webp",
    system: {
      key: "kettenbrand",
      description: "<p>Du lässt die Flammen eines brennenden Gegners auf weitere Ziele überspringen.</p>",
      category: "zauber",
      tags: ["pyro"],
      rollSource: "discipline",
      rollPath: "disziplinen.magie.pyrokinet",
      costAp: 3,
      costMana: 9,
      range: "Sicht",
      savingThrow: "con",
      damageFormula: "",
      damageType: "",
      damageFromWeapon: false,
      effects: [
        "Kann nur auf ein brennendes Ziel gewirkt werden.",
        "Wähle bis zu drei weitere Ziele im Umkreis von 5 m um das ursprüngliche Ziel.",
        "Alle gewählten Ziele erhalten Brennend für dieselbe verbleibende Dauer."
      ],
      unlockConditions: gte("disziplinen.magie.pyrokinet", 5)
    }
  },
  {
    name: "Flammenwand",
    type: "action",
    img: "icons/magic/fire/barrier-wall-flame-ring-yellow.webp",
    system: {
      key: "flammenwand",
      description: "<p>Du erschaffst eine lodernde Feuerwand, die den Weg versperrt.</p>",
      category: "zauber",
      tags: ["pyro"],
      rollSource: "discipline",
      rollPath: "disziplinen.magie.pyrokinet",
      costAp: 4,
      costMana: 18,
      range: "Sicht",
      areaShape: "linie",
      areaSize: "8 m × 1 m",
      duration: "3 Runden",
      savingThrow: "con",
      damageFormula: "",
      damageType: "",
      damageFromWeapon: false,
      effects: ["Beim Betreten oder zu Beginn des Zuges: 2W6 + MAG Feuerschaden und Brennend für 2 Runden."],
      unlockConditions: gte("disziplinen.magie.pyrokinet", 6)
    }
  },
  {
    name: "Feuersturm",
    type: "action",
    img: "icons/magic/fire/explosion-meteor-swirl-orange.webp",
    system: {
      key: "feuersturm",
      description: "<p>Unzählige kleine Feuerkugeln prasseln auf ein Gebiet nieder.</p>",
      category: "zauber",
      tags: ["pyro"],
      rollSource: "discipline",
      rollPath: "disziplinen.magie.pyrokinet",
      costAp: 5,
      costMana: 22,
      range: "Sicht",
      areaShape: "kreis",
      areaSize: "Radius 10 m",
      damageFormula: "8d6 + @mag",
      damageType: "feuer",
      damageFromWeapon: false,
      effects: [],
      unlockConditions: gte("disziplinen.magie.pyrokinet", 7)
    }
  },
  {
    name: "Spontane Verbrennung",
    type: "action",
    img: "icons/magic/fire/flame-burning-fist.webp",
    system: {
      key: "spontaneVerbrennung",
      description: "<p>Du lässt alle Flammen in deiner Umgebung augenblicklich aufflammen.</p>",
      category: "zauber",
      tags: ["pyro"],
      rollSource: "discipline",
      rollPath: "disziplinen.magie.pyrokinet",
      costAp: 2,
      costMana: 8,
      range: "Selbst",
      areaShape: "kreis",
      areaSize: "Radius 20 m",
      damageFormula: "",
      damageType: "",
      damageFromWeapon: false,
      effects: ["Alle brennenden Ziele im Bereich erhalten sofort 1W8 + MAG Feuerschaden."],
      unlockConditions: gte("disziplinen.magie.pyrokinet", 8)
    }
  },
  {
    name: "Feuerlanze",
    type: "action",
    img: "icons/magic/fire/beam-arrow-large-orange.webp",
    system: {
      key: "feuerlanze",
      description: "<p>Du bündelst gewaltige Hitze zu einer durchdringenden Lanze aus Feuer.</p>",
      category: "zauber",
      tags: ["pyro"],
      rollSource: "discipline",
      rollPath: "disziplinen.magie.pyrokinet",
      costAp: 3,
      costMana: 12,
      range: "Sicht",
      areaShape: "linie",
      areaSize: "20 m × 1 m",
      savingThrow: "con",
      damageFormula: "4d6 + @mag",
      damageType: "feuer",
      damageFromWeapon: false,
      effects: ["Alle getroffenen Ziele erhalten Brennend für 2 Runden."],
      unlockConditions: gte("disziplinen.magie.pyrokinet", 9)
    }
  },
  {
    name: "Inferno",
    type: "action",
    img: "icons/magic/fire/explosion-fireball-large-orange.webp",
    system: {
      key: "inferno",
      description: "<p>Du entfesselst ein verheerendes Flammenmeer, das alles verschlingt.</p>",
      category: "zauber",
      tags: ["pyro"],
      rollSource: "discipline",
      rollPath: "disziplinen.magie.pyrokinet",
      costAp: 5,
      costMana: 30,
      range: "Sicht",
      areaShape: "kreis",
      areaSize: "Radius 8 m",
      duration: "5 Runden",
      savingThrow: "con",
      damageFormula: "8d6 + @mag",
      damageType: "feuer",
      damageFromWeapon: false,
      effects: [
        "Alle Ziele erhalten Brennend für 5 Runden.",
        "Das Gebiet bleibt 5 Runden lang in Flammen.",
        "Beim Betreten oder zu Beginn des Zuges: 3W6 Feuerschaden und Brennend für 2 Runden."
      ],
      unlockConditions: gte("disziplinen.magie.pyrokinet", 10)
    }
  },

  // ── Zauber Hybrid (Pyrokinet kombiniert mit einer zweiten Disziplin) ───────────────────
  {
    name: "Flammenpeitsche",
    type: "action",
    img: "icons/magic/fire/projectile-fireball-smoke-large-red.webp",
    system: {
      key: "flammenpeitsche",
      description: "<p>Du erschaffst eine glühende Peitsche aus Feuer und schlägst nach einem Gegner.</p>",
      category: "zauber",
      tags: ["pyro", "krieger"],
      rollSource: "discipline",
      rollPath: "disziplinen.magie.pyrokinet",
      costAp: 2,
      costMana: 6,
      range: "10 m",
      savingThrow: "con",
      damageFormula: "2d4 + @mag",
      damageType: "feuer",
      damageFromWeapon: false,
      effects: ["Zieht das Ziel zu dir."],
      unlockConditions: and(gte("disziplinen.magie.pyrokinet", 2), gte("disziplinen.kampf.krieger", 1))
    }
  },
  {
    name: "Lodernder Sprung",
    type: "action",
    img: "icons/magic/fire/explosion-fireball-small-yellow.webp",
    system: {
      key: "lodernderSprung",
      description: "<p>Du stößt dich mit einer Explosion vom Boden ab.</p>",
      category: "zauber",
      tags: ["pyro", "aerothurg"],
      rollSource: "discipline",
      rollPath: "disziplinen.magie.pyrokinet",
      costAp: 2,
      costMana: 8,
      range: "Selbst",
      areaShape: "kreis",
      areaSize: "Radius 2 m (bei Absprung und Landung)",
      damageFormula: "@mag",
      damageType: "feuer",
      damageFromWeapon: false,
      effects: ["Springe bis zu 10 m weit.", "Beim Absprung und bei der Landung entsteht jeweils ein Kreis mit 2 m Radius."],
      unlockConditions: and(gte("disziplinen.magie.pyrokinet", 2), gte("disziplinen.magie.aerothurg", 1))
    }
  },
  {
    name: "Flammenklinge",
    type: "action",
    img: "icons/weapons/swords/sword-broad-flame.webp",
    system: {
      key: "flammenklinge",
      description: "<p>Du umhüllst deine oder eine andere physische Waffe mit lodernden Flammen.</p>",
      category: "zauber",
      tags: ["pyro", "beschwoerer"],
      rollSource: "discipline",
      rollPath: "disziplinen.magie.pyrokinet",
      costAp: 2,
      costMana: 6,
      manaUpkeep: 3,
      range: "Kontakt",
      duration: "Bis beendet",
      damageFormula: "",
      damageType: "",
      damageFromWeapon: false,
      effects: [
        "Effekt auf der Waffe: zusätzlicher Feuerschaden in Höhe von MAG mit jedem Treffer der Waffe.",
        "Effekt kann zu einem beliebigen Zeitpunkt beendet werden."
      ],
      unlockConditions: and(gte("disziplinen.magie.pyrokinet", 2), gte("disziplinen.magie.beschwoerer", 1))
    }
  },
  {
    name: "Flammenklinge manifestieren",
    type: "action",
    img: "icons/weapons/swords/sword-katana-fire-orange.webp",
    system: {
      key: "flammenklingeManifestieren",
      description: "<p>Du erschaffst eine vollständig aus Feuer bestehende Klinge.</p>",
      category: "zauber",
      tags: ["pyro", "krieger", "gauner"],
      rollSource: "discipline",
      rollPath: "disziplinen.magie.pyrokinet",
      costAp: 2,
      costMana: 6,
      manaUpkeep: 6,
      range: "Selbst",
      duration: "Bis beendet",
      damageFormula: "2d8 + @mag",
      damageType: "feuer",
      damageFromWeapon: false,
      effects: ["Effekt kann zu einem beliebigen Zeitpunkt beendet werden."],
      unlockConditions: and(
        gte("disziplinen.magie.pyrokinet", 3),
        or(gte("disziplinen.kampf.krieger", 3), gte("disziplinen.kampf.gauner", 3))
      )
    }
  },
  {
    name: "Feuerdolche",
    type: "action",
    img: "icons/weapons/daggers/dagger-flame-orange.webp",
    system: {
      key: "feuerdolche",
      description: "<p>Du erschaffst mehrere brennende Dolche und schleuderst sie auf deine Feinde.</p>",
      category: "zauber",
      tags: ["pyro", "schuetze"],
      rollSource: "discipline",
      rollPath: "disziplinen.magie.pyrokinet",
      costAp: 3,
      costMana: 9,
      range: "Sicht",
      savingThrow: "con",
      damageFormula: "1d6 + @mag",
      damageType: "feuer",
      damageFromWeapon: false,
      effects: ["Wähle bis zu drei Ziele -- jedes erleidet den Schaden separat.", "Getroffene Ziele erhalten Brennend für 1 Runde."],
      unlockConditions: and(gte("disziplinen.magie.pyrokinet", 3), gte("disziplinen.kampf.schuetze", 3))
    }
  },
  {
    name: "Flammende Zungen",
    type: "action",
    img: "icons/magic/fire/barrier-wall-flame-tan.webp",
    system: {
      key: "flammendeZungen",
      description: "<p>Mehrere lebendige Feuerzungen kreisen um dich und greifen jeden Gegner an, der sich nähert.</p>",
      category: "zauber",
      tags: ["pyro", "beschwoerer"],
      rollSource: "discipline",
      rollPath: "disziplinen.magie.pyrokinet",
      costAp: 2,
      costMana: 5,
      manaUpkeep: 5,
      range: "Selbst",
      areaShape: "kreis",
      areaSize: "Radius 2 m",
      duration: "Bis beendet",
      damageFormula: "2d6 + @mag",
      damageType: "feuer",
      damageFromWeapon: false,
      effects: [
        "Alle Gegner innerhalb von 2 m erleiden den Schaden zu Beginn ihres Zuges oder wenn sie in deine Nahkampfreichweite kommen.",
        "Effekt kann zu einem beliebigen Zeitpunkt beendet werden."
      ],
      unlockConditions: and(gte("disziplinen.magie.pyrokinet", 4), gte("disziplinen.magie.beschwoerer", 3))
    }
  },
  {
    name: "Feuerresistenz verleihen",
    type: "action",
    img: "icons/magic/fire/barrier-shield-yellow.webp",
    system: {
      key: "feuerresistenzVerleihen",
      description: "<p>Du schützt ein Ziel vor den zerstörerischen Kräften des Feuers.</p>",
      category: "zauber",
      tags: ["pyro", "spiritualist"],
      rollSource: "discipline",
      rollPath: "disziplinen.magie.pyrokinet",
      costAp: 2,
      costMana: 6,
      range: "Kontakt",
      duration: "5 Runden",
      damageFormula: "",
      damageType: "",
      damageFromWeapon: false,
      effects: ["Das Ziel erhält 50% Feuerresistenz für 5 Runden.", "Brennend wird sofort entfernt."],
      unlockConditions: and(gte("disziplinen.magie.pyrokinet", 5), gte("disziplinen.magie.spiritualist", 2))
    }
  },
  {
    name: "Phönixflug",
    type: "action",
    img: "icons/creatures/birds/bird-phoenix-fire-orange.webp",
    system: {
      key: "phoenixflug",
      description: "<p>Du verwandelst dich kurzzeitig in einen Strom aus Flammen und schießt durch die Luft.</p>",
      category: "zauber",
      tags: ["pyro", "aerothurg", "polymorph"],
      rollSource: "discipline",
      rollPath: "disziplinen.magie.pyrokinet",
      costAp: 3,
      costMana: 13,
      range: "Selbst (15 m Bewegung)",
      damageFormula: "2d6 + @mag",
      damageType: "feuer",
      damageFromWeapon: false,
      effects: ["Bewegung ignoriert Hindernisse und Gelegenheitsangriffe.", "Alle durchquerten Ziele erleiden den Schaden."],
      unlockConditions: and(
        gte("disziplinen.magie.pyrokinet", 7),
        gte("disziplinen.magie.aerothurg", 3),
        gte("disziplinen.magie.polymorph", 6)
      )
    }
  },
  {
    name: "Selbstentzündung",
    type: "action",
    img: "icons/magic/fire/dagger-rune-enchant-blue-gray.webp",
    system: {
      key: "selbstentzuendung",
      description: "<p>Du hüllst deinen gesamten Körper in magische Flammen.</p>",
      category: "zauber",
      tags: ["pyro", "polymorph"],
      rollSource: "discipline",
      rollPath: "disziplinen.magie.pyrokinet",
      costAp: 3,
      costMana: 6,
      manaUpkeep: 6,
      range: "Selbst",
      duration: "Bis beendet",
      damageFormula: "",
      damageType: "",
      damageFromWeapon: false,
      effects: [
        "Du erhältst Immunität gegen den Effekt Brennend.",
        "Nahkampfangriffe verursachen zusätzlich MAG Feuerschaden.",
        "Jeder Gegner, der dich im Nahkampf trifft, erhält MAG Feuerschaden.",
        "Effekt kann jederzeit beendet werden."
      ],
      unlockConditions: and(gte("disziplinen.magie.pyrokinet", 6), gte("disziplinen.magie.polymorph", 3))
    }
  },
  {
    name: "Blutfeuer",
    type: "action",
    img: "icons/magic/fire/flame-burning-hand-thumb.webp",
    system: {
      key: "blutfeuer",
      description: "<p>Du entzündest das Blut eines Gegners mit magischen Flammen.</p>",
      category: "zauber",
      tags: ["pyro", "nekromant"],
      rollSource: "discipline",
      rollPath: "disziplinen.magie.pyrokinet",
      costAp: 2,
      costMana: 10,
      range: "Sicht",
      duration: "4 Runden",
      savingThrow: "con",
      damageFormula: "",
      damageType: "",
      damageFromWeapon: false,
      effects: ["Immer wenn das Ziel physischen Schaden erhält, erhält es zusätzlich 1W6 Feuerschaden."],
      unlockConditions: and(gte("disziplinen.magie.pyrokinet", 7), gte("disziplinen.magie.nekromant", 3))
    }
  },
  {
    name: "Höllenschlund",
    type: "action",
    img: "icons/magic/fire/beam-jet-stream-yellow.webp",
    system: {
      key: "hoellenschlund",
      description: "<p>Du öffnest einen brennenden Spalt, aus dem Flammen und glühende Hände hervorschlagen, die Ziele nach unten ziehen.</p>",
      category: "zauber",
      tags: ["pyro", "schwarzmagier"],
      rollSource: "discipline",
      rollPath: "disziplinen.magie.pyrokinet",
      costAp: 5,
      costMana: 25,
      range: "Sicht",
      areaShape: "linie",
      areaSize: "10 m × 3 m",
      duration: "3 Runden",
      savingThrow: "con",
      damageFormula: "4d6 + @mag",
      damageType: "feuer",
      damageFromWeapon: false,
      effects: [
        "Alle Ziele im Gebiet erhalten Brennend für 3 Runden.",
        "Das Gebiet wird zu schwierigem Gebiet.",
        "Alle Ziele erhalten Prone."
      ],
      unlockConditions: and(gte("disziplinen.magie.pyrokinet", 8), gte("disziplinen.magie.schwarzmagier", 5))
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
      rollPath: "talents.wissenschaften.sozial.arkana",
      costAp: 1,
      costMana: 0,
      damageFormula: "",
      damageType: "",
      damageFromWeapon: false,
      effects: [],
      unlockConditions: gte("talents.wissenschaften.sozial.arkana", 3)
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
