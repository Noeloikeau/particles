// gravityField.js
import Particle from '../particle.js';

export const config = {
    // Physical constants
    physics: {
        G: {
            value: 1000,
            min: 0,
            max: 5000,
            step: 100,
            label: 'Gravitational Constant',
            field: 'physics'
        },
        softening: {
            value: 50,
            min: 1,
            max: 200,
            step: 1,
            label: 'Softening Length',
            field: 'physics'
        },
        massDistribution: {
            value: 'uniform',
            options: ['uniform', 'logarithmic', 'powerlaw'],
            label: 'Mass Distribution',
            field: 'physics'
        }
    },

    // Initial conditions
    initial: {
        bodies: {
            value: 100,
            min: 2,
            max: 500,
            step: 1,
            label: 'Number of Bodies',
            field: 'structure'
        },
        distribution: {
            value: 'disk',
            options: ['disk', 'sphere', 'binary', 'random'],
            label: 'Initial Distribution',
            field: 'structure'
        },
        rotation: {
            value: 0.5,
            min: 0,
            max: 1,
            step: 0.1,
            label: 'Initial Rotation',
            field: 'motion'
        }
    },

    // Visual representation
    character: {
        set: {
            value: 'binary',
            options: ['binary', 'digits'],
            label: 'Particle Style'
        },
        rate: {
            value: 5,
            min: 0,
            max: 20,
            step: 0.1,
            label: 'Update Rate'
        }
    },

    // Enable trails for orbit visualization
    trail: {
        rate: 0.01  // Slow fade for orbit tracking
    },

    // Glow based on mass
    glow: {
        radius: 3,
        color: 'rgba(255, 255, 0, 0.2)'
    },

    // Enable collisions for merging
    collisions: true,

    // Periodic boundaries for wraparound
    boundaries: {
        top: 'periodic',
        bottom: 'periodic',
        left: 'periodic',
        right: 'periodic',
        probability: 1.0
    }
};

export function createScene(config) {
    const { width, height } = config;
    const particles = [];
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Create gravitational force
    const createGravityForce = () => {
        const force = (p1, sys) => {
            let fx = 0, fy = 0;
            const neighbors = sys.getNeighbors(p1);
            
            for (const [_, data] of neighbors) {
                const p2 = data.particle;
                const dx = data.dx;
                const dy = data.dy;
                const r2 = data.r2 + config.physics.softening;
                
                // Calculate gravitational force with softening
                const F = config.physics.G * p1.mass * p2.mass / (r2 * Math.sqrt(r2));
                fx += F * dx;
                fy += F * dy;
                
                // Handle collisions/merging
                if (config.collisions && r2 < (p1.size + p2.size) * 0.5) {
                    // Conserve momentum and merge
                    const totalMass = p1.mass + p2.mass;
                    const ratio = p2.mass / totalMass;
                    p1.vx = p1.vx * (1 - ratio) + p2.vx * ratio;
                    p1.vy = p1.vy * (1 - ratio) + p2.vy * ratio;
                    p1.mass = totalMass;
                    p1.size *= Math.cbrt(ratio + 1);
                    p2.remove = true;
                }
            }
            
            return [fx, fy];
        };
        
        force.useNeighbors = true;
        return force;
    };

    // Generate initial positions based on distribution
    const generatePosition = (i, n) => {
        const angle = (2 * Math.PI * i) / n;
        let r, x, y, vx, vy;
        
        switch (config.initial.distribution) {
            case 'disk':
                r = Math.sqrt(Math.random()) * height * 0.2;
                x = centerX + r * Math.cos(angle);
                y = centerY + r * Math.sin(angle);
                // Add orbital velocity
                const v = Math.sqrt(config.physics.G * 1000 / r) * config.initial.rotation;
                vx = -v * Math.sin(angle);
                vy = v * Math.cos(angle);
                break;
            
            case 'binary':
                const sep = height * 0.2;
                if (i < n/2) {
                    x = centerX - sep/2;
                    y = centerY + (Math.random() - 0.5) * sep/4;
                } else {
                    x = centerX + sep/2;
                    y = centerY + (Math.random() - 0.5) * sep/4;
                }
                vx = (Math.random() - 0.5) * 10;
                vy = (Math.random() - 0.5) * 10;
                break;
            
            default: // random
                x = Math.random() * width;
                y = Math.random() * height;
                vx = (Math.random() - 0.5) * 10;
                vy = (Math.random() - 0.5) * 10;
        }
        
        return { x, y, vx, vy };
    };

    // Generate mass based on distribution
    const generateMass = () => {
        switch (config.physics.massDistribution) {
            case 'logarithmic':
                return Math.exp(Math.random() * 3);
            case 'powerlaw':
                return Math.pow(Math.random(), -1.5);
            default:
                return 1 + Math.random();
        }
    };

    // Create particles
    for (let i = 0; i < config.initial.bodies; i++) {
        const pos = generatePosition(i, config.initial.bodies);
        const mass = generateMass();
        
        particles.push(new Particle({
            ...pos,
            mass: mass,
            size: config.size * Math.cbrt(mass),
            character: {
                set: config.character.set,
                rate: config.character.rate * (1 + Math.random() * 0.1)
            },
            trail: {
                rate: config.trail.rate
            },
            glow: {
                ...config.glow,
                radius: config.size * Math.sqrt(mass) / 2
            },
            boundaries: config.boundaries,
            collisions: config.collisions,
            forces: [createGravityForce()],
            phase: Math.random() * 2 * Math.PI,
            phaseRate: 0.5
        }));
    }

    return particles;
}

export const metadata = {
    name: "Gravity Field",
    description: "N-body gravitational system with emergent behaviors"
};