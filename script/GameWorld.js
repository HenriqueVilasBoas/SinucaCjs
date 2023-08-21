"use strict";

function GameWorld() {


    this.hudPowerSprite = new Image();
    this.hudPowerSprite.src = "assets/sprites/hudpower.png";
    this.whiteBallStartingPosition = new Vector2(413, 413);
    this.more = 60;
    this.hudPowerSpriteScale = 1; // Initial scale value
    this.hudPowerScaleTime = 0;
    this.redBalls = [
        new Ball(new Vector2(1056, 433 + this.more), Color.red),//3
        new Ball(new Vector2(1090, 374 + this.more), Color.red),//4
        new Ball(new Vector2(1126, 393 + this.more), Color.red),//8
        new Ball(new Vector2(1126, 472 + this.more), Color.red),//10;
        new Ball(new Vector2(1162, 335 + this.more), Color.red),//11
        new Ball(new Vector2(1162, 374 + this.more), Color.red),//12
        new Ball(new Vector2(1162, 452 + this.more), Color.red),//14
    ];

    this.yellowBalls = [
        new Ball(new Vector2(1022, 413 + this.more), Color.yellow),//1
        new Ball(new Vector2(1056, 393 + this.more), Color.yellow),//2
        new Ball(new Vector2(1090, 452 + this.more), Color.yellow),//6
        new Ball(new Vector2(1126, 354 + this.more), Color.yellow),//7
        new Ball(new Vector2(1126, 433 + this.more), Color.yellow),//9
        new Ball(new Vector2(1162, 413 + this.more), Color.yellow),//13
        new Ball(new Vector2(1162, 491 + this.more), Color.yellow),//15
    ];

    this.whiteBall = new Ball(new Vector2(413, 413 + this.more), Color.white);
    this.blackBall = new Ball(new Vector2(1090, 413 + this.more), Color.black);

    this.balls = [
        this.yellowBalls[0],
        this.yellowBalls[1],
        this.redBalls[0],
        this.redBalls[1],
        this.blackBall,
        this.yellowBalls[2],
        this.yellowBalls[3],
        this.redBalls[2],
        this.yellowBalls[4],
        this.redBalls[3],
        this.redBalls[4],
        this.redBalls[5],
        this.yellowBalls[5],
        this.redBalls[6],
        this.yellowBalls[6],
        this.whiteBall]

    this.stick = new Stick({ x: 413, y: 413 + this.more });

    this.gameOver = false;

}

GameWorld.prototype.getBallsSetByColor = function (color) {

    if (color === Color.red) {
        return this.redBalls;
    }
    if (color === Color.yellow) {
        return this.yellowBalls;
    }
    if (color === Color.white) {
        return this.whiteBall;
    }
    if (color === Color.black) {
        return this.blackBall;
    }
}

GameWorld.prototype.handleInput = function (delta) {
    this.stick.handleInput(delta);
};

GameWorld.prototype.update = function (delta) {
    this.stick.update(delta);

    for (var i = 0; i < this.balls.length; i++) {
        for (var j = i + 1; j < this.balls.length; j++) {
            this.handleCollision(this.balls[i], this.balls[j], delta);
        }
    }
    this.updateHudPowerScale(delta);
    for (var i = 0; i < this.balls.length; i++) {
        this.balls[i].update(delta);
    }

    if (!this.ballsMoving() && AI.finishedSession) {
        Game.policy.updateTurnOutcome();
        if (Game.policy.foul) {
            this.ballInHand();
        }
    }

};



GameWorld.prototype.ballInHand = function () {
    if (AI_ON && Game.policy.turn === AI_PLAYER_NUM) {
        return;
    }

    KEYBOARD_INPUT_ON = false;
    this.stick.visible = false;
    if (!Mouse.left.down) {
        this.whiteBall.position = Mouse.position;
    }
    else {
        let ballsOverlap = this.whiteBallOverlapsBalls();

        if (!Game.policy.isOutsideBorder(Mouse.position, this.whiteBall.origin) &&
            !Game.policy.isInsideHole(Mouse.position) &&
            !ballsOverlap) {
            KEYBOARD_INPUT_ON = true;
            Keyboard.reset();
            Mouse.reset();
            this.whiteBall.position = Mouse.position;
            this.whiteBall.inHole = false;
            Game.policy.foul = false;
            this.stick.position = this.whiteBall.position;
            this.stick.visible = true;
        }
    }

}

GameWorld.prototype.whiteBallOverlapsBalls = function () {

    let ballsOverlap = false;
    for (var i = 0; i < this.balls.length; i++) {
        if (this.whiteBall !== this.balls[i]) {
            if (this.whiteBall.position.distanceFrom(this.balls[i].position) < BALL_SIZE) {
                ballsOverlap = true;
            }
        }
    }

    return ballsOverlap;
}

