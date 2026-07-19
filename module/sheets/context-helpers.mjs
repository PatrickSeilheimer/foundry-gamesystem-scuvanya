import { SCUVANYA } from "../config.mjs";

export function mapLeveledSkills(keys, dataSource) {
  return keys.map(key => ({
    key,
    label: game.i18n.localize(`SCUVANYA.Skill.${key}`),
    level: dataSource[key].level,
    bonus: dataSource[key].bonus,
    raceBonus: dataSource[key].raceBonus ?? 0
  }));
}

export function mapTieredSkills(keys, dataSource) {
  return keys.map(key => ({
    key,
    label: game.i18n.localize(`SCUVANYA.Skill.${key}`),
    level: dataSource[key].level,
    die: SCUVANYA.tieredDieSteps[dataSource[key].level] ?? "-",
    raceBonus: dataSource[key].raceBonus ?? 0
  }));
}

export function mapBooleanSkills(keys, dataSource) {
  return keys.map(key => ({
    key,
    label: game.i18n.localize(`SCUVANYA.Skill.${key}`),
    known: dataSource[key].known
  }));
}

export function mapDisciplines(disciplineConfig, dataSource) {
  return Object.entries(disciplineConfig).map(([key, cfg]) => ({
    key,
    label: game.i18n.localize(cfg.label),
    level: dataSource[key].level
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
    allocation: allocationSource?.[key] ?? 0
  }));
}
