var RainbowObby_CharacterController = pc.createScript(
  "RainbowObby_CharacterController"
);

RainbowObby_CharacterController.attributes.add("isLocalPlayer", {
  type: "boolean",
  default: false,
});
RainbowObby_CharacterController.attributes.add("nameTag", { type: "entity" });
RainbowObby_CharacterController.attributes.add("rotationTarget", {
  type: "entity",
});
RainbowObby_CharacterController.attributes.add("renderTarget", {
  type: "entity",
});
RainbowObby_CharacterController.attributes.add("jetpack", { type: "entity" });
RainbowObby_CharacterController.attributes.add("jumpCoil", { type: "entity" });
RainbowObby_CharacterController.attributes.add("totemOfUndying", {
  type: "entity",
});
RainbowObby_CharacterController.attributes.add("flyingCarpet", {
  type: "entity",
});
RainbowObby_CharacterController.attributes.add("boots1", { type: "entity" });
RainbowObby_CharacterController.attributes.add("boots2", { type: "entity" });
RainbowObby_CharacterController.attributes.add("jetpackParticle", {
  type: "entity",
});
RainbowObby_CharacterController.attributes.add("rewardParticle", {
  type: "entity",
});
RainbowObby_CharacterController.attributes.add("soundComponent", {
  type: "entity",
});
RainbowObby_CharacterController.attributes.add("deadNoobAsset", {
  type: "asset",
  assetType: "template",
});

RainbowObby_CharacterController.prototype.initialize = function () {
  // Stats
  this.speed = 6;
  this.jumpHeight = 13;

  // State of networking
  this._positionUpdateTimer = 0;
  this._lastServerPosition = new pc.Vec3();
  this._lastServerRotation = 0;

  // State of animations (for non-local players)
  this._isInAir = false;
  this._isWalking = false;
  this._isClimbing = false;
  this._jetpackEmitting = false;

  // State of rewarded items
  this._jetpackFuel = 0;
  this._jumpCoilTimer = 0;
  this._bootsTimer = 0;
  this._hasTotemOfUndying = false;
  this._hasFlyingCarpet = false;
  this._flyingCarpetActive = false;

  // Flag for PokiSDK.gameplayStart() event
  this._didFirstMove = false;

  // Character state
  this._deadNoobObject = null;

  // Character movement
  this._inputVector = new pc.Vec3();
  this._contactNormal = new pc.Vec3();
  this._quat = new pc.Quat();

  this._desiredAngle = 0;

  this._desiredJump = false;
  this._timeSinceLastJump = 0;
  this._timeSinceLastGrounded = 0;

  this._ladders = new Set();

  // Get necessary components
  this._animComponent = this.entity.findComponent("anim");

  this._animComponent.on("step1", () => {
    // Play Walking 1 2 or 3
    const rand = Math.floor(Math.random() * 3) + 1;

    this.soundComponent.sound.play("Walking " + rand);
  });
  this._animComponent.on("step2", () => {
    // Play Walking 1 2 or 3
    const rand = Math.floor(Math.random() * 3) + 1;

    this.soundComponent.sound.play("Walking " + rand);
  });
};

