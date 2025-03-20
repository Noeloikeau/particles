import Particle from '../particle.js';

export const config = {
    physics: {
        size: {
            value: 28,
            min: 8,
            max: 48,
            step: 1,
            label: 'Font Size'
        },
        mass: {
            value: 1,
            min: 0.1,
            max: 5,
            step: 0.1,
            label: 'Particle Mass'
        }
    },
    motion: {
        velocity: {
            value: 0.01,
            min: 0.001,
            max: 0.05,
            step: 0.001,
            label: 'Orbital Velocity'
        }
    },
    character: {
        outerSet: {
            value: 'aramaic',
            options: ['aramaic', 'sanskrit'],
            label: 'Outer Ring Characters'
        },
        innerSet: {
            value: 'sanskrit',
            options: ['aramaic', 'sanskrit'],
            label: 'Inner Ring Characters'
        },
        rate: {
            value: 0.01,
            min: 0.001,
            max: 0.1,
            step: 0.001,
            label: 'Update Rate'
        }
    },
    glow: {
        outerRadius: {
            value: 60,
            min: 20,
            max: 100,
            step: 1,
            label: 'Outer Glow'
        },
        innerRadius: {
            value: 18,
            min: 6,
            max: 60,
            step: 1,
            label: 'Inner Glow'
        },
        outerColor: {
            value: 'rgba(255, 215, 0, 0.4)',
            label: 'Outer Glow Color'
        },
        innerColor: {
            value: 'rgba(0, 255, 255, 0.3)',
            label: 'Inner Glow Color'
        }
    },
    trail: {
        fade: {
            value: 0.01,
            min: 0.001,
            max: 0.1,
            step: 0.001,
            label: 'Fade Speed'
        }
    }
};

export function createScene(config) {
    const { width, height } = config;
    const particles = [];
    
    const ringRadius = height / 3;
    const L = Math.floor(width / config.physics.size);
    const v = config.physics.size / (config.character.rate * 10) * config.motion.velocity;
    
    // Golden Aramaic halo
    for (let i = 0; i < L; i++) {
        const angle = (2 * Math.PI * i) / L;
        particles.push(new Particle({
            x: width/2 + ringRadius * Math.cos(angle),
            y: height/2 + ringRadius * Math.sin(angle),
            vx: v * Math.sin(angle),
            vy: -v * Math.cos(angle),
            size: config.physics.size,
            mass: config.physics.mass,
            phase: 0.55,
            phaseRate: 0,
            character: {
                set: config.character.outerSet,
                rate: config.character.rate
            },
            trail: {
                rate: config.trail.fade
            },
            glow: {
                radius: config.glow.outerRadius,
                color: config.glow.outerColor
            },
            boundaries: {
                top: 'reset',
                bottom: 'reset',
                left: 'reset',
                right: 'reset'
            },
            forces: [(p) => {
                const dx = p.x - width/2;
                const dy = p.y - height/2;
                const angle = Math.atan2(dy, dx);
                return [
                    -(v*v/ringRadius) * Math.cos(angle) * p.mass,
                    -(v*v/ringRadius) * Math.sin(angle) * p.mass
                ];
            }]
        }));
    }
    
    // Cyan Sanskrit inner halo
    const r = 0.8 * ringRadius;
    for (let i = 0; i < L; i++) {
        const angle = (2 * Math.PI * i) / L;
        particles.push(new Particle({
            x: width/2 + r * Math.cos(angle),
            y: height/2 + r * Math.sin(angle),
            vx: -v * Math.sin(angle),
            vy: v * Math.cos(angle),
            size: config.physics.size,
            mass: config.physics.mass,
            phase: 0,
            phaseRate: 0,
            color: 'rgb(0, 255, 255)',
            character: {
                set: config.character.innerSet,
                rate: config.character.rate
            },
            trail: {
                rate: config.trail.fade
            },
            glow: {
                radius: config.glow.innerRadius,
                color: config.glow.innerColor
            },
            boundaries: {
                top: 'reset',
                bottom: 'reset',
                left: 'reset',
                right: 'reset'
            },
            forces: [(p) => {
                const dx = p.x - width/2;
                const dy = p.y - height/2;
                const angle = Math.atan2(dy, dx);
                return [
                    -(v*v/r) * Math.cos(angle) * p.mass,
                    -(v*v/r) * Math.sin(angle) * p.mass
                ];
            }]
        }));
    }
    
    return particles;
}

export const metadata = {
    name: "Supernova",
    description: "Dual-ring celestial formation"
};