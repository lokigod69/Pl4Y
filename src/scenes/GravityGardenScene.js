export default class GravityGardenScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GravityGardenScene' });
    }

    create() {
        this.cameras.main.setBackgroundColor(0x000011);
        this.graphics = this.add.graphics({ x: 0, y: 0 }).setDepth(1);
        this.particles = [];
        this.attractMode = true;

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        for (let i = 0; i < 300; i++) {
            this.particles.push(new Particle(
                Phaser.Math.Between(0, width),
                Phaser.Math.Between(0, height)
            ));
        }

        this.createUI();
        this.input.on('pointerdown', this.flipGravity, this);
    }

    createUI() {
        const width = this.cameras.main.width;
        this.backText = this.add.text(50, 50, '← Back', {
            fontSize: '32px',
            fill: '#ffffff'
        }).setInteractive().setDepth(10).setScrollFactor(0);
        this.backText.on('pointerdown', () => this.scene.start('HubScene'));

        this.flipText = this.add.text(width - 250, 50, 'Attract', {
            fontSize: '28px',
            fill: '#88ffff'
        }).setOrigin(1, 0).setInteractive().setDepth(10).setScrollFactor(0);
        this.flipText.on('pointerdown', this.flipGravity, this);
    }

    flipGravity() {
        this.attractMode = !this.attractMode;
        this.flipText.setText(this.attractMode ? 'Attract' : 'Repel');
    }

    update(time, delta) {
        const dt = Math.min(delta / 16.67, 0.1); // Normalized ~60fps
        const pointer = this.input.activePointer;
        let bloomCount = 0;

        this.particles.forEach(p => {
            p.update(dt, pointer.x, pointer.y, this.attractMode);
            if (p.dist < 80) bloomCount++;
        });

        const bloomRatio = bloomCount / this.particles.length;
        if (window.ambientSynth) {
            window.ambientSynth.harmonicity.value = Phaser.Math.Clamp(1.5 + bloomRatio * 5, 1.5, 6.5);
        }

        this.graphics.clear();
        this.particles.forEach(p => {
            const alpha = Phaser.Math.Clamp((80 - p.dist) / 80 * 0.9, 0, 0.9);
            const hue = (p.life * 0.1) % 1;
            this.graphics.fillStyle(Phaser.Display.Color.HSVToRGB(hue, 0.8 + p.size * 0.05, 1).color, alpha);
            this.graphics.fillCircle(p.x, p.y, p.size);
        });
    }
}

class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.size = Phaser.Math.FloatBetween(1.5, 3);
        this.life = 0;
        this.dist = 999;
    }

    update(dt, mx, my, attract) {
        this.dist = Phaser.Math.Distance.Between(this.x, this.y, mx, my);
        let dx = mx - this.x;
        let dy = my - this.y;
        let distSq = this.dist * this.dist;
        if (distSq > 0) {
            let force = 2000 / distSq;
            if (!attract) force = -force;
            this.vx += (dx / this.dist) * force * dt;
            this.vy += (dy / this.dist) * force * dt;
        }

        this.vx *= 0.96;
        this.vy *= 0.96;

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Wrap bounds
        const width = 1920;
        const height = 1080;
        if (this.x < 0) this.x = width;
        if (this.x > width) this.x = 0;
        if (this.y < 0) this.y = height;
        if (this.y > height) this.y = 0;

        // Grow/shrink
        if (this.dist < 80) {
            this.size += 0.8 * dt;
        }
        this.size *= 0.992;
        this.size = Phaser.Math.Clamp(this.size, 0.5, 12);

        this.life += dt;
    }
}
