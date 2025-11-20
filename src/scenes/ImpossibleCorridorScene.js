import * as Tone from 'tone';

export default class ImpossibleCorridorScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ImpossibleCorridorScene' });
    }

    create() {
        this.cameras.main.setBackgroundColor('#000000');

        // State
        this.lives = 3;
        this.score = 0;
        this.gameSpeed = 2; // Vertical scroll speed
        this.pathWidth = 60; // Radius of safe zone
        this.isGameOver = false;
        this.devMode = false;
        this.distanceTraveled = 0;

        // Seed Logic (Weekly)
        const now = new Date();
        const oneJan = new Date(now.getFullYear(), 0, 1);
        const numberOfDays = Math.floor((now - oneJan) / (24 * 60 * 60 * 1000));
        const weekNum = Math.ceil((now.getDay() + 1 + numberOfDays) / 7);
        this.seed = `week_${now.getFullYear()}_${weekNum}`;
        this.rng = new Phaser.Math.RandomDataGenerator([this.seed]);

        // Path Generation
        this.pathPoints = [];
        this.generatePath();

        // Player
        this.player = this.add.circle(this.cameras.main.centerX, this.cameras.main.height - 100, 10, 0x00ffff);
        this.physics.add.existing(this.player);
        this.player.body.setCircle(10);
        this.player.body.setCollideWorldBounds(true);

        // Visuals
        this.createVisuals();

        // Audio
        this.setupAudio();

        // UI
        this.createUI();

        // Input
        this.input.on('pointermove', this.handleInput, this);
    }

    setupAudio() {
        // Safe Hum
        this.humSynth = new Tone.Oscillator({
            type: "sine",
            frequency: 100,
            volume: -10
        }).toDestination().start();

        // Danger Cue
        this.dangerSynth = new Tone.Distortion(0.8).toDestination();
        this.dangerOsc = new Tone.Oscillator({
            type: "sawtooth",
            frequency: 50,
            volume: -100
        }).connect(this.dangerSynth).start();

        // Life Up
        this.lifeSynth = new Tone.PolySynth(Tone.Synth).toDestination();

        // Death
        this.deathSynth = new Tone.NoiseSynth().toDestination();
    }

    generatePath() {
        // Generate a long winding path
        let x = this.cameras.main.centerX;
        let y = this.cameras.main.height;

        for (let i = 0; i < 1000; i++) {
            this.pathPoints.push({ x, y });
            y -= 20; // Step up

            // Wiggle x
            const change = this.rng.between(-20, 20);
            x += change;
            x = Phaser.Math.Clamp(x, 50, this.cameras.main.width - 50);
        }
    }

    createVisuals() {
        // Dev Mode Graphics
        this.devGraphics = this.add.graphics();
        this.devGraphics.setDepth(10);
        this.devGraphics.setVisible(false);

        // Player Aura
        this.aura = this.add.circle(this.player.x, this.player.y, 20, 0x00ffff, 0.3);
    }

    createUI() {
        this.scoreText = this.add.text(20, 20, 'Score: 0', { fontSize: '24px', fill: '#fff' }).setScrollFactor(0).setDepth(100);
        this.livesText = this.add.text(20, 50, 'Lives: 3', { fontSize: '24px', fill: '#ff0000' }).setScrollFactor(0).setDepth(100);

        this.devBtn = this.add.text(this.cameras.main.width - 40, 20, 'V', { fontSize: '24px', fill: '#fff' })
            .setInteractive()
            .setScrollFactor(0)
            .setDepth(100)
            .on('pointerdown', () => {
                this.devMode = !this.devMode;
                this.devGraphics.setVisible(this.devMode);
            });

        this.add.text(20, 80, '← Back', { fontSize: '24px', fill: '#fff' })
            .setInteractive()
            .setScrollFactor(0)
            .setDepth(100)
            .on('pointerdown', () => {
                this.cleanup();
                this.scene.start('HubScene');
            });
    }

    handleInput(pointer) {
        if (this.isGameOver) return;
        // Smooth follow with lerp
        this.targetX = pointer.x;
    }

    update(time, delta) {
        if (this.isGameOver) return;

        // Scroll Path
        this.distanceTraveled += this.gameSpeed;
        this.score = Math.floor(this.distanceTraveled);
        this.scoreText.setText(`Score: ${this.score}`);

        // Move Player X (Lerp)
        if (this.targetX !== undefined) {
            this.player.x = Phaser.Math.Linear(this.player.x, this.targetX, 0.1);
        }
        this.aura.setPosition(this.player.x, this.player.y);

        // Check Collision
        // Find closest point on path based on Y
        // Since path points are spaced 20px apart vertically, we can estimate index
        // But we are scrolling the "world" down, or player up?
        // Let's simulate scrolling by moving path points down relative to player
        // Actually, simpler: Player stays at fixed Y, we iterate through points that are near player Y

        // Current "Y" in the path is distanceTraveled + playerStartY
        const currentPathY = this.distanceTraveled + (this.cameras.main.height - 100);

        // Find point with Y closest to currentPathY
        // Our points were generated with decreasing Y (y -= 20) starting from height
        // So point[0].y = height, point[1].y = height - 20...
        // Real Y of point[i] = height - (i * 20)
        // We want point where (height - i*20) matches current "virtual" Y?
        // No, let's think relative.
        // Player is at screen Y = height - 100.
        // The "slice" of the path at player's Y changes as we scroll.
        // Index of path at player:
        const pathIndex = Math.floor(this.distanceTraveled / 20);
        const nextIndex = pathIndex + 1;

        if (pathIndex >= this.pathPoints.length - 1) {
            // End of path - generate more or loop?
            // For now, just win/loop
            this.distanceTraveled = 0; // Loop for infinite
            return;
        }

        const p1 = this.pathPoints[pathIndex];
        const p2 = this.pathPoints[nextIndex];

        // Interpolate X at exact player Y progress
        const ratio = (this.distanceTraveled % 20) / 20;
        const targetPathX = Phaser.Math.Linear(p1.x, p2.x, ratio);

        // Distance from center
        const dist = Math.abs(this.player.x - targetPathX);

        // Audio Cues
        // Map dist to danger volume
        const dangerVol = Phaser.Math.Clamp(Phaser.Math.MapLinear(dist, 0, this.pathWidth, -100, -10), -100, -5);
        this.dangerOsc.volume.rampTo(dangerVol, 0.1);
        this.dangerSynth.distortion = Phaser.Math.MapLinear(dist, 0, this.pathWidth, 0, 1);

        // Collision
        if (dist > this.pathWidth) {
            this.die();
        }

        // Dev Mode Visualization
        if (this.devMode) {
            this.devGraphics.clear();
            this.devGraphics.lineStyle(2, 0xff0000);

            // Draw visible segment of path
            // We need to draw points relative to screen
            // Screen Y = Point Y + distanceTraveled
            // Only draw points that would be on screen
            const startI = Math.max(0, Math.floor((this.distanceTraveled - this.cameras.main.height) / 20));
            const endI = Math.min(this.pathPoints.length, startI + 100);

            for (let i = startI; i < endI; i++) {
                const p = this.pathPoints[i];
                const screenY = p.y + this.distanceTraveled;
                if (screenY > -50 && screenY < this.cameras.main.height + 50) {
                    // Draw safe zone walls
                    this.devGraphics.strokeRect(p.x - this.pathWidth, screenY - 10, this.pathWidth * 2, 20);
                }
            }

            // Draw target X on player line
            this.devGraphics.lineStyle(2, 0x00ff00);
            this.devGraphics.strokeCircle(targetPathX, this.player.y, 5);
        }
    }

    die() {
        this.lives--;
        this.livesText.setText(`Lives: ${this.lives}`);
        this.deathSynth.triggerAttackRelease("8n");
        this.cameras.main.shake(200, 0.01);

        if (this.lives <= 0) {
            this.gameOver();
        } else {
            // Respawn logic (reset position to center of path)
            // Or just push them back?
            // Let's reset to center of current path segment
            const pathIndex = Math.floor(this.distanceTraveled / 20);
            this.player.x = this.pathPoints[pathIndex].x;
            this.targetX = this.player.x;
        }
    }

    gameOver() {
        this.isGameOver = true;
        this.dangerOsc.stop();
        this.humSynth.stop();
        this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, 'GAME OVER', {
            fontSize: '64px', fill: '#ff0000'
        }).setOrigin(0.5).setScrollFactor(0);
    }

    cleanup() {
        this.dangerOsc.stop();
        this.humSynth.stop();
        this.dangerOsc.dispose();
        this.humSynth.dispose();
    }
}
