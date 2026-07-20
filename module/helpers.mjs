/** Registriert zusätzliche Handlebars-Helfer, die Foundry-Core nicht mitbringt. */
export function registerHandlebarsHelpers() {
  Handlebars.registerHelper("eq", (a, b) => a === b);
  Handlebars.registerHelper("ne", (a, b) => a !== b);
  Handlebars.registerHelper("or", (...args) => args.slice(0, -1).some(Boolean));
  Handlebars.registerHelper("lt", (a, b) => a < b);
  Handlebars.registerHelper("includes", (arr, val) => Array.isArray(arr) && arr.includes(val));
  // Letztes Argument ist immer das Handlebars-Options-Objekt, muss abgeschnitten werden.
  Handlebars.registerHelper("array", (...args) => args.slice(0, -1));
}
