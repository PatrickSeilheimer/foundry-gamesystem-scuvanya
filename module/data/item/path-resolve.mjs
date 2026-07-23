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
          // Absichtlich ein ARRAY aus { path, points } statt eines { [path]: points }-Objekts:
          // Ziel-Pfade wie "talents.koerperlich.klettern" enthalten Punkte, und ein Punkt in
          // einem Objekt-SCHLÜSSEL wird von Foundrys internem expandObject (läuft bei jedem
          // Document.update()/createEmbeddedDocuments() über die kompletten Update-Daten) als
          // verschachtelter Pfad missverstanden -- die Zuteilung würde beim Speichern in
          // { talents: { koerperlich: { klettern: N } } } zerlegt und beim nächsten Öffnen als
          // leer gelesen (siehe Konversation: "die frei verteilbaren Punkte sind alle auf 0").
          const allocation = selections?.[bonus.key];
          if (Array.isArray(allocation)) {
            for (const entry of allocation) {
              if (entry?.path && bonus.options?.includes(entry.path) && entry.points > 0) add(entry.path, entry.points);
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
 *
 * "breakdown" (optional, nur beim itemBonus-Durchlauf gefüllt) ist { [path]: [{name, amount}] }
 * -- wird 1:1 als "itemBreakdown" an Attribut/Talent/Disziplin gehängt, damit der Bogen einen
 * Rechen-Tooltip zeigen kann (Basis + je Item eine Zeile + Gesamt), siehe context-helpers.mjs.
 */
export function applyPathBonuses(character, pathBonuses, overlayKey = "raceBonus", breakdown = {}) {
  character._armorBonus ??= { physical: 0, magical: 0 };
  character._acBonus ??= 0;
  character._initiativeBonus ??= 0;
  character._actionRaceCostMods ??= { apCost: {}, manaCost: {} };
  character._actionItemCostMods ??= { apCost: {}, manaCost: {} };
  character._actionItemCostModBreakdown ??= { apCost: {}, manaCost: {} };

  const attachBreakdown = (target, path) => {
    if (breakdown[path]) target.itemBreakdown = breakdown[path];
  };

  // Aktions-Kostenmodifikatoren ("actions.apCost.<tag>"/"actions.manaCost.<tag>") folgen
  // demselben Rassen-/Item-Overlay-Prinzip wie Attribute/Talente: ein Rassenbonus verschiebt
  // die "Basis" (keine eigene Zeile im Kosten-Tooltip), ein Item-Effekt bekommt eine eigene,
  // benannte Zeile (siehe documents/actor.mjs effectiveActionCostBreakdown). "all" als Tag
  // wirkt auf jede Aktion, siehe _actionTags.
  const applyActionCostMod = (resourceKey, tag, path, amount) => {
    const bucket = overlayKey === "itemBonus" ? character._actionItemCostMods : character._actionRaceCostMods;
    bucket[resourceKey][tag] = (bucket[resourceKey][tag] ?? 0) + amount;
    if (overlayKey === "itemBonus" && breakdown[path]) {
      character._actionItemCostModBreakdown[resourceKey][tag] = breakdown[path];
    }
  };

  for (const [path, amount] of Object.entries(pathBonuses)) {
    if (path.startsWith("attributes.")) {
      const key = path.slice("attributes.".length);
      const attr = character.attributes[key];
      if (attr) {
        attr[overlayKey] = (attr[overlayKey] ?? 0) + amount;
        attachBreakdown(attr, path);
      }
    } else if (path.startsWith("talents.extra.")) {
      const key = path.slice("talents.extra.".length);
      const skill = character.talents.extra[key];
      if (skill) skill.granted = true;
    } else if (path.startsWith("talents.")) {
      const sub = path.slice("talents.".length);
      const target = foundry.utils.getProperty(character.talents, sub);
      if (target) {
        target[overlayKey] = (target[overlayKey] ?? 0) + amount;
        attachBreakdown(target, path);
      }
    } else if (path.startsWith("disziplinen.")) {
      const sub = path.slice("disziplinen.".length);
      const target = foundry.utils.getProperty(character.disziplinen, sub);
      if (target) {
        target[overlayKey] = (target[overlayKey] ?? 0) + amount;
        attachBreakdown(target, path);
      }
    } else if (path.startsWith("resistances.")) {
      const key = path.slice("resistances.".length);
      if (key in character.resistancesEffective) character.resistancesEffective[key] += amount;
    } else if (path === "armor.physical" || path === "armor.magical") {
      character._armorBonus[path.slice("armor.".length)] += amount;
    } else if (path === "ac.value") {
      character._acBonus += amount;
    } else if (path === "initiative") {
      character._initiativeBonus += amount;
    } else if (path.startsWith("actions.apCost.")) {
      applyActionCostMod("apCost", path.slice("actions.apCost.".length), path, amount);
    } else if (path.startsWith("actions.manaCost.")) {
      applyActionCostMod("manaCost", path.slice("actions.manaCost.".length), path, amount);
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
 *
 * "breakdown" gruppiert dieselben Beträge zusätzlich PRO ITEM (nicht pro Effekt) unter
 * { [path]: [{name, amount}] } -- trägt ein Item mehrere Effekte auf denselben Pfad bei, zählt
 * das als EINE Zeile mit der Summe, siehe Rechen-Tooltip auf dem Bogen.
 *
 * "unlocks" sammelt "unlockAction"-Effekte separat (kein Zahlenwert, kein Pfad-Ziel im
 * pathBonuses-Sinn) als { key, itemName }-Liste -- siehe documents/actor.mjs isActionAvailable.
 */
export function resolveItemEffects(items, equippedItemIds) {
  const pathBonuses = {};
  const texts = [];
  const breakdown = {};
  const unlocks = [];

  const add = (path, amount, itemName) => {
    if (!path || !amount) return;
    pathBonuses[path] = (pathBonuses[path] ?? 0) + amount;

    const entries = (breakdown[path] ??= []);
    const existing = entries.find(e => e.name === itemName);
    if (existing) existing.amount += amount;
    else entries.push({ name: itemName, amount });
  };

  for (const item of items) {
    const isEquipped = equippedItemIds.has(item.id);
    for (const effect of item.system.effects ?? []) {
      const applies = effect.condition === "carried" || isEquipped;
      if (!applies) continue;
      if (effect.kind === "fixed") add(effect.path, effect.amount, item.name);
      else if (effect.kind === "text" && effect.text) texts.push({ name: item.name, text: effect.text });
      else if (effect.kind === "unlockAction" && effect.path) unlocks.push({ key: effect.path, itemName: item.name });
    }
  }

  return { pathBonuses, texts, breakdown, unlocks };
}
