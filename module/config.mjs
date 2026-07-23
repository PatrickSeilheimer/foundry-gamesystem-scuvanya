/**
 * Zentrale Konfigurationskonstanten für das Scuvanya-System.
 * Talentlisten sind bewusst als Daten (nicht als Schema-Struktur) gehalten,
 * damit Reihenfolge/Labels/neue Einträge an einer Stelle gepflegt werden können.
 */
export const SCUVANYA = {};

SCUVANYA.attributes = {
  str: { label: "SCUVANYA.Attribute.Str", abbr: "STR" },
  dex: { label: "SCUVANYA.Attribute.Dex", abbr: "DEX" },
  con: { label: "SCUVANYA.Attribute.Con", abbr: "CON" },
  spd: { label: "SCUVANYA.Attribute.Spd", abbr: "SPD" },
  int: { label: "SCUVANYA.Attribute.Int", abbr: "INT" },
  mnd: { label: "SCUVANYA.Attribute.Mnd", abbr: "MND" },
  mag: { label: "SCUVANYA.Attribute.Mag", abbr: "MAG" },
  cha: { label: "SCUVANYA.Attribute.Cha", abbr: "CHA" }
};

SCUVANYA.attributeStartingValue = 6;

// Skillpunkte, mit denen ein neuer Charakter startet (siehe character.mjs skillPoints.total) --
// weiterhin frei durch die SL editierbar (z.B. bei Level-Ups), 500 ist nur der Startwert.
SCUVANYA.startingSkillPoints = 500;

// Soziale Talente: positiv und negativ, beide skalieren mit CHA-Mod.
SCUVANYA.socialSkills = {
  positive: ["anfeuern", "beruhigen", "charme", "feilschen", "ueberreden"],
  negative: ["beleidigen", "einschuechtern", "luegen", "manipulieren", "taeuschen"]
};

// Wissenschaftstalente: sozial und natur, beide skalieren mit INT-Mod.
SCUVANYA.scienceSkills = {
  sozial: ["geschichte", "gesellschaft", "kultur", "arkana", "theologie", "mythologie"],
  natur: ["botanik", "geologie", "mechanik", "medizin", "zoologie"]
};

// Körperliche Talente: gemeinsamer Durchschnittsbonus über alle 5.
SCUVANYA.physicalSkills = ["klettern", "laufen", "schwimmen", "springen", "werfen"];

// Sondertalente: individueller Bonus pro Talent, je nach thematischem Attribut.
SCUVANYA.sonderSkills = {
  fingerfertigkeit: "dex",
  taschendiebstahl: "dex",
  schloesserKnacken: "dex",
  schleichen: "dex",
  spurenLesen: "int",
  durchschauen: "int",
  ueberlebenstechniken: "mnd",
  orientierung: "mnd",
  selbstvertrauen: "mnd",
  konzentration: "mnd",
  magischesGespuer: "mag"
};

// Handwerk: Stufe 0-5, startet bei 0, nutzt Stufenwürfel (explodierend).
SCUVANYA.craftSkills = [
  "grobschmied", "feinschmied", "plattner", "gerber", "zimmerer",
  "weber", "alchemist", "koch", "jagen", "fischen", "verzaubern"
];

// Spezial: Stufe 0-5, startet bei 1, nutzt Stufenwürfel (explodierend) wie Handwerk.
SCUVANYA.spezialSkills = ["sehen", "hoeren", "humor", "zechen", "begluecken", "singen", "tanzen"];

// Stufenwürfel für Handwerk/Spezial. Index = Stufe (1-5). Stufe 0 = untrained, kein Wurf.
SCUVANYA.tieredDieSteps = { 0: null, 1: "d4", 2: "d6", 3: "d8", 4: "d10", 5: "d12" };
SCUVANYA.tieredSkillMinLevel = 0;
SCUVANYA.tieredSkillMaxLevel = 5;
SCUVANYA.specialtyStartingLevel = 1;
SCUVANYA.craftStartingLevel = 0;

// Extra: reine Booleans, kein Wurf.
SCUVANYA.extraSkills = [
  "lesen", "schreiben", "lippenLesen", "reiten", "kutscheFahren", "booteSteuern", "kartenLesen"
];

// Voraussetzungen zwischen Extra-Fähigkeiten (siehe character.mjs _prepareExtraSkillDependencies):
// eine Fähigkeit mit Eintrag hier ist nur "aktiv" (zählt für Würfe/Anzeige/Skillpunkt-Kosten),
// wenn die geforderte Fähigkeit selbst aktiv ist (bekannt ODER per Rasse/Beruf gewährt) -- ein
// Rassen-/Berufsbonus, der eine Fähigkeit DIREKT gewährt, umgeht die Voraussetzung dagegen
// (siehe "granted" -- Rassen-/Berufsboni sind die neue Norm, keine Voraussetzung greift dort).
SCUVANYA.extraSkillDependencies = {
  schreiben: "lesen",
  kutscheFahren: "reiten"
};

// Sprachen: Stufe 0-4. Gemeinsprache ist bei jedem PC fix auf Stufe 4.
SCUVANYA.languageMinLevel = 0;
SCUVANYA.languageMaxLevel = 4;
SCUVANYA.commonLanguageLevel = 4;

