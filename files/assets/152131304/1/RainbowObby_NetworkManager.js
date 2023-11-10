var RainbowObby_NetworkManager = pc.createScript("RainbowObby_NetworkManager");

RainbowObby_NetworkManager.attributes.add("characterPrefab", {
  type: "asset",
  assetType: "template",
  title: "Character Prefab",
  description: "The prefab to spawn for each player",
});

RainbowObby_NetworkManager.attributes.add("inviteLinkPopup", {
  type: "entity",
  title: "Invite Link Popup",
});

RainbowObby_NetworkManager.attributes.add("inviteLinkText", {
  type: "entity",
  title: "Invite Link Text",
});

RainbowObby_NetworkManager.attributes.add("inviteLinkCopyButton", {
  type: "entity",
  title: "Invite Link Copy Button",
});

RainbowObby_NetworkManager.attributes.add("createRoomButton", {
  type: "entity",
  title: "Create Room Button",
});

RainbowObby_NetworkManager.attributes.add("joinRoomPopup", {
  type: "entity",
  title: "Join Room Popup",
});

RainbowObby_NetworkManager.attributes.add("showJoinRoomPopupButton", {
  type: "entity",
  title: "Show Join Room Popup Button",
});

RainbowObby_NetworkManager.attributes.add("joinRoomInput", {
  type: "entity",
  title: "Join Room Input",
});

RainbowObby_NetworkManager.attributes.add("joinRoomButton", {
  type: "entity",
  title: "Join Room Button",
});

RainbowObby_NetworkManager.attributes.add("mainMenuButton", {
  type: "entity",
  title: "Main Menu Button",
});

RainbowObby_NetworkManager.prototype.initialize = async function () {
  this.app.networking = this;

  window.DidJoinDiscord =
    RainbowObby_Storage.getItem("RainbowObby_discord") === "1";

  this._players = new Map();

  this.inviteLinkCopyButton.element.on("click", () => {
    this.copyInviteLink();
  });

  this.createRoomButton.element.on("click", async () => {
    // Disable button to prevent spamming
    console.log("creating room...");
    clearTimeout(this._connectRetryTimeout);
    this.createRoomButton.button.enabled = false;
    try {
      await this.createRoom();
    } catch (error) {
      console.log("error joining created room");
      RainbowObby_Popup.show("Could not create room, please try again later.");
      this._isCreateRoom = false;
      this.tryJoinOrCreateRoom();
    }
    this.createRoomButton.button.enabled = true;
  });

  this.showJoinRoomPopupButton.element.on("click", () => {
    RainbowObby_LockManager.popups++;
    RainbowObby_LockManager.check(this.app);
    this.joinRoomPopup.enabled = true;
  });

  this.joinRoomButton.element.on("click", async () => {
    // Disable button to prevent spamming
    console.log("joining room...");
    clearTimeout(this._connectRetryTimeout);
    this.joinRoomPopup.enabled = false;
    RainbowObby_LockManager.popups--;
    RainbowObby_LockManager.check(this.app);

    let roomId = this.joinRoomInput.element.text;
    // If room id is a URL, extract the room id from it
    if (roomId.startsWith("https://")) {
      // Get ?room=XXXXX
      roomId = roomId.split("?")[1];
      // Get XXXXX
      roomId = roomId.split("=")[1];
      // Remove game id
      roomId = roomId.slice(0, -1);
    }
    // First 9 characters are the room id
    roomId = roomId.slice(0, 9);

    try {
      await this.joinRoom(roomId);
      RainbowObby_Popup.show("Joined room successfully!", roomId);
    } catch (error) {
      console.log("error joining room", roomId);
      RainbowObby_Popup.show(
        "Could not join room, please check the room id and try again."
      );
      this.tryJoinOrCreateRoom();
    }
  });

  this.mainMenuButton.element.on("click", async () => {
    if (this.room) {
      this._ignoreDisconnect = true;
      await this.room.leave();
    }
    this.app.scenes.changeScene("Menu");
  });

  this.client = new Colyseus.Client("wss://obby.tufapps.com");

  const roomIdFromURL = PokiSDK.getURLParam("room");
  if (!roomIdFromURL) {
    await this.tryJoinOrCreateRoom();
    return;
  }

  const roomId = roomIdFromURL.slice(0, -1);
  try {
    await this.joinRoom(roomId);
  } catch (error) {
    console.log("error joining private room");
    await this.tryJoinOrCreateRoom();
  }
};

RainbowObby_NetworkManager.prototype.copyInviteLink = function () {
  if (this.room) {
    PokiSDK.shareableURL({ room: this.room.roomId + "0" }).then((url) => {
      if (window.clipboardData && window.clipboardData.setData) {
        // Internet Explorer-specific code path to prevent textarea being shown while dialog is visible.
        return window.clipboardData.setData("Text", url);
      } else if (
        document.queryCommandSupported &&
        document.queryCommandSupported("copy")
      ) {
        var textarea = document.createElement("textarea");
        textarea.textContent = url;
        textarea.style.position = "fixed"; // Prevent scrolling to bottom of page in Microsoft Edge.
        document.body.appendChild(textarea);
        textarea.select();
        try {
          document.execCommand("copy"); // Security exception may be thrown by some browsers.
        } catch (ex) {
          console.warn("Copy to clipboard failed.", ex);
        } finally {
          document.body.removeChild(textarea);
        }
      }
    });
    this.app.fire(
      "message:show",
      "Copied the URL, now share it with your friends!",
      5,
      new pc.Color(0, 1, 0, 1)
    );
  }
};

RainbowObby_NetworkManager.prototype.tryJoinOrCreateRoom = async function () {
  try {
    await this.joinOrCreateRoom();
  } catch (error) {
    console.log("error joining room");
    clearTimeout(this._connectRetryTimeout);
    this._connectRetryTimeout = setTimeout(() => {
      this.tryJoinOrCreateRoom();
    }, 1000);
  }
};

