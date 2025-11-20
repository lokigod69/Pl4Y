import * as Tone from 'tone';

export default class HubScene extends Phaser.Scene {
    constructor() {
        super({ key: 'HubScene' });
    }

    create() {
        this.particleTexture = this.add.graphics();
        this.particleTexture.fillStyle(0xffffff);
        this.particleTexture.fillRect(0, 0, 4, 4);
        this.particleTexture.generateTexture('particle_tex', 4, 4);
        this.particleTexture.destroy();

        this.emitter = this.add.particles(0, 0, 'particle_tex', {
            speed: { min: -200, max: 200 },
            angle: { min: 0, max: 360 },
            scale: { start: 1, end: 0 },
            lifespan: 1500,
            blendMode: Phaser.BlendModes.ADD,
            quantity: 4,
            alpha: { start: 1, end: 0 },
            on: false
        });

        this.portals = [];
        this.gameNames = [
            { id: 'gravity-garden', name: 'Gravity\nGarden' },
            { id: 'echo-snake', name: 'Echo\nSnake' },
            { id: 'void-jumper', name: 'Void\nJumper' },
            { id: 'synesthesia-rain', name: 'Rain' }
        ];

        this.createPortals();
        this.createUI();

        this.input.on('pointerdown', this.onPointerDown, this);
        this.input.on('pointermove', this.onPointerMove, this);

        this.updateTheme();
        this.add.text(50, 50, 'Pl4y', { fontSize: '64px', fill: '#ffffff' }).setDepth(5);
    }

    createPortals() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        this.gameNames.forEach((game, i) => {
            const x = Phaser.Math.Between(200, width - 200);
            const y = Phaser.Math.Between(200, height - 200);
            const container = this.add.container(x, y).setDepth(1);
            const rect = this.add.graphics();
            const text = this.add.text(0, -10, game.name, {
                fontSize: '28px',
                fill: '#ffffff',
                align: 'center'
            }).setOrigin(0.5).setDepth(2);

            container.add([rect, text]);
            container.setInteractive(new Phaser.Geom.Rectangle(-120, -60, 240, 120), Phaser.Geom.Rectangle.Contains);
            container.on('pointerdown', () => this.loadGame(game.id));

            this.portals.push({ container, rect, text, gameId: game.id });
        });
    }

    createUI() {
        const width = this.cameras.main.width;
        this.themeText = this.add.text(width - 20, 40, 'Theme 1/5', {
            fontSize: '24px',
            fill: '#ffffff'
        }).setOrigin(1, 0).setScrollFactor(0).setDepth(10).setInteractive();
        this.themeText.on('pointerdown', () => {
            window.currentTheme = (window.currentTheme + 1) % 5;
            this.updateTheme();
            this.themeText.setText(`Theme ${window.currentTheme + 1}/5`);
        });
    }

    updateTheme() {
        const theme = window.themes[window.currentTheme];
        this.cameras.main.setBackgroundColor(theme.bg);
        this.portals.forEach(({ rect, text }) => {
            rect.clear();
            rect.fillStyle(theme.portal, 0.8);
            rect.fillRoundedRect(-120, -60, 240, 120, 20);
            text.setFill(Phaser.Display.Color.ValueToColor(theme.text).rgba);
        });
        this.themeText.setColor(Phaser.Display.Color.ValueToColor(theme.text).rgba);
        if (this.emitter) this.emitter.setTintFill(theme.accent);
    }

    loadGame(id) {
        if (id === 'gravity-garden') {
            this.scene.start('GravityGardenScene');
        } else {
            // Placeholder
            console.log(`${id.toUpperCase()} coming soon!`);
        }
    }

    onPointerDown() {
        if (Tone.getContext().state !== 'running') {
            Tone.start();
        }
        if (!window.ambientLoop) {
            this.startAmbient();
        }
        this.emitter.explode(20, this.input.activePointer.x, this.input.activePointer.y);
    }

    onPointerMove(pointer) {
        this.emitter.active = true;
        this.emitter.setPosition(pointer.x, pointer.y);
        this.emitter.explode(2);
    }

    startAmbient() {
        const synth = new Tone.FMSynth({
            harmonicity: 2.5,
            modulationIndex: 12,
            envelope: { attack: 4, decay: 0.1, sustain: 0.6, release: 4 },
            modulationEnvelope: { attack: 4, decay: 0.1, sustain: 0.6, release: 4 }
        }).toDestination();

        window.ambientSynth = synth;
        window.ambientLoop = new Tone.Loop((time) => {
            synth.triggerAttackRelease('C2', '16m', time);
        }, '16m').start(0);

        Tone.Transport.bpm.value = 40;
        Tone.Transport.start();
    }

    update() {
        const pointer = this.input.activePointer;
        this.portals.forEach(({ container }) => {
            const dx = pointer.x - container.x;
            const dy = pointer.y - container.y;
            container.x += dx * 0.015;
            container.y += dy * 0.015;
        });
    }
}
