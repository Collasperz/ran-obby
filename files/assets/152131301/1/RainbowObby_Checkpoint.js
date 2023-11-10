var RainbowObby_Checkpoint = pc.createScript("RainbowObby_Checkpoint");

RainbowObby_Checkpoint.byNumber = new Map();
RainbowObby_Checkpoint._i = 0;

RainbowObby_Checkpoint.attributes.add("coin", {
  type: "asset",
  assetType: "template",
  title: "Coin Prefab",
});

RainbowObby_Checkpoint.prototype.initialize = function () {
  if (!this.entity.parent.didInitCheckpoints) {
    this.entity.parent.didInitCheckpoints = true;
    const children = this.entity.parent.children;
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const script = child.script.RainbowObby_Checkpoint;
      script.number = RainbowObby_Checkpoint._i++;
      RainbowObby_Checkpoint.byNumber.set(script.number, script);
    }
  }

  if (this.coin) {
    if (!RainbowObby_Storage.getItem("RainbowObby_CC-" + this.number)) {
      const coin = this.coin.resource.instantiate();
      coin.setPosition(
        this.entity.getPosition().clone().add(new pc.Vec3(0, 2, 0))
      );

      coin.on("collected", () => {
        RainbowObby_Storage.setItem("RainbowObby_CC-" + this.number, "1");
      });

      this.app.root.addChild(coin);
    }

    this.entity.on("destroy", () => {
      RainbowObby_Checkpoint.byNumber.clear();
      RainbowObby_Checkpoint._i = 0;
    });
  }

  this.entity.collision.on("collisionstart", (result) => {
    if (!result.other.script) return;
    if (!result.other.script.RainbowObby_CharacterController) return;
    if (result.other.script.RainbowObby_CharacterController.isLocalPlayer) {
      if (this.number === 102) {
        RainbowObby_Storage.setItem("RainbowObby_world1", true);
      }

      const currentCheckpoint = parseInt(
        RainbowObby_Storage.getItem("RainbowObby_currentCheckpoint") || "0"
      );
      if (this.number > currentCheckpoint) {
        // Get SFX component
        const sfx = this.app.root.findByName("SFX");
        const sound = sfx.sound;
        sound.play("checkpoint");

        RainbowObby_Storage.setItem(
          "RainbowObby_currentCheckpoint",
          this.number
        );
        /*
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
                */
      }
    }
  });
};
