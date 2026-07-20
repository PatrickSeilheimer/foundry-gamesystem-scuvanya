import { SCUVANYA } from "../config.mjs";
import {
  attributeSpentCost,
  talentSpentCost,
  tieredSpentCost,
  specialtySpentCost,
  EXTRA_TALENT_COST
} from "../rules/costs.mjs";

export function mapLeveledSkills(keys, dataSource) {
  return keys.map(key => {
    const shift = dataSource[key].raceBonus ?? 0;
    return {
      key,
      label: game.i18n.localize(`SCUVANYA.Skill.${key}`),
      level: dataSource[key].level,
      bonus: dataSource[key].bonus,
      raceBonus: shift,
      nextCost: talentSpentCost(dataSource[key].level + 1, shift) - talentSpentCost(dataSource[key].level, shift)
    };
  });
}

export function mapTieredSkills(keys, dataSource, kind = "handwerk") {
  const startingLevel = kind === "spezial" ? SCUVANYA.specialtyStartingLevel : 0;
  const spentFn = kind === "spezial" ? specialtySpentCost : tieredSpentCost;
  return keys.map(key => {
    const shift = dataSource[key].raceBonus ?? 0;
    return {
      key,
      label: game.i18n.localize(`SCUVANYA.Skill.${key}`),
      level: dataSource[key].level,
      die: SCUVANYA.tieredDieSteps[dataSource[key].level] ?? "-",
      raceBonus: shift,
      nextCost: spentFn(dataSource[key].level + 1, startingLevel, shift) - spentFn(dataSource[key].level, startingLevel, shift)
    };
  });
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
  return Object.entries(disciplineConfig).map(([key, cfg]) => {
    const shift = dataSource[key].raceBonus ?? 0;
    return {
      key,
      label: game.i18n.localize(cfg.label),
      level: dataSource[key].level,
      raceBonus: shift,
      nextCost: tieredSpentCost(dataSource[key].level + 1, 0, shift) - tieredSpentCost(dataSource[key].level, 0, shift)
    };
  });
}

export function mapAttributes(dataSource) {
  return Object.entries(SCUVANYA.attributes).map(([key, cfg]) => {
    const shift = dataSource[key].raceBonus ?? 0;
    return {
      key,
      label: game.i18n.localize(cfg.label),
      abbr: cfg.abbr,
      // "value" ist die reine, editierbare Basis (aus _source). "effectiveValue"/"mod" sind
      // nur zur Anzeige/für Würfe -- niemals an ein Input-Feld binden (siehe character.mjs).
      value: dataSource[key].value,
      effectiveValue: dataSource[key].effectiveValue ?? dataSource[key].value,
      mod: dataSource[key].mod,
      raceBonus: shift,
      // Marginalkosten des nächsten Punkts -- dieselbe Formel wie beim tatsächlichen Kauf
      // (character-sheet.mjs #onBuyAttribute), damit Vorschau und abgebuchte Kosten nie auseinanderlaufen.
      nextCost: attributeSpentCost(dataSource[key].value + 1, SCUVANYA.attributeStartingValue, shift)
        - attributeSpentCost(dataSource[key].value, SCUVANYA.attributeStartingValue, shift)
    };
  });
}