GameWorld.prototype.ballsMoving = function () {

    var ballsMoving = false;

    for (var i = 0; i < this.balls.length; i++) {
        if (this.balls[i].moving) {
            ballsMoving = true;
        }
    }

    return ballsMoving;
}

GameWorld.prototype.handleCollision = function (ball1, ball2, delta) {

    if (ball1.inHole || ball2.inHole)
        return;

    if (!ball1.moving && !ball2.moving)
        return;

    var ball1NewPos = ball1.position.add(ball1.velocity.multiply(delta));
    var ball2NewPos = ball2.position.add(ball2.velocity.multiply(delta));

    var dist = ball1NewPos.distanceFrom(ball2NewPos);

    if (dist < BALL_SIZE) {
        Game.policy.checkColisionValidity(ball1, ball2);

        var power = (Math.abs(ball1.velocity.x) + Math.abs(ball1.velocity.y)) +
            (Math.abs(ball2.velocity.x) + Math.abs(ball2.velocity.y));
        power = power * 0.00382;

        if (Game.sound && SOUND_ON) {
            var ballsCollide = sounds.ballsCollide.cloneNode(true);
            ballsCollide.volume = (power / (20)) < 1 ? (power / (20)) : 1;
            ballsCollide.play();
        }

        var opposite = ball1.position.y - ball2.position.y;
        var adjacent = ball1.position.x - ball2.position.x;
        var rotation = Math.atan2(opposite, adjacent);

        ball1.moving = true;
        ball2.moving = true;

        var velocity2 = new Vector2(90 * Math.cos(rotation + Math.PI) * power, 90 * Math.sin(rotation + Math.PI) * power);
        ball2.velocity = ball2.velocity.addTo(velocity2);

        ball2.velocity.multiplyWith(0.97);

        var velocity1 = new Vector2(90 * Math.cos(rotation) * power, 90 * Math.sin(rotation) * power);
        ball1.velocity = ball1.velocity.addTo(velocity1);

        ball1.velocity.multiplyWith(0.97);
    }

}
// Atualize a função updateHudPowerScale
// Atualize a função updateHudPowerScale
GameWorld.prototype.updateHudPowerScale = function (delta) {
    if (!this.whiteBall.moving) {
        if (this.hudPowerScaleTime === undefined) {
            this.hudPowerScaleTime = 0;
        }

        this.hudPowerScaleTime += delta;

        if (this.hudPowerScaleTime >= 0.1) {
            this.hudPowerSpriteScale = this.hudPowerSpriteScale || 0.;

            var circlePosition = new Vector2(
                this.whiteBall.position.x + this.hudPowerSprite.width * Math.cos(this.stick.angle),
                this.whiteBall.position.y + this.hudPowerSprite.width * Math.sin(this.stick.angle)
            );

            var allBalls = this.redBalls.concat(this.yellowBalls, this.blackBall);
            var isCollision = false;

            for (var i = 0; i < allBalls.length; i++) {
                var distance = circlePosition.distanceFrom(allBalls[i].position);
                if (distance < 70) { // Alterado o limite para 70 pixels
                    isCollision = true;
                    break;
                }
            }

            if (!isCollision) {
                this.hudPowerSpriteScale += 0.02;
                
            } else {
                this.hudPowerSpriteScale *= (1 - ((2 * 100) / this.hudPowerSprite.width) / 100);
                // Adicione a quantidade desejada para aumentar o tamanho
            }

            this.hudPowerScaleTime = 0;
        }
    } else {
        this.hudPowerScaleTime = undefined;
    }
};


GameWorld.prototype.updateHudCirclePosition = function () {
    var mousePosition = Mouse.position;
    var whiteBallPosition = this.whiteBall.position;

    // Calcula o ângulo entre o mouse e a bola branca
    var angle = Math.atan2(mousePosition.y - whiteBallPosition.y, mousePosition.x - whiteBallPosition.x);

    var hudPowerPosition = new Vector2(whiteBallPosition.x, whiteBallPosition.y - 2);
    var hudOtherPosition = new Vector2(
        (hudPowerPosition.x + this.hudPowerSprite.width * Math.cos(angle)),
        (hudPowerPosition.y + this.hudPowerSprite.width * Math.sin(angle))
    );
    this.circlePosition = new Vector2(hudOtherPosition.x, hudOtherPosition.y);

    // Calcula a posição da borda oposta baseada no ângulo e na distância
    var distanceToEdge = (this.hudPowerSprite.width * -1) * this.hudPowerSpriteScale; // metade da largura da sprite
    var oppositeAngle = angle + Math.PI; // ângulo oposto
    var oppositePosition = new Vector2(
        hudPowerPosition.x + distanceToEdge * Math.cos(oppositeAngle),
        hudPowerPosition.y + distanceToEdge * Math.sin(oppositeAngle)
    );

    this.oppositeCirclePosition = oppositePosition;
};

