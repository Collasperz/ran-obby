var RainbowObby_RewardedOffer = pc.createScript("RainbowObby_RewardedOffer");

RainbowObby_RewardedOffer.attributes.add("type", {
  type: "string",
  enum: [
    { Coil: "coil" },
    { Totem: "totem" },
    { Jetpack: "jetpack" },
    { Boots: "boots" },
  ],
  title: "Type",
});

RainbowObby_RewardedOffer.attributes.add("isFree", {
  type: "boolean",
  title: "Is Free?",
});

RainbowObby_RewardedOffer.prototype.initialize = function () {
  this.app.on("respawn", this.onRespawn, this);
  this.entity.on("destroy", () => {
    this.app.off("respawn", this.onRespawn, this);
  });

  this.entity.collision.on("triggerenter", (result) => {
    if (!result.script) return;
    if (!result.script.RainbowObby_CharacterController) return;
    if (!result.script.RainbowObby_CharacterController.isLocalPlayer) return;

    this.app.fire("rewarded:" + this.type, this.isFree, this.entity);
  });

  this.entity.collision.on("triggerleave", (result) => {
    if (!result.script) return;
    if (!result.script.RainbowObby_CharacterController) return;
    if (!result.script.RainbowObby_CharacterController.isLocalPlayer) return;

    this.app.fire("rewarded:hide");
  });
};

RainbowObby_RewardedOffer.prototype.onRespawn = function () {
  this.entity.enabled = true;
};
