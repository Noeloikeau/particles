// crystalAutomata.js
import Particle from '../particle.js';

export const config = {
    // Growth rules
    rules: {
        neighborhood: {
            value: 'von_neumann',  // 4-connected
            options: ['von_neumann', 'moore', 'extended'],  // 4, 8, or 24 neighbors
            label: 'Growth Pattern',
            field: 'rules'
        },
        threshold: {
            value: 3,
            min: 1,
            max: 8,
            step: 1,
            label: 'Growth Threshold',
            field: 'rules'
        },
        symmetry: {
            value: 6,
            min: 2,
            max: 12,
            step: 1,
            label: 'Symmetry Order',
            field: 'rules'
        }
    },

    // Update timing
    timing: {
        evolutionRate: {
            value: 2,
            min: 0.5,
            max: 10,
            step: 0.5,
            label: 'Growth Speed',
            field: 'rules'
        }
    },

    // Crystal properties
    crystal: {
        seed: {
            value: 'center',
            options: ['center', 'random', 'line', 'scattered'],
            label: 'Initial Seeds',
            field: 'structure'
        },
        seedCount: {
            value: 1,
            min: 1,
            max: 10,
            step: 1,
            label: 'Seed Count',
            field: 'structure'
        }
    },

    // Visual representation
    character: {
        set: {
            value: 'binary',
            options: ['binary', 'aramaic', 'sanskrit'],
            label: 'Symbol Set'
        },
        mode: {
            value: 'state',
            options: ['state', 'age', 'energy'],
            label: 'Symbol Mode'
        },
        rate: 5  // Update rate tied to state changes
    },

    // Color mapping
    color: {
        scheme: {
            value: 'state',
            options: ['state', 'energy', 'age', 'direction'],
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

    // Static particles
    vx: 0,
    vy: 0,
    
    // No trails (crystalline structure)
    trail: {
        rate: 0
    },

    // Glow for active growth sites
    glow: {
        radius: 2,
        color: 'rgba(255, 255, 255, 0.2)'
    }
};

export function createScene(config) {
    const { width, height } = config;
    const cellSize = config.size;
    const cols = Math.floor(width / cellSize);
    const rows = Math.floor(height / cellSize);
    const particles = [];
    const updateInterval = 1000 / config.timing.evolutionRate;

    // Define cell states
    const States = {
        EMPTY: 0,
        GROWING: 1,
        CRYSTAL: 2,
        ACTIVE: 3,
        STABLE: 4
    };

    // Character sets for different states
    const stateChars = {
        binary: ['0', '1', '▣', '▤', '▥'],
        aramaic: ['ܐ', 'ܒ', 'ܓ', 'ܕ', 'ܗ'],
        sanskrit: ['अ', 'आ', 'इ', 'ई', 'उ']
    };

    // Color schemes
    const getStateColor = (state, age, energy, direction) => {
        switch (config.color.scheme) {
            case 'state':
                const hue = state * 72; // 360/5 states = 72° per state
                return `hsl(${hue}, ${config.color.saturation * 100}%, 50%)`;
            case 'energy':
                return `hsl(${energy * 360}, ${config.color.saturation * 100}%, 50%)`;
            case 'age':
                const ageSat = Math.min(100, age * 10);
                return `hsl(60, ${ageSat}%, 50%)`;
            case 'direction':
                return `hsl(${direction}, ${config.color.saturation * 100}%, 50%)`;
            default:
                return 'white';
        }
    };

    // Get neighbors based on neighborhood type
    const getNeighbors = (x, y, grid) => {
        const neighbors = [];
        const patterns = {
            von_neumann: [[0,1], [1,0], [0,-1], [-1,0]],
            moore: [[0,1], [1,1], [1,0], [1,-1], [0,-1], [-1,-1], [-1,0], [-1,1]],
            extended: [
                // Von Neumann neighborhood at distance 2
                [0,2], [2,0], [0,-2], [-2,0],
                // Moore neighborhood at distance 1
                [0,1], [1,1], [1,0], [1,-1], [0,-1], [-1,-1], [-1,0], [-1,1]
            ]
        };

        for (const [dx, dy] of patterns[config.rules.neighborhood]) {
            const nx = (x + dx + cols) % cols;
            const ny = (y + dy + rows) % rows;
            neighbors.push(grid[ny][nx]);
        }
        return neighbors;
    };

    // Initialize grid
    const grid = Array(rows).fill().map(() => Array(cols).fill(null));

    // Create particles and grid
    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            const particle = new Particle({
                x: i * cellSize + cellSize/2,
                y: j * cellSize + cellSize/2,
                vx: 0,
                vy: 0,
                size: cellSize,
                character: {
                    set: config.character.set,
                    value: stateChars[config.character.set][0]
                },
                state: {
                    type: States.EMPTY,
                    age: 0,
                    energy: 0,
                    gridX: i,
                    gridY: j,
                    lastUpdate: performance.now()
                }
            });

            particles.push(particle);
            grid[j][i] = particle;
        }
    }

    // Place initial seeds
    const placeSeed = (x, y) => {
        if (x >= 0 && x < cols && y >= 0 && y < rows) {
            const particle = grid[y][x];
            particle.state.type = States.CRYSTAL;
            particle.character = stateChars[config.character.set][2];
            particle.color = getStateColor(2, 0, 1, 0);
            particle.glow = {
                ...config.glow,
                radius: config.size,
                color: 'rgba(255, 255, 255, 0.4)'
            };
        }
    };

    switch (config.crystal.seed) {
        case 'center':
            placeSeed(Math.floor(cols/2), Math.floor(rows/2));
            break;
        case 'random':
            for (let i = 0; i < config.crystal.seedCount; i++) {
                placeSeed(
                    Math.floor(Math.random() * cols),
                    Math.floor(Math.random() * rows)
                );
            }
            break;
        case 'line':
            const mid = Math.floor(rows/2);
            for (let i = 0; i < config.crystal.seedCount; i++) {
                placeSeed(
                    Math.floor(cols/3 + (cols/3 * i/config.crystal.seedCount)),
                    mid
                );
            }
            break;
        case 'scattered':
            for (let i = 0; i < config.crystal.seedCount; i++) {
                const angle = (2 * Math.PI * i) / config.crystal.seedCount;
                const radius = Math.min(cols, rows) / 4;
                placeSeed(
                    Math.floor(cols/2 + radius * Math.cos(angle)),
                    Math.floor(rows/2 + radius * Math.sin(angle))
                );
            }
            break;
    }

    // Create automaton update force
    const createAutomatonForce = () => {
        const force = (p, sys) => {
            const currentTime = performance.now();
            if (currentTime - p.state.lastUpdate < updateInterval) {
                return [0, 0];
            }

            // Get current state
            const neighbors = getNeighbors(p.state.gridX, p.state.gridY, grid);
            const crystalNeighbors = neighbors.filter(n => 
                n.state.type === States.CRYSTAL || 
                n.state.type === States.ACTIVE
            ).length;

            // Update state based on rules
            let newState = p.state.type;
            let newEnergy = p.state.energy;

            if (p.state.type === States.EMPTY && 
                crystalNeighbors >= config.rules.threshold) {
                newState = States.GROWING;
                newEnergy = 1;
            } else if (p.state.type === States.GROWING) {
                newState = States.CRYSTAL;
                newEnergy = 0.8;
            } else if (p.state.type === States.CRYSTAL) {
                if (crystalNeighbors > config.rules.threshold + 1) {
                    newState = States.STABLE;
                    newEnergy = 0.5;
                } else {
                    newState = States.ACTIVE;
                    newEnergy = 0.7;
                }
            }

            // Update visual properties if state changed
            if (newState !== p.state.type) {
                p.state.type = newState;
                p.character = stateChars[config.character.set][newState];
                
                // Calculate growth direction for color
                const angle = Math.atan2(
                    p.y - height/2,
                    p.x - width/2
                ) / (2 * Math.PI) * 360;
                
                p.color = getStateColor(
                    newState,
                    p.state.age,
                    newEnergy,
                    angle
                );

                // Update glow based on state
                if (newState === States.GROWING || newState === States.ACTIVE) {
                    p.glow = {
                        ...config.glow,
                        radius: config.size * newEnergy,
                        color: `rgba(255, 255, 255, ${newEnergy * 0.4})`
                    };
                } else {
                    p.glow = null;
                }
            }

            p.state.age += 1;
            p.state.energy = newEnergy;
            p.state.lastUpdate = currentTime;

            return [0, 0]; // Static particles
        };

        force.useNeighbors = true;
        return force;
    };

    // Add automaton force to all particles
    particles.forEach(p => {
        p.forces = [createAutomatonForce()];
    });

    return particles;
}

export const metadata = {
    name: "Crystal Automata",
    description: "Crystalline growth with rich state visualization"
};