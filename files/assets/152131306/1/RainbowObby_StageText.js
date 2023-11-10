var RainbowObby_StageText = pc.createScript("RainbowObby_StageText");

RainbowObby_StageText.prototype.update = function () {
  const currentCheckpoint = parseInt(
    RainbowObby_Storage.getItem("RainbowObby_currentCheckpoint") || "0"
  );
  this.entity.element.text = currentCheckpoint + 1;
};