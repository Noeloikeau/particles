// plasmaFlow.js
import Particle from '../particle.js';

export const config = {
    // Physical dynamics
    plasma: {
        temperature: {
            value: 2.0,
            min: 0.1,
            max: 5.0,
            step: 0.1,
            label: 'Temperature',
            field: 'physics'
        },
        magneticField: {
            value: 1.0,
            min: 0,
            max: 3.0,
            step: 0.1,
            label: 'Magnetic Field',
            field: 'physics'
        },
        pressure: {
            value: 0.5,
            min: 0.1,
            max: 2.0,
            step: 0.1,
            label: 'Pressure Coupling',
            field: 'physics'
        }
    },

    // Wave and field properties
    field: {
        frequency: {
            value: 1.0,
            min: 0.1,
            max: 5.0,
            step: 0.1,
            label: 'Field Frequency',
            field: 'physics'
        },
        vorticity: {
            value: 0.5,
            min: 0,
            max: 2.0,
            step: 0.1,
            label: 'Vorticity',
            field: 'physics'
        }
    },

    // Visual properties
    character: {
        set: {
            value: 'katakana',
            options: ['katakana', 'binary', 'sanskrit'],
            label: 'Symbol Set'
        },
        rate: {
            value: 10,
            min: 1,
            max: 30,
            step: 1,
            label: 'Symbol Change Rate'
        }
    },

    // Particle interactions
    interaction: {
        radius: {
            value: 50,
            min: 20,
            max: 200,
            step: 5,
            label: 'Interaction Range',
            field: 'physics'
        },
        strength: {
            value: 1.0,
            min: 0.1,
            max: 3.0,
            step: 0.1,
            label: 'Interaction Strength',
            field: 'physics'
        }
    },

    // Enable collisions and trails
    collisions: true,
    trail: {
        rate: 0.03
    },

    // Periodic boundaries
    boundaries: {
        top: 'periodic',
        bottom: 'periodic',
        left: 'periodic',
        right: 'periodic'
    }
};

export function createScene(config) {
    const { width, height } = config;
    const particles = [];
    const cellSize = config.size;
    const cols = Math.floor(width / (cellSize * 2));
    const rows = Math.floor(height / (cellSize * 2));

    // Plasma field calculation
    const calculateField = (x, y, t) => {
        const B = config.plasma.magneticField;
        const f = config.field.frequency;
        
        // Complex field components
        const Ex = Math.cos(f * t + x/100) * Math.sin(y/150);
        const Ey = Math.sin(f * t + y/100) * Math.cos(x/150);
        const Bz = Math.sin(f * t + (x+y)/200);
        
        return { Ex, Ey, Bz };
    };

    // Create plasma dynamics force
    const createPlasmaForce = () => {
        const force = (p, sys) => {
            const neighbors = sys.getNeighbors(p);
            let fx = 0, fy = 0;
            
            // Get local field
            const field = calculateField(p.x, p.y, sys.time);
            
            // Electromagnetic force
            fx += field.Ey * config.plasma.magneticField;
            fy -= field.Ex * config.plasma.magneticField;
            
            // Temperature-driven diffusion
            fx += (Math.random() - 0.5) * config.plasma.temperature;
            fy += (Math.random() - 0.5) * config.plasma.temperature;

            // Particle interactions
            for (const [_, data] of neighbors) {
                if (data.distance < config.interaction.radius) {
                    // Pressure force - repulsive at close range
                    const pressure = config.plasma.pressure * 
                        (1 - data.distance/config.interaction.radius);
                    fx -= pressure * data.dx/data.distance;
                    fy -= pressure * data.dy/data.distance;
                    
                    // Phase coupling - affects color and character changes
                    const phaseDiff = Math.sin(data.particle.phase - p.phase);
                    p.phaseRate += config.interaction.strength * phaseDiff;
                    
                    // Vorticity - adds rotational motion
                    const vort = config.field.vorticity;
                    fx += vort * data.dy/data.distance;
                    fy -= vort * data.dx/data.distance;
                }
            }

            // Update visual properties based on local conditions
            const energy = Math.sqrt(fx*fx + fy*fy);
            const fieldStrength = Math.sqrt(field.Ex*field.Ex + field.Ey*field.Ey);
            
            // Color based on energy and field
            const hue = (Math.atan2(fy, fx) / Math.PI + 1) * 180;
            const sat = Math.min(100, fieldStrength * 50);
            const lum = Math.min(70, 30 + energy * 20);
            p.color = `hsl(${hue}, ${sat}%, ${lum}%)`;
            
            // Glow based on energy
            if (p.glow) {
                p.glow.radius = config.size * (0.5 + energy);
                p.glow.color = `hsla(${hue}, ${sat}%, ${lum}%, 0.3)`;
            }
            
            // Scale forces by particle properties
            return [fx * p.mass, fy * p.mass];
        };
        
        force.useNeighbors = true;
        return force;
    };

    // Create initial particle distribution
    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            const x = (i + 0.5 + (Math.random() - 0.5)) * cellSize * 2;
            const y = (j + 0.5 + (Math.random() - 0.5)) * cellSize * 2;
            
            // Initial field values
            const field = calculateField(x, y, 0);
            const angle = Math.atan2(field.Ey, field.Ex);
            const strength = Math.sqrt(field.Ex*field.Ex + field.Ey*field.Ey);
            
            particles.push(new Particle({
                x, y,
                vx: strength * Math.cos(angle),
                vy: strength * Math.sin(angle),
                mass: 1 + Math.random() * 0.5,
                size: config.size,
                phase: angle,
                phaseRate: config.field.frequency,
                character: {
                    set: config.character.set,
                    rate: config.character.rate
                },
                color: `hsl(${(angle/Math.PI + 1) * 180}, 70%, 50%)`,
                trail: {
                    rate: config.trail.rate
                },
                glow: {
                    radius: config.size,
                    color: `hsla(${(angle/Math.PI + 1) * 180}, 70%, 50%, 0.3)`
                },
                collisions: config.collisions,
                boundaries: config.boundaries,
                forces: [createPlasmaForce()]
            }));
        }
    }

    return particles;
}

export const metadata = {
    name: "Plasma Flow",
    description: "Complex plasma dynamics with electromagnetic waves"
};