RainbowObby_CharacterController.prototype.postInitialize = function () {
  if (this.isLocalPlayer) {
    // Listen for events
    this.app.on("character:setJetpackFuel", this.setJetpackFuel, this);
    this.app.on("character:setJumpCoilTimer", this.setJumpCoilTimer, this);
    this.app.on("character:setBootsTimer", this.setBootsTimer, this);
    this.app.on("character:setTotemOfUndying", this.setTotemOfUndying, this);
    this.app.on("character:setFlyingCarpet", this.setFlyingCarpet, this);
    this.app.on("character:teleport", this.teleport, this);
    this.app.on("character:setSkin", this.setSkin, this);
    const onName = (name) => {
      this.nameTag.element.text = name;
    };
    this.app.on("character:name", onName);
    this.app.on("button:respawn", this.respawn, this);
    this.app.on("button:skipStage", this.skipStage, this);
    const onConnected = () => {
      if (this.entity.enabled) this.setAlive();
      this.app.networking.command("skin", skin);
    };
    this.app.on("network:connected", onConnected, this);

    this.entity.on("destroy", () => {
      this.app.off("character:setJetpackFuel", this.setJetpackFuel, this);
      this.app.off("character:setJumpCoilTimer", this.setJumpCoilTimer, this);
      this.app.off("character:setBootsTimer", this.setBootsTimer, this);
      this.app.off("character:setTotemOfUndying", this.setTotemOfUndying, this);
      this.app.off("character:setFlyingCarpet", this.setFlyingCarpet, this);
      this.app.off("character:teleport", this.teleport, this);
      this.app.off("character:setSkin", this.setSkin, this);
      this.app.off("character:name", onName);
      this.app.off("button:respawn", this.respawn, this);
      this.app.off("button:skipStage", this.skipStage, this);
      this.app.off("network:connected", onConnected, this);
    });

    // Teleport to last checkpoint
    this._teleportToCheckpoint();

    // Set as camera target
    this.app.fire("camera:setTarget", this.entity);

    // Listen for ladder collisions
    this.entity.collision.on("collisionstart", (result) => {
      if (result.other.tags.has("ladder")) {
        this._ladders.add(result.other);
      }
    });

    this.entity.collision.on("collisionend", (entity) => {
      if (entity.tags.has("ladder")) {
        this._ladders.delete(entity);
      }
    });

    // Get camera
    this._camera = this.app.root.findByName("Camera");

    // Skin
    var skin = RainbowObby_Storage.getItem("RainbowObby_skin") || "default";
    this.setSkin(skin);
  } else {
    // Disable physics for non-local players
    this.entity.rigidbody.enabled = false;
    this.entity.collision.enabled = false;
  }
};

RainbowObby_CharacterController.prototype._updateNonLocalPlayer = function (
  dt
) {
  /// Update visuals
  this.jetpack.enabled = this._jetpackFuel > 0;
  this.jetpackParticle.enabled = this._jetpackEmitting;
  this.jumpCoil.enabled = this._jumpCoilTimer > 0;
  this.totemOfUndying.enabled = this._hasTotemOfUndying;
  this.flyingCarpet.enabled = this._flyingCarpetActive;
  this.boots1.enabled = this._bootsTimer > 0;
  this.boots2.enabled = this._bootsTimer > 0;

  // Sounds
  if (this._jetpackEmitting) {
    if (!this._jetpackSoundPlaying) {
      this._jetpackSoundPlaying = true;
      this.soundComponent.sound.play("Jetpack");
    }
  } else {
    this._jetpackSoundPlaying = false;
    this.soundComponent.sound.stop("Jetpack");
  }

  /// Update animations
  this._animComponent.setBoolean("falling", this._isInAir);
  this._animComponent.setBoolean("walking", this._isWalking);
  this._animComponent.setBoolean("climbing", this._isClimbing);

  // Lerp to the server position
  this.entity.setPosition(
    new pc.Vec3().lerp(
      this.entity.getPosition(),
      new pc.Vec3(
        this._lastServerPosition.x,
        this._lastServerPosition.y,
        this._lastServerPosition.z
      ),
      10 * dt
    )
  );
  // Lerp to the server rotation
  this._quat = new pc.Quat().slerp(
    this._quat,
    new pc.Quat().setFromEulerAngles(0, this._lastServerRotation, 0),
    20 * dt
  );
  this.rotationTarget.setRotation(this._quat);
};

