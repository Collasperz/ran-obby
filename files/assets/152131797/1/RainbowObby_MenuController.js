var RainbowObby_MenuController = pc.createScript("RainbowObby_MenuController");

RainbowObby_MenuController.attributes.add("menu", {
  type: "entity",
  title: "Menu",
});

RainbowObby_MenuController.attributes.add("closeButton", {
  type: "entity",
  title: "Close Button",
});

RainbowObby_MenuController.attributes.add("openButton", {
  type: "entity",
  title: "Open Button",
});

RainbowObby_MenuController.prototype.initialize = function () {
  this.didFirstClick = false;
  this._t = 0;
  this.app.mouse.on("mousedown", () => {
    if (!this.didFirstClick) {
      this.didFirstClick = true;
    }
  });

  this.openButton.element.on("click", () => {
    if (!this.menu.enabled) {
      this.openMenu();
    } else {
      this.closeMenu();
    }
  });
};

RainbowObby_MenuController.prototype.update = function (dt) {
  if (!this.didFirstClick) return;

  if (pc.platform.touch)
    return;

  // If pointer lock is not enabled and we don't have any popups open, show the menu
  if (!pc.Mouse.isPointerLocked()) {
    if (RainbowObby_LockManager.popups === 0) {
      this._t += dt;
      if (this._t >= 0.1) {
        console.log(
          "Pointer lock not enabled and no popups open for 100ms, showing menu"
        );
        this.openMenu();
      }
    } else {
      this._t = 0;
    }
  } else if (this.menu.enabled) {
    this._t = 0;
    console.log("Pointer lock enabled but settings menu open, closing menu");
    this.closeMenu();
  }
};

RainbowObby_MenuController.prototype.openMenu = function () {
  PokiSDK.gameplayStop();
  RainbowObby_LockManager.popups++;
  RainbowObby_LockManager.check(this.app);
  this.menu.enabled = true;

  // Disable close button for 1 second
  this.closeButton.enabled = false;
  setTimeout(() => {
    this.closeButton.enabled = true;
  }, 1000);
};

RainbowObby_MenuController.prototype.closeMenu = function () {
  PokiSDK.gameplayStart();
  RainbowObby_LockManager.popups--;
  RainbowObby_LockManager.check(this.app);
  this.menu.enabled = false;
};
