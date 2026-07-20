/**
 * Wandelt DEFAULT_ITEMS aus default-content.mjs in vollständige Compendium-Quelldateien um
 * (packs/_source/<pack>/<name>.json), die anschließend per `npm run build:packs` (fvtt CLI) zu
 * den ausgelieferten LevelDB-Packs unter packs/<pack>/ kompiliert werden. Nur zur Build-Zeit
 * genutzt, läuft nicht im System selbst.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DEFAULT_ITEMS } from "./default-content.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// Feste IDs, damit wiederholtes Generieren/Kompilieren stabile _id/_key ergibt (kein Diff-Rauschen).
const FIXED_IDS = {
  Mensch: "4gkEd32y88iHPx5C",
  Namaren: "VFDuccfmUD873qd5",
  "Militär": "XbApaOOVVm7HJhKP",
  Wissenschaftler: "UkeLTpYDIpctUwS8"
};

const PACK_FOR_TYPE = { race: "races", profession: "professions" };

function getSafeFilename(name) {
  return name.replace(/[^a-zA-Z0-9]/g, "_");
}

for (const entry of DEFAULT_ITEMS) {
  const id = FIXED_IDS[entry.name];
  if (!id) throw new Error(`Keine feste ID für "${entry.name}" hinterlegt -- in FIXED_IDS ergänzen.`);

  const doc = {
    _id: id,
    _key: `!items!${id}`,
    name: entry.name,
    type: entry.type,
    img: entry.img ?? "icons/svg/mystery-man.svg",
    system: entry.system,
    effects: [],
    folder: null,
    sort: 0,
    ownership: { default: 0 },
    flags: {},
    _stats: {
      systemId: "scuvanya",
      systemVersion: "0.1.0",
      coreVersion: "14",
      createdTime: null,
      modifiedTime: null,
      lastModifiedBy: null,
      duplicateSource: null
    }
  };

  const pack = PACK_FOR_TYPE[entry.type];
  const dir = path.join(ROOT, "packs", "_source", pack);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${getSafeFilename(entry.name)}_${id}.json`);
  fs.writeFileSync(file, JSON.stringify(doc, null, 2) + "\n");
  console.log(`Geschrieben: ${path.relative(ROOT, file)}`);
}
