// javascript
export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    preload() {
        this.load.image('background', 'Imgs/background.png');
        this.load.image('boyLeft', 'Imgs/BoyLeft.png');
        this.load.image('boyRight', 'Imgs/BoyRight.png');
        this.load.image('boyLeftBall', 'Imgs/BoyLeftBall.png');
        this.load.image('boyRightBall', 'Imgs/BoyRightBall.png');
        this.load.image('ballImage', 'Imgs/ball.png');
        this.load.image('greenwin', 'Imgs/greenwin.png');
        this.load.image('orangewin', 'Imgs/orangewin.png');
    }

    create() {
        const { width, height } = this.scale;

        // background
        this.add.image(width / 2, height / 2, 'background')
            .setDisplaySize(width, height)
            .setOrigin(0.5, 0.5)
            .setDepth(-1);

        this.DEBUG = false;

        const PLAYER_SCALE_UP = 1.8;
        this.playerWidth = width * 0.05 * PLAYER_SCALE_UP;
        this.playerHeight = height * 0.15 * PLAYER_SCALE_UP;
        this.PICKUP_ZONE_SCALE = 0.6;
        this.PICKUP_DISTANCE_SCALE = 0.6;

        // integer radius for physics sizing
        this.ballRadius = Math.round(width * 0.02);

        this._screenWidth = width;
        this._screenHeight = height;

        this.ground = this.add.rectangle(
            width / 2,
            height - height * 0.03,
            width,
            height * 0.06,
            0x409597
        );
        this.physics.add.existing(this.ground, true);

        // PLAYER 1
        this.playerBaseTexture = 'boyRight';
        this.playerDefaultFacing = 'left';
        this.player = this.physics.add.sprite(width * 0.2, height - this.playerHeight, this.playerBaseTexture);
        this.player.setDisplaySize(this.playerWidth, this.playerHeight);
        this.player.setCollideWorldBounds(true);
        this.player.setBounce(0.1);
        this.facing = 'right';
        this.player.setFlipX(this.facing !== this.playerDefaultFacing);

        // PLAYER 2
        this.player2BaseTexture = 'boyLeft';
        this.player2DefaultFacing = 'right';
        this.player2 = this.physics.add.sprite(width * 0.8, height - this.playerHeight, this.player2BaseTexture);
        this.player2.setDisplaySize(this.playerWidth, this.playerHeight);
        this.player2.setCollideWorldBounds(true);
        this.player2.setBounce(0.1);
        this.facing2 = 'left';
        this.player2.setFlipX(this.facing2 !== this.player2DefaultFacing);

        // ball
        const diameter = this.ballRadius * 2;
        this.ball = this.physics.add.image(width / 2, height * 0.2, 'ballImage');
        this.ball.setDisplaySize(diameter, diameter);

        if (!this.physics.world.gravity || this.physics.world.gravity.y === 0) {
            this.physics.world.gravity.y = 800;
        }

        if (this.ball.body) {
            this.ball.body.setSize(this.ball.displayWidth, this.ball.displayHeight);
            const radius = Math.round(this.ball.displayWidth / 2);
            const offset = Math.round((this.ball.displayWidth - radius * 2) / 2);
            this.ball.body.setCircle(radius, offset, offset);
            this.ball.body.setAllowGravity(true);
            this.ball.body.setDamping(true);
            this.ball.body.setDrag(0.5);
            this.ball.body.setBounce(0.6);
            this.ball.body.setCollideWorldBounds(true);
        }

        // collisions
        this.physics.add.collider(this.player, this.ground);
        this.physics.add.collider(this.player2, this.ground);
        this.physics.add.collider(this.ball, this.ground);
        this.physics.add.collider(this.player, this.ball, this.handlePlayerBallCollision, null, this);
        this.physics.add.collider(this.player2, this.ball, this.handlePlayerBallCollision, null, this);
        this.physics.add.collider(this.player, this.player2);

        // pickup zones
        this.pickupZone = this.add.zone(this.player.x, this.player.y, this.playerWidth * this.PICKUP_ZONE_SCALE, this.playerHeight * this.PICKUP_ZONE_SCALE);
        this.physics.add.existing(this.pickupZone);
        this.pickupZone.body.setAllowGravity(false);
        this.pickupZone.body.setImmovable(true);

        this.pickupZone2 = this.add.zone(this.player2.x, this.player2.y, this.playerWidth * this.PICKUP_ZONE_SCALE, this.playerHeight * this.PICKUP_ZONE_SCALE);
        this.physics.add.existing(this.pickupZone2);
        this.pickupZone2.body.setAllowGravity(false);
        this.pickupZone2.body.setImmovable(true);

        this.physics.add.overlap(this.pickupZone, this.ball, this.handlePlayerBallCollision, null, this);
        this.physics.add.overlap(this.pickupZone2, this.ball, this.handlePlayerBallCollision, null, this);

        // input
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });
        this.playerShootKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);

        this.cursors = this.input.keyboard.createCursorKeys();
        this.player2Shoot = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);

        this.canPickup = true;
        this.canPickup2 = true;

        this.hasBall = false;
        this.hasBall2 = false;

        this.ballOffsetY = -this.playerHeight * 0.85;

        // goals
        const goalWidthBase = Math.max(width * 0.06, 60);
        const goalHeightBase = Math.max(height * 0.25, 80);
        const goalWidth = Math.round(goalWidthBase * 0.6);
        const goalHeight = Math.round(goalHeightBase * 0.4);
        const midY = height * 0.26;

        const leftGoalX = goalWidth / 2 + 80;
        const rightGoalX = width - goalWidth / 2 - 80;

        this.leftGoalVisual = this.add.rectangle(leftGoalX, midY, goalWidth, goalHeight, 0x0033ff, 0);
        this.rightGoalVisual = this.add.rectangle(rightGoalX, midY, goalWidth, goalHeight, 0xff3300, 0);

        this.leftGoalRect = new Phaser.Geom.Rectangle(leftGoalX - goalWidth / 2, midY - goalHeight / 2, goalWidth, goalHeight);
        this.rightGoalRect = new Phaser.Geom.Rectangle(rightGoalX - goalWidth / 2, midY - goalHeight / 2, goalWidth, goalHeight);

        // scores + backgrounds
        this.score1 = 0;
        this.score2 = 0;

        const scoreStyle1 = { fontSize: '20px', color: '#036617' };
        const scoreStyle2 = { fontSize: '20px', color: '#664303' };
        this.scoreText1 = this.add.text(15, 80, `Green: ${this.score1}`, scoreStyle1).setDepth(5);
        this.scoreText2 = this.add.text(width - 110, 80, `Orange: ${this.score2}`, scoreStyle2).setDepth(5);

        const pad = 6;
        const b1 = this.scoreText1.getBounds();
        this.scoreTextBg1 = this.add.graphics()
            .fillStyle(0xffffff, 0.8)
            .fillRoundedRect(b1.x - pad, b1.y - pad, b1.width + pad * 2, b1.height + pad * 2, 6)
            .setDepth(4);

        const b2 = this.scoreText2.getBounds();
        this.scoreTextBg2 = this.add.graphics()
            .fillStyle(0xffffff, 0.8)
            .fillRoundedRect(b2.x - pad, b2.y - pad, b2.width + pad * 2, b2.height + pad * 2, 6)
            .setDepth(4);

        // round / timer setup
        this.roundDuration = 15;
        this.remainingTime = this.roundDuration;
        this._roundOver = false;

        const timerStyle = { fontSize: '20px', color: '#000000' };
        this.timerText = this.add.text(width / 2, 12, this._formatTime(this.remainingTime), timerStyle)
            .setOrigin(0.5, 0)
            .setDepth(5);

        // timer event that ticks every second
        this.timerEvent = this.time.addEvent({
            delay: 1000,
            callback: this._tickTimer,
            callbackScope: this,
            loop: true
        });

        this._scoringInProgress = false;
    }

    _formatTime(seconds) {
        const s = Math.max(0, seconds);
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec.toString().padStart(2, '0')}`;
    }

    _tickTimer() {
        if (this._roundOver) return;
        this.remainingTime -= 1;
        if (this.timerText) this.timerText.setText(this._formatTime(this.remainingTime));
        if (this.remainingTime <= 0) {
            this._endRound();
        }
    }

    _endRound() {
        if (this._roundOver) return;
        this._roundOver = true;

        if (this.physics && this.physics.world) this.physics.world.pause();
        if (this.timerEvent) this.timerEvent.remove(false);

        let winnerMsg = 'Draw!';
        let winnerKey = null;
        if (this.score1 > this.score2) { winnerMsg = 'Green Wins!'; winnerKey = 'greenwin'; }
        else if (this.score2 > this.score1) { winnerMsg = 'Orange Wins!'; winnerKey = 'orangewin'; }

        const { width, height } = this.scale;

        // dim background
        this.winnerDim = this.add.rectangle(width / 2, height / 2, width, height, 0xffffff, 1)
            .setDepth(20)
            .setAlpha(0);

        this.tweens.add({
            targets: this.winnerDim,
            alpha: 1,
            duration: 400,
            ease: 'Quad.easeOut'
        });

        // if we have a winner image, show it; otherwise show text
        if (winnerKey && this.textures.exists(winnerKey)) {
            // slightly smaller final image
            const imgY = height / 2 - 10;
            const maxW = Math.min(width * 0.7, 900) * 0.75; // reduced to 75% to be "a bit smaller"
            const maxH = Math.min(height * 0.35, 400) * 0.75;

            const img = this.add.image(width / 2, imgY, winnerKey)
                .setOrigin(0.5)
                .setDepth(21)
                .setAlpha(0)
                .setScale(0.8);

            img.setDisplaySize(maxW, maxH);

            // title text above image, black color, higher depth so it sits on top
            this.winnerTitle = this.add.text(width / 2, imgY - (maxH / 2) - 28, winnerMsg, { fontSize: '44px', color: '#000000', align: 'center', fontStyle: 'bold' })
                .setOrigin(0.5)
                .setDepth(22)
                .setAlpha(0);

            this.tweens.add({
                targets: this.winnerTitle,
                alpha: 1,
                y: this.winnerTitle.y + 6,
                duration: 600,
                ease: 'Back.easeOut'
            });

            this.tweens.add({
                targets: img,
                alpha: 1,
                scale: 1.0,
                duration: 700,
                delay: 120,
                ease: 'Back.easeOut'
            });

            const scoreSummary = `Final Score — Green: ${this.score1}  |  Orange: ${this.score2}`;
            this.winnerSub = this.add.text(width / 2, imgY + (maxH / 2) + 18, scoreSummary, { fontSize: '20px', color: '#000000' })
                .setOrigin(0.5)
                .setDepth(22)
                .setAlpha(0);

            this.tweens.add({
                targets: this.winnerSub,
                alpha: 1,
                duration: 600,
                delay: 240,
                ease: 'Quad.easeOut'
            });
        } else {
            // fallback: animated black text (no image) shown centered
            const titleStyle = { fontSize: '56px', color: '#000000', fontStyle: 'bold' };
            const subStyle = { fontSize: '24px', color: '#000000' };

            this.winnerText = this.add.text(width / 2, height / 2 - 30, winnerMsg, titleStyle)
                .setOrigin(0.5)
                .setDepth(21)
                .setAlpha(0)
                .setScale(0.6);

            const scoreSummary = `Final Score — Green: ${this.score1}  |  Orange: ${this.score2}`;
            this.winnerSub = this.add.text(width / 2, height / 2 + 30, scoreSummary, subStyle)
                .setOrigin(0.5)
                .setDepth(21)
                .setAlpha(0);

            this.tweens.add({
                targets: this.winnerText,
                alpha: 1,
                scale: 1.05,
                duration: 700,
                ease: 'Back.easeOut',
            });
            this.tweens.add({
                targets: this.winnerSub,
                alpha: 1,
                duration: 600,
                delay: 400,
                ease: 'Quad.easeOut'
            });
        }
    }

    handlePlayerBallCollision(playerOrZone, ball) {
        if (ball && ball.body && ball.body.enable === false) return;

        let playerIndex = 0;
        if (playerOrZone === this.player || playerOrZone === this.pickupZone) playerIndex = 1;
        else if (playerOrZone === this.player2 || playerOrZone === this.pickupZone2) playerIndex = 2;

        if (playerIndex === 1) {
            if (!this.hasBall && this.canPickup) {
                this.hasBall = true;
                if (ball && ball.body) {
                    ball.body.setVelocity(0, 0);
                    ball.body.enable = false;
                }
                if (this.ball) this.ball.setVisible(false);
            }
        } else if (playerIndex === 2) {
            if (!this.hasBall2 && this.canPickup2) {
                this.hasBall2 = true;
                if (ball && ball.body) {
                    ball.body.setVelocity(0, 0);
                    ball.body.enable = false;
                }
                if (this.ball) this.ball.setVisible(false);
            }
        }
    }

    shootPlayer2() {
        if (!this.hasBall2) return;
        this.hasBall2 = false;
        if (this.DEBUG) console.log('DEBUG: shootPlayer2() called');
        if (this.ball && this.ball.body) this.ball.body.enable = true;
        let forceX2 = this.facing2 === 'right' ? 1200 : -1200;
        if (this.ball && this.ball.body) this.ball.body.setVelocity(forceX2, -400);
        if (this.ball) this.ball.setVisible(true);
        this.canPickup2 = false;
        this.time.delayedCall(300, () => {
            this.canPickup2 = true;
        });
    }

    _handleScore(playerIndex) {
        if (this._scoringInProgress) return;
        this._scoringInProgress = true;

        if (this.ball && this.ball.body) {
            this.ball.body.setVelocity(0, 0);
            this.ball.body.enable = false;
        }
        this.hasBall = false;
        this.hasBall2 = false;

        if (playerIndex === 1) {
            this.score1++;
            this.scoreText1.setText(`Green: ${this.score1}`);
        } else if (playerIndex === 2) {
            this.score2++;
            this.scoreText2.setText(`Orange: ${this.score2}`);
        }

        // update score backgrounds
        const pad = 6;
        const b1 = this.scoreText1.getBounds();
        this.scoreTextBg1.clear()
            .fillStyle(0xffffff, 0.8)
            .fillRoundedRect(b1.x - pad, b1.y - pad, b1.width + pad * 2, b1.height + pad * 2, 6);

        const b2 = this.scoreText2.getBounds();
        this.scoreTextBg2.clear()
            .fillStyle(0xffffff, 0.8)
            .fillRoundedRect(b2.x - pad, b2.y - pad, b2.width + pad * 2, b2.height + pad * 2, 6);

        this.time.delayedCall(350, () => {
            this._resetAfterScore();
            this._scoringInProgress = false;
        });
    }

    _resetAfterScore() {
        const width = this._screenWidth;
        const height = this._screenHeight;

        this.player.x = width * 0.2;
        this.player.y = height - this.playerHeight;
        if (this.player.body) this.player.body.reset(this.player.x, this.player.y);

        this.player2.x = width * 0.8;
        this.player2.y = height - this.playerHeight;
        if (this.player2.body) this.player2.body.reset(this.player2.x, this.player2.y);

        this.ball.x = width / 2;
        this.ball.y = height * 0.2;
        if (this.ball.body) {
            this.ball.body.enable = true;
            this.ball.body.setVelocity(0, 0);
            this.ball.body.reset(this.ball.x, this.ball.y);
        }

        if (this.ball) this.ball.setVisible(true);

        this.hasBall = false;
        this.hasBall2 = false;

        this.canPickup = false;
        this.canPickup2 = false;
        this.time.delayedCall(300, () => {
            this.canPickup = true;
            this.canPickup2 = true;
        });
    }

    update() {
        if (this._roundOver) return;

        const baseSpeed = 300;
        const speed1 = baseSpeed * (this.hasBall ? 0.9 : 1);
        const speed2 = baseSpeed * (this.hasBall2 ? 0.9 : 1);

        if (this.pickupZone) {
            this.pickupZone.x = this.player.x;
            this.pickupZone.y = this.player.y;
            if (this.pickupZone.body) this.pickupZone.body.reset(this.pickupZone.x, this.pickupZone.y);
        }
        if (this.pickupZone2) {
            this.pickupZone2.x = this.player2.x;
            this.pickupZone2.y = this.player2.y;
            if (this.pickupZone2.body) this.pickupZone2.body.reset(this.pickupZone2.x, this.pickupZone2.y);
        }

        // player 1 movement (W A D)
        if (this.wasd.left.isDown) {
            this.player.body.setVelocityX(-speed1);
            this.facing = 'left';
        } else if (this.wasd.right.isDown) {
            this.player.body.setVelocityX(speed1);
            this.facing = 'right';
        } else {
            this.player.body.setVelocityX(0);
        }
        if (this.wasd.up.isDown && this.player.body.touching.down) {
            this.player.body.setVelocityY(-700);
        }

        if (this.player) {
            const tex = this.hasBall ? 'boyRightBall' : this.playerBaseTexture;
            this.player.setTexture(tex);
            this.player.setFlipX(this.facing !== this.playerDefaultFacing);
        }

        // player 2 movement (arrow keys)
        if (this.cursors.left.isDown) {
            this.player2.body.setVelocityX(-speed2);
            this.facing2 = 'left';
        } else if (this.cursors.right.isDown) {
            this.player2.body.setVelocityX(speed2);
            this.facing2 = 'right';
        } else {
            this.player2.body.setVelocityX(0);
        }
        if (this.cursors.up.isDown && this.player2.body.touching.down) {
            this.player2.body.setVelocityY(-700);
        }

        if (this.player2) {
            const tex = this.hasBall2 ? 'boyLeftBall' : this.player2BaseTexture;
            this.player2.setTexture(tex);
            this.player2.setFlipX(this.facing2 !== this.player2DefaultFacing);
        }

        // fallback pickup by distance
        if (!this.hasBall && this.canPickup && this.ball) {
            const pickupDist = Math.max(this.playerWidth, this.playerHeight) * this.PICKUP_DISTANCE_SCALE;
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.ball.x, this.ball.y);
            if (dist <= pickupDist) {
                this.hasBall = true;
                if (this.ball.body) {
                    this.ball.body.setVelocity(0, 0);
                    this.ball.body.enable = false;
                }
                if (this.ball) this.ball.setVisible(false);
            }
        }
        if (!this.hasBall2 && this.canPickup2 && this.ball) {
            const pickupDist2 = Math.max(this.playerWidth, this.playerHeight) * this.PICKUP_DISTANCE_SCALE;
            const dist2 = Phaser.Math.Distance.Between(this.player2.x, this.player2.y, this.ball.x, this.ball.y);
            if (dist2 <= pickupDist2) {
                this.hasBall2 = true;
                if (this.ball.body) {
                    this.ball.body.setVelocity(0, 0);
                    this.ball.body.enable = false;
                }
                if (this.ball) this.ball.setVisible(false);
            }
        }

        // attach ball to holder and ensure visibility
        if (this.hasBall) {
            if (this.ball) this.ball.setVisible(false);
            if (this.ball) {
                this.ball.x = this.player.x;
                this.ball.y = (this.player.y + this.ballOffsetY) * 1.1;
            }
        } else if (this.hasBall2) {
            if (this.ball) this.ball.setVisible(false);
            if (this.ball) {
                this.ball.x = this.player2.x;
                this.ball.y = (this.player2.y + this.ballOffsetY) * 1.1;
            }
        } else {
            if (this.ball) this.ball.setVisible(true);
        }

        // GOAL CHECKS
        if (!this._scoringInProgress && this.ball) {
            if (Phaser.Geom.Rectangle.Contains(this.rightGoalRect, this.ball.x, this.ball.y)) {
                this._handleScore(1);
            } else if (Phaser.Geom.Rectangle.Contains(this.leftGoalRect, this.ball.x, this.ball.y)) {
                this._handleScore(2);
            }
        }

        // player 1 shoot (S)
        if (Phaser.Input.Keyboard.JustDown(this.playerShootKey) && this.hasBall && this.canPickup) {
            this.hasBall = false;
            if (this.ball.body) this.ball.body.enable = true;
            let forceX = this.facing === 'right' ? 1200 : -1200;
            if (this.ball && this.ball.body) this.ball.body.setVelocity(forceX, -400);
            if (this.ball) this.ball.setVisible(true);
            this.canPickup = false;
            this.time.delayedCall(300, () => {
                this.canPickup = true;
            });
        }

        // player 2 shoot (DOWN)
        if (Phaser.Input.Keyboard.JustDown(this.player2Shoot) && this.hasBall2 && this.canPickup2) {
            this.shootPlayer2();
        }
    }
}