RainbowObby_CharacterController.prototype.update = function (dt) {
  if (!this.isLocalPlayer) {
    this._updateNonLocalPlayer(dt);
    return;
  }
  if (this.app.isWatchingAd) return;

  // Update visuals
  this.jetpack.enabled = this._jetpackFuel > 0;
  this.jetpackParticle.enabled = this._jetpackEmitting;
  this.jumpCoil.enabled = this._jumpCoilTimer > 0;
  this.totemOfUndying.enabled = this._hasTotemOfUndying;
  this.flyingCarpet.enabled = this._flyingCarpetActive;
  this.boots1.enabled = this._bootsTimer > 0;
  this.boots2.enabled = this._bootsTimer > 0;

  // Sounds
  if (this._jetpackEmitting) {
    if (!this._jetpackSoundPlaying) {
      this._jetpackSoundPlaying = true;
      this.soundComponent.sound.play("Jetpack");
    }
  } else {
    this._jetpackSoundPlaying = false;
    this.soundComponent.sound.stop("Jetpack");
  }

  /// Update server position
  this._positionUpdateTimer += dt;
  if (this._positionUpdateTimer >= 0.1) {
    this._positionUpdateTimer = 0;
    this.app.networking.command("location", {
      x: this.entity.getPosition().x,
      y: this.entity.getPosition().y,
      z: this.entity.getPosition().z,
      angle: this._desiredAngle,
    });
  }

  /// Reset input state
  this._inputVector.set(0, 0, 0);
  this._desiredJump = false;

  /// Handle movement
  this._timeSinceLastJump += dt;
  this._timeSinceLastGrounded += dt;

  const input = this.app.keyboard;
  const joystick = window.touchJoypad.sticks["joystick0"];
  const buttons = window.touchJoypad.buttons;

  // Relative to camera
  const cameraForward = this._camera.forward;
  if (!this._flyingCarpetActive) cameraForward.y = 0;
  cameraForward.normalize();

  const cameraRight = this._camera.right;
  if (!this._flyingCarpetActive) cameraRight.y = 0;
  cameraRight.normalize();

  let desiredVelocity = new pc.Vec3();

  // Jetpack
  if (this.jetpack.enabled) {
    if (this._jetpackFuel > 0) {
      this.app.fire("ui:setJetpackFuel", this._jetpackFuel);
    }
  }

  // Jump coil
  if (this.jumpCoil.enabled) {
    this._jumpCoilTimer -= dt;
    if (this._jumpCoilTimer <= 0) {
      this.jumpCoil.enabled = false;
      this.setJumpCoilTimer(0);
    }
    this.app.fire("ui:setJumpCoilTimer", this._jumpCoilTimer);
  }

  // Boots
  if (this.boots1.enabled) {
    this._bootsTimer -= dt;
    if (this._bootsTimer <= 0) {
      this.boots1.enabled = false;
      this.boots2.enabled = false;
      this.setBootsTimer(0);
    }
    this.app.fire("ui:setBootsTimer", this._bootsTimer);
  }

  if (input.wasPressed(pc.KEY_E) || buttons.wasPressed("button1")) {
    if (this._hasFlyingCarpet) {
      this._flyingCarpetActive = !this._flyingCarpetActive;
      this.app.networking.command(
        "flyingCarpetActive",
        this._flyingCarpetActive
      );
      if (this._flyingCarpetActive) {
        this.app.networking.command("isWalking", false);
        this.app.networking.command("isInAir", false);
        this._animComponent.setBoolean("walking", false);
        this._animComponent.setBoolean("falling", false);
      }
    }
  }

  if (this._flyingCarpetActive) {
    // Move relative to camera
    if (input.isPressed(pc.KEY_W)) {
      this._inputVector.add(cameraForward);
    }
    if (input.isPressed(pc.KEY_S)) {
      this._inputVector.sub(cameraForward);
    }
    if (input.isPressed(pc.KEY_A)) {
      this._inputVector.sub(cameraRight);
    }
    if (input.isPressed(pc.KEY_D)) {
      this._inputVector.add(cameraRight);
    }
    if (input.isPressed(pc.KEY_SPACE)) {
      this._inputVector.add(new pc.Vec3(0, 1, 0));
    }
    if (input.isPressed(pc.KEY_SHIFT)) {
      this._inputVector.sub(new pc.Vec3(0, 1, 0));
    }

    // Joystick
    if (joystick) {
      if (joystick.y > 0.1) {
        this._inputVector.add(cameraForward);
      }
      if (joystick.y < -0.1) {
        this._inputVector.sub(cameraForward);
      }
      if (joystick.x < -0.1) {
        this._inputVector.sub(cameraRight);
      }
      if (joystick.x > 0.1) {
        this._inputVector.add(cameraRight);
      }
    }

    desiredVelocity = this._inputVector.clone().mulScalar(this.speed * 4);

    if (this._inputVector.length() > 0) {
      this._desiredAngle =
        Math.atan2(this._inputVector.x, this._inputVector.z) *
        pc.math.RAD_TO_DEG;
      this._quat = new pc.Quat().slerp(
        this._quat,
        new pc.Quat().setFromEulerAngles(0, this._desiredAngle, 0),
        20 * dt
      );
      this.rotationTarget.setRotation(this._quat);
    }
  } else {
    const ladderRayStart = this.entity
      .getPosition()
      .clone()
      .sub(new pc.Vec3(0, 1, 0));
    const ladderRayEnd = ladderRayStart.clone().add(cameraForward.clone());
    const ladderResult = this.app.systems.rigidbody.raycastFirst(
      ladderRayStart,
      ladderRayEnd
    );

    if (ladderResult != null && ladderResult.entity.tags.has("ladder")) {
      if (input.isPressed(pc.KEY_W) || input.isPressed(pc.KEY_UP)) {
        this._inputVector.add(new pc.Vec3(0, 1, 0));
      }

      if (input.isPressed(pc.KEY_S) || input.isPressed(pc.KEY_DOWN)) {
        this._inputVector.sub(new pc.Vec3(0, 1, 0));
      }

      if (input.isPressed(pc.KEY_A) || input.isPressed(pc.KEY_LEFT)) {
        this._inputVector.sub(cameraRight);
      }

      if (input.isPressed(pc.KEY_D) || input.isPressed(pc.KEY_RIGHT)) {
        this._inputVector.add(cameraRight);
      }

      if (input.isPressed(pc.KEY_SPACE) || buttons.isPressed("button0")) {
        this._desiredJump = true;
      }

      if (joystick) {
        if (joystick.y > 0.1) {
          this._inputVector.add(new pc.Vec3(0, 1, 0));
        }
        if (joystick.y < -0.1) {
          this._inputVector.sub(new pc.Vec3(0, 1, 0));
        }
        if (joystick.x < -0.1) {
          this._inputVector.sub(cameraRight);
        }
        if (joystick.x > 0.1) {
          this._inputVector.add(cameraRight);
        }
      }

      this._inputVector.normalize();

      desiredVelocity = this._inputVector
        .clone()
        .mulScalar(this._bootsTimer > 0 ? this.speed * 2 : this.speed);

      this.app.networking.command("isClimbing", true);
      this._animComponent.setBoolean("climbing", true);
    } else {
      this.app.networking.command("isClimbing", false);
      this._animComponent.setBoolean("climbing", false);

      if (input.isPressed(pc.KEY_W) || input.isPressed(pc.KEY_UP)) {
        this._inputVector.add(cameraForward);
      }

      if (input.isPressed(pc.KEY_S) || input.isPressed(pc.KEY_DOWN)) {
        this._inputVector.sub(cameraForward);
      }

      if (input.isPressed(pc.KEY_A) || input.isPressed(pc.KEY_LEFT)) {
        this._inputVector.sub(cameraRight);
      }

      if (input.isPressed(pc.KEY_D) || input.isPressed(pc.KEY_RIGHT)) {
        this._inputVector.add(cameraRight);
      }

      if (joystick) {
        if (joystick.y > 0.1) {
          this._inputVector.add(cameraForward);
        }
        if (joystick.y < -0.1) {
          this._inputVector.sub(cameraForward);
        }
        if (joystick.x < -0.1) {
          this._inputVector.sub(cameraRight);
        }
        if (joystick.x > 0.1) {
          this._inputVector.add(cameraRight);
        }
      }

      let isPressingSpace =
        input.isPressed(pc.KEY_SPACE) || buttons.isPressed("button0");

      if (isPressingSpace) {
        this._desiredJump = true;
      }

      this._inputVector.normalize();

      // Get ground normal
      const rayStart = this.entity.getPosition().clone();
      const rayEnd = rayStart.clone().sub(new pc.Vec3(0, 1.25, 0));

      const result = this.app.systems.rigidbody.raycastFirst(rayStart, rayEnd);

      if (!result || !result.entity.tags.has("Ground")) {
        this._contactNormal = new pc.Vec3(0, 1, 0);
        /*
        if (
          this._ttimeSinceLastJump >= 0.1 &&
          this._timeSinceLastGrounded > 0.1
        ) {
         
        }
        */
        this.app.networking.command("isInAir", true);
        this._animComponent.setBoolean("falling", true);
      } else {
        this._contactNormal = result.normal.clone();
        this._timeSinceLastGrounded = 0;
        if (this._timeSinceLastJump >= 0.5) {
          this._jumped = false; // wtf does this do
        }
        this.app.networking.command("isInAir", false);
        this._animComponent.setBoolean("falling", false);
      }

      // Move along ground normal
      desiredVelocity = this._inputVector
        .clone()
        .mulScalar(this._bootsTimer > 0 ? this.speed * 2 : this.speed);

      if (desiredVelocity.length() > 0) {
        if (!this._didFirstMove) {
          this._didFirstMove = true;
          PokiSDK.gameplayStart();
          
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
        }

        this.app.networking.command("isWalking", true);
        this._animComponent.setBoolean("walking", true);

        this._desiredAngle =
          Math.atan2(this._inputVector.x, this._inputVector.z) *
          pc.math.RAD_TO_DEG;

        this._quat = new pc.Quat().slerp(
          this._quat,
          new pc.Quat().setFromEulerAngles(0, this._desiredAngle, 0),
          20 * dt
        );
        this.rotationTarget.setRotation(this._quat);
      } else {
        this.app.networking.command("isWalking", false);
        this._animComponent.setBoolean("walking", false);
      }

      desiredVelocity.y += this.entity.rigidbody.linearVelocity.y;

      // Snap to ground
      const speed = desiredVelocity.length();
      const direction = desiredVelocity.clone().normalize();
      const alignment = direction.dot(this._contactNormal);

      if (alignment > 0 && !this._jumped) {
        desiredVelocity.sub(
          this._contactNormal.clone().mulScalar(alignment * speed)
        );
      }

      if (this.jetpack.enabled && isPressingSpace) {
        this._jetpackFuel -= dt * 30;
        if (this._jetpackFuel < 0) this.setJetpackFuel(0);
        desiredVelocity.add(new pc.Vec3(0, 1, 0).mulScalar(3));
        this.app.networking.command("jetpackEmitting", true);
        this._jetpackEmitting = true;
      } else {
        this.app.networking.command("jetpackEmitting", false);
        this._jetpackEmitting = false;
        if (
          this._desiredJump &&
          this._timeSinceLastGrounded <= 0.3 &&
          !this._jumped
        ) {
          this._jumped = true;
          this._timeSinceLastJump = 0;
          // apply jump impulse along ground normal
          desiredVelocity.add(
            this._contactNormal
              .clone()
              .mulScalar(
                this._jumpCoilTimer > 0 ? this.jumpHeight * 2 : this.jumpHeight
              )
          );
        }
      }

      desiredVelocity.set(
        desiredVelocity.x,
        desiredVelocity.y - 30 * dt,
        desiredVelocity.z
      );
    }
  }

  this.entity.rigidbody.linearVelocity = desiredVelocity;
};

