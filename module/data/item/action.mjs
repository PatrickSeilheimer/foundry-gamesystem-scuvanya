import { SCUVANYA } from "../../config.mjs";
import { baseItemSchema } from "./base-item.mjs";
import { flagsField } from "./equipment-shared.mjs";

const fields = foundry.data.fields;

/**
 * Aktionen/Zauber -- werden NICHT pro Charakter als eingebettetes Item geführt, sondern zentral
 * im Compendium-Pack "actions" gepflegt (siehe SCUVANYA.actionCategories, module/actions/catalog.mjs).
 * Der Charakterbogen zeigt daraus gefiltert nur die Aktionen, die freigeschaltet sind (siehe
 * documents/actor.mjs isActionAvailable) -- entweder weil system.unlockConditions erfüllt ist,
 * oder weil ein Item-Effekt vom Typ "unlockAction" (siehe equipment-shared.mjs) sie unabhängig
 * davon gewährt.
 *
 * "key" identifiziert eine Aktion eindeutig für genau diesen Gewähren-Mechanismus (effect.path
 * bei kind "unlockAction" referenziert diesen Schlüssel) -- unabhängig vom Namen, damit
 * Umbenennungen den Verweis nicht brechen.
 */
export default class ActionData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      ...baseItemSchema(),

      key: new fields.StringField({ required: true, blank: true }),
      category: new fields.StringField({
        required: true, choices: Object.keys(SCUVANYA.actionCategories), initial: "talenteinsatz"
      }),
      // Freie Schlagworte zur Kostenmodifikator-Zielsuche (siehe path-resolve.mjs
      // "actions.apCost.<tag>"/"actions.manaCost.<tag>") -- z.B. "pyro", "nahkampf".
      tags: flagsField(),

      // Woher der Würfelwurf kommt (siehe SCUVANYA.actionRollSources) -- "rollPath" ist bei
      // discipline/skill/attribute der Ziel-Pfad (z.B. "disziplinen.magie.pyrokinet",
      // "talents.wissenschaften.natur.medizin", "attributes.str"); bei "weaponCategory" bleibt
      // rollPath leer, das Ziel ergibt sich dynamisch aus der ausgerüsteten Waffe.
      rollSource: new fields.StringField({
        required: true, choices: SCUVANYA.actionRollSources, initial: "none"
      }),
      rollPath: new fields.StringField({ required: false, blank: true, initial: "" }),

      costAp: new fields.NumberField({ required: true, integer: true, initial: 0, min: 0 }),
      costMana: new fields.NumberField({ required: true, integer: true, initial: 0, min: 0 }),
      // Zusätzliche Mana-Kosten PRO RUNDE, um einen andauernden Effekt aufrechtzuerhalten (z.B.
      // "6 Mana, danach 3 weitere pro Runde") -- rein informativ auf dem Tooltip, kein
      // automatischer Rundenabzug (siehe Klassenkommentar: kein Dauer-/Status-Tracking).
      manaUpkeep: new fields.NumberField({ required: true, integer: true, initial: 0, min: 0 }),

      // Freitext-Angaben zu Reichweite/Fläche/Dauer -- bewusst Freitext statt strukturierter
      // Zahlenfelder, weil aktuell keine Foundry-Canvas-Vorlage (MeasuredTemplate) automatisch
      // platziert wird; das ist reine Anzeigeinformation für Tooltip/Absprache am Tisch.
      // areaShape "" = keine Fläche (Einzelziel/Selbst). "kreis"/"linie" werden bei "Umkreis"
      // IMMER um den Wirkenden selbst zentriert (siehe Konversation), sonst an einem frei
      // wählbaren Punkt innerhalb der Reichweite.
      range: new fields.StringField({ required: false, blank: true, initial: "" }),
      areaShape: new fields.StringField({ required: false, blank: true, initial: "", choices: ["", "kreis", "linie"] }),
      areaSize: new fields.StringField({ required: false, blank: true, initial: "" }),
      duration: new fields.StringField({ required: false, blank: true, initial: "" }),

      // Rettungswurf-Attribut, das ein GETROFFENES Ziel gegen einen (noch nicht definierten)
      // Spell Save DC des Wirkenden würfeln muss, um einen aufgezwungenen Effekt (Brennend,
      // Prone, erzwungene Bewegung, ...) abzuwenden -- siehe Konversation: "Mach dafür in jeden
      // Charakter einen Spell Save DC, ich weiß nur noch nicht genau wie dieser berechnet wird."
      // Rein deklarativ/informativ (Tooltip), NICHT automatisch gewürfelt, bis die DC-Formel
      // feststeht. "" = kein Rettungswurf nötig (reiner Schaden oder rein positiver Effekt).
      savingThrow: new fields.StringField({
        required: false, blank: true, initial: "", choices: ["", ...Object.keys(SCUVANYA.attributes)]
      }),

      // Schadenswurf: entweder eine feste Formel ODER (bei Waffenangriffen) aus der aktuell
      // ausgerüsteten Waffe ausgelesen (system.damageFormula/damageType der Waffe).
      damageFormula: new fields.StringField({ required: false, blank: true, initial: "" }),
      damageType: new fields.StringField({
        required: false, blank: true, initial: "", choices: Object.keys(SCUVANYA.damageTypes)
      }),
      damageFromWeapon: new fields.BooleanField({ required: true, initial: false }),

      // Rein beschreibende Effekt-Notizen (z.B. "Ziel brennt: 1W6 Feuerschaden für 3 Züge") --
      // werden aktuell nicht automatisch mechanisch angewendet (kein Dauer-/Status-Tracking),
      // siehe Aktionen-Tooltip.
      effects: new fields.ArrayField(new fields.StringField({ required: true, blank: true })),

      // Beliebig verschachtelter UND-/ODER-Baum (siehe module/rules/conditions.mjs), als
      // Freiform-Objekt statt typisiertem Schema, weil rekursive SchemaFields in Foundry nicht
      // sauber unterstützt werden. Leer/kein "type" = immer freigeschaltet.
      unlockConditions: new fields.ObjectField({ required: false, initial: {} })
    };
  }
}
