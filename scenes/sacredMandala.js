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
        layers: {
            value: 8,
            min: 3,
            max: 12,
            step: 1,
            label: 'Layer Count'
        }
    },
    orbital: {
        outerRadius: {
            value: 0.33,
            min: 0.2,
            max: 0.5,
            step: 0.01,
            label: 'Outer Ring Size'
        },
        innerRadius: {
            value: 0.2,
            min: 0.1,
            max: 0.4,
            step: 0.01,
            label: 'Inner Ring Size'
        },
        baseVelocity: {
            value: 10,
            min: 0.01,
            max: 100,
            step: 0.01,
            label: 'Base Rotation Speed'
        },
        velocityRatio: {
            value: 1.2,
            min: 0.5,
            max: 2.0,
            step: 0.1,
            label: 'Inner/Outer Speed Ratio'
        }
    },
    appearance: {
        outerGlow: {
            value: 60,
            min: 20,
            max: 100,
            step: 1,
            label: 'Outer Ring Glow'
        },
        innerGlow: {
            value: 18,
            min: 6,
            max: 60,
            step: 1,
            label: 'Inner Ring Glow'
        }
    },
    character: {
        outerSet: {
            value: 'aramaic',
            options: ['aramaic', 'sanskrit'],
            label: 'Outer Ring Script'
        },
        innerSet: {
            value: 'sanskrit',
            options: ['aramaic', 'sanskrit'],
            label: 'Inner Ring Script'
        },
        updateRate: {
            value: 0.01,
            min: 0.001,
            max: 0.1,
            step: 0.001,
            label: 'Symbol Change Rate'
        }
    },
    trail: {
        fade: {
            value: 0.01,
            min: 0.001,
            max: 0.1,
            step: 0.001,
            label: 'Trail Fade Speed'
        }
    }
};

export function createScene(config) {
    const { width, height } = config;
    const particles = [];
    const centerX = width / 2;
    const centerY = height / 2;
    const layers = config.physics.layers;
    const baseOrbitRadius = height * config.orbital.innerRadius;
    const haloOrbitRadius = height * config.orbital.outerRadius;
    const baseVelocity = config.orbital.baseVelocity;

    // Outer Golden Halo
    const haloPointCount = Math.floor(width / config.physics.size);
    const haloVelocity = baseVelocity * 2;
    
    for (let i = 0; i < haloPointCount; i++) {
        const angle = (2 * Math.PI * i) / haloPointCount;
        const initialX = centerX + haloOrbitRadius * Math.cos(angle);
        const initialY = centerY + haloOrbitRadius * Math.sin(angle);
        particles.push(new Particle({
            x: initialX,
            y: initialY,
            vx: haloVelocity * Math.sin(angle),
            vy: -haloVelocity * Math.cos(angle),
            size: config.physics.size,
            phase: 0.55,
            phaseRate: 0,
            character: {
                set: config.character.outerSet,
                rate: config.character.updateRate
            },
            trail: {
                rate: config.trail.fade
            },
            glow: {
                color: 'rgba(255, 215, 0, 0.4)',
                radius: config.appearance.outerGlow
            },
            boundaries: {
                top: 'reset',
                bottom: 'reset',
                left: 'reset',
                right: 'reset'
            },
            forces: [(p) => {
                const dx = p.x - centerX;
                const dy = p.y - centerY;
                const r = Math.sqrt(dx * dx + dy * dy);
                const forceMagnitude = haloVelocity * haloVelocity / haloOrbitRadius;
                return [
                    -forceMagnitude * dx / r * p.mass,
                    -forceMagnitude * dy / r * p.mass
                ];
            }]
        }));
    }

    // Inner Cyan Halo
    const innerHaloRadius = 0.8 * haloOrbitRadius;
    const innerHaloVelocity = haloVelocity * config.orbital.velocityRatio;
    
    for (let i = 0; i < haloPointCount; i++) {
        const angle = (2 * Math.PI * i) / haloPointCount;
        const initialX = centerX + innerHaloRadius * Math.cos(angle);
        const initialY = centerY + innerHaloRadius * Math.sin(angle);
        particles.push(new Particle({
            x: initialX,
            y: initialY,
            vx: -innerHaloVelocity * Math.sin(angle),
            vy: innerHaloVelocity * Math.cos(angle),
            size: config.physics.size,
            color: 'rgb(0, 255, 255)',
            character: {
                set: config.character.innerSet,
                rate: config.character.updateRate
            },
            trail: {
                rate: config.trail.fade
            },
            glow: {
                color: 'rgba(0, 255, 255, 0.3)',
                radius: config.appearance.innerGlow
            },
            boundaries: {
                top: 'reset',
                bottom: 'reset',
                left: 'reset',
                right: 'reset'
            },
            forces: [(p) => {
                const dx = p.x - centerX;
                const dy = p.y - centerY;
                const r = Math.sqrt(dx * dx + dy * dy);
                const forceMagnitude = innerHaloVelocity * innerHaloVelocity / innerHaloRadius;
                return [
                    -forceMagnitude * dx / r * p.mass,
                    -forceMagnitude * dy / r * p.mass
                ];
            }]
        }));
    }

    // Inner Mandala layers
    for (let layer = 0; layer < layers; layer++) {
        const layerRadius = baseOrbitRadius * (1 - layer * 0.1);
        const pointCount = 12 + layer * 4;
        const layerVelocity = baseVelocity * Math.sqrt(baseOrbitRadius / layerRadius);

        for (let i = 0; i < pointCount; i++) {
            const angle = (2 * Math.PI * i) / pointCount;
            const initialX = centerX + layerRadius * Math.cos(angle);
            const initialY = centerY + layerRadius * Math.sin(angle);

            particles.push(new Particle({
                x: initialX,
                y: initialY,
                vx: -layerVelocity * (initialY - centerY) / layerRadius,
                vy: layerVelocity * (initialX - centerX) / layerRadius,
                size: config.physics.size * (1 - layer * 0.1),
                phase: 0.55,
                phaseRate: 0,
                character: {
                    set: layer < 4 ? 'sanskrit' : 'aramaic',
                    rate: config.character.updateRate
                },
                trail: {
                    rate: config.trail.fade
                },
                glow: {
                    color: layer % 2 === 0 ? 
                        `rgba(255, ${155 + layer * 10}, ${layer * 30}, 0.3)` : 
                        'rgba(0, 255, 255, 0.3)',
                    radius: (8 - layer) * 6
                },
                color: layer % 2 === 1 ? 'rgb(0, 255, 255)' : undefined,
                boundaries: {
                    top: 'reset',
                    bottom: 'reset',
                    left: 'reset',
                    right: 'reset'
                },
                forces: [(p) => {
                    const dx = p.x - centerX;
                    const dy = p.y - centerY;
                    const r = Math.sqrt(dx * dx + dy * dy);
                    const forceMagnitude = layerVelocity * layerVelocity / layerRadius;
                    return [
                        -forceMagnitude * dx / r * p.mass,
                        -forceMagnitude * dy / r * p.mass
                    ];
                }]
            }));
        }
    }

    return particles;
}

export const metadata = {
    name: "Sacred Mandala",
    description: "Multi-layered rotating mandala with glowing scripts"
};