var RainbowObby_CoinsText = pc.createScript("RainbowObby_CoinsText");

RainbowObby_CoinsText.prototype.update = function () {
  this.entity.element.text = RainbowObby_Bank.coins;
};
