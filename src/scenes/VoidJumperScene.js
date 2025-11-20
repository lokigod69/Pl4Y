import * as Tone from 'tone';

export default class VoidJumperScene extends Phaser.Scene {
    constructor() {
        super({ key: 'VoidJumperScene' });
    }

    create() {
        this.cameras.main.setBackgroundColor(0x000000);

        // State
        this.seed = '';
        this.score = 0;
        this.combo = 0;
        this.isGameOver = false;
        this.gravityStrength = 500;

        // Player
        this.player = this.add.rectangle(0, 0, 20, 20, 0x00ffff);
        this.physics.add.existing(this.player);
        this.player.body.setCollideWorldBounds(false);
        this.player.body.setBounce(0.2);
        this.player.body.setAllowGravity(false); // Custom gravity

        // Player Trail
        this.trailParticles = this.add.particles(0, 0, 'particle_tex', {
            speed: 10,
            scale: { start: 0.5, end: 0 },
            lifespan: 200,
            blendMode: 'ADD',
            follow: this.player
        });

        // Platforms
        this.platforms = this.physics.add.staticGroup();

        // Audio
        this.synth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: "sawtooth" },
            envelope: { attack: 0.01, decay: 0.1, sustain: 0.1, release: 1 }
        }).toDestination();

        // UI
        this.createUI();
        this.loadingText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, 'Fetching Block Hash...', {
            fontSize: '32px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // Fetch Seed
        fetch('https://mempool.space/api/blocks/tip/hash')
            .then(res => res.text())
            .then(hash => {
                this.seed = hash;
                this.loadingText.setText(`Seed: ${hash.substring(0, 8)}...`);
                this.startGame(hash);
            })
            .catch(err => {
                console.error(err);
                this.seed = 'fallback_seed_' + Date.now();
                this.loadingText.setText('Offline Mode');
                this.startGame(this.seed);
            });

        // Input
        this.input.on('pointerdown', this.jump, this);

        // Camera
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setZoom(1);
    }

    createUI() {
        this.backText = this.add.text(50, 50, '← Back', {
            fontSize: '32px',
            fill: '#ffffff'
        }).setInteractive().setDepth(100).setScrollFactor(0);
        this.backText.on('pointerdown', () => {
            this.scene.start('HubScene');
        });

        this.scoreText = this.add.text(this.cameras.main.width - 50, 50, '0', {
            fontSize: '48px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(1, 0).setDepth(100).setScrollFactor(0);
    }

    startGame(seed) {
        // Seed RNG
        const rng = new Phaser.Math.RandomDataGenerator([seed]);

        // Generate Platforms
        // We'll generate a "cloud" of platforms around the start
        for (let i = 0; i < 100; i++) {
            const x = rng.between(-2000, 2000);
            const y = rng.between(-2000, 2000);
            const w = rng.between(50, 200);
            const h = 20;

            // Don't spawn too close to player start
            if (Phaser.Math.Distance.Between(0, 0, x, y) < 200) continue;

            const platform = this.add.rectangle(x, y, w, h, 0xff00ff);
            this.physics.add.existing(platform, true); // Static
            this.platforms.add(platform);
        }

        // Start Platform
        const startPlat = this.add.rectangle(0, 100, 200, 20, 0xffffff);
        this.physics.add.existing(startPlat, true);
        this.platforms.add(startPlat);

        this.physics.add.collider(this.player, this.platforms, this.land, null, this);

        this.loadingText.destroy();
    }

    jump() {
        if (this.isGameOver) return;

        // Jump direction is opposite to gravity (away from mouse)
        const pointer = this.input.activePointer;
        const angle = Phaser.Math.Angle.Between(pointer.worldX, pointer.worldY, this.player.x, this.player.y);

        const jumpForce = 600;
        this.player.body.velocity.x = Math.cos(angle) * jumpForce;
        this.player.body.velocity.y = Math.sin(angle) * jumpForce;

        // Audio
        this.combo++;
        const pitch = Math.min(this.combo * 100, 1000);
        this.synth.triggerAttackRelease(440 + pitch, '16n');
    }

    land() {
        this.combo = 0;
    }

    update(time, delta) {
        if (!this.seed) return;

        // Custom Gravity: Pull towards mouse
        const pointer = this.input.activePointer;
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, pointer.worldX, pointer.worldY);
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, pointer.worldX, pointer.worldY);

        // Gravity gets stronger as you get closer? Or constant?
        // Let's make it constant for control, or slightly inverse square
        const force = this.gravityStrength;

        this.player.body.acceleration.x = Math.cos(angle) * force;
        this.player.body.acceleration.y = Math.sin(angle) * force;

        // Rotation: Player points towards gravity center (feet down)
        this.player.rotation = angle - Math.PI / 2;

        // Trail
        // Simple trail using graphics
        // (Optimized: could use particles)

        // Check bounds/death?
        // For now, infinite void.
    }
}
