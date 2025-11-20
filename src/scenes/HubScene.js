import * as Tone from 'tone';

export default class HubScene extends Phaser.Scene {
    constructor() {
        super({ key: 'HubScene' });
    }

    create() {
        // 1. Background: Nebula Gradient
        this.createBackground();

        // 2. Global Ambient Particles
        this.createAmbientParticles();

        // 3. Title: "Pl4y" (Orbitron)
        this.add.text(60, 60, 'PL4Y', {
            fontFamily: '"Orbitron", sans-serif',
            fontSize: '84px',
            fontStyle: '900',
            fill: '#ffffff'
        }).setOrigin(0, 0.5).setDepth(10).setShadow(0, 0, '#00ffff', 10);

        this.add.text(60, 110, 'SYSTEM ONLINE', {
            fontFamily: '"Orbitron", sans-serif',
            fontSize: '16px',
            fill: '#00ffff',
            letterSpacing: 2
        }).setOrigin(0, 0.5).setDepth(10).setAlpha(0.8);

        // 4. Theme Switcher (Segmented)
        this.createThemeSwitcher();

        // 5. Portals (Grid/Pentagon Layout)
        this.gameNames = [
            { id: 'gravity-garden', name: 'GRAVITY\nGARDEN', color: 0x00ff88 },
            { id: 'echo-snake', name: 'ECHO\nSNAKE', color: 0xff0088 },
            { id: 'void-jumper', name: 'VOID\nJUMPER', color: 0x8800ff },
            { id: 'synesthesia-rain', name: 'SYNESTHESIA\nRAIN', color: 0x0088ff },
            { id: 'impossible-corridor', name: 'IMPOSSIBLE\nCORRIDOR', color: 0xff4400 }
        ];
        this.createPortals();

        // 6. Audio Setup
        this.setupAudio();

        // 7. Click to Start Overlay (if needed)
        if (Tone.context.state !== 'running') {
            this.showClickToStart();
        }
    }

    createBackground() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Create a deep radial gradient texture
        const bgGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        bgGraphics.fillGradientStyle(0x0a0a1a, 0x0a0a1a, 0x000000, 0x000000, 1);
        bgGraphics.fillRect(0, 0, width, height);
        bgGraphics.generateTexture('nebula_bg', width, height);

        this.add.image(width / 2, height / 2, 'nebula_bg').setDepth(-10);

