"use strict";

function Stick(position) {
    this.position = position;
    this.origin = new Vector2(970, 11);
    this.shotOrigin = new Vector2(950, 11);
    this.shooting = false;
    this.visible = true;
    this.rotation = 0;
    this.power = 0;
    this.trackMouse = true;
    this.tacoPosition = new Vector2(58, 325); // Posição inicial do taco
    this.tacoRotation = 0; // Rotação inicial do taco
    this.tacoScale = 1.0; // Escala inicial do taco
    this.tacoOrigin = new Vector2(0, 0); // Ponto de origem inicial do taco
    this.blackImage = new Image();
    this.blackImage.src = "assets/sprites/black.png";
}

window.addEventListener("contextmenu", function (event) {
    event.preventDefault();
}, false);

Stick.prototype.handleInput = function (delta) {

    if (AI_ON && Game.policy.turn === AI_PLAYER_NUM)
        return;

    if (Game.policy.turnPlayed)
        return;

    if (Keyboard.down(Keys.S) && KEYBOARD_INPUT_ON) {
        if (this.power < 63) {
            this.origin.x += 2;
            this.power += 1.2;
            this.tacoPosition.y = this.tacoPosition.y +4; // Altera a posição y do taco
        }
    }

    if (Keyboard.down(Keys.D) && KEYBOARD_INPUT_ON) {
        if (this.power > 0) {
            this.origin.x -= 2;
            this.power -= 1.2;
            this.rotation = Math.atan2(opposite, adjacent);
            this.tacoPosition.y = this.tacoPosition.y-4; // Altera a posição y do taco
        }
    }


    else if (this.power > 0 && Mouse.left.down) {
        var strike = sounds.strike.cloneNode(true);
        strike.volume = (this.power / 10) < 1 ? (this.power / 10) : 1;
        strike.play();
        Game.policy.turnPlayed = true;
        this.shooting = true;
        this.origin = this.shotOrigin.copy();
        this.tacoPosition = new Vector2(58, 325)

        Game.gameWorld.whiteBall.shoot(this.power, this.rotation);
        var stick = this;
       
        setTimeout(function () { stick.visible = false; }, 100);

    }
    else if (this.trackMouse) {
        var opposite = Mouse.position.y - this.position.y;
        var adjacent = Mouse.position.x - this.position.x;
        this.rotation = Math.atan2(opposite, adjacent);
    }
};

Stick.prototype.shoot = function (power, rotation) {
    this.power = power;
    this.rotation = rotation;

    if (Game.sound && SOUND_ON) {
        var strike = sounds.strike.cloneNode(true);
        strike.volume = (this.power / (10)) < 1 ? (this.power / (10)) : 1;
        strike.play();
    }
    Game.policy.turnPlayed = true;
    this.shooting = true;
    this.origin = this.shotOrigin.copy();

    Game.gameWorld.whiteBall.shoot(this.power, this.rotation);
    var stick = this;
    setTimeout(function () { stick.visible = false; }, 500);
}

Stick.prototype.update = function () {
    // stick angle definition
    var opposite = Mouse.position.y - this.position.y;
    var adjacent = Mouse.position.x - this.position.x;
    this.rotation = Math.atan2(opposite, adjacent);

    if (this.shooting && !Game.gameWorld.whiteBall.moving)
        this.reset();
};

Stick.prototype.reset = function () {
    this.position.x = Game.gameWorld.whiteBall.position.x;
    this.position.y = Game.gameWorld.whiteBall.position.y;
    this.origin = new Vector2(970, 11);
    this.shooting = false;
    this.power = 0;

    var stick = this;

    stick.visible = true; 

};


Stick.prototype.draw = function () {
    Canvas2D.drawImage(this.blackImage, new Vector2(22, 602), 0, 1, new Vector2(0, 0));
    if (!this.visible)
        return;
    
    Canvas2D.drawSprite(sprites.taco, this.tacoPosition, this.tacoRotation, 1, this.tacoOrigin);

    
    Canvas2D.drawImage(sprites.stick, this.position, this.rotation, 1, this.origin);

};
