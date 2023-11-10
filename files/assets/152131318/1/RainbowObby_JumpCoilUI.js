var RainbowObby_JumpCoilUI = pc.createScript("RainbowObby_JumpCoilUI");

RainbowObby_JumpCoilUI.attributes.add("textEntity", {
  type: "entity",
  title: "Text Entity",
});

RainbowObby_JumpCoilUI.prototype.initialize = function () {
  this.app.on("ui:setJumpCoilTimer", this.onTime, this);
  this.entity.on("destroy", () => {
    this.app.off("ui:setJumpCoilTimer", this.onTime, this);
  });
  this.entity.enabled = false;
};

RainbowObby_JumpCoilUI.prototype.onTime = function (t) {
  this.textEntity.element.text = t.toFixed(1) + "s";

  if (t === 0) {
    this.entity.enabled = false;
  } else {
    this.entity.enabled = true;
  }
};
