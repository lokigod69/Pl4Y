import * as Tone from 'tone';

export default class EchoSnakeScene extends Phaser.Scene {
    constructor() {
        super({ key: 'EchoSnakeScene' });
    }

    create() {
        this.cameras.main.setBackgroundColor(0x000000);

        // Snake State
        this.snake = [];
        this.trail = [];
        this.snakeLength = 20;
        this.speed = 4; // Base speed
        this.baseSpeed = 4;
        this.score = 0;
        this.isDead = false;

        // Audio
        this.synth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: "triangle" },
            envelope: { attack: 0.05, decay: 0.1, sustain: 0.3, release: 1 }
        }).toDestination();
        this.scale = ['C4', 'D4', 'E4', 'G4', 'A4', 'C5', 'D5', 'E5'];
        this.noteIndex = 0;

        // Graphics
        this.graphics = this.add.graphics();
        this.glowGraphics = this.add.graphics();
        this.glowGraphics.blendMode = Phaser.BlendModes.ADD;

        // Input
        this.input.on('pointermove', (pointer) => {
            this.targetX = pointer.x;
            this.targetY = pointer.y;
        });
        // Initialize target to center
        this.targetX = this.cameras.main.width / 2;
        this.targetY = this.cameras.main.height / 2;

        // Initial Snake Head
        this.head = { x: this.targetX, y: this.targetY };
        this.snake.push({ x: this.targetX, y: this.targetY });

        // Food
        this.food = { x: 0, y: 0, active: false };
        this.spawnFood();

        // UI
        this.createUI();
    }

    createUI() {
        this.backText = this.add.text(50, 50, '← Back', {
            fontSize: '32px',
            fill: '#ffffff'
        }).setInteractive().setDepth(100);
        this.backText.on('pointerdown', () => {
            this.scene.start('HubScene');
        });

        this.scoreText = this.add.text(this.cameras.main.width - 50, 50, '0', {
            fontSize: '48px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(1, 0).setDepth(100);

        this.gameOverText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, 'GAME OVER\nClick to Restart', {
            fontSize: '64px',
            fill: '#ff0055',
            align: 'center'
        }).setOrigin(0.5).setDepth(100).setVisible(false);

        this.input.on('pointerdown', () => {
            if (this.isDead) this.restartGame();
        });
    }

    spawnFood() {
        const margin = 100;
        this.food.x = Phaser.Math.Between(margin, this.cameras.main.width - margin);
        this.food.y = Phaser.Math.Between(margin, this.cameras.main.height - margin);
        this.food.active = true;
        this.food.hue = Math.random();
    }

    update(time, delta) {
        if (this.isDead) return;

        // Move Head towards target (mouse)
        const dx = this.targetX - this.head.x;
        const dy = this.targetY - this.head.y;
        const angle = Math.atan2(dy, dx);
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Smooth movement
        const moveSpeed = this.speed * (delta / 16.67);

        if (dist > moveSpeed) {
            this.head.x += Math.cos(angle) * moveSpeed;
            this.head.y += Math.sin(angle) * moveSpeed;
        } else {
            this.head.x = this.targetX;
            this.head.y = this.targetY;
        }

        // Update Snake Body (History)
        this.snake.unshift({ x: this.head.x, y: this.head.y });

        // Limit length and create trail effect
        while (this.snake.length > this.snakeLength) {
            this.snake.pop();
        }

        // Collision with Food
        if (this.food.active) {
            const distToFood = Phaser.Math.Distance.Between(this.head.x, this.head.y, this.food.x, this.food.y);
            if (distToFood < 30) {
                this.eatFood();
            }
        }

        // Self Collision (only check if moved enough and snake is long enough)
        if (this.snake.length > 50) {
            // Check head against body segments (skip first few to avoid immediate self-collision)
            for (let i = 20; i < this.snake.length; i += 5) {
                const seg = this.snake[i];
                if (Phaser.Math.Distance.Between(this.head.x, this.head.y, seg.x, seg.y) < 10) {
                    this.gameOver();
                    break;
                }
            }
        }

        this.draw();
    }

    eatFood() {
        this.score += 10;
        this.scoreText.setText(this.score);
        this.snakeLength += 15; // Grow
        this.speed += 0.1; // Speed up slightly

        // Play Note
        const note = this.scale[this.noteIndex % this.scale.length];
        this.synth.triggerAttackRelease(note, '8n');
        this.noteIndex++;
        if (Math.random() > 0.8) this.noteIndex = Phaser.Math.Between(0, this.scale.length - 1); // Randomize sometimes

        this.spawnFood();

        // Visual Pulse
        this.cameras.main.shake(100, 0.005);
    }

    gameOver() {
        this.isDead = true;
        this.gameOverText.setVisible(true);
        this.synth.triggerAttackRelease(['C3', 'Eb3', 'G3'], '2n');
        this.cameras.main.shake(500, 0.02);
    }

    restartGame() {
        this.isDead = false;
        this.gameOverText.setVisible(false);
        this.snake = [];
        this.snakeLength = 20;
        this.speed = this.baseSpeed;
        this.score = 0;
        this.scoreText.setText('0');
        this.head = { x: this.targetX, y: this.targetY };
        this.snake.push(this.head);
        this.spawnFood();
    }

    draw() {
        this.graphics.clear();
        this.glowGraphics.clear();

        // Draw Food
        if (this.food.active) {
            const color = Phaser.Display.Color.HSVToRGB(this.food.hue, 1, 1).color;
            this.graphics.fillStyle(color, 1);
            this.graphics.fillCircle(this.food.x, this.food.y, 10);

            this.glowGraphics.fillStyle(color, 0.4);
            this.glowGraphics.fillCircle(this.food.x, this.food.y, 20);
        }

        // Draw Snake
        // We draw segments with decreasing size and opacity
        for (let i = 0; i < this.snake.length; i++) {
            const seg = this.snake[i];
            const ratio = 1 - (i / this.snake.length);
            const size = 20 * ratio;

            // Rainbow effect based on index + time
            const hue = (i * 0.01 + this.time.now * 0.001) % 1;
            const color = Phaser.Display.Color.HSVToRGB(hue, 1, 1).color;

            this.graphics.fillStyle(color, 1);
            this.graphics.fillCircle(seg.x, seg.y, size / 2);

            // Glow
            if (i % 3 === 0) { // Optimize glow drawing
                this.glowGraphics.fillStyle(color, 0.2 * ratio);
                this.glowGraphics.fillCircle(seg.x, seg.y, size * 1.5);
            }
        }
    }
}
