var CoSaveSystem = pc.createScript('coSaveSystem');

var CoSaveSystem = {
    isLocalStorageSupported: function () {
        var isSupported = false;
        if (this.dataStore == null)
            this.dataStore = {};
        try {
            window.localStorage;
            isSupported = true;
        } catch (e) {
            isSupported = false;

        }
        return isSupported;
    },
    setItem: function (key, value) {
        if (this.isLocalStorageSupported()) {
            window.localStorage.setItem(key, value);
        } else {
            this.dataStore[key] = value;
        }
    },
    getItem: function (key) {
        if (this.isLocalStorageSupported()) {
            return window.localStorage.getItem(key);
        } else {
            return this.dataStore[key];
        }
    },
};