GameWorld.prototype.update = function (delta) {
    this.stick.update(delta);

    for (var i = 0; i < this.balls.length; i++) {
        for (var j = i + 1; j < this.balls.length; j++) {
            this.handleCollision(this.balls[i], this.balls[j], delta);
        }
    }

    this.updateHudPowerScale(delta);
    this.updateHudCirclePosition(); // Atualiza a posição do círculo a cada frame

    for (var i = 0; i < this.balls.length; i++) {
        this.balls[i].update(delta);
    }

    if (!this.ballsMoving() && AI.finishedSession) {
        Game.policy.updateTurnOutcome();
        if (Game.policy.foul) {
            this.ballInHand();
        }
    }
};
GameWorld.prototype.draw = function () {
    Canvas2D.drawImage(sprites.background);
    Game.policy.drawScores();

    for (var i = 0; i < this.balls.length; i++) {
        this.balls[i].draw();
    }

    var hudPowerSprite = new Image();
    hudPowerSprite.src = "assets/sprites/hudpower.png";

    var mousePosition = Mouse.position;
    var whiteBallPosition = this.whiteBall.position;

    // Calcula a distância entre o mouse e a bola branca
    var distanceToWhiteBall = mousePosition.distanceFrom(whiteBallPosition);

    // Verifica se a distância é maior que 20 pixels
    var isMouseNearWhiteBall = distanceToWhiteBall > 20;

    // Se a bola branca estiver parada, dentro da tela e a distância for maior que 20 pixels, realiza as ações
    if (!this.whiteBall.moving && isMouseNearWhiteBall &&
        whiteBallPosition.x >= 0 && whiteBallPosition.x <= Game.size.x &&
        whiteBallPosition.y >= 0 && whiteBallPosition.y <= Game.size.y) {

        // Calcula o ângulo entre o mouse e a bola branca
        var angle = Math.atan2(mousePosition.y - whiteBallPosition.y, mousePosition.x - whiteBallPosition.x);

        // Define a posição da sprite hudPower na posição da bola branca

        var hudPowerPosition = new Vector2(whiteBallPosition.x, whiteBallPosition.y - 2);
        var hudOtherPosition = new Vector2(
            (hudPowerPosition.x + hudPowerSprite.width * Math.cos(angle)),
            (hudPowerPosition.y + hudPowerSprite.width * Math.sin(angle))
        );
        var circlePosition = new Vector2(hudOtherPosition.x, hudOtherPosition.y);


        // DEFINITIVAMENTE A POSIÇÃO DA MIRA
        var shiftedPosition = new Vector2(this.oppositeCirclePosition.x, this.oppositeCirclePosition.y);

        Canvas2D.drawSprite(sprites.circle, shiftedPosition, angle, 1.0, new Vector2(sprites.circle.width / 10, sprites.circle.height / 2));


        Canvas2D.drawSprite(hudPowerSprite, hudPowerPosition, angle, this.hudPowerSpriteScale);

        // Ajusta o ângulo do stick para acompanhar o mouse
        this.stick.angle = angle;

        // Define stick como visível
        this.stick.visible = true;
    } else {
        // Caso contrário, define stick e hudPower como invisíveis
        this.stick.visible = false;
    }

    this.stick.draw();
};





// Função para verificar se a hudPower está em contato com alguma bola
GameWorld.prototype.isHudPowerInContact = function (position) {
    for (var i = 0; i < this.balls.length; i++) {
        var distance = position.distanceFrom(this.balls[i].position);
        if (distance < BALL_SIZE) {
            return true;
        }
    }
    return false;
};
GameWorld.prototype.reset = function () {
    this.gameOver = false;

    for (var i = 0; i < this.balls.length; i++) {
        this.balls[i].reset();
    }

    this.stick.reset();

    if (AI_ON && AI_PLAYER_NUM === 0) {
        AI.startSession();
    }
};

GameWorld.prototype.initiateState = function (balls) {

    for (var i = 0; i < this.balls.length; i++) {
        this.balls[i].position.x = balls[i].position.x;
        this.balls[i].position.y = balls[i].position.y;
        this.balls[i].visible = balls[i].visible;
        this.balls[i].inHole = balls[i].inHole;
    }

    this.stick.position = this.whiteBall.position;
}