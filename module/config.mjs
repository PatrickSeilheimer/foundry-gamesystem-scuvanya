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

// Soziale Talente: positiv und negativ, beide skalieren mit CHA-Mod.
SCUVANYA.socialSkills = {
  positive: ["anfeuern", "beruhigen", "charme", "feilschen", "ueberreden"],
  negative: ["beleidigen", "einschuechtern", "luegen", "manipulieren", "taeuschen"]
};

// Wissenschaftstalente: sozial und natur, beide skalieren mit INT-Mod.
SCUVANYA.scienceSkills = {
  sozial: ["geschichte", "gesellschaft", "kultur", "arkana", "theologie"],
  natur: ["botanik", "geologie", "mechanik", "medizin", "zoologie"]
};

// Körperliche Talente: gemeinsamer Durchschnittsbonus über alle 5.
SCUVANYA.physicalSkills = ["klettern", "laufen", "schwimmen", "springen", "werfen"];

// Sondertalente: individueller Bonus pro Talent (Formel noch nicht final).
// PLATZHALTER: alle Sondertalente nutzen vorerst MAG-Mod als Bonusquelle.
// Sobald die finale Liste vorliegt, hier je Talent das echte Attribut eintragen.
SCUVANYA.sonderSkills = {
  fingerfertigkeit: "mag",
  taschendiebstahl: "mag",
  schloesserKnacken: "mag",
  schleichen: "mag",
  spurenLesen: "mag",
  ueberlebenstechniken: "mag",
  orientierung: "mag",
  selbstvertrauen: "mag",
  konzentration: "mag",
  magischesGespuer: "mag",
  durchschauen: "mag"
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

// Boni-Arten innerhalb einer Eigenschaft (siehe progression-shared.mjs bonusBundleSchema):
// "fixed": fester Bonus auf genau ein Ziel (path).
// "choice": wähle EIN Ziel aus options, erhält amount.
// "distribute": verteile amount Punkte frei auf options (max. perOptionMax pro Ziel, 0 = unbegrenzt).
// "text": reiner Beschreibungstext ohne Zahlenwert (RP-relevant, z.B. "Nachtsicht").
SCUVANYA.bonusKinds = ["fixed", "choice", "distribute", "text"];