RainbowObby_CharacterController.prototype.postUpdate = function (dt) {
  /// Check if we should be dead
  if (this.entity.getPosition().y < -10 && !this._dead) {
    this.die();
    return;
  }
};

RainbowObby_CharacterController.prototype.setSkin = function (skin) {
  this._skin = skin;
  const skins = this.app.assets.findByTag("RainbowObby_skin");
  for (const skinAsset of skins) {
    if (skinAsset.name === skin) {
      const meshInstances = this.renderTarget.render.meshInstances;
      for (const meshInstance of meshInstances) {
        meshInstance.material = skinAsset.resource;
      }

      if (this.isLocalPlayer) {
        this.app.networking.command("skin", skin);
        RainbowObby_Storage.setItem("RainbowObby_skin", skin);
      }
      return;
    }
  }

  console.warn("Skin not found!");
};

RainbowObby_CharacterController.prototype.setJetpackFuel = function (fuel) {
  this.app.networking.command("hasJetpack", fuel > 0);
  this._jetpackFuel = fuel;
  this.app.fire("ui:setJetpackFuel", this._jetpackFuel);
  if (fuel > 0) {
    this.rewardParticle.particlesystem.reset();
    this.rewardParticle.particlesystem.play();
  }
};

RainbowObby_CharacterController.prototype.setJumpCoilTimer = function (timer) {
  this.app.networking.command("hasJumpCoil", timer > 0);
  this._jumpCoilTimer = timer;
  this.app.fire("ui:setJumpCoilTimer", this._jumpCoilTimer);
  if (timer > 0) {
    this.rewardParticle.particlesystem.reset();
    this.rewardParticle.particlesystem.play();
  }
};

