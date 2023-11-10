var RainbowObby_CloseButton = pc.createScript("RainbowObby_CloseButton");

RainbowObby_CloseButton.attributes.add("entityToHide", {
  type: "entity",
  title: "Entity To Hide",
});

RainbowObby_CloseButton.prototype.initialize = function () {
  this.entity.element.on("click", this.hide, this);
};

RainbowObby_CloseButton.prototype.hide = function () {
  this.entityToHide.enabled = false;
  RainbowObby_LockManager.popups--;
  RainbowObby_LockManager.check(this.app);
};
