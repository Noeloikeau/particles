// renderer.js - Fixed version with glow only on current particles
class Trail {
    constructor(particle) {
        this.x = particle.x;
        this.y = particle.y;
        this.character = particle.character;
        this.opacity = 1;
        this.particle = particle;
        
        // Copy only basic visual properties, not glow
        this.fontSize = particle.fontSize;
        this.fontFamily = particle.fontFamily;
        this.fadeSpeed = particle.fadeSpeed;
        //this.color = particle.getColor();
    }

    fade() {
        this.opacity -= this.fadeSpeed;
        return this.opacity > 0;
    }
}

class Renderer {
    constructor(canvas, defaultOptions = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', {
            alpha: false
        });
        
        this.defaultOptions = {
            fontSize: 14,
            fontFamily: 'arial',
            backgroundColor: 'rgb(0, 0, 0)',
            fadeSpeed: 0.05,
            glowEffect: false,
            glowColor: 'rgba(0, 255, 70, 0.2)',
            glowRadius: 3
        };

        this.maxTrails = 1000;
        this.trails = [];
        this.lastTrailPos = new Map();
        
        this.resize(window.innerWidth, window.innerHeight);
        this.clear();
    }

    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
    }

    setFont(particle) {
        const fontSize = particle.fontSize || this.defaultOptions.fontSize;
        const fontFamily = particle.fontFamily || this.defaultOptions.fontFamily;
        this.ctx.font = `${fontSize}px ${fontFamily}`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
    }

    clear() {
        this.ctx.fillStyle = this.defaultOptions.backgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.trails = [];
        this.lastTrailPos.clear();
    }

    shouldDropTrail(particle) {
        if (this.trails.length >= this.maxTrails) {
            return false;
        }

        const lastPos = this.lastTrailPos.get(particle.id);
        if (!lastPos) {
            this.lastTrailPos.set(particle.id, { x: particle.x, y: particle.y });
            return false;
        }

        const dx = particle.x - lastPos.x;
        const dy = particle.y - lastPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance >= particle.fontSize) {
            this.lastTrailPos.set(particle.id, { x: particle.x, y: particle.y });
            return true;
        }
        return false;
    }

    dropTrail(particle) {
        if (this.trails.length >= this.maxTrails) {
            this.trails.shift();
        }
        this.trails.push(new Trail(particle));
    }

    updateTrails() {
        // Apply fade effect with semi-transparent black overlay
        this.ctx.fillStyle = this.defaultOptions.backgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw trails (without glow)
        this.trails = this.trails.filter(trail => {
            if (trail.particle.remove) {
                return false;
            }
            if (trail.fade()) {
                this.setFont(trail);
                
                // Draw only the character with proper opacity
                this.ctx.globalAlpha = trail.opacity;
                this.ctx.fillStyle = trail.particle.getColor();//trail.color
                this.ctx.fillText(trail.character, trail.x, trail.y);
                this.ctx.globalAlpha = 1;
                
                return true;
            }
            return false;
        });
    }

    drawParticle(particle) {
        this.setFont(particle);

        if (this.shouldDropTrail(particle)) {
            this.dropTrail(particle);
        }

        // Draw glow only for current particles
        if (particle.glowEffect) {
            const gradient = this.ctx.createRadialGradient(
                particle.x, particle.y, 0,
                particle.x, particle.y, particle.glowRadius
            );
            
            gradient.addColorStop(0, particle.glowColor);
            gradient.addColorStop(1, 'rgba(0,0,0,0)');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.glowRadius * 2, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Draw character
        this.ctx.fillStyle = particle.getColor();
        this.ctx.fillText(particle.character, particle.x, particle.y);
    }

    render(particles) {
        // First update and draw trails (without glow)
        this.updateTrails();
        
        // Then draw current particles (with glow)
        particles.forEach(particle => {
            this.drawParticle(particle);
        });
    }
}

export default Renderer;