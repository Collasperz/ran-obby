var RainbowObby_SpeedBootsUI = pc.createScript("RainbowObby_SpeedBootsUI");

RainbowObby_SpeedBootsUI.attributes.add("textEntity", {
  type: "entity",
  title: "Text Entity",
});

RainbowObby_SpeedBootsUI.prototype.initialize = function () {
  this.app.on("ui:setBootsTimer", this.onTime, this);
  this.entity.on("destroy", () => {
    this.app.off("ui:setBootsTimer", this.onTime, this);
  });
  this.entity.enabled = false;
};

RainbowObby_SpeedBootsUI.prototype.onTime = function (t) {
  this.textEntity.element.text = t.toFixed(1) + "s";

  if (t === 0) {
    this.entity.enabled = false;
  } else {
    this.entity.enabled = true;
  }
};
