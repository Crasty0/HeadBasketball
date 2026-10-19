export default class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    preload() {
        this.load.image('menuBg', 'Imgs/Manu.png');
    }

    create() {
        const { width, height } = this.scale;

        // fade in
        this.cameras.main.fadeIn(800);

        //  background
        this.menuBgImage = this.add.image(width / 2, height / 2, 'menuBg')
            .setDisplaySize(width, height)
            .setOrigin(0.5)
            .setDepth(-2);

        // dark overlay (IMPORTANT)
        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.45)
            .setDepth(-1);

        // TITLE
        this.title = this.add.text(width / 2, height * 0.25, 'HEAD BASKETBALL', {
            fontSize: '80px',
            fontFamily: 'Bangers',
            color: '#ffcc00',
            stroke: '#000000',
            strokeThickness: 8,
            shadow: {
                offsetX: 4,
                offsetY: 4,
                color: '#000000',
                blur: 5,
                fill: true
            }
        }).setOrigin(0.5);

        this.title.setColor('#ffcc00');

        this.title.setShadow(6, 6, '#000000', 0, true, true);

        // title animation (pulse)
        this.tweens.add({
            targets: this.title,
            scale: { from: 0.9, to: 1.1 },
            angle: { from: -2, to: 2 },
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // START TEXT
        this.startText = this.add.text(width / 2, height * 0.6, 'Press SPACE to start', {
            fontSize: '28px',
            fontFamily: 'Arial',
            color: '#ffff00',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // blink animation
        this.tweens.add({
            targets: this.startText,
            alpha: 0,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // input
        this.input.keyboard.on('keydown-SPACE', () => {
            this.cameras.main.fadeOut(300);

            this.time.delayedCall(300, () => {
                this.scene.start('GameScene');
            });
        });
    }
}