import Particle from '../particle.js';

export const config = {
    // Simple value override, inherits all UI config
    vy: 560,
    
    character: {
        rate: {
            value: 20,
            field: 'appearance',
            label: 'Symbol Change Rate'
        }
    },
    
    trail: {
        rate: 0.01
    },

    boundaries: {
        bottom: 'randomDelay'
    }
};

export function createScene(config) {
    const { width, height } = config;
    const particles = [];
    const columns = Math.floor(width / config.size);
    
    for (let i = 0; i < columns; i++) {
        particles.push(new Particle({
            x: config.size/2 + i * config.size,
            y: Math.random() * height * 2 - height,
            vx: 0,
            vy: config.vy,
            size: config.size,
            character: {
                set: config.character.set,
                rate: config.character.rate
            },
            trail: {
                rate: config.trail.rate
            },
            boundaries: {
                ...config.boundaries,
                left: 'reflecting',
                right: 'reflecting'
            }
        }));
    }
    
    return particles;
}


export const metadata = {
    name: "Matrix Rain",
    description: "Classic matrix-style falling characters"
};