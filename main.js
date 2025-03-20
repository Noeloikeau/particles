import PhysicsSystem from './physics.js';
import Renderer from './renderer.js';
import characterManager from './characters.js';

export class MatrixApp {
    constructor(canvasId = 'matrix-canvas') {
        // Bind methods first before any use
        this.animate = this.animate.bind(this);
        this.handleResize = this.handleResize.bind(this);

        this.canvas = document.getElementById(canvasId) || 
                     this.createCanvas(canvasId);
        
        this.physics = new PhysicsSystem(
            window.innerWidth,
            window.innerHeight
        );
        
        this.renderer = new Renderer(this.canvas, {
            fontSize: 14,
            fontFamily: 'arial',
            backgroundColor: 'rgb(0, 0, 0)',
            fadeSpeed: 0.05
        });

        this.animationFrame = null;
        this.lastTime = performance.now();
        this.neighborSearch = true;  // Enable neighbor search by default
        this.neighborRadius = 50;    // Default neighbor search radius
        
        // Add event listeners
        window.addEventListener('resize', this.handleResize);
        
        // Initial resize
        this.resize(window.innerWidth, window.innerHeight);
    }

    createCanvas(id) {
        const canvas = document.createElement('canvas');
        canvas.id = id;
        document.body.appendChild(canvas);
        return canvas;
    }

    addParticles(particles) {
        if (!particles) return;
        this.physics.addParticles(particles);
    }

    clear() {
        if (this.physics) {
            this.physics.clear();
        }
    }

    setNeighborSearch(enable, radius = 50) {
        this.neighborSearch = enable;
        this.neighborRadius = radius;
    }

    start() {
        if (!this.animationFrame) {
            this.lastTime = performance.now();
            this.animate();
        }
    }

    stop() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }

    animate(currentTime = performance.now()) {
        if (!this.physics || !this.renderer) return;

        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        // Compute neighbors if enabled
        if (this.neighborSearch) {
            this.physics.computeNeighbors(this.neighborRadius);
        }

        // Update physics
        this.physics.update(deltaTime);

        // Update characters
        if (this.physics.particles) {
            this.physics.particles.forEach(particle => {
                if (particle) {
                    characterManager.updateParticleChar(particle, currentTime / 1000);
                }
            });
        }

        // Render frame
        this.renderer.render(this.physics.particles);

        this.animationFrame = requestAnimationFrame(this.animate);
    }

    handleResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        this.resize(width, height);
    }

    resize(width, height) {
        if (!this.canvas || !this.physics || !this.renderer) return;
        
        this.canvas.width = width;
        this.canvas.height = height;
        this.physics.resize(width, height);
        this.renderer.resize(width, height);
    }

    destroy() {
        this.stop();
        window.removeEventListener('resize', this.handleResize);
        this.physics = null;
        this.renderer = null;
        characterManager.clearCache();
    }
}

export default MatrixApp;