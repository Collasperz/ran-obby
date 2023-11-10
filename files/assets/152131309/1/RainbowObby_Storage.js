var RainbowObby_Storage = {
  isLocalStorageSupported: function () {
    try {
      return "localStorage" in window && window.localStorage !== null;
    } catch (e) {
      return false;
    }
  },

  setItem: function (k, v) {
    if (this.isLocalStorageSupported()) {
      window.localStorage.setItem(k, v);
    } else {
      RainbowObby_Storage.createCookie(k, v);
    }
  },

  getItem: function (k) {
    if (this.isLocalStorageSupported()) {
      return window.localStorage.getItem(k);
    } else {
      return RainbowObby_Storage.readCookie(k);
    }
  },

  createCookie: function (k, v, days) {
    if (days) {
      var date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      var expires = "; expires=" + date.toString();
    } else {
      var expires = "";
    }
    document.cookie = k + "=" + v + expires + "; path=/";
  },

  readCookie: function (k) {
    const nameEQ = k + "=";
    const ca = document.cookie.split(";");
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == " ") c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  },
};