// Kampf- und Magiedisziplinen: Stufe 0-10, W20 + Disziplin-Bonus vs. Ziel-AC.
SCUVANYA.combatDisciplines = {
  krieger: { label: "SCUVANYA.Combat.Krieger", attribute: "str" },
  gauner: { label: "SCUVANYA.Combat.Gauner", attribute: "dex" },
  schuetze: { label: "SCUVANYA.Combat.Schuetze", attribute: "dex", ranged: true }
};

SCUVANYA.magicDisciplines = {
  pyrokinet: { label: "SCUVANYA.Magic.Pyrokinet" },
  geomant: { label: "SCUVANYA.Magic.Geomant" },
  hydrosoph: { label: "SCUVANYA.Magic.Hydrosoph" },
  aerothurg: { label: "SCUVANYA.Magic.Aerothurg" },
  nekromant: { label: "SCUVANYA.Magic.Nekromant" },
  polymorph: { label: "SCUVANYA.Magic.Polymorph" },
  beschwoerer: { label: "SCUVANYA.Magic.Beschwoerer" },
  spiritualist: { label: "SCUVANYA.Magic.Spiritualist" },
  schwarzmagier: { label: "SCUVANYA.Magic.Schwarzmagier" }
};

SCUVANYA.disciplineMinLevel = 0;
SCUVANYA.disciplineMaxLevel = 10;

// Schadensarten mit Kategorie (physisch/magisch), für Rüstung & Resistenz/Verwundbarkeit.
SCUVANYA.damageTypes = {
  feuer: { label: "SCUVANYA.Damage.Feuer", category: "magisch" },
  eis: { label: "SCUVANYA.Damage.Eis", category: "magisch" },
  gift: { label: "SCUVANYA.Damage.Gift", category: "magisch" },
  saeure: { label: "SCUVANYA.Damage.Saeure", category: "magisch" },
  erde: { label: "SCUVANYA.Damage.Erde", category: "magisch" },
  wasser: { label: "SCUVANYA.Damage.Wasser", category: "magisch" },
  nekro: { label: "SCUVANYA.Damage.Nekro", category: "magisch" },
  licht: { label: "SCUVANYA.Damage.Licht", category: "magisch" },
  void: { label: "SCUVANYA.Damage.Void", category: "magisch" },
  luft: { label: "SCUVANYA.Damage.Luft", category: "magisch" },
  blitz: { label: "SCUVANYA.Damage.Blitz", category: "magisch" },
  wucht: { label: "SCUVANYA.Damage.Wucht", category: "magisch" },
  psychisch: { label: "SCUVANYA.Damage.Psychisch", category: "magisch" },
  stich: { label: "SCUVANYA.Damage.Stich", category: "physisch" },
  stumpf: { label: "SCUVANYA.Damage.Stumpf", category: "physisch" },
  hieb: { label: "SCUVANYA.Damage.Hieb", category: "physisch" }
};

// Resistenz/Verwundbarkeit-Stufen: negative Werte = Verwundbarkeit, positive = Resistenz.
// Multiplikator: -100 -> x2, -75 -> x1.75, ... 0 -> x1, ... 100 -> x0 (immun).
SCUVANYA.resistanceSteps = [-100, -75, -50, -25, 0, 25, 50, 75, 100];

SCUVANYA.resistanceMultiplier = function (step) {
  return Math.clamp ? Math.clamp(1 - step / 100, 0, 2) : Math.min(2, Math.max(0, 1 - step / 100));
};

// Item-Typen, die Effekte (Active Effects) tragen können.
SCUVANYA.itemTypes = ["weapon", "armor", "consumable", "equipment", "race", "profession"];

/**
 * Ausrüstungs-Slots eines Charakters (siehe module/data/actor/character.mjs
 * equipment.slots und module/apps/equip-picker.mjs). "accepts" listet die Werte, die
 * system.slot eines Items annehmen kann, damit es in diesen Slot passt -- ein Ring-Item
 * setzt z.B. slot="ring" und passt dadurch sowohl in ringLinks als auch ringRechts.
 */
SCUVANYA.equipSlots = {
  kopf: { label: "SCUVANYA.EquipSlot.kopf", category: "ruestung", accepts: ["kopf"] },
  brust: { label: "SCUVANYA.EquipSlot.brust", category: "ruestung", accepts: ["brust"] },
  arme: { label: "SCUVANYA.EquipSlot.arme", category: "ruestung", accepts: ["arme"] },
  beine: { label: "SCUVANYA.EquipSlot.beine", category: "ruestung", accepts: ["beine"] },
  fuesse: { label: "SCUVANYA.EquipSlot.fuesse", category: "ruestung", accepts: ["fuesse"] },
  ohrringe: { label: "SCUVANYA.EquipSlot.ohrringe", category: "schmuck", accepts: ["ohrringe"] },
  halskette: { label: "SCUVANYA.EquipSlot.halskette", category: "schmuck", accepts: ["halskette"] },
  armbaender: { label: "SCUVANYA.EquipSlot.armbaender", category: "schmuck", accepts: ["armbaender"] },
  ringLinks: { label: "SCUVANYA.EquipSlot.ringLinks", category: "schmuck", accepts: ["ring"] },
  ringRechts: { label: "SCUVANYA.EquipSlot.ringRechts", category: "schmuck", accepts: ["ring"] },
  // "beidhaendig" (Zweihandwaffen) passt in beide Hand-Slots UND belegt beim Ausrüsten
  // automatisch beide gleichzeitig, siehe documents/actor.mjs equipItem/unequipSlot.
  hauptHand: { label: "SCUVANYA.EquipSlot.hauptHand", category: "hand", accepts: ["hauptHand", "beidhaendig"] },
  nebenHand: { label: "SCUVANYA.EquipSlot.nebenHand", category: "hand", accepts: ["nebenHand", "beidhaendig"] }
};

