/** Registriert zusätzliche Handlebars-Helfer, die Foundry-Core nicht mitbringt. */
export function registerHandlebarsHelpers() {
  Handlebars.registerHelper("eq", (a, b) => a === b);
  // Letztes Argument ist immer das Handlebars-Options-Objekt, muss abgeschnitten werden.
  Handlebars.registerHelper("array", (...args) => args.slice(0, -1));
}
