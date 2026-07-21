/**
 * Standard-Rassen/-Berufe, die mit dem System ausgeliefert werden -- Quelle für die
 * Compendium-Packs unter packs/races und packs/professions (siehe generate-pack-sources.mjs
 * und package.json "build:packs"). Nur zur Build-Zeit genutzt, ist kein Teil des laufenden
 * Systems (die Packs selbst werden über system.json geladen, siehe scuvanya.mjs).
 *
 * Um einen Eintrag zu ändern oder zu ergänzen: hier bearbeiten, dann `npm run build:packs`
 * ausführen und die neu kompilierten packs/races bzw. packs/professions committen.
 *
 * Jedes Bündel hat "attributeStart" (feste Attributboni OHNE Namen/Beschreibung -- die sind
 * einfach da) und eine Liste "eigenschaften" (Name + Beschreibung + Boni-Liste, siehe
 * bonusBundleSchema in module/data/item/progression-shared.mjs). Wahlmöglichkeiten, die
 * zufällig ein Attribut betreffen (z.B. "wähle ein Kampfattribut"), bleiben trotzdem in
 * einer Eigenschaft, weil der Wizard dafür einen Namen zum Beschriften braucht. Boni-Pfade
 * sind relativ zu system, z.B. "attributes.mag", "talents.koerperlich.klettern",
 * "disziplinen.magie.pyrokinet". Situative/erzählerische Regeln ohne festen Zahlenwert
 * (z.B. "kein Fallschaden", "Bonus in Höhe des MAG-Mods") werden als "text"-Boni geführt,
 * weil der generische Pfad-Resolver (path-resolve.mjs) nur statische Beträge kennt.
 *
 * Bildpfade zeigen auf assets/races/<datei>, ausgeliefert unter systems/scuvanya/assets/races/
 * (siehe system.json). Rassen ohne Bild-Set (aktuell nur Therari) behalten den
 * Platzhalter aus race.mjs (icons/svg/mystery-man.svg).
 */
const ATTRIBUTE_KEYS = ["str", "dex", "con", "spd", "int", "mnd", "mag", "cha"];
const ATTRIBUTE_PATHS = ATTRIBUTE_KEYS.map(k => `attributes.${k}`);

const MAGIC_DISCIPLINE_PATHS = [
  "pyrokinet", "geomant", "hydrosoph", "aerothurg", "nekromant",
  "polymorph", "beschwoerer", "spiritualist", "schwarzmagier"
].map(k => `disziplinen.magie.${k}`);

const COMBAT_DISCIPLINE_PATHS = ["krieger", "gauner", "schuetze"].map(k => `disziplinen.kampf.${k}`);
const COMBAT_OR_MAGIC_PATHS = [...COMBAT_DISCIPLINE_PATHS, ...MAGIC_DISCIPLINE_PATHS];

const SOCIAL_ALL_PATHS = [
  ...["anfeuern", "beruhigen", "charme", "feilschen", "ueberreden"].map(k => `talents.sozial.positiv.${k}`),
  ...["beleidigen", "einschuechtern", "luegen", "manipulieren", "taeuschen"].map(k => `talents.sozial.negativ.${k}`)
];

const NATURE_SCIENCE_PATHS = [
  "botanik", "geologie", "mechanik", "medizin", "zoologie"
].map(k => `talents.wissenschaften.natur.${k}`);

const SOCIAL_SCIENCE_PATHS = [
  "geschichte", "gesellschaft", "kultur", "arkana", "theologie"
].map(k => `talents.wissenschaften.sozial.${k}`);

const SCIENCE_ALL_PATHS = [...SOCIAL_SCIENCE_PATHS, ...NATURE_SCIENCE_PATHS];

const PHYSICAL_SKILL_PATHS = [
  "klettern", "laufen", "schwimmen", "springen", "werfen"
].map(k => `talents.koerperlich.${k}`);

const CRAFT_PATHS = [
  "grobschmied", "feinschmied", "plattner", "gerber", "zimmerer",
  "weber", "alchemist", "koch", "jagen", "fischen", "verzaubern"
].map(k => `talents.handwerk.${k}`);

const RACE_IMG = (key) => `systems/scuvanya/assets/races/${key}.png`;

