var RainbowObby_Connecting = pc.createScript("RainbowObby_Connecting");

RainbowObby_Connecting.attributes.add("container", {
  type: "entity",
  title: "Container",
  description: "The container to show when connecting",
});

RainbowObby_Connecting.prototype.update = function (dt) {
  this.container.enabled = !this.app.networking.room;
};
