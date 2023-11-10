var RainbowObby_MarketController = pc.createScript(
  "RainbowObby_MarketController"
);

RainbowObby_MarketController.attributes.add("market", {
  type: "entity",
  title: "Market",
});

RainbowObby_MarketController.prototype.initialize = function () {
  this.app.on("button:toggleMarket", this.toggleMarket, this);
  this.entity.on("destroy", () => {
    this.app.off("button:toggleMarket", this.toggleMarket, this);
  });
};

RainbowObby_MarketController.prototype.update = function () {
  // Show the market when pressing M
  if (this.app.keyboard.wasPressed(pc.KEY_M)) {
    this.toggleMarket();
  }

  if (this.app.keyboard.wasPressed(pc.KEY_ESCAPE) && this.market.enabled) {
    this.market.enabled = false;
    RainbowObby_LockManager.popups--;
    RainbowObby_LockManager.check(this.app);
  }
};

RainbowObby_MarketController.prototype.toggleMarket = function () {
  this.market.enabled = !this.market.enabled;
  if (this.market.enabled) {
    RainbowObby_LockManager.popups++;
    RainbowObby_LockManager.check(this.app);
  } else {
    RainbowObby_LockManager.popups--;
    RainbowObby_LockManager.check(this.app);
  }

  
  const commercialBreakCounter = Date.now();
  PokiSDK.commercialBreak(() => {
    this.app.isWatchingAd = true;
    this.app.systems.sound.volume = 0;
  }).then(() => {
    if (Date.now() - commercialBreakCounter > 1000) {
      gameanalytics.GameAnalytics.addAdEvent(
        gameanalytics.EGAAdAction.Show,
        gameanalytics.EGAAdType.Interstitial,
        "poki",
        "ClassicObby"
      );
    }

    this.app.isWatchingAd = false;
    this.app.systems.sound.volume = 1;
  });
};
