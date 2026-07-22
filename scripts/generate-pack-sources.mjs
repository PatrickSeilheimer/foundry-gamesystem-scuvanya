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
import { DEFAULT_ACTIONS } from "./default-actions.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// Feste IDs, damit wiederholtes Generieren/Kompilieren stabile _id/_key ergibt (kein Diff-Rauschen).
const FIXED_IDS = {
  Mensch: "4gkEd32y88iHPx5C",
  Namaren: "VFDuccfmUD873qd5",
  Akmons: "Nq7ZpRt3WkX9Ld2H",
  Brooks: "Bh6VfKm2QsE8Ty4A",
  Gremnak: "Gd3RxNw7Uc5Pm1Jz",
  Nagori: "Na8KtLp4Ry6Vb2Qs",
  Kayrun: "Ky9WmXd3Ft7Hn5Lc",
  Varkesh: "Vr2ScBq8Zm4Kd6Nx",
  Kethari: "Kt5Hj3Wp9Rc7Fb1M",
  Lumithar: "Lm4Qw8Nx2Vt6Zk9R",
  Aerathi: "Ae7Tb3Km9Ws5Hd2Q",
  Corveth: "Cv6Rn2Xf8Lt4Pm9K",
  Florathi: "Fl3Zk7Bq5Nc9Ht2W",
  Therari: "Th8Mp4Vd6Kx2Rw5S",
  "Militär": "XbApaOOVVm7HJhKP",
  Wissenschaftler: "UkeLTpYDIpctUwS8",

  "[TEST] Eiserner Helm": "Eq1HmKp4Ws8Nd2Rx",
  "[TEST] Schwerer Kürass": "Eq2KrZb6Tm9Fc3Lp",
  "[TEST] Lederarmschienen": "Eq3ArWq7Nx5Hd8Vt",
  "[TEST] Beinschienen": "Eq4BnXf2Rc9Km6Zs",
  "[TEST] Wanderstiefel": "Eq5WsTb4Ld7Qm3Nk",
  "[TEST] Ohrringe der Klarheit": "Eq6OhRp8Vc2Ws5Ft",
  "[TEST] Amulett der Wachsamkeit": "Eq7AmZk3Nx6Bq9Ld",
  "[TEST] Armband der Stärke": "Eq8ArKt5Ws2Rc7Mn",
  "[TEST] Ring der Macht": "Eq9RgMp7Xf4Nd1Kw",
  "[TEST] Schwert des Kriegers": "Eq1SwKr9Tb3Vc6Zm",
  "[TEST] Schild der Standhaftigkeit": "Eq2ShSt4Nk8Wq5Rp",
  "[TEST] Zweihandschwert": "Eq3ZwHs6Md2Ft9Xc",
  "[TEST] Heiltrank": "Eq4HlTr8Kn3Wp5Zs",
  "[TEST] Dolch der Gauner": "Eq5DcGn3Rw7Kt9Mp",
  "[TEST] Kurzbogen": "Eq6KzBg8Nx4Ld2Hs",
  "[TEST] Umhang des Pyromanen": "Eq7UmPy5Tc9Wr3Fn",

  "Funkenstoß": "Ac1FkSt4Rw8Nx2Md",
  "Feuerball": "Ac2FbKr9Wt3Ls6Hn",
  "Feuerelementar beschwören": "Ac3FeBs6Xm2Rd8Tk",
  "Wall aus Stein": "Ac4WsSt7Nc3Vp5Km",
  "Wasserpeitsche": "Ac5WpHt2Bx9Rf4Ln",
  "Gegner entwaffnen": "Ac6GeEw8Md5Ks3Rt",
  "Waffenangriff": "Ac7WfAg3Tn9Lc6Hm",
  "Gezielter Schuss": "Ac8GzSc5Wk2Rn8Vd",
  "Gegner analysieren – magische Resistenzen": "Ac9GaMr4Xt7Ns2Kw",
  "Gesundheit einschätzen": "AcAGeEs6Rm3Ht9Lp",
  "Zweiter Atem": "AcBZwAt8Nc4Ws2Rk"
};

const PACK_FOR_TYPE = {
  race: "races",
  profession: "professions",
  weapon: "items",
  armor: "items",
  equipment: "items",
  consumable: "items",
  action: "actions"
};

function getSafeFilename(name) {
  return name.replace(/[^a-zA-Z0-9]/g, "_");
}

for (const entry of [...DEFAULT_ITEMS, ...DEFAULT_ACTIONS]) {
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
    flags: entry.flags ?? {},
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