        // Add a subtle moving gradient blob
        this.blob = this.add.circle(width / 2, height / 2, 400, 0x220044, 0.3);
        this.blob.setBlendMode(Phaser.BlendModes.ADD);
        this.tweens.add({
            targets: this.blob,
            scaleX: 1.2,
            scaleY: 0.8,
            angle: 360,
            duration: 20000,
            yoyo: true,
            repeat: -1
        });
    }

    createAmbientParticles() {
        const particles = this.add.particles(0, 0, 'particle_tex', {
            x: { min: 0, max: this.cameras.main.width },
            y: { min: 0, max: this.cameras.main.height },
            quantity: 1,
            frequency: 100,
            lifespan: 6000,
            speedY: { min: -10, max: -30 },
            scale: { start: 0.2, end: 0 },
            alpha: { start: 0.5, end: 0 },
            blendMode: 'ADD'
        });

        // If texture doesn't exist, create it first
        if (!this.textures.exists('particle_tex')) {
            const g = this.make.graphics({ x: 0, y: 0, add: false });
            g.fillStyle(0xffffff);
            g.fillCircle(4, 4, 4);
            g.generateTexture('particle_tex', 8, 8);
        }
    }

    createThemeSwitcher() {
        const width = this.cameras.main.width;
        const container = this.add.container(width - 150, 60);

        const bg = this.add.rectangle(0, 0, 200, 40, 0xffffff, 0.1)
            .setStrokeStyle(1, 0xffffff, 0.3);

        const text = this.add.text(0, 0, 'THEME: NEON', {
            fontFamily: '"Orbitron", sans-serif',
            fontSize: '14px',
            color: '#ffffff'
        }).setOrigin(0.5);

        container.add([bg, text]);
        container.setSize(200, 40);
        container.setInteractive({ useHandCursor: true });

        container.on('pointerover', () => bg.setStrokeStyle(1, 0xffffff, 0.8));
        container.on('pointerout', () => bg.setStrokeStyle(1, 0xffffff, 0.3));
        container.on('pointerdown', () => {
            window.currentTheme = (window.currentTheme + 1) % 5;
            this.updateTheme();
            text.setText(`THEME: ${window.themes[window.currentTheme].name.toUpperCase()}`);
        });
    }

    createPortals() {
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2 + 40;
        const radius = 220;
        const count = this.gameNames.length;

        this.gameNames.forEach((game, index) => {
            // Pentagon layout
            const angle = (index * (360 / count) - 90) * (Math.PI / 180);
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);

            this.createPortalCard(x, y, game);
        });
    }

    createPortalCard(x, y, game) {
        const container = this.add.container(x, y);

        // Glass Card Background
        const cardWidth = 180;
        const cardHeight = 120;

        const bg = this.add.rectangle(0, 0, cardWidth, cardHeight, 0x000000, 0.5);
        bg.setStrokeStyle(2, game.color, 0.6);

        // Glow FX (Phaser 3.60+)
        if (bg.preFX) {
            bg.preFX.addGlow(game.color, 2, 0, false, 0.1, 10);
        }

        // Text
        const text = this.add.text(0, 0, game.name, {
            fontFamily: '"Orbitron", sans-serif',
            fontSize: '18px',
            align: 'center',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        // Hit Area
        container.add([bg, text]);
        container.setSize(cardWidth, cardHeight);
        container.setInteractive({ useHandCursor: true });

        // Interactions
        container.on('pointerover', () => {
            this.tweens.add({
                targets: container,
                scale: 1.1,
                duration: 200,
                ease: 'Back.out'
            });
            bg.setStrokeStyle(3, game.color, 1);
            bg.setFillStyle(game.color, 0.1);
            if (bg.preFX) bg.preFX.list[0].strength = 4; // Boost glow
        });

        container.on('pointerout', () => {
            this.tweens.add({
                targets: container,
                scale: 1,
                duration: 200,
                ease: 'Back.out'
            });
            bg.setStrokeStyle(2, game.color, 0.6);
            bg.setFillStyle(0x000000, 0.5);
            if (bg.preFX) bg.preFX.list[0].strength = 2; // Reset glow
        });

        container.on('pointerdown', () => {
            this.cameras.main.fadeOut(500, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.loadGame(game.id);
            });
        });

        // Gentle float animation
        this.tweens.add({
            targets: container,
            y: y + 10,
            duration: 2000 + Math.random() * 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.inOut',
            delay: Math.random() * 1000
        });
    }

    loadGame(id) {
        if (id === 'gravity-garden') this.scene.start('GravityGardenScene');
        else if (id === 'echo-snake') this.scene.start('EchoSnakeScene');
        else if (id === 'void-jumper') this.scene.start('VoidJumperScene');
        else if (id === 'synesthesia-rain') this.scene.start('SynesthesiaRainScene');
        else if (id === 'impossible-corridor') this.scene.start('ImpossibleCorridorScene');
        else console.log(`${id.toUpperCase()} coming soon!`);
    }

    updateTheme() {
        // Simplified theme update for now - mainly changing accent colors if needed
        // But the new design relies more on the specific game colors
        const theme = window.themes[window.currentTheme];
        // Could update background gradient colors here
    }

    setupAudio() {
        // Re-implement audio unlock logic
        this.input.on('pointerdown', async () => {
            if (Tone.context.state !== 'running') {
                await Tone.start();
                console.log('Audio unlocked');
                if (this.clickText) this.clickText.destroy();
                this.startAmbient();
            }
        });
    }

    showClickToStart() {
        this.clickText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, 'CLICK TO INITIALIZE', {
            fontFamily: '"Orbitron", sans-serif',
            fontSize: '32px',
            color: '#ffffff',
            backgroundColor: '#000000aa',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setDepth(100);
    }

    startAmbient() {
        if (window.ambientStarted) return;
        window.ambientStarted = true;

        const synth = new Tone.FMSynth({
            harmonicity: 2.5,
            modulationIndex: 12,
            envelope: { attack: 4, decay: 0.1, sustain: 0.6, release: 4 },
            modulationEnvelope: { attack: 4, decay: 0.1, sustain: 0.6, release: 4 }
        }).toDestination();

        // Lower volume for ambient
        synth.volume.value = -12;

        window.ambientSynth = synth;
        window.ambientLoop = new Tone.Loop((time) => {
            synth.triggerAttackRelease('C2', '16m', time);
        }, '16m').start(0);

        Tone.Transport.bpm.value = 40;
        Tone.Transport.start();
    }

    update() {
        // Mouse parallax
        const ptr = this.input.activePointer;
        const cx = this.cameras.main.width / 2;
        const cy = this.cameras.main.height / 2;

        const dx = (ptr.x - cx) * 0.02;
        const dy = (ptr.y - cy) * 0.02;

        this.cameras.main.scrollX = dx;
        this.cameras.main.scrollY = dy;
    }
}
