import Particle from '../particle.js';

export const config = {
    physics: {
        size: {
            value: 28,
            min: 8,
            max: 48,
            step: 1,
            label: 'Font Size'
        }
    },
    motion: {
        vy: {
            value: 30,
            min: 0,
            max: 100,
            step: 1,
            label: 'Helix Speed'
        },
        radius: {
            value: 100,
            min: 50,
            max: 200,
            step: 5,
            label: 'Helix Radius'
        }
    },
    character: {
        set: {
            value: 'dna',
            options: ['dna'],
            label: 'Character Set'
        },
        rate: {
            value: 1,
            min: 0.1,
            max: 5,
            step: 0.1,
            label: 'Update Rate'
        }
    },
    trail: {
        fade: {
            value: 0.05,
            min: 0.01,
            max: 1,
            step: 0.01,
            label: 'Fade Speed'
        }
    },
    boundaries: {
        top: {
            value: 'periodic',
            options: ['periodic'],
            label: 'Top Boundary'
        },
        bottom: {
            value: 'periodic',
            options: ['periodic'],
            label: 'Bottom Boundary'
        },
        left: {
            value: 'reset',
            options: ['reset'],
            label: 'Left Boundary'
        },
        right: {
            value: 'reset',
            options: ['reset'],
            label: 'Right Boundary'
        }
    }
};

export function createScene(config) {
    const { width, height } = config;
    const particles = [];
    const helixRadius = config.motion.radius;
    const verticalSpacing = 20;
    const numParticles = Math.floor(height / verticalSpacing) * 2;
    const centerX = width / 2;
    
    // Create force function with neighbor awareness
    const createHelixForce = (isLeftHelix) => {
        const force = (p, sys) => {
            const currentPhase = (p.y / height) * Math.PI * 2;
            const targetX = centerX + (isLeftHelix ? -1 : 1) * helixRadius * Math.cos(currentPhase);
            const dx = targetX - p.x;
            
            // Get nearest neighbors
            const neighbors = sys.getNeighbors(p);
            let nearest = null;
            let minDist = Infinity;
            
            for (const [_, data] of neighbors) {
                if (data.distance < minDist) {
                    minDist = data.distance;
                    nearest = data.particle;
                }
            }
            
            // Character swapping logic
            if (nearest && minDist < config.physics.size) {
                const updateInterval = 1 / p.charUpdateRate;
                const currentTime = performance.now() / 1000;
                
                if (!p.lastCharUpdate || currentTime - p.lastCharUpdate >= updateInterval) {
                    const p1 = p.phase;
                    const p2 = nearest.phase;
                    p.character = nearest.character;
                    p.phase = p2;
                    nearest.phase = p1;
                    p.lastCharUpdate = currentTime;
                }
            }
            
            return [10 * dx * p.mass, 0];
        };
        
        force.useNeighbors = true;
        return force;
    };
    
    // Create particles
    for (let i = 0; i < numParticles; i++) {
        const isLeftHelix = i % 2 === 0;
        const baseY = (Math.floor(i / 2) * verticalSpacing) % height;
        const phase = (baseY / height) * Math.PI * 2;
        
        particles.push(new Particle({
            x: centerX + (isLeftHelix ? -1 : 1) * helixRadius * Math.cos(phase),
            y: baseY,
            vx: 0,
            vy: config.motion.vy,
            size: config.physics.size,
            phase: isLeftHelix ? phase : -phase,
            phaseRate: 0,
            character: {
                set: config.character.set,
                rate: config.character.rate * (1 + Math.random() * 0.1),
                update: performance.now()/1000
            },
            trail: {
                rate: config.trail.fade
            },
            boundaries: {
                top: config.boundaries.top,
                bottom: config.boundaries.bottom,
                left: config.boundaries.left,
                right: config.boundaries.right
            },
            forces: [createHelixForce(isLeftHelix)]
        }));
    }
    
    return particles;
}

export const metadata = {
    name: "DNA Helix",
    description: "Double helix with character swapping"
};