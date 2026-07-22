import { SCUVANYA } from "./config.mjs";

/**
 * Beschriftet einen Bonus-/Effekt-Pfad menschenlesbar (z.B. "attributes.mag" -> "Magie",
 * "disziplinen.kampf.krieger" -> "Krieger"). Gemeinsam genutzt vom Charaktererstellungs-Wizard
 * (Bonus-Vorschau) und dem Charakterbogen (Item-Effekt-Tooltips, siehe character-sheet.mjs).
 *
 * Für Resistenz-Pfade wird, sofern ein Betrag mitgegeben wird, zusätzlich zwischen Resistenz
 * (positiver Betrag) und Verwundbarkeit (negativer Betrag) unterschieden -- siehe
 * SCUVANYA.resistanceSteps: negative Werte sind Verwundbarkeit, positive Werte Resistenz.
 */
export function describePath(path, amount) {
  if (path.startsWith("attributes.")) {
    const cfg = SCUVANYA.attributes[path.slice("attributes.".length)];
    return cfg ? game.i18n.localize(cfg.label) : path;
  }
  if (path.startsWith("disziplinen.")) {
    const key = path.split(".").pop();
    const cfg = SCUVANYA.combatDisciplines[key] ?? SCUVANYA.magicDisciplines[key];
    return cfg ? game.i18n.localize(cfg.label) : path;
  }
  if (path.startsWith("talents.extra.")) {
    return game.i18n.localize(`SCUVANYA.Skill.${path.slice("talents.extra.".length)}`);
  }
  if (path.startsWith("talents.")) {
    const key = path.split(".").pop();
    const localized = game.i18n.localize(`SCUVANYA.Skill.${key}`);
    return localized.startsWith("SCUVANYA.") ? path : localized;
  }
  if (path.startsWith("resistances.")) {
    const cfg = SCUVANYA.damageTypes[path.slice("resistances.".length)];
    const label = cfg ? game.i18n.localize(cfg.label) : path;
    if (typeof amount === "number" && amount !== 0) {
      const suffix = game.i18n.localize(amount > 0 ? "SCUVANYA.Damage.ResistanceSuffix" : "SCUVANYA.Damage.VulnerabilitySuffix");
      return `${label}${suffix}`;
    }
    return label;
  }
  if (path === "armor.physical") return game.i18n.localize("SCUVANYA.Armor.physical");
  if (path === "armor.magical") return game.i18n.localize("SCUVANYA.Armor.magical");
  if (path === "ac.value") return game.i18n.localize("SCUVANYA.AC");
  if (path === "initiative") return game.i18n.localize("SCUVANYA.Initiative");
  return path;
}
