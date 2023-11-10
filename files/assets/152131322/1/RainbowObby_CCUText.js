var RainbowObby_CCUText = pc.createScript("RainbowObby_CCUText");

RainbowObby_CCUText.prototype.update = function (dt) {
  if (!this.app.networking.room) {
    this.entity.element.text = "1";
  } else {
    this.entity.element.text =
      this.app.networking.room.state.players.size.toString();
  }
};
