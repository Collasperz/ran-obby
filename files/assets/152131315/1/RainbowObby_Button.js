var RainbowObby_Button = pc.createScript("RainbowObby_Button");

RainbowObby_Button.attributes.add("id", {
  type: "string",
  title: "ID",
  description: "ID of the button",
});

RainbowObby_Button.prototype.initialize = function () {
  this.entity.element.on("click", this.onClick, this);
};

RainbowObby_Button.prototype.onClick = function () {
  this.app.fire("button:" + this.id);
};
