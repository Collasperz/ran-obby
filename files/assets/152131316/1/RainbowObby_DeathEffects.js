var RainbowObby_DeathEffects = pc.createScript("RainbowObby_DeathEffects");

RainbowObby_DeathEffects.attributes.add("bloodEffect", {
  type: "entity",
  title: "Blood Effect",
});

RainbowObby_DeathEffects.attributes.add("blackBG", {
  type: "entity",
  title: "Black BG",
});

RainbowObby_DeathEffects.attributes.add("deathUI", {
  type: "entity",
  title: "Death UI",
});

RainbowObby_DeathEffects.prototype.initialize = function () {
  this.app.on("death", this.onDeath, this);
  this.app.on("respawn", this.onRespawn, this);
  this.entity.on("destroy", () => {
    this.app.off("death", this.onDeath, this);
    this.app.off("respawn", this.onRespawn, this);
  });
};

RainbowObby_DeathEffects.prototype.update = function (dt) {
  // if space is pressed, respawn
  if (this.app.keyboard.wasPressed(pc.KEY_SPACE) && this.deathUI.enabled) {
    this.app.fire("button:respawn");
  }
};

RainbowObby_DeathEffects.prototype.onDeath = function () {
  // Tween blood effect opacity to flash
  RainbowObby_LockManager.popups += 1;
  RainbowObby_LockManager.check(this.app);
  this.bloodEffect.enabled = true;
  this.blackBG.enabled = true;
  this.deathUI.enabled = true;
  this.bloodEffect.element.opacity = 0;
  this.blackBG.element.opacity = 0;
  this.deathUI.setLocalScale(0, 0, 0);

  const op = { opacity: 0 };
  const bsOp = { opacity: 0 };
  const btnOp = { s: 0 };
  new TWEEN.Tween(op)
    .to({ opacity: 1 }, 250)
    .easing(TWEEN.Easing.Sinusoidal.InOut)
    .onUpdate(() => {
      this.bloodEffect.element.opacity = op.opacity;
    })
    .chain(
      new TWEEN.Tween(op)
        .to({ opacity: 0 }, 250)
        .easing(TWEEN.Easing.Sinusoidal.InOut)
        .onUpdate(() => {
          this.bloodEffect.element.opacity = op.opacity;
        })
        .onComplete(() => {
          this.bloodEffect.enabled = false;
        }),
      new TWEEN.Tween(btnOp)
        .to({ s: 1 }, 250)
        .easing(TWEEN.Easing.Sinusoidal.InOut)
        .onUpdate(() => {
          this.deathUI.setLocalScale(btnOp.s, btnOp.s, btnOp.s);
        })
    )
    .start();
  new TWEEN.Tween(bsOp)
    .to({ opacity: 0.75 }, 500)
    .easing(TWEEN.Easing.Sinusoidal.InOut)
    .onUpdate(() => {
      this.blackBG.element.opacity = bsOp.opacity;
    })
    .onComplete(() => {})
    .start();
};

RainbowObby_DeathEffects.prototype.onRespawn = function () {
  RainbowObby_LockManager.popups -= 1;
  RainbowObby_LockManager.check(this.app);
  this.bloodEffect.enabled = false;
  this.blackBG.enabled = false;
  this.deathUI.enabled = false;
};