RainbowObby_CharacterController.prototype.setBootsTimer = function (timer) {
  this.app.networking.command("hasSpeedBoots", timer > 0);
  this._bootsTimer = timer;
  this.app.fire("ui:setBootsTimer", this._bootsTimer);
  if (timer > 0) {
    this.rewardParticle.particlesystem.reset();
    this.rewardParticle.particlesystem.play();
  }
};

RainbowObby_CharacterController.prototype.setTotemOfUndying = function (
  hasTotem
) {
  this.app.networking.command("hasTotemOfUndying", hasTotem);
  this._hasTotemOfUndying = hasTotem;
  this.app.fire("ui:setTotemOfUndying", this._hasTotemOfUndying);
  if (hasTotem) {
    this.rewardParticle.particlesystem.reset();
    this.rewardParticle.particlesystem.play();
  }
};

RainbowObby_CharacterController.prototype.setFlyingCarpet = function (
  hasFlyingCarpet
) {
  this.app.networking.command("hasFlyingCarpet", hasFlyingCarpet);
  this.app.networking.command("flyingCarpetActive", hasFlyingCarpet);
  this._hasFlyingCarpet = hasFlyingCarpet;
  this._flyingCarpetActive = hasFlyingCarpet;
};

RainbowObby_CharacterController.prototype.teleport = function (position) {
  this.entity.rigidbody.teleport(position);
};

