var RainbowObby_Bank = pc.createScript("RainbowObby_Bank");

RainbowObby_Bank.coins = 0;
RainbowObby_Bank.addCoins = function (amount) {
  RainbowObby_Bank.coins += amount;
  RainbowObby_Bank.coins = Math.max(0, RainbowObby_Bank.coins);

  RainbowObby_Storage.setItem("RainbowObby_coins", RainbowObby_Bank.coins);
};

RainbowObby_Bank.prototype.initialize = function () {
  RainbowObby_Bank.coins = parseInt(
    RainbowObby_Storage.getItem("RainbowObby_coins") || "0"
  );
};
