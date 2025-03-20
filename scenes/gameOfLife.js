import Particle from '../particle.js';

export const config = {
    physics: {
        size: {
            value: 30,
            min: 10,
            max: 50,
            step: 1,
            label: 'Cell Size'
        },
        evolutionRate: {
            value: 2,
            min: 0.5,
            max: 10,
            step: 0.5,
            label: 'Evolution Rate (Hz)'
        },
        initialDensity: {
            value: 0.3,
            min: 0.1,
            max: 0.9,
            step: 0.1,
            label: 'Initial Cell Density'
        }
    },
    character: {
        style: {
            value: 'squares',
            options: ['squares', 'binary'],
            label: 'Cell Style'
        }
    }
};

export function createScene(config) {
    const { width, height } = config;
    const particles = [];
    const cellSize = config.physics.size;
    const cols = Math.floor(width / cellSize);
    const rows = Math.floor(height / cellSize);
    const updateInterval = 1000 / config.physics.evolutionRate;
    
    // Character pairs based on style
    const charPairs = {
        squares: { alive: '■', dead: '□' },
        binary: { alive: '1', dead: '0' }
    };
    const chars = charPairs[config.character.style];
    
    // Fixed colors that work with the simulation
    const ALIVE_COLOR = 'rgb(0, 255, 70)';
    const DEAD_COLOR = 'rgb(50, 50, 50)';
    
    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            const isAlive = Math.random() < config.physics.initialDensity;
            
            const p = new Particle({
                x: i * cellSize + cellSize/2,
                y: j * cellSize + cellSize/2,
                size: cellSize,
                character: {
                    value: isAlive ? chars.alive : chars.dead,
                    lock: true
                },
                color: isAlive ? ALIVE_COLOR : DEAD_COLOR
            });
            
            // Initialize state
            p.state = {
                alive: isAlive,
                gridX: i,
                gridY: j,
                lastUpdate: performance.now()
            };
            
            // Add forces
            p.forces = [
                (p) => {
                    const currentTime = performance.now();
                    if (currentTime - p.state.lastUpdate < updateInterval) {
                        return [0, 0];
                    }
                    
                    let liveNeighbors = 0;
                    
                    // Check neighbors
                    for (let dx = -1; dx <= 1; dx++) {
                        for (let dy = -1; dy <= 1; dy++) {
                            if (dx === 0 && dy === 0) continue;
                            
                            const nx = (p.state.gridX + dx + cols) % cols;
                            const ny = (p.state.gridY + dy + rows) % rows;
                            
                            const neighborParticle = particles.find(
                                neighbor => 
                                    neighbor.state.gridX === nx && 
                                    neighbor.state.gridY === ny
                            );
                            
                            if (neighborParticle?.state.alive) {
                                liveNeighbors++;
                            }
                        }
                    }
                    
                    // Apply Game of Life rules
                    const nextState = p.state.alive ? 
                        (liveNeighbors === 2 || liveNeighbors === 3) :
                        (liveNeighbors === 3);
                    
                    // Update if state changed
                    if (nextState !== p.state.alive) {
                        p.state.alive = nextState;
                        p.color = nextState ? ALIVE_COLOR : DEAD_COLOR;
                        p.character = nextState ? chars.alive : chars.dead;
                    }
                    
                    p.state.lastUpdate = currentTime;
                    return [0, 0];
                }
            ];
            
            particles.push(p);
        }
    }
    return particles;
}

export const metadata = {
    name: "Game of Life",
    description: "Conway's Game of Life with style options"
};