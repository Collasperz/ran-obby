var RainbowObby_ThirdPersonCamera = pc.createScript(
  "RainbowObby_ThirdPersonCamera"
);

RainbowObby_ThirdPersonCamera.attributes.add("sensitivity", {
  type: "number",
  default: 1.4,
  title: "Sensitivity",
});

RainbowObby_ThirdPersonCamera.prototype.initialize = function () {
  this.distance = parseInt(
    RainbowObby_Storage.getItem("RainbowObby_cameraDistance") || "10"
  );
  this.targetEntity = null;
  this._eulers = new pc.Vec3(-25, -90, 0);
  this.touchCoords = new pc.Vec2();

  this.app.mouse.on(pc.EVENT_MOUSEMOVE, this._onMouseMove, this);
  this.app.mouse.on(pc.EVENT_MOUSEDOWN, this._onMouseDown, this);
  this.app.mouse.on(pc.EVENT_MOUSEUP, this._onMouseUp, this);
  this.app.mouse.on(pc.EVENT_MOUSEWHEEL, this._onMouseWheel, this);
  if (this.app.touch) {
    this.app.touch.on(pc.EVENT_TOUCHSTART, this._onTouchStartEndCancel, this);
    this.app.touch.on(pc.EVENT_TOUCHEND, this._onTouchStartEndCancel, this);
    this.app.touch.on(pc.EVENT_TOUCHCANCEL, this._onTouchStartEndCancel, this);

    this.app.touch.on(pc.EVENT_TOUCHMOVE, this._onTouchMove, this);
  }

  this.app.on("camera:setTarget", this._onSetTarget, this);
  this.entity.on("destroy", () => {
    this.app.off("camera:setTarget", this._onSetTarget, this);
  });
};

RainbowObby_ThirdPersonCamera.prototype._onSetTarget = function (target) {
  this.targetEntity = target;
};

RainbowObby_ThirdPersonCamera.prototype._onTouchStartEndCancel = function (e) {
  var touch;
  if (e.touches.length === 0) return;
  if (e.touches.length === 1 || e.touches[0].x > e.touches[1].x) {
    touch = e.touches[0];
  } else {
    touch = e.touches[1];
  }

  this.touchCoords = new pc.Vec2(touch.x, touch.y);
};

RainbowObby_ThirdPersonCamera.prototype._onTouchMove = function (e) {
  if (!this.joystickBaseEntity) {
    this.joystickBaseEntity = this.app.root.findByName(
      "Left Half Touch Joystick"
    )?.children[0];
    return;
  }

  var touch;
  if (e.touches.length === 0) return;
  if (e.touches.length === 1) {
    if (this.joystickBaseEntity.enabled) {
      return;
    } else {
      touch = e.touches[0];
    }
  } else {
    if (e.touches[0].x > e.touches[1].x) {
      touch = e.touches[0];
    } else {
      touch = e.touches[1];
    }
  }

  var dx = touch.x - this.touchCoords.x;
  var dy = touch.y - this.touchCoords.y;

  this._eulers.y += this.sensitivity * 3 * -dx;
  this._eulers.x += this.sensitivity * 3 * -dy;

  this.touchCoords = new pc.Vec2(touch.x, touch.y);
};

RainbowObby_ThirdPersonCamera.prototype._onMouseMove = function (e) {
  if (pc.Mouse.isPointerLocked()) {
    this._eulers.y -= e.dx * this.sensitivity;
    this._eulers.x -= e.dy * this.sensitivity;
  }
};

RainbowObby_ThirdPersonCamera.prototype._onMouseDown = function (e) {};
RainbowObby_ThirdPersonCamera.prototype._onMouseUp = function (e) {};
RainbowObby_ThirdPersonCamera.prototype._onMouseWheel = function (e) {
  // Change distance
  this.distance -= e.wheel * 0.25;
  this.distance = pc.math.clamp(this.distance, 1, 20);
  RainbowObby_Storage.setItem("RainbowObby_cameraDistance", this.distance);
};

RainbowObby_ThirdPersonCamera.prototype.postUpdate = function (dt) {
  if (!this.targetEntity) return;

  const targetPos = this.targetEntity.getPosition();
  const eulers = this._eulers;
  const quat = new pc.Quat();

  // Clamp eulers to [-90, 90] to stop camera flipping upside down
  eulers.x = pc.math.clamp(eulers.x, -89, 89);
  eulers.z = pc.math.clamp(eulers.y, -89, 89);

  quat.setFromEulerAngles(eulers.x, eulers.y, 0);

  const rotatedPos = quat.transformVector(
    new pc.Vec3(0, 0, this.distance),
    new pc.Vec3()
  );

  const finalPos = targetPos.clone().add(rotatedPos);

  this.entity.setPosition(finalPos);
  this.entity.lookAt(targetPos);
};
