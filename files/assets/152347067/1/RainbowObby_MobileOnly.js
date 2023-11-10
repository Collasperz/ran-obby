var RainbowObby_MobileOnly = pc.createScript("RainbowObby_MobileOnly");

RainbowObby_MobileOnly.prototype.initialize = function () {
  if (!this.app.touch) {
    this.entity.enabled = false;
  }
};
