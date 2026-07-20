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
