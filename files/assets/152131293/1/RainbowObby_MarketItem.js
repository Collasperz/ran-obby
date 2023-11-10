var RainbowObby_MarketItem = pc.createScript("RainbowObby_MarketItem");

RainbowObby_MarketItem.attributes.add("id", {
  type: "string",
  title: "ID",
  description: "The ID of the item",
});

RainbowObby_MarketItem.attributes.add("price", {
  type: "number",
  title: "Price",
  description: "The price of the item",
});

RainbowObby_MarketItem.attributes.add("currency", {
  enum: [{ Coins: "coins" }, { Ads: "ads" }, { Discord: "discord" }],
  type: "string",
  title: "Currency",
});

RainbowObby_MarketItem.attributes.add("priceTag", {
  type: "entity",
  title: "Price Tag",
  description: "The entity that displays the price",
});

RainbowObby_MarketItem.attributes.add("priceTagContainer", {
  type: "entity",
  title: "Price Tag Container",
  description: "The entity that contains the price tag",
});

RainbowObby_MarketItem.prototype.initialize = function () {
  this.entity.element.on("click", this.onClick, this);

  this.updatePriceTag();
};

RainbowObby_MarketItem.prototype.onClick = function () {
  // If unlocked, equip the item
  if (
    RainbowObby_Storage.getItem("RainbowObby_market:item:" + this.id) === "1" ||
    this.price === 0 ||
    (this.currency === "discord" && window.DidJoinDiscord)
  ) {
    // Equip the item
    this.app.fire("character:setSkin", this.id);
    return;
  }

  if (this.currency === "coins") {
    if (RainbowObby_Bank.coins < this.price) {
      RainbowObby_Popup.show(
        "You don't have enough coins! You need " +
          (this.price - RainbowObby_Bank.coins) +
          " more coins to buy this item."
      );
      return;
    }
    RainbowObby_Bank.addCoins(-this.price);
    // Give the item
    RainbowObby_Storage.setItem("RainbowObby_market:item:" + this.id, "1");
    // Equip the item
    this.app.fire("character:setSkin", this.id);

    // Update the price tag
    this.updatePriceTag();
  }

  // If the currency is ads, display an ad and then give the item
  if (this.currency === "ads") {
    PokiSDK.rewardedBreak(() => {
      this.app.systems.sound.volume = 0;
    }).then((success) => {
      if (success) {
        gameanalytics.GameAnalytics.addAdEvent(
          gameanalytics.EGAAdAction.Clicked,
          gameanalytics.EGAAdType.RewardedVideo,
          "poki",
          "ClassicObby"
        );
        var adsWatched = parseInt(
          RainbowObby_Storage.getItem("RainbowObby_market:ads:" + this.id) ||
            "0"
        );
        adsWatched++;
        RainbowObby_Storage.setItem(
          "RainbowObby_market:ads:" + this.id,
          adsWatched
        );

        if (adsWatched >= this.price) {
          // Give the item
          RainbowObby_Storage.setItem(
            "RainbowObby_market:item:" + this.id,
            "1"
          );
          // Equip the item
          this.app.fire("character:setSkin", this.id);
        }
        // Update the price tag
        this.updatePriceTag();
      }
      this.app.systems.sound.volume = 1;
    });
  }

  // If the currency is discord, open the discord invite
  if (this.currency === "discord") {
    window.open("https://discord.gg/PDW7rDecDu", "_blank");
    RainbowObby_Storage.setItem("RainbowObby_discord", "1");
    window.DidJoinDiscord = true;

    // Give the item
    RainbowObby_Storage.setItem("RainbowObby_market:item:" + this.id, "1");
    // Equip the item
    this.app.fire("character:setSkin", this.id);
    // Update the price tag
    this.updatePriceTag();
  }
};

RainbowObby_MarketItem.prototype.updatePriceTag = function () {
  // If unlocked, hide the price tag
  if (
    RainbowObby_Storage.getItem("RainbowObby_market:item:" + this.id) === "1" ||
    this.price === 0 ||
    (this.currency === "discord" && window.DidJoinDiscord)
  ) {
    this.priceTagContainer.enabled = false;
    return;
  }

  if (this.currency === "coins") {
    this.priceTag.element.text = this.price;
  }

  if (this.currency === "ads") {
    var adsWatched = parseInt(
      RainbowObby_Storage.getItem("RainbowObby_market:ads:" + this.id) || "0"
    );

    this.priceTag.element.text = adsWatched + "/" + this.price;
  }
};
