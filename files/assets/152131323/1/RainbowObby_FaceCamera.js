var RainbowObby_FaceCamera = pc.createScript("RainbowObby_FaceCamera");

RainbowObby_FaceCamera.prototype.postUpdate = function (dt) {
  if (!this._camera) {
    this._camera = this.app.root.findByName("Camera");
    return;
  }
  this.entity.lookAt(this._camera.getPosition());
  this.entity.rotateLocal(0, 180, 0);
};