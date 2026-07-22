import { SCUVANYA } from "../../config.mjs";

/**
 * Löst die Eigenschaften/Boni eines oder mehrerer Bonus-Bündel (siehe bonusBundleSchema in
 * progression-shared.mjs) zu einem flachen Satz von Ziel-Boni auf. attributeStart fließt immer
 * direkt ein (keine Wahl nötig); "choice"/"distribute" werden anhand der getroffenen Auswahl
 * (selections, aus item.system.choiceSelections) eingerechnet; "text" landet als reine
 * Anzeige-Badge ohne Zahlenwert; "fixed" fließt direkt ein.
 *
 * Das Ergebnis ist EIN flacher { [path]: amount }-Satz -- unabhängig davon, ob er aus einem
 * einzelnen Bündel (Beruf) oder mehreren gleichzeitig aktiven Bündeln (Rasse: Basis +
 * Geschlecht + ggf. Subrasse) stammt. Namaren-Beispiel: Basis "attributes.mag" +5 und
 * weiblich "attributes.mag" -1 ergeben netto pathBonuses["attributes.mag"] = 4.
 */
export function resolveBundles(bundles, selections) {
  const pathBonuses = {};
  const texts = [];

  const add = (path, amount) => {
    if (!path || !amount) return;
    pathBonuses[path] = (pathBonuses[path] ?? 0) + amount;
  };

  for (const bundle of bundles) {
    for (const key of Object.keys(SCUVANYA.attributes)) {
      add(`attributes.${key}`, bundle?.attributeStart?.[key] ?? 0);
    }
    for (const eigenschaft of bundle?.eigenschaften ?? []) {
      for (const bonus of eigenschaft.boni ?? []) {
        if (bonus.kind === "fixed") {
          add(bonus.path, bonus.amount);
        } else if (bonus.kind === "choice") {
          const selected = selections?.[bonus.key];
          if (selected && bonus.options?.includes(selected)) add(selected, bonus.amount);
        } else if (bonus.kind === "distribute") {
          const allocation = selections?.[bonus.key];
          if (allocation && typeof allocation === "object") {
            for (const [path, points] of Object.entries(allocation)) {
              if (bonus.options?.includes(path) && points > 0) add(path, points);
            }
          }
        } else if (bonus.kind === "text" && bonus.text) {
          texts.push({ name: eigenschaft.name, text: bonus.text });
        }
      }
    }
  }

  return { pathBonuses, texts };
}

/**
 * Trägt einen flachen { [path]: amount }-Satz in die abgeleiteten Actor-Daten ein. Wird von
 * CharacterData.prepareDerivedData zweimal aufgerufen -- einmal für Rassen-/Berufsboni
 * (overlayKey "raceBonus", verschiebt auch die SP-Kostenkurve, siehe costs.mjs) und einmal für
 * Ausrüstungs-Effekte (overlayKey "itemBonus", rein kosmetisch/Wurf-Bonus, verschiebt NICHT
 * die Kostenkurve -- ein abgelegter Ring darf keine dauerhaften Kosten hinterlassen). Beide
 * Overlays fließen bei der Anzeige zusammen (siehe context-helpers.mjs), nur "itemBonus" löst
 * dort eine sichtbare Markierung aus (siehe Konversation: Rassen-/Berufsboni sind die neue
 * Norm, kein "Bonus" im eigentlichen Sinn -- ein Ausrüstungseffekt schon).
 *
 * _armorBonus/_acBonus/_initiativeBonus werden bewusst NICHT hier zurückgesetzt (das müsste der
 * Aufrufer VOR dem ersten Aufruf einmalig tun), sonst würde der zweite Aufruf den ersten
 * überschreiben statt zu addieren -- Rüstung/AC/Initiative kennen ohnehin keine getrennten
 * Overlays, sie akkumulieren beide Quellen gemeinsam (siehe _prepareArmorAndAc).
 */
