var RainbowObby_Popup = pc.createScript("RainbowObby_Popup");

RainbowObby_Popup.attributes.add("view", {
  type: "entity",
  title: "View",
});

RainbowObby_Popup.attributes.add("message", {
  type: "entity",
  title: "Message",
});

RainbowObby_Popup.prototype.initialize = function () {
  RainbowObby_Popup.instance = this;

  this.entity.on("destroy", () => {
    RainbowObby_Popup.instance = null;
  });
};

RainbowObby_Popup.show = function (message) {
  RainbowObby_LockManager.popups++;
  RainbowObby_LockManager.check(RainbowObby_Popup.instance.app);
  RainbowObby_Popup.instance.view.enabled = true;
  RainbowObby_Popup.instance.message.element.text = message;
};
