import { SCUVANYA } from "../config.mjs";
import {
  attributeSpentCost,
  talentLevelCost,
  tieredLevelCost,
  specialtyLevelCost,
  EXTRA_TALENT_COST
} from "../rules/costs.mjs";

export function mapLeveledSkills(keys, dataSource) {
  return keys.map(key => ({
    key,
    label: game.i18n.localize(`SCUVANYA.Skill.${key}`),
    level: dataSource[key].level,
    bonus: dataSource[key].bonus,
    raceBonus: dataSource[key].raceBonus ?? 0,
    nextCost: talentLevelCost(dataSource[key].level + 1)
  }));
}

export function mapTieredSkills(keys, dataSource, kind = "handwerk") {
  const nextLevelCost = kind === "spezial" ? specialtyLevelCost : tieredLevelCost;
  return keys.map(key => ({
    key,
    label: game.i18n.localize(`SCUVANYA.Skill.${key}`),
    level: dataSource[key].level,
    die: SCUVANYA.tieredDieSteps[dataSource[key].level] ?? "-",
    raceBonus: dataSource[key].raceBonus ?? 0,
    nextCost: nextLevelCost(dataSource[key].level + 1)
  }));
}

export function mapBooleanSkills(keys, dataSource) {
  return keys.map(key => ({
    key,
    label: game.i18n.localize(`SCUVANYA.Skill.${key}`),
    known: dataSource[key].known,
    granted: dataSource[key].granted ?? false,
    cost: EXTRA_TALENT_COST
  }));
}

export function mapDisciplines(disciplineConfig, dataSource) {
  return Object.entries(disciplineConfig).map(([key, cfg]) => ({
    key,
    label: game.i18n.localize(cfg.label),
    level: dataSource[key].level,
    raceBonus: dataSource[key].raceBonus ?? 0,
    nextCost: tieredLevelCost(dataSource[key].level + 1)
  }));
}

export function mapAttributes(dataSource, allocationSource) {
  return Object.entries(SCUVANYA.attributes).map(([key, cfg]) => ({
    key,
    label: game.i18n.localize(cfg.label),
    abbr: cfg.abbr,
    // "value" ist die reine, editierbare Basis (aus _source). "effectiveValue"/"mod" sind
    // nur zur Anzeige/für Würfe -- niemals an ein Input-Feld binden (siehe character.mjs).
    value: dataSource[key].value,
    effectiveValue: dataSource[key].effectiveValue ?? dataSource[key].value,
    mod: dataSource[key].mod,
    raceBonus: dataSource[key].raceBonus ?? 0,
    allocation: allocationSource?.[key] ?? 0,
    // Marginalkosten des nächsten Punkts -- dieselbe Formel wie beim tatsächlichen Kauf
    // (character-sheet.mjs #onBuyAttribute), damit Vorschau und abgebuchte Kosten nie auseinanderlaufen.
    nextCost: attributeSpentCost(dataSource[key].value + 1, SCUVANYA.attributeStartingValue)
      - attributeSpentCost(dataSource[key].value, SCUVANYA.attributeStartingValue)
  }));
}
