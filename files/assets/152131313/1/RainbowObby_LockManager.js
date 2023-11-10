var RainbowObby_LockManager = pc.createScript("RainbowObby_LockManager");

RainbowObby_LockManager.popups = 0;
RainbowObby_LockManager.check = (app) => {
  if (RainbowObby_LockManager.popups > 0) {
    console.log(
      "popups open - disabling pointer lock",
      RainbowObby_LockManager.popups
    );
    app.mouse.disablePointerLock();
    return;
  }
  console.log("no popups open - enabling pointer lock");
  app.mouse.enablePointerLock();
  setTimeout(() => {
    app.mouse.enablePointerLock();
  }, 100);
};

RainbowObby_LockManager.prototype.initialize = function () {
  // on mouse down
  const onMouseDown = () => {
    if (RainbowObby_LockManager.popups > 0) {
      console.log(
        "mouse down but popups open - disabling pointer lock",
        RainbowObby_LockManager.popups
      );
      this.app.mouse.disablePointerLock();
      return;
    }
    console.log("mouse down and no popups open - enabling pointer lock");
    this.app.mouse.enablePointerLock();
  };
  this.app.mouse.on("mousedown", onMouseDown);

  this.entity.on("destroy", () => {
    RainbowObby_LockManager.popups = 0;
    this.app.mouse.off("mousedown", onMouseDown);
  });
};
