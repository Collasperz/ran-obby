var RainbowObby_CarpetOnly = pc.createScript("RainbowObby_CarpetOnly");

RainbowObby_CarpetOnly.prototype.initialize = function () {
  this.entity.enabled = false;
  const onCarpet = (value) => {
    if (!value) {
      this.entity.enabled = false;
    } else {
      this.entity.enabled = this.app.touch ? true : false;
    }
  };
  this.app.on("character:setFlyingCarpet", onCarpet);

  this.entity.on("destroy", () => {
    this.app.off("character:setFlyingCarpet", onCarpet);
  });
};
