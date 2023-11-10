var BikeObby_ResetProgressController = pc.createScript('resetProgressController');

// initialize code called once per entity
BikeObby_ResetProgressController.prototype.initialize = function () {
    this.networkManager = this.app.root.findByName("NetworkManager").script.networkManager;
    /*
    this.entity.collision.on('triggerenter', function (otherEntity) {
        if (otherEntity.tags.has("Player")) {
            this.app.fire("popupController:showPopup",
                "Delete progress", "Would you like to reset your progress?", true, this.app, "resetData", "closePopup");
        }
    }, this);
    this.entity.collision.on('triggerleave', function (otherEntity) {
        if (otherEntity.tags.has("Player")) {
            this.app.fire("popupController:hidePopup");
        }
    }, this);*/
    this.app.on("resetData", this.resetData, this);
    this.on('destroy', function () {
        this.app.off("resetData", this.resetData, this);
    }, this);

};

BikeObby_ResetProgressController.prototype.resetData = function () {
    if (this.networkManager.room)
        this.networkManager.room.leave();

    this.networkManager.musicPlayer.sound.stop("music");
    BikeObby_Utils.clear();
    //var oldHierarchy = pc.app.root.findByName("Root");
    //oldHierarchy.destroy();
    //this.app.loadSceneHierarchy("1869105.json", function (err, parent) { });
    this.app.scenes.changeScene("BikeObby");
};