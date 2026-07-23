/**
 * Beispiel-Ausrüstung, die alle Facetten des Ausrüstungssystems demonstriert: Slots (siehe
 * SCUVANYA.equipSlots in module/config.mjs), Flags (freie Kategorisierung/Filter im Inventar),
 * Bedingungen (Voraussetzung zum Ausrüsten, z.B. Mindest-STR) und Effekte (fixe Boni, die je
 * nach "condition" nur bei ausgerüstetem oder bereits bei mitgeführtem Item zählen, siehe
 * module/data/item/path-resolve.mjs resolveItemEffects).
 *
 * ALLE Einträge hier sind bewusst als Testobjekte gekennzeichnet (Namenspräfix "[TEST]",
 * flags.scuvanya.testItem=true UND das Schlagwort "test" in system.flags), damit sie sich
 * später schnell wiederfinden und entfernen lassen -- siehe Auftrag: erst mal nur zur
 * Demonstration des Systems, keine finale Item-Liste.
 */
const TEST_FLAGS = { scuvanya: { testItem: true } };

export const DEFAULT_EQUIPMENT = [
  {
    name: "[TEST] Eiserner Helm",
    type: "armor",
    flags: TEST_FLAGS,
    system: {
      description: "<p>Ein schlichter eiserner Helm, wie ihn Wachen und Söldner gleichermaßen tragen.</p>",
      armorType: "physical",
      value: 1,
      flags: ["ruestung", "leicht", "test"],
      slot: "kopf",
      conditions: [],
      effects: [
        { key: "helmSchutz", kind: "fixed", path: "armor.physical", amount: 1, condition: "equipped" }
      ]
    }
  },
  {
    name: "[TEST] Schwerer Kürass",
    type: "armor",
    flags: TEST_FLAGS,
    system: {
      description: "<p>Ein massiver Brustpanzer aus Plattenstahl. Ohne entsprechende Körperkraft behindert sein Gewicht mehr, als er schützt -- er lässt sich erst ab STR 12 sinnvoll tragen.</p>",
      armorType: "physical",
      value: 3,
      flags: ["ruestung", "schwer", "test"],
      slot: "brust",
      conditions: [
        { path: "attributes.str", operator: "gte", value: 12 }
      ],
      effects: [
        { key: "kuerassSchutz", kind: "fixed", path: "armor.physical", amount: 3, condition: "equipped" }
      ]
    }
  },
  {
    name: "[TEST] Lederarmschienen",
    type: "armor",
    flags: TEST_FLAGS,
    system: {
      description: "<p>Gegerbtes Leder, an den Unterarmen geschnallt. Bietet leichten Schutz, ohne die Beweglichkeit einzuschränken.</p>",
      armorType: "physical",
      value: 1,
      flags: ["ruestung", "leicht", "test"],
      slot: "arme",
      conditions: [],
      effects: [
        { key: "armschienenSchutz", kind: "fixed", path: "armor.physical", amount: 1, condition: "equipped" }
      ]
    }
  },
  {
    name: "[TEST] Beinschienen",
    type: "armor",
    flags: TEST_FLAGS,
    system: {
      description: "<p>Einfache Schienen aus gehärtetem Leder und Metallstreben, die Schienbein und Oberschenkel schützen.</p>",
      armorType: "physical",
      value: 1,
      flags: ["ruestung", "leicht", "test"],
      slot: "beine",
      conditions: [],
      effects: [
        { key: "beinschienenSchutz", kind: "fixed", path: "armor.physical", amount: 1, condition: "equipped" }
      ]
    }
  },
  {
    name: "[TEST] Wanderstiefel",
    type: "armor",
    flags: TEST_FLAGS,
    system: {
      description: "<p>Federleichte Stiefel aus bestem Leder, verzaubert, um ihren Träger schneller vorankommen zu lassen.</p>",
      armorType: "physical",
      value: 0,
      flags: ["ruestung", "magisch", "test"],
      slot: "fuesse",
      conditions: [],
      effects: [
        { key: "wanderstiefelTempo", kind: "fixed", path: "attributes.spd", amount: 1, condition: "equipped" }
      ]
    }
  },
  {
    name: "[TEST] Ohrringe der Klarheit",
    type: "equipment",
    flags: TEST_FLAGS,
    system: {
      description: "<p>Filigrane Ohrringe aus Silber, die den Geist des Trägers schärfen.</p>",
      quantity: 1,
      weight: 0,
      flags: ["schmuck", "magisch", "test"],
      slot: "ohrringe",
      conditions: [],
      effects: [
        { key: "ohrringeKlarheit", kind: "fixed", path: "attributes.mnd", amount: 1, condition: "equipped" }
      ]
    }
  },
  {
    name: "[TEST] Amulett der Wachsamkeit",
    type: "equipment",
    flags: TEST_FLAGS,
    system: {
      description: "<p>Ein warm pulsierendes Amulett. Seine schützende Wirkung entfaltet es bereits, wenn es nur am Körper getragen oder in der Tasche mitgeführt wird -- es muss dafür nicht sichtbar umgehängt sein.</p>",
      quantity: 1,
      weight: 0,
      flags: ["schmuck", "magisch", "test"],
      slot: "halskette",
      conditions: [],
      effects: [
        { key: "amulettWachsamkeit", kind: "fixed", path: "initiative", amount: 2, condition: "carried" }
      ]
    }
  },
  {
    name: "[TEST] Armband der Stärke",
    type: "equipment",
    flags: TEST_FLAGS,
    system: {
      description: "<p>Ein schwerer Armreif aus dunklem Metall, der die Muskeln seines Trägers spürbar kräftigt.</p>",
      quantity: 1,
      weight: 0,
      flags: ["schmuck", "magisch", "test"],
      slot: "armbaender",
      conditions: [],
      effects: [
        { key: "armbandStaerke", kind: "fixed", path: "attributes.str", amount: 1, condition: "equipped" }
      ]
    }
  },
  {
    name: "[TEST] Ring der Macht",
    type: "equipment",
    flags: TEST_FLAGS,
    system: {
      description: "<p>Ein schlichter goldener Ring, der die magischen Fähigkeiten seines Trägers deutlich verstärkt. Passt sowohl an den linken als auch den rechten Ringfinger.</p>",
      quantity: 1,
      weight: 0,
      flags: ["schmuck", "magisch", "test"],
      slot: "ring",
      conditions: [],
      effects: [
        { key: "ringMagie", kind: "fixed", path: "attributes.mag", amount: 2, condition: "equipped" },
        { key: "ringWaerme", kind: "text", text: "Der Ring wird spürbar warm, wenn in der Nähe Magie gewirkt wird.", condition: "equipped" }
      ]
    }
  },
  {
    name: "[TEST] Schwert des Kriegers",
    type: "weapon",
    flags: TEST_FLAGS,
    system: {
      description: "<p>Ein gut ausbalanciertes Langschwert mit einer Gravur alter Kriegerorden. Es liegt erfahrenen Kriegern besonders gut in der Hand.</p>",
      damageFormula: "1d8",
      damageType: "hieb",
      ranged: false,
      discipline: "krieger",
      equipped: false,
      flags: ["waffe", "nahkampf", "stärkewaffe", "test"],
      slot: "hauptHand",
      conditions: [],
      effects: [
        { key: "schwertKrieger", kind: "fixed", path: "disziplinen.kampf.krieger", amount: 1, condition: "equipped" }
      ]
    }
  },
  {
    name: "[TEST] Dolch der Gauner",
    type: "weapon",
    flags: TEST_FLAGS,
    system: {
      description: "<p>Eine schmale, leichte Klinge -- unauffällig zu tragen und schneller gezogen als jedes Langschwert.</p>",
      damageFormula: "1d4",
      damageType: "stich",
      ranged: false,
      discipline: "gauner",
      equipped: false,
      flags: ["waffe", "nahkampf", "geschickwaffe", "test"],
      slot: "hauptHand",
      conditions: [],
      effects: [
        { key: "dolchGauner", kind: "fixed", path: "disziplinen.kampf.gauner", amount: 1, condition: "equipped" }
      ]
    }
  },
  {
    name: "[TEST] Kurzbogen",
    type: "weapon",
    flags: TEST_FLAGS,
    system: {
      description: "<p>Ein handlicher Bogen aus Eibenholz, wie ihn Jäger und Kundschafter gleichermaßen verwenden.</p>",
      damageFormula: "1d6",
      damageType: "stich",
      ranged: true,
      discipline: "schuetze",
      equipped: false,
      flags: ["waffe", "fernkampf", "geschickwaffe", "test"],
      slot: "hauptHand",
      conditions: [],
      effects: [
        { key: "kurzbogenSchuetze", kind: "fixed", path: "disziplinen.kampf.schuetze", amount: 1, condition: "equipped" }
      ]
    }
  },
  {
    name: "[TEST] Umhang des Pyromanen",
    type: "equipment",
    flags: TEST_FLAGS,
    system: {
      description: "<p>Ein Umhang aus rußgeschwärztem Stoff, der nie ganz aufhört, nach Rauch zu riechen. Wer ihn trägt, spürt Feuermagie williger auf ihn übergehen -- selbst ohne die eigentlich nötige Übung.</p>",
      quantity: 1,
      weight: 0,
      flags: ["ruestung", "magisch", "test"],
      slot: "brust",
      conditions: [],
      effects: [
        { key: "umhangFeuerball", kind: "unlockAction", path: "feuerball", condition: "equipped" },
        { key: "umhangManakosten", kind: "fixed", path: "actions.manaCost.pyro", amount: -1, condition: "equipped" }
      ]
    }
  },
  {
    name: "[TEST] Werkzeug",
    type: "equipment",
    flags: TEST_FLAGS,
    system: {
      description: "<p>Ein Bündel Werkzeug für so ziemlich jedes Handwerk -- nur zum Schmieden reicht es nicht. Dient während einer Rast als Nachweis, dass ein Handwerk auch tatsächlich ausgeübt werden kann (siehe documents/actor.mjs getUsableCraftSkills).</p>",
      quantity: 1,
      weight: 0,
      // Kein Slot -- Werkzeuge müssen nicht ausgerüstet werden, nur im Inventar mitgeführt.
      // "handwerkszeug" ist der generische Marker, die restlichen Flags sind je ein Schlüssel
      // aus SCUVANYA.craftSkills (siehe module/config.mjs) -- bewusst ALLE außer "grobschmied",
      // um zu Testzwecken zu zeigen, dass ein Werkzeug auch NICHT universell sein kann.
      flags: [
        "handwerkszeug", "test",
        "feinschmied", "plattner", "gerber", "zimmerer", "weber",
        "alchemist", "koch", "jagen", "fischen", "verzaubern"
      ],
      slot: "",
      conditions: [],
      effects: []
    }
  },
  {
    name: "[TEST] Schild der Standhaftigkeit",
    type: "armor",
    flags: TEST_FLAGS,
    system: {
      description: "<p>Ein massiver Rundschild aus Eisen und Eichenholz, der sowohl gegen Klingen als auch gegen Fernangriffe zuverlässig schützt.</p>",
      armorType: "physical",
      value: 2,
      flags: ["ruestung", "schild", "test"],
      slot: "nebenHand",
      conditions: [],
      effects: [
        { key: "schildSchutz", kind: "fixed", path: "armor.physical", amount: 2, condition: "equipped" },
        { key: "schildAc", kind: "fixed", path: "ac.value", amount: 1, condition: "equipped" }
      ]
    }
  },
  {
    name: "[TEST] Zweihandschwert",
    type: "weapon",
    flags: TEST_FLAGS,
    system: {
      description: "<p>Eine gewaltige, beidhändig geführte Klinge. Für den vollen Krafteinsatz müssen beide Hände frei sein -- es passt deshalb sowohl in die Haupt- als auch in die Nebenhand.</p>",
      damageFormula: "2d6",
      damageType: "hieb",
      ranged: false,
      discipline: "krieger",
      equipped: false,
      flags: ["waffe", "zweihaendig", "schwer", "stärkewaffe", "test"],
      slot: "beidhaendig",
      conditions: [
        { path: "attributes.str", operator: "gte", value: 12 }
      ],
      effects: [
        { key: "zweihandKrieger", kind: "fixed", path: "disziplinen.kampf.krieger", amount: 2, condition: "equipped" }
      ]
    }
  },
  {
    name: "[TEST] Heiltrank",
    type: "consumable",
    flags: TEST_FLAGS,
    system: {
      description: "<p>Ein kleines Fläschchen mit einer rot schimmernden Flüssigkeit. Schmeckt nach Kirschen und Eisen.</p>",
      quantity: 3,
      consumeOnUse: true,
      flags: ["verbrauchbar", "heilung", "test"]
    }
  }
];
