import { SCUVANYA } from "../config.mjs";

/**
 * Rassen-/Berufsboni sind konzeptionell KEIN Bonus obendrauf, sondern verschieben den
 * Startwert selbst (siehe character.mjs/path-resolve.mjs -- die Boni werden weiterhin
 * technisch als eigenes "raceBonus"-Overlay geführt, damit ein Rassenwechsel den
 * persistierten Basiswert nie verfälscht). Auf dem Bogen wird deshalb NUR die verschmolzene
 * Summe angezeigt (z.B. "5"), nie eine Aufschlüsselung wie "1 (+4)". Aus demselben Grund lösen
 * Rassen-/Berufsboni auch KEINE "hat einen aktiven Bonus"-Markierung aus -- die ist Quellen wie
 * Ausrüstung/Active Effects vorbehalten, die es aktuell noch nicht gibt (raceBonus fließt daher
 * nur noch in "level" ein, wird aber nicht mehr separat nach außen gereicht).
 */

export function mapLeveledSkills(keys, dataSource) {
  return keys.map(key => {
    const shift = dataSource[key].raceBonus ?? 0;
    return {
      key,
      label: game.i18n.localize(`SCUVANYA.Skill.${key}`),
      level: dataSource[key].level + shift,
      bonus: dataSource[key].bonus
    };
  });
}

const CROSS = "✕";

export function mapTieredSkills(keys, dataSource) {
  return keys.map(key => {
    const shift = dataSource[key].raceBonus ?? 0;
    const level = Math.min(dataSource[key].level + shift, SCUVANYA.tieredSkillMaxLevel);
    return {
      key,
      label: game.i18n.localize(`SCUVANYA.Skill.${key}`),
      level,
      die: SCUVANYA.tieredDieSteps[level] ?? null,
      crosses: CROSS.repeat(Math.max(0, level))
    };
  });
}

export function mapBooleanSkills(keys, dataSource) {
  return keys.map(key => ({
    key,
    label: game.i18n.localize(`SCUVANYA.Skill.${key}`),
    known: dataSource[key].known,
    granted: dataSource[key].granted ?? false
  }));
}

// Bild je Disziplin (assets/disciplines/*.png) -- eigene Zuordnung, weil zwei Dateinamen
// mit Umlaut (schütze/beschwörer) von den ASCII-Schlüsseln (schuetze/beschwoerer) abweichen.
const DISCIPLINE_IMAGES = {
  krieger: "krieger.png",
  gauner: "gauner.png",
  schuetze: "schütze.png",
  pyrokinet: "pyrokinet.png",
  geomant: "geomant.png",
  hydrosoph: "hydrosoph.png",
  aerothurg: "aerothurg.png",
  nekromant: "nekromant.png",
  polymorph: "polymorph.png",
  beschwoerer: "beschwörer.png",
  spiritualist: "spiritualist.png",
  schwarzmagier: "schwarzmagier.png"
};

export function mapDisciplines(disciplineConfig, dataSource) {
  return Object.entries(disciplineConfig).map(([key, cfg]) => {
    const shift = dataSource[key].raceBonus ?? 0;
    const level = dataSource[key].level + shift;
    return {
      key,
      label: game.i18n.localize(cfg.label),
      level,
      img: DISCIPLINE_IMAGES[key] ? `systems/scuvanya/assets/disciplines/${DISCIPLINE_IMAGES[key]}` : null
    };
  });
}

// Icon je Attribut (Font Awesome 6 Free) -- rein dekorativ, keine mechanische Bedeutung.
const ATTRIBUTE_ICONS = {
  str: "fa-dumbbell",
  dex: "fa-bullseye",
  con: "fa-heart-pulse",
  spd: "fa-bolt",
  int: "fa-brain",
  mnd: "fa-mountain",
  mag: "fa-wand-magic-sparkles",
  cha: "fa-star"
};

export function mapAttributes(dataSource) {
  return Object.entries(SCUVANYA.attributes).map(([key, cfg]) => {
    return {
      key,
      label: game.i18n.localize(cfg.label),
      abbr: cfg.abbr,
      icon: ATTRIBUTE_ICONS[key],
      // "value" bleibt die reine, editierbare Basis (aus _source, siehe character.mjs) --
      // angezeigt wird aber ausschließlich "effectiveValue", die bereits verschmolzene Summe.
      value: dataSource[key].value,
      effectiveValue: dataSource[key].effectiveValue ?? dataSource[key].value,
      mod: dataSource[key].mod,
      modDisplay: `${dataSource[key].mod >= 0 ? "+" : ""}${dataSource[key].mod}`
    };
  });
}
