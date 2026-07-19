const fields = foundry.data.fields;

/** Gemeinsame Basisfelder für alle Item-Typen. */
export function baseItemSchema() {
  return {
    description: new fields.HTMLField({ required: false, blank: true })
  };
}