RainbowObby_NetworkManager.prototype.update = function (dt) {
  TWEEN.update();
};

RainbowObby_NetworkManager.prototype.command = function (command, data) {
  if (!this.room) {
    return;
  }

  this.room.send(command, data);
};

RainbowObby_NetworkManager.prototype.joinOrCreateRoom = async function () {
  if (this.room) {
    await this.room.leave();
  }

  return this.connect(async () => {
    return this.client.joinOrCreate("classicObby");
  });
};

RainbowObby_NetworkManager.prototype.createRoom = async function () {
  this._ignoreDisconnect = true;
  this._isCreateRoom = true;

  if (this.room) {
    await this.room.leave();
  }

  return this.connect(async () => {
    return this.client.create("classicObby", { private: true });
  });
};

RainbowObby_NetworkManager.prototype.joinRoom = async function (roomId) {
  this._ignoreDisconnect = true;
  if (this.room) {
    await this.room.leave();
  }

  return this.connect(async () => {
    return this.client.joinById(roomId);
  });
};

RainbowObby_NetworkManager.prototype.connect = async function (fn) {
  console.log("connecting...");

  this.room = await fn();

  if (this._isCreateRoom) {
    this._isCreateRoom = false;

    RainbowObby_LockManager.popups++;
    RainbowObby_LockManager.check(this.app);

    this.inviteLinkPopup.enabled = true;
    this.inviteLinkText.element.text = "Room id is " + this.room.roomId;
  }

  this.app.fire("network:connected", this.room);

  console.log("joined successfully", this.room);

  this.room.state.players.onAdd((player, key) => {
    if (player.id === this.room.sessionId) {
      // this is me, do not create a new character as we already have one
      this.app.fire("character:name", player.name);
      return;
    }

    console.log("adding player", player.id, "me=", this.room.sessionId);

    const character = this.characterPrefab.resource.instantiate();
    const script = character.script.RainbowObby_CharacterController;

    if (!player.isAlive) {
      character.enabled = false;
    }

    player.position.onChange(() => {
      script._lastServerPosition = new pc.Vec3(
        player.position.x,
        player.position.y,
        player.position.z
      );
    });
    player.onChange(() => {
      this.onPlayerChange(script, player, character);
    });

    this.onPlayerChange(script, player, character);

    character.setPosition(
      player.position.x,
      player.position.y,
      player.position.z
    );
    character.setLocalRotation(
      new pc.Quat().setFromEulerAngles(0, player.rotation, 0)
    );

    this.app.root.addChild(character);
    this._players.set(key, character);
  });

  this.room.state.players.onRemove((player, key) => {
    if (player.id === this.room.sessionId) {
      // this is me, do not remove
      return;
    }

    console.log("removing player", player.id, key);

    const character = this._players.get(key);
    character.destroy();
    this._players.delete(key);
  });

  this.room.onLeave(() => {
    this.app.fire("network:disconnected");
    this.app.fire("character:name", "");

    // Destroy all game objects
    this._players.forEach((entity) => {
      entity.destroy();
    });
    this._players.clear();

    this.room = null;

    // Try to reconnect to a random room
    if (!this._ignoreDisconnect) this.tryJoinOrCreateRoom();
    this._ignoreDisconnect = false;
    
    const commercialBreakCounter = Date.now();
    PokiSDK.commercialBreak(() => {
      this.app.isWatchingAd = true;
      this.app.systems.sound.volume = 0;
    }).then(() => {
      if (Date.now() - commercialBreakCounter > 1000) {
        gameanalytics.GameAnalytics.addAdEvent(
          gameanalytics.EGAAdAction.Show,
          gameanalytics.EGAAdType.Interstitial,
          "poki",
          "ClassicObby"
        );
      }

      this.app.isWatchingAd = false;
      this.app.systems.sound.volume = 1;
    });
  });

  const commercialBreakCounter = Date.now();
  PokiSDK.commercialBreak(() => {
    this.app.isWatchingAd = true;
    this.app.systems.sound.volume = 0;
  }).then(() => {
    if (Date.now() - commercialBreakCounter > 1000) {
      gameanalytics.GameAnalytics.addAdEvent(
        gameanalytics.EGAAdAction.Show,
        gameanalytics.EGAAdType.Interstitial,
        "poki",
        "ClassicObby"
      );
    }

    this.app.isWatchingAd = false;
    this.app.systems.sound.volume = 1;
  });
};

RainbowObby_NetworkManager.prototype.onPlayerChange = function (
  script,
  player,
  character
) {
  script._lastServerPosition = new pc.Vec3(
    player.position.x,
    player.position.y,
    player.position.z
  );
  script._lastServerRotation = player.rotation;

  script._isInAir = player.isInAir;
  script._isWalking = player.isWalking;
  script._isClimbing = player.isClimbing;
  script._jetpackEmitting = player.jetpackEmitting;

  script._jetpackFuel = player.hasJetpack ? 1 : 0;
  script._jumpCoilTimer = player.hasJumpCoil ? 1 : 0;
  script._hasTotemOfUndying = player.hasTotemOfUndying;
  script._hasFlyingCarpet = player.hasFlyingCarpet;
  script._bootsTimer = player.hasSpeedBoots ? 1 : 0;
  script._flyingCarpetActive = player.flyingCarpetActive;

  script.setSkin(player.skin);
  script.setNickname(player.name);

  if (character.enabled && !player.isAlive) {
    character.setPosition(
      player.position.x,
      player.position.y,
      player.position.z
    );
    script.die();
  } else if (!character.enabled && player.isAlive) {
    script.setAlive();
  }
};
