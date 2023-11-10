var RainbowObby_ResetProgress = pc.createScript("RainbowObby_ResetProgress");

RainbowObby_ResetProgress.prototype.initialize = function () {
  this.app.on("button:clearData", () => {
    RainbowObby_Storage.setItem("RainbowObby_currentCheckpoint", 0);
    this.app.fire("character:setJetpackFuel", 0);
    this.app.fire("character:setJumpCoilTimer", 0);
    this.app.fire("character:setBootsTimer", 0);
    this.app.fire("character:setTotemOfUndying", false);
    this.app.fire("character:setFlyingCarpet", false);
    this.app.fire("button:respawn");
  });
};
