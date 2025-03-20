// waveFunction.js
import Particle from '../particle.js';

export const config = {
    // Wave properties
    wave: {
        frequency: {
            value: 2.0,
            min: 0.1,
            max: 10.0,
            step: 0.1,
            label: 'Base Frequency',
            field: 'physics'
        },
        sources: {
            value: 2,
            min: 1,
            max: 4,
            step: 1,
            label: 'Wave Sources',
            field: 'physics'
        },
        coupling: {
            value: 0.5,
            min: 0,
            max: 1,
            step: 0.05,
            label: 'Phase Coupling',
            field: 'physics'
        }
    },

    // Color dynamics
    color: {
        mode: {
            value: 'complex',
            options: ['complex', 'amplitude', 'interference'],
            label: 'Color Mode',
            field: 'appearance'
        },
        saturation: {
            value: 0.8,
            min: 0,
            max: 1,
            step: 0.1,
            label: 'Color Saturation',
            field: 'appearance'
        }
    },

    // Character behavior
    character: {
        set: {
            value: 'binary',
            options: ['binary', 'digits', 'katakana'],
            label: 'Symbol Set'
        },
        rate: {
            value: 5,
            min: 0,
            max: 20,
            step: 0.1,
            label: 'Update Rate'
        },
        mode: {
            value: 'phase',
            options: ['phase', 'amplitude', 'random'],
            label: 'Symbol Mode'
        }
    },

    // Phase dynamics
    phaseRate: {
        value: 2,
        min: 0,
        max: 5,
        step: 0.1,
        label: 'Phase Speed'
    },

    // Grid properties
    grid: {
        density: {
            value: 0.5,
            min: 0.01,
            max: 10.0,
            step: 0.01,
            label: 'Grid Density',
            field: 'structure'
        }
    },

    // Enable trails for wave visualization
    trail: {
        rate: 0.05
    },

    // Glow for interference visualization
    glow: {
        radius: 3,
        color: 'rgba(255, 255, 255, 0.2)'
    }
};

export function createScene(config) {
    const { width, height } = config;
    const particles = [];
    const spacing = config.size / config.grid.density;
    const cols = Math.floor(width / spacing);
    const rows = Math.floor(height / spacing);

    // Create wave sources
    const sources = [];
    for (let i = 0; i < config.wave.sources; i++) {
        const angle = (2 * Math.PI * i) / config.wave.sources;
        const radius = Math.min(width, height) * 0.3;
        sources.push({
            x: width/2 + radius * Math.cos(angle),
            y: height/2 + radius * Math.sin(angle),
            phase: 0
        });
    }

    // Wave superposition function
    const calculateWave = (x, y, t) => {
        let real = 0, imag = 0;
        
        for (const source of sources) {
            const dx = x - source.x;
            const dy = y - source.y;
            const r = Math.sqrt(dx*dx + dy*dy);
            const phase = config.wave.frequency * (r/50 - t);
            
            real += Math.cos(phase) / Math.sqrt(r + 1);
            imag += Math.sin(phase) / Math.sqrt(r + 1);
        }
        
        const amplitude = Math.sqrt(real*real + imag*imag);
        const phase = Math.atan2(imag, real);
        return { amplitude, phase };
    };

    // Color mapping functions
    const colorModes = {
        complex: (amplitude, phase) => {
            const h = (phase / (2 * Math.PI) + 1) * 360;
            const s = config.color.saturation * 100;
            const l = 50 + amplitude * 25;
            return `hsl(${h}, ${s}%, ${l}%)`;
        },
        amplitude: (amplitude) => {
            const h = amplitude * 260;
            const s = config.color.saturation * 100;
            return `hsl(${h}, ${s}%, 50%)`;
        },
        interference: (amplitude, phase) => {
            const r = Math.cos(phase) * 127 + 128;
            const g = Math.sin(phase) * 127 + 128;
            const b = amplitude * 255;
            return `rgb(${r}, ${g}, ${b})`;
        }
    };

    // Create phase coupling force
    const createPhaseCouplingForce = () => {
        const force = (p, sys) => {
            const neighbors = sys.getNeighbors(p);
            let phaseDiff = 0;
            
            for (const [_, data] of neighbors) {
                if (data.distance < spacing * 2) {
                    const other = data.particle;
                    phaseDiff += Math.sin(other.phase - p.phase);
                }
            }
            
            // Adjust phase rate based on neighbors
            p.phaseRate = config.phaseRate + 
                         config.wave.coupling * phaseDiff;
            
            return [0, 0]; // Phase coupling doesn't create physical forces
        };
        
        force.useNeighbors = true;
        return force;
    };

    // Create grid of particles
    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            const x = i * spacing + spacing/2;
            const y = j * spacing + spacing/2;
            const { amplitude, phase } = calculateWave(x, y, 0);
            
            particles.push(new Particle({
                x, y,
                vx: 0, vy: 0,
                mass: 1,
                size: config.size,
                phase: phase,
                phaseRate: config.phaseRate,
                character: {
                    set: config.character.set,
                    rate: config.character.rate,
                    update: (particle, time) => {
                        const { amplitude, phase } = calculateWave(
                            particle.x, 
                            particle.y, 
                            time
                        );
                        
                        // Update color based on mode
                        particle.color = colorModes[config.color.mode](
                            amplitude, 
                            phase
                        );
                        
                        // Update character based on mode
                        if (config.character.mode === 'phase') {
                            particle.phase = phase;
                        } else if (config.character.mode === 'amplitude') {
                            particle.phaseRate = amplitude * config.phaseRate;
                        }
                    }
                },
                trail: {
                    rate: config.trail.rate
                },
                glow: {
                    ...config.glow,
                    radius: config.size * amplitude
                },
                color: colorModes[config.color.mode](amplitude, phase),
                forces: [createPhaseCouplingForce()]
            }));
        }
    }

    return particles;
}

export const metadata = {
    name: "Wave Function",
    description: "Quantum-inspired wave interference patterns"
};