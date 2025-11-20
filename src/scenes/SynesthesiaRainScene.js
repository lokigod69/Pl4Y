import * as Tone from 'tone';

export default class SynesthesiaRainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'SynesthesiaRainScene' });
    }

    create() {
        this.cameras.main.setBackgroundColor('#050505');

        // State
        this.score = 0;
        this.combo = 0;
        this.isBlackHole = false;
        this.gameTime = 0;
        this.drops = [];
        this.cometTimer = 0;

        // Audio Setup
        this.setupAudio();

        // Visuals
        this.createBackground();
        this.createPlayer();
        this.createParticles();

        // Input
        this.input.on('pointerdown', () => this.isBlackHole = true);
        this.input.on('pointerup', () => this.isBlackHole = false);

        // UI
        this.createUI();
    }

    setupAudio() {
        // Master Effects
        this.reverb = new Tone.Reverb({ decay: 4, wet: 0.3 }).toDestination();
        this.delay = new Tone.FeedbackDelay("8n", 0.2).connect(this.reverb);

        // Instruments
        this.bassSynth = new Tone.FMSynth({
            harmonicity: 0.5, modulationIndex: 10,
            envelope: { attack: 0.01, decay: 0.5, sustain: 0.1, release: 1 }
        }).connect(this.reverb); // Red

        this.padSynth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: "triangle" },
            envelope: { attack: 0.5, decay: 1, sustain: 0.5, release: 2 }
        }).connect(this.reverb); // Orange

        this.pluckSynth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: "sine" },
            envelope: { attack: 0.01, decay: 0.3, sustain: 0, release: 0.3 }
        }).connect(this.delay); // Yellow

        this.bellSynth = new Tone.MetalSynth({
            harmonicity: 12, resonance: 800, modulationIndex: 20,
            envelope: { decay: 0.4, release: 1 }, volume: -6
        }).connect(this.delay); // Green

        this.chimeSynth = new Tone.FMSynth({
            harmonicity: 8, modulationIndex: 20,
            envelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 1 }
        }).connect(this.delay); // Cyan

        this.fluteSynth = new Tone.FMSynth({
            harmonicity: 1.01, modulationIndex: 5,
            envelope: { attack: 0.1, decay: 0.5, sustain: 0.3, release: 1 }
        }).connect(this.reverb); // Blue

        this.vocalSynth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: "sine" },
            envelope: { attack: 0.5, decay: 1, sustain: 0.8, release: 1.5 }
        }).connect(this.reverb); // Purple

        this.glitchSynth = new Tone.MembraneSynth({
            pitchDecay: 0.01, octaves: 4,
            envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 }
        }).connect(this.delay); // White

        this.instruments = {
            0xff0000: { synth: this.bassSynth, note: 'C2' }, // Red
            0xffa500: { synth: this.padSynth, note: 'E3' }, // Orange
            0xffff00: { synth: this.pluckSynth, note: 'G3' }, // Yellow
            0x00ff00: { synth: this.bellSynth, note: 'B3' }, // Green
            0x00ffff: { synth: this.chimeSynth, note: 'D4' }, // Cyan
            0x0000ff: { synth: this.fluteSynth, note: 'F4' }, // Blue
            0x800080: { synth: this.vocalSynth, note: 'A4' }, // Purple
            0xffffff: { synth: this.glitchSynth, note: 'C5' }  // White
        };

        this.colors = Object.keys(this.instruments).map(Number);
    }

    createBackground() {
        // "Living viscous liquid" - approximated with a large gradient texture that moves
        this.bgGraphics = this.add.graphics();
        this.bgGraphics.fillGradientStyle(0x000000, 0x000022, 0x000000, 0x000022, 1);
        this.bgGraphics.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);
        this.bgGraphics.setDepth(-10);
    }

    createPlayer() {
        this.player = this.add.circle(0, 0, 20, 0xffffff, 0.5);
        this.physics.add.existing(this.player);
        this.player.body.setCircle(20);
        this.player.body.setCollideWorldBounds(true);

        // Glow effect
        this.playerGlow = this.add.circle(0, 0, 40, 0xffffff, 0.2);
    }

    createParticles() {
        this.emitter = this.add.particles(0, 0, 'particle_tex', {
            speed: 100,
            scale: { start: 0.5, end: 0 },
            blendMode: 'ADD',
            lifespan: 500,
            on: false
        });
    }

    createUI() {
        this.add.text(50, 50, '← Back', { fontSize: '32px', fill: '#ffffff' })
            .setInteractive().on('pointerdown', () => this.scene.start('HubScene'));

        this.comboText = this.add.text(this.cameras.main.width / 2, 100, '', {
            fontSize: '48px', fill: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5).setAlpha(0);
    }

    update(time, delta) {
        this.gameTime += delta;
        this.cometTimer += delta;

        // Player Movement
        const pointer = this.input.activePointer;
        this.player.setPosition(pointer.x, pointer.y);
        this.playerGlow.setPosition(pointer.x, pointer.y);

        // Black Hole Logic
        if (this.isBlackHole) {
            this.player.setScale(1.5);
            this.playerGlow.setScale(2.5);
            this.playerGlow.setFillStyle(0x000000, 0.5);
            this.playerGlow.setStrokeStyle(2, 0xffffff);

            // Suck drops
            this.drops.forEach(drop => {
                const angle = Phaser.Math.Angle.Between(drop.x, drop.y, this.player.x, this.player.y);
                const dist = Phaser.Math.Distance.Between(drop.x, drop.y, this.player.x, this.player.y);
                if (dist < 300) {
                    drop.x += Math.cos(angle) * 10;
                    drop.y += Math.sin(angle) * 10;
                }
            });
        } else {
            this.player.setScale(1);
            this.playerGlow.setScale(1);
            this.playerGlow.setFillStyle(0xffffff, 0.2);
            this.playerGlow.setStrokeStyle(0);
        }

        // Spawn Drops
        if (Math.random() < 0.05 + (this.combo * 0.001)) {
            this.spawnDrop();
        }

        // Comet Drop
        if (this.cometTimer > 30000) { // 30s
            this.spawnComet();
            this.cometTimer = 0;
        }

        // Update Drops
        for (let i = this.drops.length - 1; i >= 0; i--) {
            const drop = this.drops[i];
            drop.y += drop.speed;
            drop.rotation += 0.05;

            // Catch
            if (Phaser.Math.Distance.Between(drop.x, drop.y, this.player.x, this.player.y) < (this.isBlackHole ? 60 : 30)) {
                this.catchDrop(drop);
                this.drops.splice(i, 1);
                drop.destroy();
                continue;
            }

            // Miss
            if (drop.y > this.cameras.main.height + 50) {
                this.missDrop();
                this.drops.splice(i, 1);
                drop.destroy();
            }
        }
    }

    spawnDrop() {
        const x = Phaser.Math.Between(0, this.cameras.main.width);
        const color = Phaser.Utils.Array.GetRandom(this.colors);
        const drop = this.add.rectangle(x, -20, 10, 20, color);
        drop.speed = Phaser.Math.Between(3, 8);
        drop.color = color;
        this.drops.push(drop);
    }

    spawnComet() {
        const x = Phaser.Math.Between(100, this.cameras.main.width - 100);
        const comet = this.add.circle(x, -50, 30, 0xffffff);
        comet.speed = 1;
        comet.isComet = true;
        // Add trail to comet
        this.tweens.add({
            targets: comet,
            alpha: 0.5,
            yoyo: true,
            repeat: -1,
            duration: 500
        });
        this.drops.push(comet);
    }

    catchDrop(drop) {
        // Visuals
        this.emitter.setPosition(drop.x, drop.y);
        this.emitter.setTint(drop.isComet ? 0xffffff : drop.color);
        this.emitter.explode(drop.isComet ? 50 : 10);

        // Audio
        if (drop.isComet) {
            // Massive chord
            this.padSynth.triggerAttackRelease(['C3', 'E3', 'G3', 'B3', 'D4'], '8n');
            this.cameras.main.shake(500, 0.01);
            this.cameras.main.flash(1000, 255, 255, 255);
            this.combo += 5;
        } else {
            const instr = this.instruments[drop.color];
            if (instr) {
                // Randomize note slightly or use scale
                instr.synth.triggerAttackRelease(instr.note, '16n');
            }
            this.combo++;
        }

        // Combo Effects
        if (this.combo > 10) {
            this.comboText.setText(`${this.combo} CHAIN`);
            this.comboText.setAlpha(1);
            this.tweens.add({
                targets: this.comboText,
                alpha: 0,
                duration: 1000
            });
        }
    }

    missDrop() {
        this.combo = 0;
        this.cameras.main.shake(100, 0.005);
        // Thud sound
        this.bassSynth.triggerAttackRelease('C1', '32n');
    }
}
