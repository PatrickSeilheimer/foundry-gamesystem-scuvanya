import { describePath } from "../path-labels.mjs";

/**
 * Vergleichsoperatoren für "compare"-Blattknoten (siehe SCUVANYA.conditionOperators) --
 * zentrale Quelle, gemeinsam genutzt von Ausrüstungs-Voraussetzungen (documents/actor.mjs
 * evaluateConditions) und Aktions-Freischaltbedingungen (evaluateConditionNode unten).
 */
export const CONDITION_COMPARATORS = {
  gte: (a, b) => a >= b,
  lte: (a, b) => a <= b,
  eq: (a, b) => a === b,
  gt: (a, b) => a > b,
  lt: (a, b) => a < b
};

/**
 * Wertet einen beliebig verschachtelten UND-/ODER-Bedingungsbaum gegen einen Actor aus (siehe
 * SCUVANYA.conditionNodeTypes und action.mjs unlockConditions). Ein leerer/fehlender Knoten
 * (kein "type") gilt als immer erfüllt -- eine Aktion ohne Voraussetzungen ist immer verfügbar.
 *
 * Knotenformen:
 *   { type: "and", children: [...] }                         -- alle Kinder müssen erfüllt sein
 *   { type: "or", children: [...] }                          -- mind. ein Kind muss erfüllt sein
 *   { type: "compare", path, operator, value }                -- Pfad-Vergleich (actor._resolveConditionValue)
 *   { type: "hasEquippedWeaponFlag", flag }                   -- ausgerüstete Waffe trägt dieses Flag
 *   { type: "hasEquippedWeapon" }                             -- irgendeine Waffe ist ausgerüstet
 */
export function evaluateConditionNode(node, actor) {
  if (!node || !node.type) return true;
  switch (node.type) {
    case "and":
      return (node.children ?? []).every(child => evaluateConditionNode(child, actor));
    case "or":
      return (node.children ?? []).some(child => evaluateConditionNode(child, actor));
    case "compare": {
      const compare = CONDITION_COMPARATORS[node.operator] ?? CONDITION_COMPARATORS.gte;
      const actual = actor._resolveConditionValue(node.path);
      return compare(actual, node.value);
    }
    case "hasEquippedWeaponFlag":
      return actor.hasEquippedWeaponWithFlag(node.flag);
    case "hasEquippedWeapon":
      return actor.hasEquippedWeapon();
    default:
      return true;
  }
}

/**
 * Baut eine menschenlesbare Beschreibung eines Bedingungsbaums (für Tooltips, siehe
 * action-tooltip.hbs) -- z.B. "Gauner ≥ 6 UND Geschickwaffe ausgerüstet" oder
 * "(Gauner ≥ 6 UND Geschickwaffe ausgerüstet) ODER (Krieger ≥ 8 UND Stärkewaffe ausgerüstet)".
 * Gruppen innerhalb eines "or" werden geklammert, damit die Verschachtelung eindeutig bleibt.
 */
export function describeConditionNode(node) {
  if (!node || !node.type) return "";
  const and = game.i18n.localize("SCUVANYA.Action.And");
  const or = game.i18n.localize("SCUVANYA.Action.Or");

  switch (node.type) {
    case "and":
      return (node.children ?? []).map(describeConditionNode).filter(Boolean).join(` ${and} `);
    case "or":
      return (node.children ?? [])
        .map(child => {
          const text = describeConditionNode(child);
          return child.type === "and" || child.type === "or" ? `(${text})` : text;
        })
        .filter(Boolean)
        .join(` ${or} `);
    case "compare": {
      const operatorLabel = game.i18n.localize(`SCUVANYA.ConditionOperator.${node.operator}`);
      return `${describePath(node.path)} ${operatorLabel} ${node.value}`;
    }
    case "hasEquippedWeaponFlag": {
      const flag = node.flag ? node.flag.charAt(0).toUpperCase() + node.flag.slice(1) : node.flag;
      return game.i18n.format("SCUVANYA.Action.RequiresWeaponFlag", { flag });
    }
    case "hasEquippedWeapon":
      return game.i18n.localize("SCUVANYA.Action.RequiresAnyWeapon");
    default:
      return "";
  }
}
