var RainbowObby_FakeGravity = pc.createScript("RainbowObby_FakeGravity");

RainbowObby_FakeGravity.prototype.update = function (dt) {
  this.entity.rigidbody.applyForce(0, -1000 * dt, 0);
};