RainbowObby_CharacterController.prototype._teleportToCheckpoint = function () {
  const currentCheckpoint = parseInt(
    RainbowObby_Storage.getItem("RainbowObby_currentCheckpoint") || "0"
  );
  const checkpoint = RainbowObby_Checkpoint.byNumber.get(currentCheckpoint);
  if (checkpoint) {
    const p = checkpoint.entity.getPosition().clone().add(new pc.Vec3(0, 2, 0));
    this.entity.rigidbody.teleport(p);
    this.entity.setPosition(p);
  }
};

RainbowObby_CharacterController.prototype._spawnDeadNoob = function () {
  if (this._deadNoobObject) {
    this._deadNoobObject.destroy();
    this._deadNoobObject = null;
  }
  this._deadNoobObject = this.deadNoobAsset.resource.instantiate();
  this._deadNoobObject.setPosition(this.entity.getPosition());
  this._deadNoobObject.setLocalEulerAngles(
    this.rotationTarget.getLocalEulerAngles()
  );
  this._deadNoobObject.reparent(this.entity.parent);

  this._deadNoobObject.script.RainbowObby_DeadNoob.setSkin(
    this._skin || "default"
  );
};

RainbowObby_CharacterController.prototype.die = function () {
  this._dead = true;
  // update server state here if local player
  if (this.isLocalPlayer) {
    this.app.networking.command("isAlive", false);
    this.app.fire("death");
    PokiSDK.gameplayStop();
  }
  this.soundComponent.sound.play("death");

  this._spawnDeadNoob();

  this.entity.enabled = false;
};

RainbowObby_CharacterController.prototype.setAlive = function () {
  // update server state here if local player
  if (this.isLocalPlayer) {
    this.app.networking.command("isAlive", true);
    if (!this.entity.enabled) {
      this.app.fire("respawn");
      this._didFirstMove = false;
    }
  }

  if (this._deadNoobObject) {
    this._deadNoobObject.destroy();
    this._deadNoobObject = null;
  }

  this.entity.enabled = true;

  setTimeout(() => {
    this._dead = false;
  }, 500);
};

RainbowObby_CharacterController.prototype.respawn = function () {
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
    this._teleportToCheckpoint();
    this.setAlive();
  });
};

RainbowObby_CharacterController.prototype.skipStage = function () {
  PokiSDK.rewardedBreak(() => {
    // you can pause any background music or other audio here
    this.app.isWatchingAd = true;
    this.app.systems.sound.volume = 0;
  }).then((success) => {
    if (success) {
      gameanalytics.GameAnalytics.addAdEvent(
        gameanalytics.EGAAdAction.Clicked,
        gameanalytics.EGAAdType.RewardedVideo,
        "poki",
        "ClassicObby"
      );

      const currentCheckpoint = parseInt(
        RainbowObby_Storage.getItem("RainbowObby_currentCheckpoint") || "0"
      );
      if (currentCheckpoint + 1 < RainbowObby_Checkpoint.byNumber.size) {
        RainbowObby_Storage.setItem(
          "RainbowObby_currentCheckpoint",
          currentCheckpoint + 1
        );
      }
    }
    this.app.isWatchingAd = false;
    this.app.systems.sound.volume = 1;
    this._teleportToCheckpoint();
    this.setAlive();
  });
};

RainbowObby_CharacterController.prototype.setNickname = function (nickname) {
  this.nameTag.element.text = nickname;
};