export function applyPathBonuses(character, pathBonuses, overlayKey = "raceBonus") {
  character._armorBonus ??= { physical: 0, magical: 0 };
  character._acBonus ??= 0;
  character._initiativeBonus ??= 0;

  for (const [path, amount] of Object.entries(pathBonuses)) {
    if (path.startsWith("attributes.")) {
      const key = path.slice("attributes.".length);
      const attr = character.attributes[key];
      if (attr) attr[overlayKey] = (attr[overlayKey] ?? 0) + amount;
    } else if (path.startsWith("talents.extra.")) {
      const key = path.slice("talents.extra.".length);
      const skill = character.talents.extra[key];
      if (skill) skill.granted = true;
    } else if (path.startsWith("talents.")) {
      const sub = path.slice("talents.".length);
      const target = foundry.utils.getProperty(character.talents, sub);
      if (target) target[overlayKey] = (target[overlayKey] ?? 0) + amount;
    } else if (path.startsWith("disziplinen.")) {
      const sub = path.slice("disziplinen.".length);
      const target = foundry.utils.getProperty(character.disziplinen, sub);
      if (target) target[overlayKey] = (target[overlayKey] ?? 0) + amount;
    } else if (path.startsWith("resistances.")) {
      const key = path.slice("resistances.".length);
      if (key in character.resistancesEffective) character.resistancesEffective[key] += amount;
    } else if (path === "armor.physical" || path === "armor.magical") {
      character._armorBonus[path.slice("armor.".length)] += amount;
    } else if (path === "ac.value") {
      character._acBonus += amount;
    } else if (path === "initiative") {
      character._initiativeBonus += amount;
    } else {
      // Generischer Fallback für Pfade außerhalb der bekannten Namensräume oben: wird direkt
      // auf die ABGELEITETEN Daten angewendet -- sicher, weil prepareDerivedData bei jedem
      // Aufruf frisch aus den persistierten Werten neu rechnet, hier wird nichts dauerhaft
      // gespeichert. ACHTUNG: falls so ein Pfad auch ein direkt editierbares Formularfeld im
      // Bogen ist, müsste stattdessen ein eigenes Effective-Overlay ergänzt werden (wie bei
      // attributes/talents/disziplinen/resistances/armor/ac) -- sonst würde der Bonus beim
      // nächsten Speichern in den Basiswert eingerechnet und würde sich mit jedem Save erneut
      // aufaddieren.
      const current = foundry.utils.getProperty(character, path);
      if (typeof current === "number") foundry.utils.setProperty(character, path, current + amount);
    }
  }
}

/**
 * Löst die Effekte ausrüstbarer Items (Waffe/Rüstung/Ausrüstung, siehe equipment-shared.mjs
 * effectSchema) zu einem flachen { [path]: amount }-Satz auf -- analog zu resolveBundles, aber
 * ohne choice/distribute (Items brauchen keine Wahlmöglichkeiten). Ein Effekt zählt nur, wenn
 * seine "condition" erfüllt ist: "equipped" nur für Items in equippedItemIds, "carried" für
 * jedes hier übergebene Item (Aufrufer filtert bereits auf Besitz).
 */
export function resolveItemEffects(items, equippedItemIds) {
  const pathBonuses = {};
  const texts = [];

  const add = (path, amount) => {
    if (!path || !amount) return;
    pathBonuses[path] = (pathBonuses[path] ?? 0) + amount;
  };

  for (const item of items) {
    const isEquipped = equippedItemIds.has(item.id);
    for (const effect of item.system.effects ?? []) {
      const applies = effect.condition === "carried" || isEquipped;
      if (!applies) continue;
      if (effect.kind === "fixed") add(effect.path, effect.amount);
      else if (effect.kind === "text" && effect.text) texts.push({ name: item.name, text: effect.text });
    }
  }

  return { pathBonuses, texts };
}
