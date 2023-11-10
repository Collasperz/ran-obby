var RainbowObby_RotatingThing = pc.createScript("RainbowObby_RotatingThing");

RainbowObby_RotatingThing.prototype.update = function (dt) {
  this.entity.rotate(0, 360 * dt, 0);
};
