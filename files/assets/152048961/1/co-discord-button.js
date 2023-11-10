var CoDiscordButton = pc.createScript('coDiscordButton');

CoDiscordButton.prototype.initialize = function () {
    this.entity.button.on('click', function (event) {
        window.open("https://discord.gg/BtZbhJ9y4J", "_blank");

        //CarADSSHOW
        let commercialBreakCounter = Date.now();
        PokiSDK.commercialBreak(() => {
            this.app.systems.sound.volume = 0;
        }).then(() => {
            this.app.isWatchingAd = false;
            if (Date.now() - commercialBreakCounter > 1000) {
                gameanalytics.GameAnalytics.addAdEvent(
                    gameanalytics.EGAAdAction.Show,
                    gameanalytics.EGAAdType.Interstitial,
                    "poki",
                    "carObby"
                );
            }
            this.app.systems.sound.volume = 1;
        });
    }, this);
};