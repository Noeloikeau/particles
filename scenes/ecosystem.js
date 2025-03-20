import Particle from '../particle.js';

export const config = {
    physics: {
        size: {
            value: 28,
            min: 16,
            max: 48,
            step: 1,
            label: 'Creature Size'
        },
        preyDensity: {
            value: 0.15,
            min: 0.05,
            max: 0.3,
            step: 0.01,
            label: 'Initial Prey Density'
        },
        predatorRatio: {
            value: 0.1,
            min: 0.01,
            max: 0.3,
            step: 0.01,
            label: 'Predator/Prey Ratio'
        }
    },
    prey: {
        speed: {
            value: 1,
            min: 0.1,
            max: 5,
            step: 0.1,
            label: 'Prey Speed'
        },
        fleeRadius: {
            value: 5,
            min: 2,
            max: 10,
            step: 0.5,
            label: 'Flee Radius'
        },
        reproductionEnergy: {
            value: 150,
            min: 100,
            max: 300,
            step: 10,
            label: 'Reproduction Threshold'
        }
    },
    predator: {
        speed: {
            value: 1.5,
            min: 0.1,
            max: 5,
            step: 0.1,
            label: 'Predator Speed'
        },
        huntRadius: {
            value: 1,
            min: 0.5,
            max: 3,
            step: 0.1,
            label: 'Hunt Radius'
        },
        energyDrain: {
            value: 0.05,
            min: 0.01,
            max: 0.2,
            step: 0.01,
            label: 'Energy Loss Rate'
        },
        energyGain: {
            value: 100,
            min: 50,
            max: 200,
            step: 10,
            label: 'Energy from Kill'
        }
    }
};

export function createScene(config) {
    const { width, height } = config;
    const cellSize = config.physics.size;
    const cols = Math.floor(width / cellSize);
    const rows = Math.floor(height / cellSize);
    const preyCount = Math.floor(cols * rows * config.physics.preyDensity);
    const predatorCount = Math.floor(preyCount * config.physics.predatorRatio);
    const particles = [];

    // Create prey force with neighbor awareness
    const createPreyForce = () => {
        const force = (p, sys) => {
            const neighbors = sys.getNeighbors(p);
            let fx = 0, fy = 0;

            for (const [_, data] of neighbors) {
                if (data.distance < cellSize * config.prey.fleeRadius) {
                    const other = data.particle;
                    if (other.state?.type === 'predator') {
                        // Enhanced flee behavior with squared distance for more dramatic escape
                        const repel = 10 * cellSize / (data.distance * data.distance);
                        fx -= repel * data.dx / data.distance;
                        fy -= repel * data.dy / data.distance;
                    }
                }
            }

            // Base movement plus random wandering
            fx += (Math.random() - 0.5) * cellSize * config.prey.speed;
            fy += (Math.random() - 0.5) * cellSize * config.prey.speed;

            // Reproduction
            if (p.state.energy >= config.prey.reproductionEnergy &&
                performance.now() - p.state.lastSpawn > 5000) {
                p.state.energy -= 75;
                p.state.lastSpawn = performance.now();
                const newPrey = p.clone();
                newPrey.x += Math.random() * cellSize - cellSize / 2;
                newPrey.y += Math.random() * cellSize - cellSize / 2;
                newPrey.state.energy = 75;
                newPrey.state.lastSpawn = performance.now();
                sys.addParticles([newPrey]);
            }

            // Ensure proper wrapping at boundaries
            p.x = (p.x + width) % width;
            p.y = (p.y + height) % height;

            return [fx, fy];
        };
        force.useNeighbors = true;
        return force;
    };

    // Create predator force with neighbor awareness
    const createPredatorForce = () => {
        const force = (p, sys) => {
            const neighbors = sys.getNeighbors(p);
            let fx = 0, fy = 0;
            let nearestPrey = null;
            let minDist = Infinity;
            let preyDx = 0, preyDy = 0;

            for (const [_, data] of neighbors) {
                if (data.particle.state?.type === 'prey' && data.distance < minDist) {
                    nearestPrey = data.particle;
                    minDist = data.distance;
                    preyDx = data.dx;
                    preyDy = data.dy;
                }
            }

            // Energy depletion
            p.state.energy -= config.predator.energyDrain;

            if (p.state.energy <= 0) {
                p.remove = true;
                return [0, 0];
            }

            if (nearestPrey) {
                // Enhanced chase behavior
                const attract = 8 * cellSize / (minDist + 1);
                fx = attract * preyDx/minDist * config.predator.speed;
                fy = attract * preyDy/minDist * config.predator.speed;

                // Hunting success
                if (minDist < cellSize * config.predator.huntRadius) {
                    nearestPrey.remove = true;
                    p.state.energy += config.predator.energyGain;
                }
            } else {
                // Random movement when no prey in sight
                fx = (Math.random() - 0.5) * cellSize * config.predator.speed;
                fy = (Math.random() - 0.5) * cellSize * config.predator.speed;
            }

            // Ensure proper wrapping at boundaries
            p.x = (p.x + width) % width;
            p.y = (p.y + height) % height;

            return [fx, fy];
        };
        force.useNeighbors = true;
        return force;
    };

    // Create prey
    for (let i = 0; i < preyCount; i++) {
        particles.push(new Particle({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * cellSize,
            vy: (Math.random() - 0.5) * cellSize,
            size: cellSize,
            character: {
                value: '🐑',
                lock: true
            },
            color: 'rgb(0, 255, 0)',  // Green tint
            glow: {
                radius: cellSize/2,
                color: 'rgba(0, 255, 0, 0.3)'
            },
            boundaries: {
                top: 'periodic',
                bottom: 'periodic',
                left: 'periodic',
                right: 'periodic'
            },
            state: {
                type: 'prey',
                energy: 100,
                lastSpawn: performance.now()
            },
            forces: [createPreyForce()]
        }));
    }

    // Create predators
    for (let i = 0; i < predatorCount; i++) {
        particles.push(new Particle({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * cellSize * 1.5,
            vy: (Math.random() - 0.5) * cellSize * 1.5,
            size: cellSize * 1.2,
            character: {
                value: '🐺',
                lock: true
            },
            color: 'rgb(255, 0, 0)',  // Red tint
            glow: {
                radius: cellSize/2,
                color: 'rgba(255, 0, 0, 0.3)'
            },
            boundaries: {
                top: 'periodic',
                bottom: 'periodic',
                left: 'periodic',
                right: 'periodic'
            },
            state: {
                type: 'predator',
                energy: 150,
                lastSpawn: performance.now()
            },
            forces: [createPredatorForce()]
        }));
    }

    return particles;
}

export const metadata = {
    name: "Ecosystem",
    description: "Predator-prey dynamics with wolves and sheep"
};