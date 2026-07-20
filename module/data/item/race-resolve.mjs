import { SCUVANYA } from "../../config.mjs";

/**
 * Löst auf, welche Bonus-Bündel einer Rasse für ein bestimmtes Geschlecht/Subrasse gerade
 * aktiv sind: immer die Basis, dazu das gewählte Geschlecht (falls das Bündel existiert),
 * dazu die gewählte Subrasse (falls vorhanden und gefunden). Funktioniert sowohl mit dem
 * rohen Welt-Item (Wizard-Vorschau, noch nicht auf einen Charakter angewendet) als auch mit
 * dem eingebetteten Item-Datenmodell auf dem Actor (siehe character.mjs).
 */
export function activeRaceBundles(raceSystem, gender, subraceKey) {
  const bundles = [raceSystem.base];
  const genderBundle = gender === "weiblich" ? raceSystem.weiblich : raceSystem.maennlich;
  if (genderBundle) bundles.push(genderBundle);
  if (subraceKey) {
    const subrace = raceSystem.subraces?.find(s => s.key === subraceKey);
    if (subrace) bundles.push(subrace.bonuses);
  }
  return bundles;
}

/**
 * Summiert mehrere Bonus-Bündel zu EINEM Bündel derselben Form (siehe bonusBundleSchema in
 * progression-shared.mjs) -- z.B. Basis +5 Magie und Geschlecht -1 Magie werden zu einem
 * einzelnen Nettobonus von +4, nicht als zwei separate Boni dargestellt. Weil das Ergebnis
 * dieselbe Form wie ein einzelnes Bündel hat, kann der Rest des Systems (Actor-Berechnung,
 * Wizard-Vorschau) Rassen und Berufe identisch behandeln -- ein Beruf ist einfach der
 * Sonderfall "genau ein Bündel", siehe character.mjs _computeProgressionBonus().
 */
export function mergeBonusBundles(bundles) {
  const attributeBonuses = {};
  const resistanceBonuses = {};
  const skillMap = {};
  const extraGrantsSet = new Set();
  const choices = [];
  let freeAttributePoints = 0;

  for (const key of Object.keys(SCUVANYA.attributes)) attributeBonuses[key] = 0;
  for (const key of Object.keys(SCUVANYA.damageTypes)) resistanceBonuses[key] = 0;

  for (const bundle of bundles) {
    if (!bundle) continue;
    for (const key of Object.keys(SCUVANYA.attributes)) {
      attributeBonuses[key] += bundle.attributeBonuses?.[key] ?? 0;
    }
    for (const key of Object.keys(SCUVANYA.damageTypes)) {
      resistanceBonuses[key] += bundle.resistanceBonuses?.[key] ?? 0;
    }
    for (const entry of bundle.skillBonuses ?? []) {
      skillMap[entry.path] = (skillMap[entry.path] ?? 0) + entry.bonus;
    }
    for (const key of bundle.extraGrants ?? []) extraGrantsSet.add(key);
    freeAttributePoints += bundle.freeAttributePoints ?? 0;
    for (const choice of bundle.choices ?? []) choices.push(choice);
  }

  return {
    attributeBonuses,
    resistanceBonuses,
    skillBonuses: Object.entries(skillMap).map(([path, bonus]) => ({ path, bonus })),
    extraGrants: [...extraGrantsSet],
    choices,
    freeAttributePoints
  };
}

/** Kurzform: aktive Bündel einer Rasse direkt zu einem Netto-Bündel verrechnen. */
export function resolveRaceBonuses(raceSystem, gender, subraceKey) {
  return mergeBonusBundles(activeRaceBundles(raceSystem, gender, subraceKey));
}