export const DEFAULT_ITEMS = [
  {
    name: "Mensch",
    type: "race",
    img: RACE_IMG("human_m"),
    system: {
      category: "humanoid",
      description: "<p>Menschen zeichnen sich durch eine bemerkenswerte Vielfalt aus. Sie existieren in allen Größen, Formen und Hautfarben, mit unterschiedlichen Haar- und Augenfarben sowie körperlichen Proportionen. Keine andere Spezies zeigt eine so große Bandbreite an genetischen Merkmalen, was sie als Gruppe schwer einzuordnen macht.</p><p>Sie sind von Natur aus Individualisten, auch wenn sie sich häufig in Familien, Stämmen oder Gemeinschaften organisieren. Kaum eine andere Spezies erschließt so bereitwillig neue Lebensräume oder passt sich fremden Kulturen an, während sie gleichzeitig ihre eigenen Traditionen bewahrt. Im Durchschnitt sind Menschen überall kompetent, aber selten überlegen. Ihnen fehlt die immense Stärke der Brooks, die magische Affinität der Namaren oder die wissenschaftliche Brillanz der Kethari, doch ihre Fähigkeit, in jedem Bereich zumindest mitzuhalten, macht sie zu einer äußerst widerstandsfähigen Spezies.</p><p>In der Wissenschaft sind Menschen die vielseitigsten Forscher und Gelehrten Scuvanyas. Sie integrieren neues Wissen schneller als jede andere Spezies und machen dabei keinen Unterschied, ob es von Kethari, Akmons oder Kayrun stammt. In der Architektur sind sie unübertroffen: ihre Bauwerke reichen von filigranen Kathedralen bis zu massiven Festungen und dienen ebenso der Macht- wie der Glaubensdemonstration.</p>",
      body: {
        maennlich: { heightMin: 1.40, heightMax: 2.15, weightMin: 40, weightMax: 150, muendigkeitsalter: 14, erwachsenenalter: 21, lebenserwartung: 65 },
        weiblich: { heightMin: 1.30, heightMax: 2.00, weightMin: 35, weightMax: 140, muendigkeitsalter: 15, erwachsenenalter: 20, lebenserwartung: 68 }
      },
      imageMaennlich: RACE_IMG("human_m"),
      imageWeiblich: RACE_IMG("human_w"),
      base: {
        attributeStart: { str: 1, dex: 1, con: 2, spd: 1, int: 1, mnd: 1, mag: 1, cha: 2 },
        eigenschaften: [
          {
            key: "alleskoenner",
            name: "Alleskönner",
            description: "Menschen sind in nichts die Besten, aber in allem brauchbar. Ihre Ausbildung ist breit statt tief, weshalb sie überall ein wenig Boden gutmachen.",
            boni: [
              { kind: "distribute", key: "menschAttribute", options: ATTRIBUTE_PATHS, amount: 2, perOptionMax: 0 },
              { kind: "distribute", key: "menschHandwerk", options: CRAFT_PATHS, amount: 2, perOptionMax: 0 },
              { kind: "choice", key: "menschKampfMagie", options: COMBAT_OR_MAGIC_PATHS, amount: 3 },
              { kind: "distribute", key: "menschSozial", options: SOCIAL_ALL_PATHS, amount: 4, perOptionMax: 0 },
              { kind: "distribute", key: "menschWissenschaft", options: SCIENCE_ALL_PATHS, amount: 4, perOptionMax: 0 },
              { kind: "distribute", key: "menschKoerperlich", options: PHYSICAL_SKILL_PATHS, amount: 4, perOptionMax: 0 },
              { kind: "distribute", key: "menschSonstige", options: ["talents.sonder.fingerfertigkeit", "talents.sonder.taschendiebstahl", "talents.sonder.schloesserKnacken", "talents.sonder.schleichen", "talents.sonder.spurenLesen", "talents.sonder.ueberlebenstechniken", "talents.sonder.orientierung", "talents.sonder.selbstvertrauen", "talents.sonder.konzentration", "talents.sonder.magischesGespuer", "talents.sonder.durchschauen"], amount: 4, perOptionMax: 0 },
              { kind: "text", text: "Wähle eine zusätzliche Sprache deiner Wahl auf Stufe 2 (manuell im Sprachen-Bereich eintragen)." }
            ]
          }
        ]
      }
    }
  },
  {
    name: "Namaren",
    type: "race",
    img: RACE_IMG("namaren_m"),
    system: {
      category: "humanoid",
      description: "<p>Namaren sind die kleinste humanoide Spezies. Ihr rundlicher Körperbau entwickelt sich erst nach dem 18. Lebensjahr, wenn kurze Beine und ein gedrungener Körper ihr charakteristisches, oft unterschätztes Erscheinungsbild prägen. Hinter diesem Äußeren steckt eine immense magische Kraft, denn ihrem Glauben nach liegt das Zentrum magischer Energie im Bauch. Ein wohlgenährter Namar gilt deshalb nicht nur als wohlhabend, sondern auch als magisch besonders begabt.</p><p>Namaren führen ein gemeinschaftlich orientiertes, von Neugier und Gastfreundschaft geprägtes Leben. Ihre Gesellschaft ist eine Meritokratie: Respekt wird durch Wissen und magisches Talent erworben, und ihre Städte gelten als lebendige Zentren der Lehre. Dieser Fokus auf Wissen bringt ihnen mitunter den Ruf ein, hochnäsig zu sein, doch bleiben sie pragmatisch genug, um Diplomatie und Zusammenarbeit zu schätzen.</p><p>In Wissenschaft und Magie sind Namaren unbestrittene Vorreiter. Ihre \"Arkanatoren\", Geräte zur Speicherung magischer Energie, sind weltberühmt, ebenso ihre monumentalen Bibliotheken. Die meisten Namaren sind nicht gläubig und betrachten Religion als wenig greifbar, begegnen den Glaubenspraktiken anderer Völker aber respektvoll.</p>",
      body: {
        maennlich: { heightMin: 0.90, heightMax: 1.25, weightMin: 40, weightMax: 80, muendigkeitsalter: 19, erwachsenenalter: 25, lebenserwartung: 90 },
        weiblich: { heightMin: 0.88, heightMax: 1.20, weightMin: 35, weightMax: 70, muendigkeitsalter: 15, erwachsenenalter: 23, lebenserwartung: 90 }
      },
      imageMaennlich: RACE_IMG("namaren_m"),
      imageWeiblich: RACE_IMG("namaren_w"),
      base: {
        attributeStart: { str: -1, con: 2, spd: -1, int: 4, mnd: 3, mag: 5 },
        eigenschaften: [
          {
            key: "gelehrter",
            name: "Gelehrter",
            description: "Von Kindheit an in Lesen und Schreiben unterrichtet -- Bildung ist bei den Namaren keine Frage des Standes, sondern der Erziehung.",
            boni: [
              { kind: "fixed", path: "talents.extra.lesen", amount: 1 },
              { kind: "fixed", path: "talents.extra.schreiben", amount: 1 }
            ]
          },
          {
            key: "gefaehrlicherHexer",
            name: "Gefährlicher Hexer",
            description: "Ein Blick, ein Wort, und die eigene Magie wird spürbar bedrohlich. Du erhältst einen zusätzlichen Bonus auf Einschüchtern in Höhe deines aktiven MAG-Modifiers (inklusive aller temporären und permanenten Effekte, minimal 0).",
            boni: [
              { kind: "text", text: "Bonus auf Einschüchtern = aktueller MAG-Modifier (nie negativ)." }
            ]
          },
          {
            key: "magierAkademieAbschluss",
            name: "Magier Akademie Abschluss",
            description: "Du hast den Standardabschluss einer hochangesehenen Namaren-Magie-Akademie und bist sehr versiert in einer Magiedisziplin deiner Wahl.",
            boni: [
              { kind: "choice", key: "namarenMagieDisziplin", options: MAGIC_DISCIPLINE_PATHS, amount: 3 }
            ]
          }
        ]
      }
    }
  },
  {
    name: "Akmons",
    type: "race",
    img: RACE_IMG("akmon_m"),
    system: {
      category: "humanoid",
      description: "<p>Akmons sind eine Rasse von außergewöhnlicher Anmut. Ihre makellose Haut schimmert in goldbraunen oder bronzenen Tönen, während ihre Augen in lebendigem Grün oder Blau leuchten. Athletisch gebaut und perfekt proportioniert, bewegen sie sich mit einer Selbstverständlichkeit, die sie in jeder Menge hervorstechen lässt.</p><p>Körperpflege, Fitness und Mode sind zentrale Bestandteile ihres Alltags, denn Akmons betrachten ihre äußere Erscheinung sowohl als Ausdruck ihrer Individualität als auch als Zeichen des Respekts gegenüber anderen. Ihre Gesellschaft bemisst soziale Stellung weniger nach Geburt als nach Ausstrahlung, Kreativität und Schönheit; die charismatischsten Akmons übernehmen meist repräsentative statt herrschende Rollen.</p><p>Kulturell gelten sie als Meister der Mode, Schmuckherstellung, Schauspielkunst und Poesie. Ihre Wissenschaft konzentriert sich folgerichtig auf Ästhetik, Kosmetik und magische Transformation. Für Akmons ist Schönheit keine Oberflächlichkeit, sondern ein Ausdruck innerer Balance und Stärke.</p>",
      body: {
        maennlich: { heightMin: 1.75, heightMax: 2.00, weightMin: 70, weightMax: 110, muendigkeitsalter: 18, erwachsenenalter: 20, lebenserwartung: 80 },
        weiblich: { heightMin: 1.65, heightMax: 1.80, weightMin: 68, weightMax: 100, muendigkeitsalter: 18, erwachsenenalter: 20, lebenserwartung: 80 }
      },
      imageMaennlich: RACE_IMG("akmon_m"),
      imageWeiblich: RACE_IMG("akmon_w"),
      base: {
        attributeStart: { str: 2, dex: 2, con: -1, spd: 1, int: -1, mnd: 2, mag: 2, cha: 5 },
        eigenschaften: [
          {
            key: "attraktiv",
            name: "Attraktiv",
            description: "Deine Ausstrahlung wirkt, bevor du ein Wort gesagt hast.",
            boni: [{ kind: "fixed", path: "talents.sozial.positiv.charme", amount: 6 }]
          },
          {
            key: "perfekteGenetik",
            name: "Perfekte Genetik",
            description: "Dein athletischer, makelloser Körperbau macht dir nahezu jede körperliche Übung leichter als anderen.",
            boni: [
              { kind: "fixed", path: "talents.koerperlich.klettern", amount: 1 },
              { kind: "fixed", path: "talents.koerperlich.laufen", amount: 1 },
              { kind: "fixed", path: "talents.koerperlich.schwimmen", amount: 1 },
              { kind: "fixed", path: "talents.koerperlich.springen", amount: 1 },
              { kind: "fixed", path: "talents.koerperlich.werfen", amount: 1 }
            ]
          },
          {
            key: "eleganterAuftritt",
            name: "Eleganter Auftritt",
            description: "Dein Auftreten wirkt selbst in fremden Gesellschaften einnehmend und geschliffen.",
            boni: [{ kind: "fixed", path: "talents.sozial.positiv.ueberreden", amount: 3 }]
          },
          {
            key: "redner",
            name: "Redner",
            description: "Rhetorik und gesellschaftliches Gespür wurden dir praktisch in die Wiege gelegt. Verteile 8 Punkte auf soziale Talente (maximal 4 pro Talent).",
            boni: [{ kind: "distribute", key: "akmonRedner", options: SOCIAL_ALL_PATHS, amount: 8, perOptionMax: 4 }]
          }
        ]
      }
    }
  },
  {
    name: "Brooks",
    type: "race",
    img: RACE_IMG("brooks_m"),
    system: {
      category: "humanoid",
      description: "<p>Brooks sind eine beeindruckend große und stämmige Spezies mit außergewöhnlicher Körperkraft und Widerstandsfähigkeit. Ihre Gliedmaßen sind dicker und muskulöser als die anderer humanoider Rassen, ergänzt durch einen kurzen, kräftigen Hals und breite Schultern. Ihre kurzen Beine machen sie langsam, doch ihre Ausdauer ist außergewöhnlich: Brooks können stunden- oder gar nächtelang arbeiten, ohne zu ermüden.</p><p>Ihr auffälligstes Merkmal ist ein Wachstum, das praktisch nie endet. Nach dem 30. Lebensjahr verlangsamt es sich zwar, hört aber bis ins hohe Alter nie ganz auf, weshalb ein Brooks streng genommen nie vollständig ausgewachsen ist. Damit einher geht eine bemerkenswerte Regenerationsfähigkeit: Brooks heilen schnell, und selbst schwere Wunden hinterlassen selten Narben.</p><p>Ihre Gesellschaft kennt keine festen Hierarchien und betont Zusammenarbeit sowie die Gleichwertigkeit aller Berufe, auch wenn Brooks von anderen Völkern oft vorschnell auf die Rolle des Lastenträgers reduziert werden. Tatsächlich zeigt sich ihr Talent ebenso in stiller, filigraner Kunst wie in beeindruckender Medizin: Ihr Ziel ist es, die Grenzen der Sterblichkeit zu verschieben, nicht aus Angst vor dem Tod, sondern aus dem Wunsch, Wissen über Generationen hinweg weiterzugeben.</p>",
      body: {
        maennlich: { heightMin: 1.90, heightMax: 2.35, weightMin: 140, weightMax: 220, muendigkeitsalter: 20, erwachsenenalter: 100, lebenserwartung: 100 },
        weiblich: { heightMin: 1.92, heightMax: 2.40, weightMin: 140, weightMax: 240, muendigkeitsalter: 20, erwachsenenalter: 100, lebenserwartung: 100 }
      },
      imageMaennlich: RACE_IMG("brooks_m"),
      imageWeiblich: RACE_IMG("brooks_w"),
      base: {
        attributeStart: { str: 4, dex: -1, con: 5, spd: -1, int: 2, mnd: 3 },
        eigenschaften: [
          {
            key: "hyperaktiveZellregeneration",
            name: "Hyperaktive Zellregeneration",
            description: "Dein Körper heilt mit außergewöhnlicher Geschwindigkeit: Heilung durch Rasten wirkt bei dir dreifach. Dein extremer Stoffwechsel verlangt dafür 2 Rationen Nahrung pro Tag statt einer.",
            boni: [{ kind: "text", text: "Heilung durch Rasten x3, benötigt 2 Rationen Nahrung/Tag." }]
          },
          {
            key: "lebenderRammbock",
            name: "Lebender Rammbock",
            description: "Wenn du dich mit voller Wucht in Bewegung setzt, ist es schwer, dich aufzuhalten. Läufst du vor einem physischen Angriff mindestens 3 Felder auf dein Ziel zu, verursacht dein Angriff 1W6 Bonusschaden.",
            boni: [{ kind: "text", text: "Anlauf von mind. 3 Feldern vor einem physischen Angriff: +1W6 Bonusschaden." }]
          },
          {
            key: "schwerfaellig",
            name: "Schwerfällig",
            description: "Deine enorme Masse setzt deinen Körper nur langsam in Bewegung.",
            boni: [{ kind: "fixed", path: "initiative", amount: -3 }]
          },
          {
            key: "standhafteVitalitaet",
            name: "Standhafte Vitalität",
            description: "Deine körperliche Widerstandskraft schützt dich vor schwächenden Effekten.",
            boni: [{ kind: "text", text: "+2 auf Konstitutionswürfe gegen Statuseffekte." }]
          }
        ]
      }
    }
  },
  {
    name: "Gremnak",
    type: "race",
    img: RACE_IMG("gremnak_m"),
    system: {
      category: "reptilian",
      description: "<p>Gremnak gelten als das Drachenvolk und weisen den größten Geschlechterunterschied aller Völker Scuvanyas auf. Männer sind groß, kräftig und überdurchschnittlich schuppenbedeckt, mit langem Hals und animalischen Gesichtszügen. Frauen sind deutlich kleiner, schmächtiger und humaner, dafür aber intelligenter und magisch begabter als ihre männlichen Artgenossen. Ihre schuppige Haut schützt beide Geschlechter vor physischem Schaden und Witterungseinflüssen.</p><p>Ihr Leben folgt strengen, von Tradition geprägten Ritualen. Männer übernehmen körperliche Arbeit und Verteidigung, Frauen die Pflege der Magie und die Kindererziehung. Ihre Gesellschaft ist hierarchisch, doch die Hierarchie gründet ebenso auf Wissen wie auf Stärke: An der Spitze jeder Gemeinde steht ein Anführer, beraten von den weisesten Frauen und stärksten Männern.</p><p>Ihre Entstehung ist ein dunkles Kapitel: Gremnak gehen auf das Kaelth&#39;mari-Fusionsritual des Magiers Xaelthar zurück, der Menschen und gefangene Drachen zu einer neuen, mächtigeren Spezies verschmelzen wollte, um sich eine Armee zu schaffen. Die Verschmolzenen rebellierten gegen ihren Schöpfer und flohen in die Wildnis. Über Jahrhunderte formte die Isolation die Gremnak zu einem eigenständigen Volk, das die Erinnerung an seine Erschaffung bewusst verschweigt, aus Furcht vor dem Fluch ihres Ursprungs.</p>",
      body: {
        maennlich: { heightMin: 1.85, heightMax: 2.20, weightMin: 110, weightMax: 200, muendigkeitsalter: 13, erwachsenenalter: 16, lebenserwartung: 58 },
        weiblich: { heightMin: 1.45, heightMax: 1.68, weightMin: 45, weightMax: 64, muendigkeitsalter: 13, erwachsenenalter: 13, lebenserwartung: 65 }
      },
      imageMaennlich: RACE_IMG("gremnak_m"),
      imageWeiblich: RACE_IMG("gremnak_w"),
      base: {
        eigenschaften: [
          {
            key: "schuetzendeSchuppen",
            name: "Schützende Schuppen",
            description: "Robuste Hautschuppen bedecken Teile deines Körpers, gleich welchen Geschlechts.",
            boni: [{ kind: "fixed", path: "armor.physical", amount: 1 }]
          }
        ]
      },
      maennlich: {
        attributeStart: { str: 5, dex: 2, con: 3, spd: 2, mag: 2, cha: -2 },
        eigenschaften: [
          {
            key: "zumKriegerErzogen",
            name: "Zum Krieger erzogen",
            description: "Männliche Gremnak werden von früher Kindheit an auf den Krieg vorbereitet.",
            boni: [
              { kind: "fixed", path: "disziplinen.kampf.krieger", amount: 4 },
              { kind: "choice", key: "gremnakKriegerMagie", options: ["disziplinen.magie.pyrokinet", "disziplinen.magie.geomant", "disziplinen.magie.aerothurg"], amount: 2 }
            ]
          }
        ]
      },
      weiblich: {
        attributeStart: { str: -1, dex: 2, con: -1, spd: 1, int: 2, mnd: 4, mag: 4, cha: 1 },
        eigenschaften: [
          {
            key: "heilendeHaende",
            name: "Heilende Hände",
            description: "Die natürliche Begabung weiblicher Gremnak erlaubt es dir, heilende Lichtmagie zu kanalisieren (abgebildet über die Disziplin Spiritualist).",
            boni: [
              { kind: "fixed", path: "disziplinen.magie.spiritualist", amount: 3 },
              { kind: "fixed", path: "talents.wissenschaften.natur.medizin", amount: 4 }
            ]
          }
        ]
      }
    }
  },
  {
    name: "Nagori",
    type: "race",
    img: RACE_IMG("nagori_m"),
    system: {
      category: "amphibian",
      description: "<p>Nagori sind humanoide Wesen mit einer ausgeprägten Vier-Augen-Struktur: ein großes und ein kleines Augenpaar. Die kleinen, seitlich sitzenden Augen bieten ein breites Sichtfeld zur Bewegungserkennung, die großen zentralen Augen ermöglichen scharfe Detailsicht und exzellentes Sehen bei Dunkelheit. Ihr amphibisches Erbe zeigt sich in flachen Nasen, flossenartigen Ohren und fehlender Körperbehaarung; durch erhöhte Blutzirkulation können sie zudem nach Belieben Schwimmhäute ausbilden. Magische Begabung ist unter ihnen selten.</p><p>Sie siedeln bevorzugt an Flussufern, Sümpfen und Küsten und leben von Fisch, Meeresfrüchten sowie Ackerbau. Ihre Gesellschaft basiert auf flachen Hierarchien und einer Konsensdemokratie: Jede Stimme zählt gleich, und Entscheidungen werden in offenen Versammlungen getroffen. Diese respektvolle, inklusive Grundhaltung prägt auch ihren Umgang mit anderen Völkern.</p><p>Ihre Forschung konzentriert sich auf die Unterwasserwelt sowie Alchemie und Heilkunde. Kulturell sind Wettkämpfe und Feste zentral, allen voran das jährliche Erntefest. Die Nagori sind zudem ein zutiefst gläubiges, polytheistisches Volk: Beinahe jede Alltagshandlung ist einer eigenen Gottheit gewidmet.</p>",
      body: {
        maennlich: { heightMin: 1.45, heightMax: 1.90, weightMin: 56, weightMax: 90, muendigkeitsalter: 9, erwachsenenalter: 9, lebenserwartung: 40 },
        weiblich: { heightMin: 1.45, heightMax: 1.88, weightMin: 49, weightMax: 84, muendigkeitsalter: 9, erwachsenenalter: 9, lebenserwartung: 42 }
      },
      imageMaennlich: RACE_IMG("nagori_m"),
      imageWeiblich: RACE_IMG("nagori_w"),
      base: {
        attributeStart: { str: 1, dex: 4, con: 1, spd: 3, mnd: 5, mag: -1, cha: -1 },
        eigenschaften: [
          {
            key: "vieraeugig",
            name: "Vieräugig",
            description: "Dein zweites Augenpaar liefert dir eine Rundumwahrnehmung, die kaum eine Bewegung übersieht.",
            boni: [{ kind: "fixed", path: "talents.spezial.sehen", amount: 3 }]
          },
          {
            key: "schwimmhaeute",
            name: "Schwimmhäute",
            description: "Auf Kommando bilden sich zwischen deinen Fingern und Zehen feine Schwimmhäute.",
            boni: [{ kind: "fixed", path: "talents.koerperlich.schwimmen", amount: 4 }]
          },
          {
            key: "wasserfilm",
            name: "Wasserfilm",
            description: "Ein feiner, natürlicher Schleimfilm schützt deine Haut vor Wasserschaden.",
            boni: [{ kind: "fixed", path: "resistances.wasser", amount: 50 }]
          }
        ]
      },
      subraces: [
        {
          key: "pelagori",
          name: "Pelagori",
          bonuses: {
            attributeStart: { spd: 1, mag: -1 },
            eigenschaften: [
              {
                key: "wassernatur",
                name: "Wassernatur",
                description: "Diese Linie lebt überwiegend an Küsten, Flussdeltas und auf Inseln im offenen Meer und bewegt sich im Wasser so mühelos wie an Land.",
                boni: [
                  { kind: "fixed", path: "talents.koerperlich.schwimmen", amount: 4 },
                  { kind: "text", text: "Kein Bewegungsmalus im Wasser." }
                ]
              },
              {
                key: "apexPredatorPelagori",
                name: "Apex Predator",
                description: "Die See ist deine Speisekammer.",
                boni: [{ kind: "fixed", path: "talents.handwerk.fischen", amount: 4 }]
              }
            ]
          }
        },
        {
          key: "saurori",
          name: "Saurori",
          bonuses: {
            attributeStart: { str: 2, dex: -1, con: 1, spd: -2 },
            eigenschaften: [
              {
                key: "schuppenhaut",
                name: "Schuppenhaut",
                description: "Diese im Landesinneren und in warmen Sümpfen entwickelte Unterart trägt einen kräftigeren, robusteren Körper mit verhärteter Haut.",
                boni: [{ kind: "fixed", path: "armor.physical", amount: 1 }]
              },
              {
                key: "apexPredatorSaurori",
                name: "Apex Predator",
                description: "Im dichten Unterholz der Sümpfe bist du der geborene Jäger.",
                boni: [{ kind: "fixed", path: "talents.handwerk.jagen", amount: 2 }]
              }
            ]
          }
        }
      ]
    }
  },
  {
    name: "Kayrun",
    type: "race",
    img: RACE_IMG("kayrun_m"),
    system: {
      category: "celestial",
      description: "<p>Kayrun sind eine kleinwüchsige Spezies, bei der es kaum äußerliche Unterschiede zwischen den Geschlechtern gibt: Männer und Frauen sind gleich stark, gleich magisch begabt und einander in der Körperform ähnlich, selbst die Fähigkeit zu säugen besitzen beide. Ihre Fortpflanzung ist einzigartig, denn aus Verbindungen reiner Kayrun-Paare entstehen stets Zwillinge, ein Junge und ein Mädchen, die magisch miteinander verbunden sind und ihre Kräfte im gemeinsamen Einsatz erheblich verstärken.</p><p>Ihre Gesellschaft ist stark familienorientiert und kennt keine Geschlechterrollen; Aufgaben werden allein nach individuellen Stärken und Vorlieben verteilt. Wissenschaftlich sind Kayrun in Medizin und Magie weit vorangeschritten und teilen ihre Erkenntnisse bereitwillig mit anderen Völkern, was ihnen hohes Ansehen als Forschungspartner einbringt.</p><p>Kulturell gelten Kayrun als herausragende Astronomen und Astrologen. Schon jungen Kayrun wird beigebracht, Sternbilder zu deuten, deren duale Bedeutung sie tief mit der Vorstellung der eigenen Zwillingsnatur verknüpfen. In der Kunst gelten sie eher als durchschnittlich; ihre Stärke liegt in Wissenschaft und sozialem Zusammenhalt.</p>",
      body: {
        maennlich: { heightMin: 1.15, heightMax: 1.78, weightMin: 42, weightMax: 80, muendigkeitsalter: 16, erwachsenenalter: 19, lebenserwartung: 110 },
        weiblich: { heightMin: 1.13, heightMax: 1.74, weightMin: 42, weightMax: 80, muendigkeitsalter: 16, erwachsenenalter: 19, lebenserwartung: 112 }
      },
      imageMaennlich: RACE_IMG("kayrun_m"),
      imageWeiblich: RACE_IMG("kayrun_w"),
      base: {
        attributeStart: { str: -1, dex: 2, spd: 2, int: 2, mnd: 3, mag: 5, cha: -1 },
        eigenschaften: [
          {
            key: "gabeDerVerbundenheit",
            name: "Gabe der Verbundenheit",
            description: "Durch die Zeit mit deinem Zwilling habt ihr gelernt, magische Kraft aufeinander zu übertragen. Du erlernst die Aktion \"Mana übertragen\" ohne die sonst dafür nötige Freischaltbedingung (Aktionen folgen in einem späteren Ausbau).",
            boni: [{ kind: "text", text: "Schaltet die Aktion \"Mana übertragen\" ohne die übliche Voraussetzung frei." }]
          },
          {
            key: "sternenkarte",
            name: "Sternenkarte",
            description: "Sterne sind für dich lesbar wie eine Landkarte.",
            boni: [{ kind: "fixed", path: "talents.sonder.orientierung", amount: 6 }]
          },
          {
            key: "kooperativ",
            name: "Kooperativ",
            description: "Gemeinsam seid ihr mehr als die Summe eurer Teile: Gruppenproben, an denen mehr als nur dieser Charakter beteiligt ist (inklusive Gruppenangriffe oder gemeinschaftliche Zauber), erhalten +2.",
            boni: [{ kind: "text", text: "+2 auf Gruppenproben (Gruppenangriffe, gemeinschaftliche Zauber etc.)." }]
          }
        ]
      }
    }
  },
  {
    name: "Varkesh",
    type: "race",
    img: RACE_IMG("varkesh_m"),
    system: {
      category: "infernal",
      description: "<p>Varkesh sind eine infernale humanoide Spezies, deren Erscheinung unweigerlich an Dämonen alter Legenden erinnert: rötliche bis dunkelrote Haut, Hörner in unterschiedlichsten Formen und ein langer, beweglicher Schwanz, den viele instinktiv zum Greifen oder zur Betonung ihrer Körpersprache nutzen. Trotz dieses Erscheinungsbilds sind Varkesh biologisch vollständig sterblich und besitzen keine tatsächliche Verbindung zu infernalen Mächten.</p><p>Aufgrund historischer Verfolgung gründen Varkesh nur selten eigene Siedlungen und leben stattdessen meist innerhalb fremder Städte, wo sie sich geschickt in bestehende soziale Strukturen einfügen. Ihre Gemeinschaften bestehen aus losen, über mehrere Städte verstreuten Familiennetzwerken, die auf persönlichen Beziehungen und Loyalität beruhen. Viele bevorzugen Berufe als Händler, Vermittler oder Informanten, was ihnen den nicht immer gerechtfertigten Ruf notorischer Kriminalität einbringt.</p><p>Kulturell ist die Rhetorik zentral: Wortgefechte, Verhandlungen und subtile Manipulation gelten als Ausdruck von Intelligenz. Ihre religiösen Ansichten reichen von der Verehrung alter Dämonengötter bis zur strikten Ablehnung jeder Verbindung zu infernalen Mächten.</p>",
      body: {
        maennlich: { heightMin: 1.50, heightMax: 1.90, weightMin: 49, weightMax: 98, muendigkeitsalter: 15, erwachsenenalter: 23, lebenserwartung: 150 },
        weiblich: { heightMin: 1.48, heightMax: 1.88, weightMin: 49, weightMax: 84, muendigkeitsalter: 16, erwachsenenalter: 24, lebenserwartung: 150 }
      },
      imageMaennlich: RACE_IMG("varkesh_m"),
      imageWeiblich: RACE_IMG("varkesh_w"),
      base: {
        attributeStart: { dex: 3, con: -1, int: 2, mnd: 2, mag: 2, cha: 4 },
        eigenschaften: [
          {
            key: "daemonischePraesenz",
            name: "Dämonische Präsenz",
            description: "Dein Auftreten wirkt gleichermaßen einschüchternd wie faszinierend.",
            boni: [
              { kind: "fixed", path: "talents.sozial.negativ.einschuechtern", amount: 3 },
              { kind: "fixed", path: "talents.sozial.positiv.charme", amount: 3 }
            ]
          },
          {
            key: "heissbluetig",
            name: "Heißblüter",
            description: "Deine erhöhte Körpertemperatur dämpft sowohl sengende Hitze als auch beißende Kälte.",
            boni: [
              { kind: "fixed", path: "resistances.feuer", amount: 25 },
              { kind: "fixed", path: "resistances.eis", amount: 25 }
            ]
          },
          {
            key: "teufelAufDerSchulter",
            name: "Teufel auf der Schulter",
            description: "Du weißt genau, welchen Knopf du bei wem drücken musst.",
            boni: [
              { kind: "fixed", path: "talents.sozial.negativ.manipulieren", amount: 2 },
              { kind: "fixed", path: "talents.sozial.positiv.ueberreden", amount: 2 }
            ]
          },
          {
            key: "bewandertImUntergrund",
            name: "Bewandert im Untergrund",
            description: "Die Grauzonen der Gesellschaft sind dir vertrauter als den meisten lieb wäre.",
            boni: [
              { kind: "fixed", path: "talents.wissenschaften.sozial.gesellschaft", amount: 2 },
              { kind: "fixed", path: "talents.sonder.taschendiebstahl", amount: 4 }
            ]
          },
          {
            key: "schweif",
            name: "Schweif",
            description: "Dein beweglicher Schweif kann selbst dann noch greifen und werfen, wenn beide Hände bereits ausgerüstet sind.",
            boni: [{ kind: "text", text: "Kann Gegenstände greifen/werfen, auch wenn beide Hände ausgerüstet sind." }]
          },
          {
            key: "scharfsinnigVarkesh",
            name: "Scharfsinnig",
            description: "Kaum eine Lüge entgeht deinem geschulten Blick.",
            boni: [{ kind: "fixed", path: "talents.sonder.durchschauen", amount: 4 }]
          }
        ]
      },
      subraces: [
        {
          key: "ashkari",
          name: "Ashkari",
          bonuses: {
            attributeStart: { dex: -1, con: 2, mag: 1, cha: -2 },
            eigenschaften: [
              {
                key: "flammengeboren",
                name: "Flammengeboren",
                description: "Ascheblütige Varkesh, in Wüsten und Vulkanregionen entwickelt: Feuer ist für dich fast ein Zuhause, Kälte trifft dich dafür härter.",
                boni: [
                  { kind: "fixed", path: "resistances.feuer", amount: 75 },
                  { kind: "fixed", path: "resistances.eis", amount: -25 }
                ]
              },
              {
                key: "pyromane",
                name: "Pyromane",
                description: "Die Flamme gehorcht dir wie ein zweites Werkzeug.",
                boni: [{ kind: "fixed", path: "disziplinen.magie.pyrokinet", amount: 4 }]
              }
            ]
          }
        },
        {
          key: "umbrari",
          name: "Umbrari",
          bonuses: {
            attributeStart: { dex: 1, spd: 3, mag: -1, cha: -3 },
            eigenschaften: [
              {
                key: "schattengeboren",
                name: "Schattengeboren",
                description: "Schattenblütige Varkesh, über Generationen im Untergrund dicht besiedelter Städte geformt.",
                boni: [
                  { kind: "fixed", path: "disziplinen.kampf.gauner", amount: 4 },
                  { kind: "fixed", path: "talents.sonder.schleichen", amount: 6 }
                ]
              },
              {
                key: "beschaffer",
                name: "Beschaffer",
                description: "Verschlossene Türen sind für dich eher eine Einladung als ein Hindernis.",
                boni: [
                  { kind: "fixed", path: "talents.sonder.taschendiebstahl", amount: 2 },
                  { kind: "fixed", path: "talents.sonder.schloesserKnacken", amount: 4 }
                ]
              },
              {
                key: "trickbetrueger",
                name: "Trickbetrüger",
                description: "Mit flinken Fingern und einer noch flinkeren Zunge kommst du meist unbemerkt davon.",
                boni: [
                  { kind: "fixed", path: "talents.sonder.fingerfertigkeit", amount: 6 },
                  { kind: "fixed", path: "talents.sozial.negativ.taeuschen", amount: 4 }
                ]
              }
            ]
          }
        },
        {
          key: "oratori",
          name: "Oratori",
          bonuses: {
            attributeStart: { dex: -2, int: 1, mnd: 1, mag: -1, cha: 1 },
            eigenschaften: [
              {
                key: "teufelOderEngel",
                name: "Teufel oder Engel",
                description: "Silberzungen, die ihr volles Potential aus der Kommunikation schöpfen und je nach Ziel zu den besten oder den schlechtesten Beratern werden. Wähle wahlweise einen Bonus auf Überreden oder Manipulieren.",
                boni: [{ kind: "choice", key: "oratoriTeufelOderEngel", options: ["talents.sozial.positiv.ueberreden", "talents.sozial.negativ.manipulieren"], amount: 6 }]
              },
              {
                key: "augeFuersDetail",
                name: "Auge fürs Detail",
                description: "Kein Zögern, kein Blinzeln entgeht dir.",
                boni: [
                  { kind: "fixed", path: "talents.spezial.sehen", amount: 1 },
                  { kind: "fixed", path: "talents.sonder.durchschauen", amount: 2 }
                ]
              }
            ]
          }
        }
      ]
    }
  },
  {
    name: "Kethari",
    type: "race",
    img: RACE_IMG("kethari_m"),
    system: {
      category: "insectoid",
      description: "<p>Kethari sind eine insectoide Spezies mit einem widerstandsfähigen, chitinartigen Exoskelett, das sie vor Verletzungen und Umwelteinflüssen schützt. Trotz dieser robusten Hülle sind sie überraschend leicht und beweglich. Ihr auffälligstes Merkmal sind individuell geformte Knochenplatten auf dem Kopf, die innerhalb ihrer Kultur als Ausdruck der Identität gelten. Ihre großen, facettenartigen Augen und ihr außergewöhnliches Nervensystem verleihen ihnen ein nahezu perfektes Gedächtnis: Durch meditative Techniken können sie vergangene Erlebnisse mit erstaunlicher Genauigkeit erneut durchleben, was sie zu außergewöhnlichen Historikern und Chronisten macht.</p><p>Ihr Leben ist ruhig, strukturiert und von Disziplin, Wissen und Handwerkskunst geprägt. Die Webkunst nimmt darin eine zentrale Rolle ein: Ihre Textilien gehören zu den feinsten der bekannten Welt und dienen zugleich als kulturelle Archive, deren Muster Geschichten oder mathematische Prinzipien symbolisieren. Kethari sind grundsätzlich friedliebend, vermeiden Konflikte und gelten in Mathematik, Physik und Astronomie als bedeutende Denker.</p><p>Ihr rund 140-jähriges Leben verläuft in klar definierten Phasen, vom sorglosen Kindesalter über das Erwachen und das Studium bis zum jahrzehntelangen Aufstieg im gewählten Beruf, gefolgt von Besinnung und schließlich der Weisheit, in der sie als Berater und Lehrer wirken.</p>",
      body: {
        maennlich: { heightMin: 1.28, heightMax: 1.80, weightMin: 40, weightMax: 66, muendigkeitsalter: 20, erwachsenenalter: 14, lebenserwartung: 140 },
        weiblich: { heightMin: 1.28, heightMax: 1.80, weightMin: 40, weightMax: 66, muendigkeitsalter: 20, erwachsenenalter: 14, lebenserwartung: 140 }
      },
      imageMaennlich: RACE_IMG("kethari_m"),
      imageWeiblich: RACE_IMG("kethari_w"),
      base: {
        attributeStart: { str: 1, dex: 2, con: 3, int: 5, mnd: 2, cha: -1 },
        eigenschaften: [
          {
            key: "fotografischesGedaechtnis",
            name: "Fotografisches Gedächtnis",
            description: "Durch Meditation kannst du eine beliebige Erinnerung erneut in nahezu hundertprozentiger Präzision durchleben. Rein erzählerische, RP-lastige Eigenschaft ohne Zahlenwert.",
            boni: [{ kind: "text", text: "Kann jede eigene Erinnerung meditativ in voller Präzision durchleben (rein narrativ)." }]
          },
          {
            key: "exoskelettKethari",
            name: "Exoskelett",
            description: "Dein hartes Exoskelett bedeckt den gesamten Körper und wehrt Treffer ab, die andere verletzen würden.",
            boni: [{ kind: "fixed", path: "armor.physical", amount: 2 }]
          },
          {
            key: "weberKultur",
            name: "Weber Kultur",
            description: "Das Weben ist dir seit Kindheitstagen vertraut, feine Fasern zu komplexen, langlebigen Geweben zu verarbeiten.",
            boni: [{ kind: "fixed", path: "talents.handwerk.weber", amount: 3 }]
          },
          {
            key: "gelehrterKethari",
            name: "Gelehrter",
            description: "Bildung ist für Kethari selbstverständlich, Lesen und Schreiben gehören zu ihrer frühesten Erziehung.",
            boni: [
              { kind: "fixed", path: "talents.extra.lesen", amount: 1 },
              { kind: "fixed", path: "talents.extra.schreiben", amount: 1 }
            ]
          }
        ]
      }
    }
  },
  {
    name: "Lumithar",
    type: "race",
    img: RACE_IMG("lumi_m"),
    system: {
      category: "insectoid",
      description: "<p>Lumithar sind eine insectoide Spezies mit schlankem Körperbau und einem leichteren, flexibleren Exoskelett als andere Insektenvölker, was ihnen eine geschmeidige und präzise Bewegung ermöglicht. Ihr markantestes Merkmal ist die Biolumineszenz: Entlang Armen, Rücken und Gesicht besitzen sie lichtemittierende Organe, die in Kombination mit kräftigen Kieferklauen eine komplexe, für andere Spezies kaum entzifferbare Sprache aus Lichtmustern und Klicklauten ergeben.</p><p>Lumithar fühlen sich vor allem in großen Gemeinschaften wohl. Ihre Städte bestehen nicht aus einzelnen Gebäuden, sondern wachsen organisch zu einem zusammenhängenden Netzwerk aus Kammern, Tunneln und offenen Bereichen zusammen, sowohl unterirdisch als auch an Bäumen und natürlichen Formationen der Oberfläche. Loyalität gegenüber der eigenen Kolonie steht bei ihnen über individuellen Interessen, auch wenn jeder Lumithar seine eigene Persönlichkeit behält.</p><p>Ihre größte Stärke liegt weniger in theoretischer Forschung als in praktischer, gemeinschaftlicher Problemlösung, besonders im Verständnis für strukturelle Stabilität und Holzverarbeitung. Bei Festen erzeugen Gruppen von Lumithar synchronisierte Lichtmuster, die wie lebendige Lichtwellen wirken, ein sichtbarer Ausdruck ihres Glaubens an das große Ganze, dem jede Gemeinschaft angehört.</p>",
      body: {
        maennlich: { heightMin: 1.00, heightMax: 1.62, weightMin: 35, weightMax: 66, muendigkeitsalter: 4, erwachsenenalter: 4, lebenserwartung: 28 },
        weiblich: { heightMin: 1.00, heightMax: 1.62, weightMin: 35, weightMax: 66, muendigkeitsalter: 4, erwachsenenalter: 4, lebenserwartung: 28 }
      },
      imageMaennlich: RACE_IMG("lumi_m"),
      imageWeiblich: RACE_IMG("lumi_w"),
      base: {
        attributeStart: { str: 3, dex: 3, con: 3, spd: -1, mnd: 3, mag: 3, cha: -2 },
        eigenschaften: [
          {
            key: "exoskelettLumithar",
            name: "Exoskelett",
            description: "Auch dein leichteres Exoskelett bietet spürbaren Schutz vor Treffern.",
            boni: [{ kind: "fixed", path: "armor.physical", amount: 2 }]
          },
          {
            key: "alternativeSpracheLumithar",
            name: "Alternative Sprache",
            description: "Durch Lichtmuster und Klicklaute kannst du mit anderen Lumithar kommunizieren. Diese Kommunikation ist für andere Spezies praktisch unmöglich zu verstehen.",
            boni: [{ kind: "text", text: "Eigene, für andere Spezies unverständliche Kommunikation via Licht/Klicklaute (optional als Sprache \"Lumithar\" führbar)." }]
          },
          {
            key: "schwarmgeist",
            name: "Schwarmgeist",
            description: "Im Verbund mit anderen agierst du spürbar sicherer.",
            boni: [{ kind: "text", text: "+2 auf Proben, die eine Zusammenarbeit mit einem Verbündeten beinhalten." }]
          }
        ]
      }
    }
  },
  {
    name: "Aerathi",
    type: "race",
    img: RACE_IMG("aerathi_m"),
    system: {
      category: "avian",
      description: "<p>Aerathi sind eine aviane Spezies mit leichtem Körperbau und hohlen Knochen, die ihnen bemerkenswerte Beweglichkeit und Ausdauer verleihen. Ihr teilweise gefiederter Körper variiert stark in Menge und Farbe des Gefieders, von schlichten Braun- und Grautönen bis zu seltenen, farbenprächtigen Federkleidern. Verlängerte Federstrukturen an den Armen erlauben ihnen, kurze Strecken zu gleiten und Stürze fast folgenlos abzufangen, echter Flug bleibt ihnen jedoch verwehrt.</p><p>Als nomadisches Volk errichten Aerathi selten dauerhafte Städte. Stattdessen ziehen sie in Karawanen über große Distanzen, manchmal zwischen Kontinenten, und schlagen unterwegs temporäre Lager auf oder wohnen zeitweise in den Städten anderer Völker. Als vielseitige Händler, Boten und Informationsvermittler verfügen sie über ein außergewöhnlich dichtes Netzwerk an Kontakten, wodurch sie oft besser über Weltgeschehen informiert sind als viele sesshafte Völker.</p><p>Ihre Kultur lebt von Geschichten, Musik und dem Austausch von Eindrücken aus aller Welt. Viele Aerathi betrachten das Reisen selbst als spirituelle Erfahrung, bei der jede Begegnung und jede neue Landschaft Teil eines größeren Lebenswegs ist.</p>",
      body: {
        maennlich: { heightMin: 1.24, heightMax: 1.92, weightMin: 48, weightMax: 90, muendigkeitsalter: 12, erwachsenenalter: 16, lebenserwartung: 104 },
        weiblich: { heightMin: 1.21, heightMax: 1.85, weightMin: 44, weightMax: 84, muendigkeitsalter: 12, erwachsenenalter: 16, lebenserwartung: 101 }
      },
      imageMaennlich: RACE_IMG("aerathi_m"),
      imageWeiblich: RACE_IMG("aerathi_w"),
      base: {
        attributeStart: { str: -1, dex: 2, con: 3, spd: 5, mag: -1, cha: 4 },
        eigenschaften: [
          {
            key: "gleitfluegelAerathi",
            name: "Gleitflügel",
            description: "Deine Federn und deine leichte Körperstruktur bremsen jeden Fall ab: Du erleidest keinen Fallschaden und kannst sehr kurze Strecken gleiten.",
            boni: [{ kind: "text", text: "Kein Fallschaden, kann sehr kurze Strecken gleiten." }]
          },
          {
            key: "ausgepraegtesNetzwerk",
            name: "Ausgeprägtes Netzwerk",
            description: "Dein weitreichendes Netzwerk an Kontakten öffnet dir Türen und Preise, die anderen verschlossen bleiben.",
            boni: [
              { kind: "fixed", path: "talents.sozial.positiv.ueberreden", amount: 2 },
              { kind: "fixed", path: "talents.sozial.positiv.feilschen", amount: 2 }
            ]
          },
          {
            key: "weltenbummlerAerathi",
            name: "Weltenbummler",
            description: "Ein Leben auf Reisen hat dir ein untrügliches Gespür für Wege, Kulturen und Karten vermittelt.",
            boni: [
              { kind: "fixed", path: "talents.sonder.orientierung", amount: 6 },
              { kind: "fixed", path: "talents.wissenschaften.sozial.kultur", amount: 3 },
              { kind: "fixed", path: "talents.extra.kartenLesen", amount: 1 }
            ]
          }
        ]
      },
      subraces: [
        {
          key: "karavathi",
          name: "Karavathi",
          bonuses: {
            attributeStart: { str: 2, con: 2, spd: -3, cha: -1 },
            eigenschaften: [
              {
                key: "allesSchonGesehen",
                name: "Alles schon gesehen",
                description: "Ewig reisende Nomaden, denen kaum ein Ort oder eine Sitte noch fremd ist.",
                boni: [
                  { kind: "fixed", path: "talents.sonder.orientierung", amount: 4 },
                  { kind: "fixed", path: "talents.wissenschaften.sozial.gesellschaft", amount: 4 },
                  { kind: "fixed", path: "talents.wissenschaften.sozial.kultur", amount: 3 }
                ]
              },
              {
                key: "weltbewandert",
                name: "Weltbewandert",
                description: "Auf ihren endlosen Reisen sammeln die Karavathi Wissen aus jedem Winkel der Welt.",
                boni: [
                  { kind: "fixed", path: "talents.wissenschaften.sozial.theologie", amount: 4 },
                  { kind: "fixed", path: "talents.wissenschaften.sozial.arkana", amount: 4 },
                  { kind: "fixed", path: "talents.wissenschaften.sozial.geschichte", amount: 4 }
                ]
              },
              {
                key: "wildnisbewohnerKaravathi",
                name: "Wildnisbewohner",
                description: "Das Leben abseits fester Städte hat sie überlebenstüchtig und handwerklich vielseitig gemacht.",
                boni: [
                  { kind: "fixed", path: "talents.sonder.ueberlebenstechniken", amount: 3 },
                  { kind: "choice", key: "karavathiHandwerk", options: CRAFT_PATHS, amount: 2 }
                ]
              }
            ]
          }
        },
        {
          key: "mercadia",
          name: "Mercadia",
          bonuses: {
            attributeStart: {},
            eigenschaften: [
              {
                key: "sonderpreise",
                name: "Sonderpreise",
                description: "Händler und Kuriere, die aus jedem Handel das Beste herausholen.",
                boni: [{ kind: "fixed", path: "talents.sozial.positiv.feilschen", amount: 4 }]
              },
              {
                key: "schnellreise",
                name: "Schnellreise",
                description: "Reittiere und Kutschen sind für Mercadia-Händler Alltagswerkzeug.",
                boni: [
                  { kind: "fixed", path: "talents.extra.reiten", amount: 1 },
                  { kind: "fixed", path: "talents.extra.kutscheFahren", amount: 1 }
                ]
              }
            ]
          }
        }
      ]
    }
  },
  {
    name: "Corveth",
    type: "race",
    img: RACE_IMG("corveth_m"),
    system: {
      category: "avian",
      description: "<p>Corveth sind eine aviane Spezies mit schlankem, leichtem Körperbau, deren Federkleid vollständig oder größtenteils schwarz ist und je nach Individuum matt, glänzend oder leicht bläulich schimmert. Ihre scharfen, ausdrucksstarken Gesichtszüge mit leicht schnabelartiger Nase bleiben humanoid genug, um problemlos zu sprechen. Ihre großen, aufmerksamen Augen mit ungewöhnlichen Farbvariationen wie Silber, Gelb oder Violett verleihen ihnen einen durchdringenden, von anderen oft als unangenehm empfundenen Blick. Wie andere aviane Völker können sie mit federartigen Armstrukturen ihren Fall abbremsen und kurze Strecken gleiten.</p><p>Corveth sind überwiegend Einzelgänger, die sich in Städten als Händler, Sammler, Informanten oder gelegentlich Trickbetrüger bewegen. Viele entwickeln eine tiefe Faszination für seltene Gegenstände und Artefakte, eine Sammelleidenschaft, die als Ausdruck von Intelligenz und Individualität gilt. Respekt wird unter ihnen durch Einfallsreichtum, geschickte Verhandlungen und elegante, subtile Methoden erworben, während plumpe Gewalt als ungeschickt gilt.</p><p>Wissenschaftlich widmen sich Corveth meist individuellen Studien zu Magie und alten Artefakten, besonders zu unauffälligen, präzisen Zaubern wie Illusionen und mentaler Beeinflussung. Für viele von ihnen ist Wissen selbst die höchste Form von Macht.</p>",
      body: {
        maennlich: { heightMin: 1.24, heightMax: 1.92, weightMin: 48, weightMax: 90, muendigkeitsalter: 12, erwachsenenalter: 16, lebenserwartung: 104 },
        weiblich: { heightMin: 1.21, heightMax: 1.85, weightMin: 44, weightMax: 84, muendigkeitsalter: 12, erwachsenenalter: 16, lebenserwartung: 101 }
      },
      imageMaennlich: RACE_IMG("corveth_m"),
      imageWeiblich: RACE_IMG("corveth_w"),
      base: {
        attributeStart: { str: -1, dex: 5, con: -1, spd: 2, int: 4, mnd: 2, mag: 1 },
        eigenschaften: [
          {
            key: "scharfsinnigCorveth",
            name: "Scharfsinnig",
            description: "Dein durchdringender Blick durchschaut die meisten Täuschungsversuche.",
            boni: [{ kind: "fixed", path: "talents.sonder.durchschauen", amount: 4 }]
          },
          {
            key: "meisterDerTaeuschung",
            name: "Meister der Täuschung",
            description: "Lügen kommen dir so leicht über die Lippen wie die Wahrheit.",
            boni: [
              { kind: "fixed", path: "talents.sozial.negativ.luegen", amount: 2 },
              { kind: "fixed", path: "talents.sozial.negativ.taeuschen", amount: 2 }
            ]
          },
          {
            key: "adlerauge",
            name: "Adlerauge",
            description: "Kaum ein Detail entgeht deinem geschulten Blick aus der Ferne.",
            boni: [{ kind: "fixed", path: "talents.spezial.sehen", amount: 2 }]
          },
          {
            key: "gleitfluegelCorveth",
            name: "Gleitflügel",
            description: "Deine Federn und leichte Körperstruktur bremsen jeden Fall ab: Du erleidest keinen Fallschaden und kannst sehr kurze Strecken gleiten.",
            boni: [{ kind: "text", text: "Kein Fallschaden, kann sehr kurze Strecken gleiten." }]
          }
        ]
      },
      subraces: [
        {
          key: "lorveth",
          name: "Lor'veth",
          bonuses: {
            attributeStart: { dex: -1, int: 1 },
            eigenschaften: [
              {
                key: "buecherwurm",
                name: "Bücherwurm",
                description: "Wissenssammler, die kaum eine Bibliothek auslassen.",
                boni: [
                  { kind: "fixed", path: "talents.extra.lesen", amount: 1 },
                  { kind: "fixed", path: "talents.extra.schreiben", amount: 1 }
                ]
              },
              {
                key: "gelehrtLorveth",
                name: "Gelehrt",
                description: "Geschichte und arkanes Wissen sind ihre bevorzugten Sammelgebiete.",
                boni: [
                  { kind: "fixed", path: "talents.wissenschaften.sozial.geschichte", amount: 8 },
                  { kind: "fixed", path: "talents.wissenschaften.sozial.arkana", amount: 4 }
                ]
              }
            ]
          }
        },
        {
          key: "noxveth",
          name: "Nox'veth",
          bonuses: {
            attributeStart: { int: -1, cha: 1 },
            eigenschaften: [
              {
                key: "meisterdieb",
                name: "Meisterdieb",
                description: "Spione und Informanten, die sich lautlos durch jede Stadt bewegen.",
                boni: [
                  { kind: "fixed", path: "talents.sonder.taschendiebstahl", amount: 4 },
                  { kind: "fixed", path: "talents.sonder.schleichen", amount: 6 }
                ]
              },
              {
                key: "trickbetruegerNoxveth",
                name: "Trickbetrüger",
                description: "Ihre flinken Finger und ihre noch flinkere Zunge machen sie zu gefährlichen Gegnern in jeder Verhandlung.",
                boni: [
                  { kind: "fixed", path: "talents.sonder.fingerfertigkeit", amount: 6 },
                  { kind: "fixed", path: "talents.sozial.negativ.taeuschen", amount: 4 }
                ]
              }
            ]
          }
        },
        {
          key: "aureveth",
          name: "Aure'veth",
          bonuses: {
            attributeStart: {},
            eigenschaften: [
              {
                key: "sammlerAureveth",
                name: "Sammler",
                description: "Glanzsammler, die für ein seltenes Stück jedes Schloss knacken und jeden Preis verhandeln.",
                boni: [
                  { kind: "fixed", path: "talents.sonder.schloesserKnacken", amount: 4 },
                  { kind: "fixed", path: "talents.sozial.positiv.feilschen", amount: 4 },
                  { kind: "fixed", path: "talents.spezial.sehen", amount: 2 },
                  { kind: "fixed", path: "talents.sonder.spurenLesen", amount: 4 }
                ]
              },
              {
                key: "ganzBesondereItems",
                name: "Ganz besondere Items",
                description: "Ein untrügliches Gespür führt sie stets zum wertvollsten Stück im Raum.",
                boni: [
                  { kind: "fixed", path: "talents.sonder.magischesGespuer", amount: 3 },
                  { kind: "fixed", path: "talents.wissenschaften.sozial.arkana", amount: 3 }
                ]
              }
            ]
          }
        },
        {
          key: "morveth",
          name: "Mor'veth",
          bonuses: {
            attributeStart: { dex: -2, mag: 3, cha: -1 },
            eigenschaften: [
              {
                key: "mystikerMorveth",
                name: "Mystiker",
                description: "Mystische Nebelkrähen, die sich abseits der Städte den arkanen Künsten widmen.",
                boni: [
                  { kind: "fixed", path: "talents.wissenschaften.sozial.arkana", amount: 6 },
                  { kind: "choice", key: "morvethMagieDisziplin", options: MAGIC_DISCIPLINE_PATHS, amount: 3 }
                ]
              },
              {
                key: "waldbewohnerMorveth",
                name: "Waldbewohner",
                description: "In der Wildnis abseits der Städte fühlen sich Mor'veth am wohlsten.",
                boni: [{ kind: "fixed", path: "talents.sonder.ueberlebenstechniken", amount: 5 }]
              }
            ]
          }
        }
      ]
    }
  },
  {
    name: "Florathi",
    type: "race",
    img: RACE_IMG("flora_m"),
    system: {
      category: "floral",
      description: "<p>Florathi sind eine florale Spezies mit pflanzenähnlicher Biologie: Ihre Haut aus faserigem, flexiblem Gewebe zeigt grüne, bräunliche oder rötliche Töne, und aus ihrem Kopf wächst eine Blüte, deren Form und Farbe je nach Familie stark variiert. Diese Blüten drücken familiäre Herkunft und Emotionen zugleich aus, unter anderem über Duftstoffe. Da ihr Körper Sonnenlicht über eine pflanzenähnliche Photosynthese in Energie umwandelt, verbringen Florathi gern längere Zeit ruhend in der Sonne, und über wurzelähnliches Nervengewebe in den Füßen nehmen sie feine Bodenvibrationen in ihrer Umgebung wahr.</p><p>Sie leben bevorzugt in offenen, sonnigen Landschaften und meiden dunkle oder unterirdische Regionen. Ihre Gesellschaft gliedert sich in Blütenfamilien mit eigenen kulturellen Schwerpunkten, von den ästhetisch orientierten Rosenfamilien über die meditativen Lavendelfamilien bis zu den widerstandsfähigen Distelfamilien und den spirituell geprägten Lotusfamilien. Konflikte zwischen den Familien sind selten, da sich alle Florathi als Teil einer gemeinsamen Gemeinschaft verstehen.</p><p>Wissenschaftlich sind sie führend in Pflanzenkunde, Duftstoffen und Parfümherstellung; ihre Parfums gelten als die komplexesten Duftkompositionen der Welt und werden mitunter gezielt eingesetzt, um Emotionen und Erinnerungen zu beeinflussen. Ihre Weltanschauung dreht sich um das Gleichgewicht der Natur und den Kreislauf von Wachstum, Verfall und Erneuerung.</p>",
      body: {
        maennlich: { heightMin: 1.10, heightMax: 2.05, weightMin: 29, weightMax: 88, muendigkeitsalter: 12, erwachsenenalter: 16, lebenserwartung: 104 },
        weiblich: { heightMin: 1.10, heightMax: 2.05, weightMin: 29, weightMax: 88, muendigkeitsalter: 12, erwachsenenalter: 16, lebenserwartung: 101 }
      },
      imageMaennlich: RACE_IMG("flora_m"),
      imageWeiblich: RACE_IMG("flora_w"),
      base: {
        attributeStart: { con: 3, spd: -2, int: 3, mnd: 3, mag: 4, cha: 1 },
        eigenschaften: [
          {
            key: "selbststudiumFlorathi",
            name: "Selbststudium",
            description: "Pflanzenkunde ist dir buchstäblich in die Wurzeln gelegt, ebenso ein natürliches Gespür für erdverbundene Magie.",
            boni: [
              { kind: "fixed", path: "talents.wissenschaften.natur.botanik", amount: 10 },
              { kind: "fixed", path: "disziplinen.magie.geomant", amount: 2 }
            ]
          },
          {
            key: "verwurzelt",
            name: "Verwurzelt",
            description: "Bei direktem Bodenkontakt nimmst du im Umkreis von 10 Metern alles wahr, was sich auf dem Boden bewegt. Durch Meditation lässt sich die Reichweite steigern, wobei du währenddessen auf Sehen und Hören verzichtest.",
            boni: [{ kind: "text", text: "Erspürt Bewegung am Boden im Umkreis von 10m bei Bodenkontakt; per Meditation erweiterbar (verzichtet dabei auf Sehen/Hören)." }]
          },
          {
            key: "alternativeSpracheFlorathi",
            name: "Alternative Sprache",
            description: "Du kannst durch Düfte mit anderen Florathi kommunizieren. Diese Kommunikation ist für andere Spezies praktisch unmöglich zu verstehen.",
            boni: [{ kind: "text", text: "Eigene, für andere Spezies unverständliche Kommunikation über Düfte." }]
          },
          {
            key: "sonneTanken",
            name: "Sonne tanken",
            description: "Rastest du im direkten Sonnenlicht, erhältst du die dreifache Menge HP, Mana und mentaler Gesundheit zurück.",
            boni: [{ kind: "text", text: "Rasten in direktem Sonnenlicht heilt HP/Mana/mentale Gesundheit x3." }]
          },
          {
            key: "reinigendeMineralien",
            name: "Reinigende Mineralien",
            description: "Dein Körper reinigt sich beständig selbst und macht dich widerstandsfähiger gegen Gifte.",
            boni: [{ kind: "fixed", path: "resistances.gift", amount: 50 }]
          },
          {
            key: "pflanzlicheHerkunft",
            name: "Pflanzliche Herkunft",
            description: "Wasser nährt dich, Feuer bedroht dich mehr als andere Völker.",
            boni: [
              { kind: "fixed", path: "resistances.wasser", amount: 50 },
              { kind: "fixed", path: "resistances.feuer", amount: -50 }
            ]
          }
        ]
      },
      subraces: [
        {
          key: "rosaris",
          name: "Rosaris",
          bonuses: {
            attributeStart: { str: 1, int: -1, mnd: -1, mag: -2, cha: 3 },
            eigenschaften: [
              {
                key: "duftnote",
                name: "Duftnote",
                description: "Florathi Rosaris tragen eine Rosenblüte am Kopf: Schönheit, Charisma und Eleganz in Person.",
                boni: [
                  { kind: "fixed", path: "talents.sozial.positiv.charme", amount: 2 },
                  { kind: "fixed", path: "talents.sozial.positiv.ueberreden", amount: 2 }
                ]
              }
            ]
          }
        },
        {
          key: "lotaris",
          name: "Lotaris",
          bonuses: {
            attributeStart: { str: -1, mag: 1 },
            eigenschaften: [
              {
                key: "heilerLotaris",
                name: "Heiler",
                description: "Florathi Lotaris tragen eine Lotusblüte am Kopf: spirituelle Heiler, versiert in Meditation und Magie.",
                boni: [
                  { kind: "fixed", path: "talents.wissenschaften.natur.medizin", amount: 5 },
                  { kind: "fixed", path: "disziplinen.magie.spiritualist", amount: 3 }
                ]
              }
            ]
          }
        },
        {
          key: "lavaris",
          name: "Lavaris",
          bonuses: {
            attributeStart: { str: -1, con: -2, int: 1, mnd: 1, cha: 1 },
            eigenschaften: [
              {
                key: "beruhigendePraesenz",
                name: "Beruhigende Präsenz",
                description: "Florathi Lavaris tragen eine Lavendelblüte am Kopf: eine beruhigende Persönlichkeit, oft als Alchemisten und Parfümeure tätig.",
                boni: [{ kind: "fixed", path: "talents.sozial.positiv.beruhigen", amount: 4 }]
              },
              {
                key: "kraeuterkundiger",
                name: "Kräuterkundiger",
                description: "Ihr Gespür für Kräuter und Essenzen macht sie zu geschickten Alchemisten.",
                boni: [{ kind: "fixed", path: "talents.handwerk.alchemist", amount: 3 }]
              }
            ]
          }
        },
        {
          key: "helioris",
          name: "Helioris",
          bonuses: {
            attributeStart: { con: 1, int: -1, mnd: 1, mag: -2, cha: 1 },
            eigenschaften: [
              {
                key: "optimist",
                name: "Optimist",
                description: "Florathi Helioris tragen eine Sonnenblume am Kopf: optimistisch und voller Energie.",
                boni: [
                  { kind: "fixed", path: "talents.sozial.positiv.anfeuern", amount: 2 },
                  { kind: "fixed", path: "talents.sozial.positiv.charme", amount: 2 }
                ]
              },
              {
                key: "sonnenanbeter",
                name: "Sonnenanbeter",
                description: "Ihre Verbundenheit zur Sonne zeigt sich auch in ihrer Magie.",
                boni: [{ kind: "fixed", path: "disziplinen.magie.pyrokinet", amount: 3 }]
              }
            ]
          }
        },
        {
          key: "quercaris",
          name: "Quercaris",
          bonuses: {
            attributeStart: { str: 3, con: 2, int: -2, mnd: -1, mag: -2 },
            eigenschaften: [
              {
                key: "rinde",
                name: "Rinde",
                description: "Florathi Quercaris tragen eine Art verzweigte Baumkrone auf dem Kopf: hart gesotten, stabil und oft groß und breit gebaut.",
                boni: [
                  { kind: "fixed", path: "armor.physical", amount: 2 },
                  { kind: "fixed", path: "armor.magical", amount: 2 }
                ]
              }
            ]
          }
        },
        {
          key: "dionaris",
          name: "Dionaris",
          bonuses: {
            attributeStart: { str: 3, dex: 1, con: 1, spd: 2, int: -2, mnd: -2, mag: -3 },
            eigenschaften: [
              {
                key: "furchteinfloessend",
                name: "Furchteinflößend",
                description: "Florathi Dionaris tragen keine Blüte, sondern Zacken und Zähne an mehreren Körperstellen: die fleischfressende Art der Florathi.",
                boni: [{ kind: "fixed", path: "talents.sozial.negativ.einschuechtern", amount: 6 }]
              }
            ]
          }
        },
        {
          key: "mycelio",
          name: "Mycelio",
          bonuses: {
            attributeStart: { con: -1, mnd: 1, mag: 1, cha: -1 },
            eigenschaften: [
              {
                key: "giftMycelio",
                name: "Gift",
                description: "Florathi Mycelio tragen weder Blüten noch Blätter, sondern sind pilzartig gewachsen und praktisch immun gegen jedes Toxin.",
                boni: [
                  { kind: "fixed", path: "resistances.gift", amount: 100 },
                  { kind: "text", text: "Immun gegen den Status \"vergiftet\"." }
                ]
              }
            ]
          }
        }
      ]
    }
  },
  {
    name: "Therari",
    type: "race",
    system: {
      category: "bestial",
      description: "<p>Therari sind eine bestiale humanoide Spezies, deren Körperbau größtenteils dem der Menschen ähnelt, ergänzt um deutliche tierische Merkmale: Ohren, Schwänze, Hörner, Fellbereiche, Krallen oder besondere Augenformen, mal einzeln, mal in Kombination. Jeder Therari trägt die Prägung eines bestimmten Tieres in sich, von wolfsähnlichen Individuen mit ausgeprägtem Rudelinstinkt über unabhängige, katzenähnliche Charaktere bis zu ruhigen, bärenähnlichen Handwerkern. Trotz dieser Vielfalt bleiben Therari vollständig humanoid in ihrer Anatomie und nutzen Werkzeuge, Waffen und Kleidung wie jede andere Spezies.</p><p>Eine einheitliche Therari-Gesellschaft existiert kaum, ihre Kultur und Lebensweise ist so vielfältig wie ihre tierischen Abstammungen. Was fast alle verbindet, ist der Stolz auf ihre tierische Herkunft: Ihre Eigenschaften gelten nicht als Makel, sondern als Teil ihrer Identität, und Bemerkungen darüber werden meist als Anerkennung verstanden statt als Beleidigung.</p><p>Da Werte und Boni der Therari je nach Blutlinie stark variieren, sind Körpermaße, Alter und Attribute hier bewusst nicht fest vorgegeben. Die SL legt gemeinsam mit der spielenden Person eine balancierte Ausprägung passend zum gewählten Tier fest; die untenstehenden Werte dienen nur als neutraler Startpunkt.</p>",
      body: {
        maennlich: { heightMin: 1.20, heightMax: 2.10, weightMin: 40, weightMax: 140, muendigkeitsalter: 14, erwachsenenalter: 20, lebenserwartung: 70 },
        weiblich: { heightMin: 1.20, heightMax: 2.10, weightMin: 40, weightMax: 140, muendigkeitsalter: 14, erwachsenenalter: 20, lebenserwartung: 70 }
      },
      base: {
        eigenschaften: [
          {
            key: "blutlinienVielfalt",
            name: "Blutlinien-Vielfalt",
            description: "Ohne feste Startattribute gleichen Therari ihre Blutlinie über frei verteilbare Punkte aus. In Absprache mit der SL kann hier abweichend eine passgenauere, auf das gewählte Tier zugeschnittene Verteilung vereinbart werden.",
            boni: [
              { kind: "distribute", key: "therariAttribute", options: ATTRIBUTE_PATHS, amount: 12, perOptionMax: 0 },
              { kind: "distribute", key: "therariSozial", options: SOCIAL_ALL_PATHS, amount: 4, perOptionMax: 0 },
              { kind: "distribute", key: "therariWissenschaft", options: SCIENCE_ALL_PATHS, amount: 4, perOptionMax: 0 },
              { kind: "distribute", key: "therariKoerperlich", options: PHYSICAL_SKILL_PATHS, amount: 4, perOptionMax: 0 }
            ]
          }
        ]
      }
    }
  },
  {
    name: "Militär",
    type: "profession",
    system: {
      description: "<p>Ausbildung an Waffen, Erste Hilfe im Feld und die Fähigkeit, Widerstand zu brechen.</p>",
      attributeStart: { con: 2 },
      eigenschaften: [
        {
          key: "kampfausbildung",
          name: "Kampfausbildung",
          description: "Drill und Felderfahrung stärken Erste-Hilfe-Kenntnisse und Durchsetzungsvermögen.",
          boni: [
            { kind: "fixed", path: "talents.wissenschaften.natur.medizin", amount: 2 },
            { kind: "fixed", path: "talents.sozial.negativ.einschuechtern", amount: 4 }
          ]
        },
        {
          key: "kampfschwerpunkt",
          name: "Kampfschwerpunkt",
          description: "Wähle ein Kampfattribut, das durch die Ausbildung geschärft wurde.",
          boni: [
            { kind: "choice", key: "kampfattribut", options: ["attributes.str", "attributes.dex", "attributes.mag"], amount: 1 }
          ]
        },
        {
          key: "koerperlicheEignung",
          name: "Körperliche Eignung",
          description: "Wähle ein körperliches Talent, das im Dienst besonders trainiert wurde.",
          boni: [
            { kind: "choice", key: "koerperlichesTalent", options: PHYSICAL_SKILL_PATHS, amount: 5 }
          ]
        }
      ]
    }
  },
  {
    name: "Wissenschaftler",
    type: "profession",
    system: {
      description: "<p>Systematische Bildung in Naturwissenschaften und methodischem Denken.</p>",
      attributeStart: { int: 2, mnd: 1 },
      eigenschaften: [
        {
          key: "wissenschaftlicheBildung",
          name: "Wissenschaftliche Bildung",
          description: "Jahrelange akademische Ausbildung schärft die Konzentrationsfähigkeit.",
          boni: [
            { kind: "fixed", path: "talents.sonder.konzentration", amount: 6 }
          ]
        },
        {
          key: "fachgebiet",
          name: "Fachgebiet",
          description: "Wähle ein Naturwissenschaftstalent als Spezialgebiet.",
          boni: [
            { kind: "choice", key: "naturwissenschaft", options: NATURE_SCIENCE_PATHS, amount: 8 }
          ]
        }
      ]
    }
  }
];
