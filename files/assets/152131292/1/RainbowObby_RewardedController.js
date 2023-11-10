var RainbowObby_RewardedController = pc.createScript(
  "RainbowObby_RewardedController"
);

RainbowObby_RewardedController.attributes.add("coilImage", {
  type: "entity",
  title: "Coil Image",
});

RainbowObby_RewardedController.attributes.add("totemImage", {
  type: "entity",
  title: "Totem Image",
});

RainbowObby_RewardedController.attributes.add("jetpackImage", {
  type: "entity",
  title: "Jetpack Image",
});

RainbowObby_RewardedController.attributes.add("bootsImage", {
  type: "entity",
  title: "Boots Image",
});

RainbowObby_RewardedController.attributes.add("text", {
  type: "entity",
  title: "Text",
});

RainbowObby_RewardedController.attributes.add("button", {
  type: "entity",
  title: "Take Button",
});

RainbowObby_RewardedController.prototype.initialize = function () {
  const onCoil = (free, obj) => {
    this.obj = obj;
    this.reward = "coil";
    if (free) {
      this.claimFreeReward();
      return;
    }

    this.show("coil");
  };
  this.app.on("rewarded:coil", onCoil);

  const onTotem = (free, obj) => {
    this.obj = obj;
    this.reward = "totem";
    if (free) {
      this.claimFreeReward();
      return;
    }

    this.show("totem");
  };
  this.app.on("rewarded:totem", onTotem);

  const onJetpack = (free, obj) => {
    this.obj = obj;
    this.reward = "jetpack";
    if (free) {
      this.claimFreeReward();
      return;
    }

    this.show("jetpack");
  };
  this.app.on("rewarded:jetpack", onJetpack);

  const onBoots = (free, obj) => {
    this.obj = obj;
    this.reward = "boots";
    if (free) {
      this.claimFreeReward();
      return;
    }

    this.show("boots");
  };
  this.app.on("rewarded:boots", onBoots);

  const onHide = () => {
    const op = { scale: 1 };
    new TWEEN.Tween(op)
      .to({ scale: 0 }, 100)
      .onUpdate(() => {
        this.entity.setLocalScale(op.scale, op.scale, op.scale);
      })
      .onComplete(() => {
        if (this.entity.enabled) {
          RainbowObby_LockManager.popups -= 1;
          RainbowObby_LockManager.check(this.app);
        }
        this.entity.enabled = false;
      })
      .start();
  };
  this.app.on("rewarded:hide", onHide);

  this.entity.on("destroy", () => {
    this.app.off("rewarded:coil", onCoil);
    this.app.off("rewarded:totem", onTotem);
    this.app.off("rewarded:jetpack", onJetpack);
    this.app.off("rewarded:boots", onBoots);
    this.app.off("rewarded:hide", onHide);
  });

  this.button.element.on("click", () => {
    this.claimReward();
  });

  this.entity.enabled = false;
};

RainbowObby_RewardedController.prototype.claimFreeReward = function () {
  // Get SFX component
  const sfx = this.app.root.findByName("SFX");
  const sound = sfx.sound;
  sound.play("chest");
  switch (this.reward) {
    case "coil":
      this.app.fire("character:setJumpCoilTimer", 60);
      break;
    case "totem":
      this.app.fire("character:setTotemOfUndying", true);
      break;
    case "jetpack":
      this.app.fire("character:setJetpackFuel", 100);
      break;
    case "boots":
      this.app.fire("character:setBootsTimer", 60);
      break;
  }
};

RainbowObby_RewardedController.prototype.claimReward = function () {
  PokiSDK.rewardedBreak(() => {
    this.app.isWatchingAd = true;
    this.app.systems.sound.volume = 0;
  }).then((success) => {
    if (success) {
      gameanalytics.GameAnalytics.addAdEvent(
        gameanalytics.EGAAdAction.Clicked,
        gameanalytics.EGAAdType.RewardedVideo,
        "poki",
        "ClassicObby"
      );
      switch (this.reward) {
        case "coil":
          this.app.fire("character:setJumpCoilTimer", 60);
          break;
        case "totem":
          this.app.fire("character:setTotemOfUndying", true);
          break;
        case "jetpack":
          this.app.fire("character:setJetpackFuel", 100);
          break;
        case "boots":
          this.app.fire("character:setBootsTimer", 60);
          break;
      }
      // Get SFX component
      const sfx = this.app.root.findByName("SFX");
      const sound = sfx.sound;
      sound.play("chest");
      this.obj.enabled = false;
    }
    RainbowObby_LockManager.popups -= 1;
    RainbowObby_LockManager.check(this.app);
    this.entity.enabled = false;
    this.app.isWatchingAd = false;
    this.app.systems.sound.volume = 1;
  });
};

RainbowObby_RewardedController.prototype.show = function (reward) {
  RainbowObby_LockManager.popups += 1;
  RainbowObby_LockManager.check(this.app);
  switch (reward) {
    case "coil":
      this.coilImage.enabled = true;
      this.totemImage.enabled = false;
      this.jetpackImage.enabled = false;
      this.bootsImage.enabled = false;
      this.text.element.text = "Jump Coil";
      break;
    case "totem":
      this.coilImage.enabled = false;
      this.totemImage.enabled = true;
      this.jetpackImage.enabled = false;
      this.bootsImage.enabled = false;
      this.text.element.text = "Totem of Undying";
      break;
    case "jetpack":
      this.coilImage.enabled = false;
      this.totemImage.enabled = false;
      this.jetpackImage.enabled = true;
      this.bootsImage.enabled = false;
      this.text.element.text = "Jetpack";
      break;
    case "boots":
      this.coilImage.enabled = false;
      this.totemImage.enabled = false;
      this.jetpackImage.enabled = false;
      this.bootsImage.enabled = true;
      this.text.element.text = "Speed Boots";
      break;
  }

  this.entity.enabled = true;
  this.entity.setLocalScale(0, 0, 0);

  const op = { scale: 0 };
  new TWEEN.Tween(op)
    .to({ scale: 1 }, 100)
    .onUpdate(() => {
      this.entity.setLocalScale(op.scale, op.scale, op.scale);
    })
    .start();
};
