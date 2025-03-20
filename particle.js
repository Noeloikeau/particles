class Particle {
    constructor({
        // Physics properties
        x = 0,
        y = 0,
        vx = 0,
        vy = 0,
        mass = 1,
        size = 14,
        collisions = {},
        forces = [],
        
        // State properties
        phase = 0,
        phaseRate = 0,
        color = {
            value: null,
            map: null,
        },
        
        // Boundary behavior
        boundaries = {
            top: 'periodic',
            bottom: 'periodic',
            left: 'periodic',
            right: 'periodic',
            probability: 0.975,
        },
        
        character = {
            value: null,
            set: 'katakana',
            rate: 1.0,
            lock: false,
            family: 'arial',
            update: performance.now()/1000,
        },
        
        trail = {},
        
        glow = {},
        
        // Legacy parameters for backwards compatibility
        restitution,
        characterSet,
        fontSize,
        fontFamily,
        fadeSpeed,
        glowEffect,
        glowColor,
        glowRadius,
        phaseVelocity,
        boundaryProbability,
        charUpdateRate,
        lockCharacter,
        lastCharUpdate,
        state = {
            type: 'prey',
            energy: 100,
            lastSpawn: performance.now()
        },
    } = {}) {
        // Physics state
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.ax = 0;
        this.ay = 0;
        this.mass = mass;
        
        // Handle collisions conversion
        this.collisions = Object.keys(collisions).length > 0;
        this.restitution = restitution ?? collisions.restitution ?? 1.0;
        
        // Forces
        this.forces = forces;
        
        // Phase state
        this.phase = phase;
        this.phaseVelocity = phaseVelocity ?? phaseRate;
        
        // Boundary behavior - extract probability from new structure
        this.boundaries = {
            top: boundaries.top,
            bottom: boundaries.bottom,
            left: boundaries.left,
            right: boundaries.right
        };
        this.boundaryProbability = boundaryProbability ?? boundaries.probability;
        
        // Visual properties - handle size/fontSize compatibility
        this.fontSize = fontSize ?? size;
        
        // Character properties - merge old and new patterns
        this.characterSet = characterSet ?? (Array.isArray(character.set) ? character.set[0] : character.set);
        this.character = character.value;
        this.charUpdateRate = charUpdateRate ?? character.rate;
        this.lockCharacter = lockCharacter ?? character.lock;
        this.fontFamily = fontFamily ?? character.family ?? 'arial';
        this.lastCharUpdate = lastCharUpdate ?? character.update ?? performance.now()/1000;
        
        // Trail effect
        this.fadeSpeed = fadeSpeed ?? trail.rate ?? 0.05;
        
        // Glow effect - convert from new structure
        this.glowEffect = glowEffect ?? Object.keys(glow).length > 0;
        this.glowColor = glowColor ?? glow.color ?? color.value;
        this.glowRadius = glowRadius ?? glow.radius ?? 3;
        
        // Color handling
        if (typeof color === 'string') {
            this.color = color;
        } else {
            this.color = color.value;
            if (color.map) {
                this.getColor = (sys) => color.map(this, sys);
            }
        }
        
        // Ecosystem state
        this.state = state;
        
        // Unique ID
        this.id = Math.random().toString(36).substr(2, 9);
    }
    
    update(dt) {
        if (this.remove) return;
        // Update velocity with current acceleration
        this.vx += this.ax * dt;
        this.vy += this.ay * dt;
        
        // Update position
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        
        // Update phase (for color cycling)
        this.phase = (this.phase + this.phaseVelocity * dt) % (2 * Math.PI);
        if (this.phase < 0) this.phase += 2 * Math.PI;
    }
    
    getColor() {
        // Use explicit color if provided
        if (this.color) return this.color;
        
        const r = Math.floor(127 * Math.sin(this.phase) + 128);
        const g = Math.floor(127 * Math.sin(this.phase + 2 * Math.PI / 3) + 128);
        const b = Math.floor(127 * Math.sin(this.phase + 4 * Math.PI / 3) + 128);
        
        return `rgb(${r}, ${g}, ${b})`;
    }
    
    addForce(force) {
        this.forces.push(force);
    }
    
    removeForce(force) {
        const index = this.forces.indexOf(force);
        if (index > -1) {
            this.forces.splice(index, 1);
        }
    }
    
    clone() {
        return new Particle({
            x: this.x,
            y: this.y,
            vx: this.vx,
            vy: this.vy,
            mass: this.mass,
            size: this.fontSize,
            collisions: {
                restitution: this.restitution
            },
            forces: this.forces,
            phase: this.phase,
            phaseRate: this.phaseVelocity,
            color: {
                value: this.color,
                map: this.getColor !== Particle.prototype.getColor ? this.getColor : null
            },
            boundaries: {
                ...this.boundaries,
                probability: this.boundaryProbability
            },
            character: {
                value: this.character,
                set: this.characterSet,
                rate: this.charUpdateRate,
                lock: this.lockCharacter,
                family: this.fontFamily,
                update: this.lastCharUpdate
            },
            trail: {
                rate: this.fadeSpeed
            },
            glow: this.glowEffect ? {
                color: this.glowColor,
                radius: this.glowRadius
            } : {},
            state: JSON.parse(JSON.stringify(this.state))
        });
    }
}

export default Particle;