// Werte, die system.slot eines equippbaren Items annehmen kann (siehe equipSlots.*.accepts).
SCUVANYA.itemSlotValues = [
  "kopf", "brust", "arme", "beine", "fuesse",
  "ohrringe", "halskette", "armbaender", "ring",
  "hauptHand", "nebenHand", "beidhaendig"
];

// Vergleichsoperatoren für Item-Bedingungen (siehe equipment-shared.mjs conditionSchema).
SCUVANYA.conditionOperators = {
  gte: "SCUVANYA.ConditionOperator.gte",
  lte: "SCUVANYA.ConditionOperator.lte",
  eq: "SCUVANYA.ConditionOperator.eq",
  gt: "SCUVANYA.ConditionOperator.gt",
  lt: "SCUVANYA.ConditionOperator.lt"
};

// Wann ein Effekt eines Items zählt: "equipped" (Standardfall, muss ausgerüstet sein) oder
// "carried" (wirkt bereits, wenn das Item nur im Inventar liegt -- selten, z.B. ein Amulett,
// das passiv wirkt, ohne angelegt zu sein).
SCUVANYA.effectConditions = ["equipped", "carried"];

// Boni-Arten innerhalb einer Eigenschaft (siehe progression-shared.mjs bonusBundleSchema):
// "fixed": fester Bonus auf genau ein Ziel (path).
// "choice": wähle EIN Ziel aus options, erhält amount.
// "distribute": verteile amount Punkte frei auf options (max. perOptionMax pro Ziel, 0 = unbegrenzt).
// "text": reiner Beschreibungstext ohne Zahlenwert (RP-relevant, z.B. "Nachtsicht").
SCUVANYA.bonusKinds = ["fixed", "choice", "distribute", "text"];

/**
 * Aktionen/Zauber (siehe module/data/item/action.mjs, module/actions/catalog.mjs). Werden NICHT
 * als eingebettete Items pro Charakter geführt, sondern zentral im Compendium-Pack "actions"
 * gepflegt (wie eine Zauber-/Fähigkeitenliste) -- der Charakterbogen zeigt daraus gefiltert nur
 * die Aktionen, deren Freischaltbedingungen (system.unlockConditions) der Charakter erfüllt,
 * oder die er über einen Item-Effekt vom Typ "unlockAction" geschenkt bekommt (siehe
 * equipment-shared.mjs effectSchema und documents/actor.mjs isActionAvailable).
 */
SCUVANYA.actionCategories = {
  talenteinsatz: { label: "SCUVANYA.ActionCategory.talenteinsatz" },
  attacke: { label: "SCUVANYA.ActionCategory.attacke" },
  zauber: { label: "SCUVANYA.ActionCategory.zauber" }
};

// Woher der Würfelwurf einer Aktion kommt (siehe documents/actor.mjs _buildActionRollFormula):
// "discipline"/"skill"/"attribute": fester Pfad (system.rollPath) wird gewürfelt.
// "weaponCategory": Ziel ergibt sich dynamisch aus der Disziplin der aktuell ausgerüsteten Waffe
// (Haupt- vor Nebenhand) -- z.B. "Waffenangriff" würfelt Krieger/Gauner/Schütze je nach Waffe.
// "none": kein Würfelwurf (reine Ressourcen-Aktion).
SCUVANYA.actionRollSources = ["discipline", "skill", "attribute", "weaponCategory", "none"];

// AP, die ein Charakter zu Beginn seines Zuges im Kampf erhält (siehe scuvanya.mjs Hooks.on("combatTurn")).
SCUVANYA.turnStartAP = 5;

// Knotentypen eines Freischaltbedingungs-Baums (siehe module/rules/conditions.mjs):
// "and"/"or": Gruppenknoten mit "children" (beliebig tief verschachtelbar).
// "compare": Blattknoten, vergleicht einen Pfad (Attribut/Talent/Disziplin) via operator/value.
// "hasEquippedWeaponFlag": Blattknoten, prüft ob eine ausgerüstete Waffe ein bestimmtes Flag trägt.
// "hasEquippedWeapon": Blattknoten, prüft ob überhaupt eine Waffe ausgerüstet ist.
SCUVANYA.conditionNodeTypes = ["and", "or", "compare", "hasEquippedWeaponFlag", "hasEquippedWeapon"];
