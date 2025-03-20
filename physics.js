// physics.js - Complete physics engine with per-particle properties
class PhysicsSystem {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.particles = [];
        this.newParticles = []; // Array to hold new particles
        this.neighbors = new Map();  // particle.id -> Map of neighbor data
        this.time = 0;
        this.initialState = null;     // For simulation reset
    }

    addParticles(particles) {
        this.newParticles.push(...particles);
        if (this.initialState == null)
            this.saveInitialState();
    }

    clear() {
        this.particles = [];
        this.newParticles = []; // Clear newParticles as well
        this.neighbors.clear();
        this.initialState = null;
    }

    saveInitialState() {
        this.initialState = this.particles.map(p => ({
            x: p.x,
            y: p.y,
            vx: p.vx,
            vy: p.vy,
            phase: p.phase,
            phaseVelocity: p.phaseVelocity,
            forces: [...p.forces],
            boundaries: {...p.boundaries},
            mass: p.mass,
            // Add any other properties that need to be restored
        }));
    }

    resetToInitial() {
        if (this.initialState) {
            this.particles.forEach((p, i) => {
                Object.assign(p, this.initialState[i]);
            });
        }
    }

    // Compute nearest neighbors for all particles that need them
    computeNeighbors() {
        this.neighbors.clear();

        // Only process particles that need neighbors
        const activeParticles = this.particles.filter(p => 
            p.collisions || p.forces?.some(f => f.useNeighbors));

        for (let i = 0; i < activeParticles.length; i++) {
            const p1 = activeParticles[i];
            // Use collisionRadius if defined, otherwise default to fontSize/2
            const searchRadius = p1.collisionRadius || p1.fontSize/2 || 7;

            if (!this.neighbors.has(p1.id)) {
                this.neighbors.set(p1.id, new Map());
            }

            for (let j = i + 1; j < activeParticles.length; j++) {
                const p2 = activeParticles[j];
                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;
                const r2 = dx * dx + dy * dy;
                
                // Use larger of the two search radii
                const maxRadius = Math.max(
                    searchRadius,
                    p2.collisionRadius || p2.fontSize/2 || 7
                );

                if (r2 < maxRadius * maxRadius * 4) { // Use 4x radius for early pruning
                    const dist = Math.sqrt(r2);
                    
                    if (!this.neighbors.has(p2.id)) {
                        this.neighbors.set(p2.id, new Map());
                    }

                    this.neighbors.get(p1.id).set(p2.id, {
                        particle: p2,
                        dx, dy,
                        distance: dist,
                        r2
                    });

                    this.neighbors.get(p2.id).set(p1.id, {
                        particle: p1,
                        dx: -dx,
                        dy: -dy,
                        distance: dist,
                        r2
                    });
                }
            }
        }
    }

    handleCollisions() {
        const collidingParticles = this.particles.filter(p => p.collisions);
        
        for (const p1 of collidingParticles) {
            const neighbors = this.neighbors.get(p1.id);
            if (!neighbors) continue;

            for (const [id2, data] of neighbors) {
                const p2 = data.particle;
                if (!p2.collisions) continue;

                const r1 = p1.collisionRadius || p1.fontSize/2 || 7;
                const r2 = p2.collisionRadius || p2.fontSize/2 || 7;
                const minDist = r1 + r2;
                
                if (data.distance < minDist) {
                    const dx = data.dx;
                    const dy = data.dy;
                    const dist = data.distance;

                    // Compute relative velocity
                    const dvx = p2.vx - p1.vx;
                    const dvy = p2.vy - p1.vy;
                    
                    // Normal vector
                    const nx = dx / dist;
                    const ny = dy / dist;
                    
                    // Normal component of relative velocity
                    const vrn = dvx * nx + dvy * ny;
                    
                    // Only collide if particles are approaching
                    // Add small negative threshold to handle numerical imprecision
                    if (vrn < -0.01) {
                        // Average restitution
                        const restitution = (p1.restitution + p2.restitution) / 2;
                        
                        // Collision impulse
                        const j = -(1 + restitution) * vrn / (1/p1.mass + 1/p2.mass);
                        const jx = j * nx;
                        const jy = j * ny;
                        
                        // Apply impulse
                        p1.vx -= jx / p1.mass;
                        p1.vy -= jy / p1.mass;
                        p2.vx += jx / p2.mass;
                        p2.vy += jy / p2.mass;
                        
                        // Separation to prevent sinking
                        const overlap = minDist - dist;
                        if (overlap > 0) {
                            // More aggressive separation for high-speed collisions
                            const separationScale = Math.min(1.0, Math.abs(vrn) / 10);
                            const correction = overlap * separationScale;
                            
                            const m1 = p1.mass;
                            const m2 = p2.mass;
                            const totalMass = m1 + m2;
                            
                            p1.x -= correction * (m2/totalMass) * nx;
                            p1.y -= correction * (m2/totalMass) * ny;
                            p2.x += correction * (m1/totalMass) * nx;
                            p2.y += correction * (m1/totalMass) * ny;
                        }
                    }
                }
            }
        }
    }

    handleBoundaries(particle) {
        const prob = particle.boundaryProbability || 0.975;

        // Top boundary
        if (particle.y < 0) {
            switch (particle.boundaries.top) {
                case 'reflecting':
                    particle.y = 0;
                    particle.vy = -particle.vy * particle.restitution;
                    break;
                case 'periodic':
                    particle.y = this.height;
                    break;
                case 'randomDelay':
                    if (Math.random() > prob) {
                        particle.y = this.height;
                    }
                    break;
                case 'reset':
                    this.resetToInitial();
                    break
            }
        }

        // Bottom boundary
        if (particle.y > this.height) {
            switch (particle.boundaries.bottom) {
                case 'reflecting':
                    particle.y = this.height;
                    particle.vy = -particle.vy * particle.restitution;
                    break;
                case 'periodic':
                    particle.y = 0;
                    break;
                case 'randomDelay':
                    if (Math.random() > prob) {
                        particle.y = 0;
                    }
                    break;
                case 'reset':
                    this.resetToInitial();
                    break
            }
        }

        // Left boundary
        if (particle.x < 0) {
            switch (particle.boundaries.left) {
                case 'reflecting':
                    particle.x = 0;
                    particle.vx = -particle.vx * particle.restitution;
                    break;
                case 'periodic':
                    particle.x = this.width;
                    break;
                case 'randomDelay':
                    if (Math.random() > prob) {
                        particle.x = this.width;
                        particle.vx = Math.abs(particle.vx);
                    }
                    break;
                case 'reset':
                    this.resetToInitial();
                    break
            }
        }

        // Right boundary
        if (particle.x > this.width) {
            switch (particle.boundaries.right) {
                case 'reflecting':
                    particle.x = this.width;
                    particle.vx = -particle.vx * particle.restitution;
                    break;
                case 'periodic':
                    particle.x = 0;
                    break;
                case 'randomDelay':
                    if (Math.random() > prob) {
                        particle.x = 0;
                        particle.vx = -Math.abs(particle.vx);
                    }
                    break;
                case 'reset':
                    this.resetToInitial();
                    break
            }
        }
    }

    update(dt) {
        this.time += dt;
    
        // 1. Remove marked particles
        this.particles = this.particles.filter(p => !p.remove);
    
        // 2. Add new particles
        if (this.newParticles.length > 0) {
            this.particles.push(...this.newParticles);
            this.newParticles = []; // Clear the newParticles array
        }
    
        // 3. Update neighbor cache if needed
        if (this.particles.some(p => p.collisions || 
            p.forces.some(f => f.useNeighbors))) {
            this.computeNeighbors();
        }
    
        // 4. Handle collisions
        this.handleCollisions();
    
        // 5. Update particles
        this.particles.forEach(particle => {
            // Reset acceleration
            particle.ax = 0;
            particle.ay = 0;
    
            // Apply forces
            if (particle.forces) {
                particle.forces.forEach(force => {
                    const [fx, fy] = force(particle, this);
                    particle.ax += fx / particle.mass;
                    particle.ay += fy / particle.mass;
                });
            }
    
            // Update state
            particle.update(dt);
    
            // Handle boundaries
            this.handleBoundaries(particle);
        });
    }

    getNeighbors(particle) {
        return this.neighbors.get(particle.id) || new Map();
    }

    resize(width, height) {
        this.width = width;
        this.height = height;
    }
}

export default PhysicsSystem;