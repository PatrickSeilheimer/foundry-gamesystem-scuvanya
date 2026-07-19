export default class ScuvanyaItem extends Item {
  async roll() {
    if (this.type === "weapon") return this._rollWeapon();
    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `<h3>${this.name}</h3>${this.system.description ?? ""}`
    });
  }

  async _rollWeapon() {
    const roll = new Roll(this.system.damageFormula, this.actor?.getRollData() ?? {});
    await roll.evaluate();
    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: `${this.name} - Schaden`
    });
    return roll;
  }
}
