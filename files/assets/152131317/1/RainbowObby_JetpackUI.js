var RainbowObby_JetpackUI = pc.createScript("RainbowObby_JetpackUI");

RainbowObby_JetpackUI.attributes.add("textEntity", {
  type: "entity",
  title: "Text Entity",
});

RainbowObby_JetpackUI.prototype.initialize = function () {
  this.app.on("ui:setJetpackFuel", this.onJetpackFuel, this);
  this.entity.on("destroy", () => {
    this.app.off("ui:setJetpackFuel", this.onJetpackFuel, this);
  });
  this.entity.enabled = false;
};

RainbowObby_JetpackUI.prototype.onJetpackFuel = function (fuel) {
  this.textEntity.element.text = fuel.toFixed(2) + "%";

  if (fuel === 0) {
    this.entity.enabled = false;
  } else {
    this.entity.enabled = true;
  }
};
