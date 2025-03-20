// examples.js - Core demonstrations
import MatrixApp from './main.js';
import Particle from './particle.js';
const dynamicStates = new Map();
const defaultConfig = {
    dt: 0.05,                    // Physics timestep
    fontSize: 28,                // Base font size
    fadeSpeed: 0.01,             // Trail fade rate
    charUpdateRate: 1/0.05,      // Symbol frequency
    glowRadius: 6
};

const createScene = (scene, config = {}) => {
    const finalConfig = { ...defaultConfig, ...config };
    const { dt, fontSize, fadeSpeed, charUpdateRate } = finalConfig;
    const width = config.width || window.innerWidth;
    const height = config.height || window.innerHeight;
    
    switch(scene) {
        case 'matrixRain': {
            const particles = [];
            const columns = Math.floor(width / fontSize) + 1;
            const baseSpeed = fontSize / dt;
            // Green Katakana characters
            for (let i = 0; i < columns; i++) {
                particles.push(new Particle({
                    x: fontSize/2 + i * fontSize,
                    y: Math.random() * height * 2 - height,
                    vx: 0,
                    vy: baseSpeed,
                    phase: 0,
                    phaseVelocity: 0,
                    characterSet: 'katakana',
                    fontSize: fontSize,
                    fadeSpeed: fadeSpeed,
                    charUpdateRate: charUpdateRate,
                    color : 'rgb(0, 255, 70)',
                    collisions : true,
                    boundaries: {
                        top: 'periodic',
                        bottom: 'randomDelay',
                        left: 'reflecting',
                        right: 'reflecting'
                    },
                    boundaryProbability: 0.975,
                    forces: []
                }));
            }
            return particles;
        }

        case 'supernova': {
            const particles = [];
            const ringRadius = height / 3;
            const L = Math.floor(width / fontSize);
            const v = fontSize / (dt * 10);  // Orbital velocity
            // Golden Aramaic halo
            for (let i = 0; i < L; i++) {
                const angle = (2 * Math.PI * i) / L;
                particles.push(new Particle({
                    x: width/2 + ringRadius * Math.cos(angle),
                    y: height/2 + ringRadius * Math.sin(angle),
                    vx: 0.01*v * Math.sin(angle),
                    vy: -0.01*v * Math.cos(angle),
                    mass: 1,
                    phase: 0.55,
                    phaseVelocity: 0.,
                    characterSet: 'aramaic',
                    fontSize: fontSize,
                    fadeSpeed: 0.01,
                    charUpdateRate: 0.01,
                    glowEffect: true,
                    glowColor: 'rgba(255, 215, 0, 0.4)',
                    glowRadius: 10*finalConfig.glowRadius,
                    boundaries: {
                        top: 'reset',
                        bottom: 'reset',
                        left: 'reset',
                        right: 'reset'
                    },
                    forces: [
                        (p, sys) => {
                            const dx = p.x - width/2;
                            const dy = p.y - height/2;
                            const Radius = Math.sqrt(dx * dx + dy * dy);
                            const angle = Math.atan2(dy, dx);
                            return [
                                -(v*v/ringRadius) * Math.cos(angle) * p.mass,
                                -(v*v/ringRadius) * Math.sin(angle) * p.mass
                            ];
                        }
                    ]
                }));
            }
            // Cyan Sanskrit halo
            const r = 0.8*ringRadius;
            for (let i = 0; i < L; i++) {
                const angle = (2 * Math.PI * i) / L;
                particles.push(new Particle({
                    x: width/2 + r * Math.cos(angle),
                    y: height/2 + r * Math.sin(angle),
                    vx: -0.01*v * Math.sin(angle),
                    vy: 0.01*v * Math.cos(angle),
                    mass: 1,
                    phase: 0,
                    color : 'rgb(0, 255, 255)',
                    phaseVelocity: 0.,
                    characterSet: 'sanskrit',
                    fontSize: fontSize,
                    fadeSpeed: 1,
                    charUpdateRate: 0.01,
                    glowEffect: true,
                    glowColor: 'rgba(0, 255, 255, 0.3)',
                    glowRadius: 3*finalConfig.glowRadius,
                    boundaries: {
                        top: 'reset',
                        bottom: 'reset',
                        left: 'reset',
                        right: 'reset'
                    },
                    forces: [
                        (p, sys) => {
                            const dx = p.x - width/2;
                            const dy = p.y - height/2;
                            const angle = Math.atan2(dy, dx);
                            return [
                                -(v*v/r) * Math.cos(angle) * p.mass,
                                -(v*v/r) * Math.sin(angle) * p.mass
                            ];
                        }
                    ]
                }));
            }

            return particles;
        }


        case 'dnaHelix': {
            const particles = [];
            const helixRadius = 100;
            const verticalSpacing = 20;
            const numParticles = Math.floor(height / verticalSpacing) * 2;  
            const centerX = width / 2;
            const baseSpeed = 30;
         
            // Create force function with neighbor awareness
            const createHelixForce = (isLeftHelix) => {
                const force = (p, sys) => {
                    // Maintain helix shape
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
                    if (nearest && minDist < fontSize) {
                        const updateInterval = 1 / p.charUpdateRate;
                        const currentTime = performance.now() / 1000;
                        
                        if (!p.lastCharUpdate || currentTime - p.lastCharUpdate >= updateInterval) {
                            p.character = nearest.character;
                            p.lastCharUpdate = currentTime;
                        }
                    }
         
                    return [10 * dx * p.mass, 0];
                };
                
                // Flag force function as needing neighbors
                force.useNeighbors = true;
                
                return force;
            };
         
            // Create the particles
            for (let i = 0; i < numParticles; i++) {
                const isLeftHelix = i % 2 === 0;
                const baseY = (Math.floor(i / 2) * verticalSpacing) % height;
                const phase = (baseY / height) * Math.PI * 2;
                
                particles.push(new Particle({
                    x: centerX + (isLeftHelix ? -1 : 1) * helixRadius * Math.cos(phase),
                    y: baseY,
                    vx: 0,
                    vy: baseSpeed,
                    phase: phase,
                    phaseVelocity: 0.,
                    characterSet: 'dna',
                    fontSize: fontSize,
                    fadeSpeed: 1,
                    charUpdateRate: 1/(Math.random()+0.01),
                    lastCharUpdate: performance.now()/1000,  // Set initial update time
                    lockCharacter: false,
                    boundaries: {
                        top: 'periodic',
                        bottom: 'periodic',
                        left: 'reset',
                        right: 'reset'
                    },
                    forces: [createHelixForce(isLeftHelix)]
                }));
            }
            
            return particles;
         }

        case 'gameOfLife': {
            const particles = [];
            const cellSize = 30;
            const cols = Math.floor(width / cellSize);
            const rows = Math.floor(height / cellSize);
            
            for (let i = 0; i < cols; i++) {
                for (let j = 0; j < rows; j++) {
                    const isAlive = Math.random() < 0.3;
                    
                    const p = new Particle({
                        x: i * cellSize + cellSize/2,
                        y: j * cellSize + cellSize/2,
                        mass: 1,
                        characterSet: 'binary',
                        fontSize: 20,
                        color: isAlive ? 'rgb(0, 255, 70)' : 'rgb(50, 50, 50)',
                        character: isAlive ? '1' : '0',
                        glowEffect: true,
                        glowColor: isAlive ? 'rgba(0, 255, 70, 0.3)' : 'rgba(50, 50, 50, 0.1)',
                        glowRadius: isAlive ? 8 : 4,
                        charUpdateRate : 0.01
                    });
        
                    // Initialize state BEFORE creating force function
                    p.state = {
                        alive: isAlive,
                        gridX: i,
                        gridY: j,
                        lastUpdate: performance.now()
                    };
        
                    // Add forces after state is initialized
                    p.forces = [
                        (p) => {
                            const currentTime = performance.now();
                            if (currentTime - p.state.lastUpdate < 500) {
                                return [0, 0];
                            }
                            let liveNeighbors = 0;
                        
                        // Check all 8 neighboring cells
                        for (let dx = -1; dx <= 1; dx++) {
                            for (let dy = -1; dy <= 1; dy++) {
                                if (dx === 0 && dy === 0) continue;
                                
                                const nx = (p.state.gridX + dx + cols) % cols;
                                const ny = (p.state.gridY + dy + rows) % rows;
                                
                                // Find neighbor particle
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
                            p.color = nextState ? 'rgb(0, 255, 70)' : 'rgb(50, 50, 50)';
                            p.character = nextState ? '1' : '0';
                            p.glowColor = nextState ? 
                                'rgba(0, 255, 70, 0.3)' : 'rgba(50, 50, 50, 0.1)';
                            p.glowRadius = nextState ? 8 : 4;
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


        case 'sacredMandala':{
            const particles = [];
            const centerX = width / 2;
            const centerY = height / 2;
            const layers = 8; 
            const baseOrbitRadius = height / 5; 
            const haloOrbitRadius = height / 3; 
            const baseVelocity = fontSize / (dt * 20);
        
            // Outer Golden Halo
            const haloPointCount = Math.floor(width / fontSize);
            const haloVelocity = fontSize / (dt * 10);
            for (let i = 0; i < haloPointCount; i++) {
                const angle = (2 * Math.PI * i) / haloPointCount;
                const initialX = centerX + haloOrbitRadius * Math.cos(angle);
                const initialY = centerY + haloOrbitRadius * Math.sin(angle);
                particles.push(new Particle({
                    x: initialX,
                    y: initialY,
                    vx: haloVelocity * Math.sin(angle),
                    vy: -haloVelocity * Math.cos(angle),
                    mass: 1,
                    phase: 0.55,
                    phaseVelocity: 0.,
                    characterSet: 'aramaic',
                    fontSize: fontSize,
                    fadeSpeed: 0.01,
                    charUpdateRate: 0.01,
                    glowEffect: true,
                    glowColor: 'rgba(255, 215, 0, 0.4)',
                    glowRadius: 10 * finalConfig.glowRadius,
                    boundaries: {
                        top: 'reset',
                        bottom: 'reset',
                        left: 'reset',
                        right: 'reset'
                    },
                    forces: [
                        (p) => {
                            const dx = p.x - centerX;
                            const dy = p.y - centerY;
                            const r = Math.sqrt(dx * dx + dy * dy);
                            const forceMagnitude = haloVelocity * haloVelocity / haloOrbitRadius;
                            return [
                                -forceMagnitude * dx / r * p.mass,
                                -forceMagnitude * dy / r * p.mass
                            ];
                        }
                    ]
                }));
            }

            // Inner Cyan Halo
            const innerHaloRadius = 0.8*haloOrbitRadius;
            const innerHaloVelocity = fontSize / (dt * 12);
            for (let i = 0; i < haloPointCount; i++) {
                const angle = (2 * Math.PI * i) / haloPointCount;
                const initialX = centerX + innerHaloRadius * Math.cos(angle);
                const initialY = centerY + innerHaloRadius * Math.sin(angle);
                particles.push(new Particle({
                    x: initialX,
                    y: initialY,
                    vx: -innerHaloVelocity * Math.sin(angle),
                    vy: innerHaloVelocity * Math.cos(angle),
                    mass: 1,
                    phase: 0,
                    phaseVelocity: 0.,
                    characterSet: 'sanskrit',
                    fontSize: fontSize,
                    fadeSpeed: 1,
                    charUpdateRate: 0.01,
                    glowEffect: true,
                    glowColor: 'rgba(0, 255, 255, 0.3)',
                    glowRadius: 3 * finalConfig.glowRadius,
                    color: 'rgb(0, 255, 255)',
                    boundaries: {
                        top: 'reset',
                        bottom: 'reset',
                        left: 'reset',
                        right: 'reset'
                    },
                    forces: [
                        (p) => {
                            const dx = p.x - centerX;
                            const dy = p.y - centerY;
                            const r = Math.sqrt(dx * dx + dy * dy);
                            const forceMagnitude = innerHaloVelocity * innerHaloVelocity / innerHaloRadius;
                            return [
                                -forceMagnitude * dx / r * p.mass,
                                -forceMagnitude * dy / r * p.mass
                            ];
                        }
                    ]
                }));
            }
        
            // Mandala
            for (let layer = 0; layer < layers; layer++) {
                const layerRadius = baseOrbitRadius * (1 - layer * 0.1);
                const pointCount = 12 + layer * 4; 
                const v = baseVelocity * Math.sqrt(baseOrbitRadius / layerRadius);
        
                for (let i = 0; i < pointCount; i++) {
                    const angle = (2 * Math.PI * i) / pointCount;
                    const initialX = centerX + layerRadius * Math.cos(angle);
                    const initialY = centerY + layerRadius * Math.sin(angle);
        
                    particles.push(new Particle({
                        x: initialX,
                        y: initialY,
                        vx: -v * (initialY - centerY) / layerRadius,
                        vy: v * (initialX - centerX) / layerRadius,
                        mass: 1,
                        phase: 0.55,
                        phaseVelocity: 0.,
                        characterSet: layer < 4 ? 'sanskrit' : 'aramaic',
                        fontSize: fontSize * (1 - layer * 0.1),
                        fadeSpeed: 0.01,
                        charUpdateRate: 0.5,
                        glowEffect: true,
                        glowColor: layer % 2 === 0 ? `rgba(255, ${155 + layer * 10}, ${layer * 30}, 0.3)` : 'rgba(0, 255, 255, 0.3)',
                        glowRadius: (8 - layer) * finalConfig.glowRadius,
                        color: layer % 2 === 1 ? 'rgb(0, 255, 255)' : undefined,
                        boundaries: {
                            top: 'reset',
                            bottom: 'reset',
                            left: 'reset',
                            right: 'reset'
                        },
                        forces: [
                            (p) => {
                                const dx = p.x - centerX;
                                const dy = p.y - centerY;
                                const r = Math.sqrt(dx * dx + dy * dy);
                                const forceMagnitude = v * v / layerRadius;
                                return [
                                    -forceMagnitude * dx / r * p.mass,
                                    -forceMagnitude * dy / r * p.mass
                                ];
                            }
                        ]
                    }));
                }
            }
            return particles;
        }


        case 'ecosystem': {
            const particles = [];
            const cellSize = fontSize;
            const cols = Math.floor(width / cellSize);
            const rows = Math.floor(height / cellSize);
            const preyCount = Math.floor(cols * rows * 0.15);
            const predatorCount = Math.floor(preyCount * 0.1);
        
            // Create prey force with neighbor awareness
            const createPreyForce = () => {
                const force = (p, sys) => {
                    const neighbors = sys.getNeighbors(p);
                    let fx = 0, fy = 0;
        
                    for (const [_, data] of neighbors) {
                        if (data.distance < fontSize * 5) {
                            const other = data.particle;
                            if (other.state?.type === 'predator') {
                                // Flee from predators
                                const repel = 10 * fontSize / (data.distance + 1);
                                fx -= repel * data.dx / data.distance;
                                fy -= repel * data.dy / data.distance;
                            }
                        }
                    }
        
                    // Add random movement
                    fx += (Math.random() - 0.5) * fontSize;
                    fy += (Math.random() - 0.5) * fontSize;
        
                    // Prey reproduction
                    if (p.state.energy >= 150 &&
                        performance.now() - p.state.lastSpawn > 5000) {
                        p.state.energy -= 75;
                        p.state.lastSpawn = performance.now();
                        const newPrey = p.clone();
                        newPrey.x += Math.random() * fontSize - fontSize / 2;
                        newPrey.y += Math.random() * fontSize - fontSize / 2;
                        newPrey.state.energy = 75;
                        newPrey.state.lastSpawn = performance.now();
                        sys.addParticles([newPrey]);
                    }
        
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
        
                    // Find nearest prey
                    for (const [_, data] of neighbors) {
                        if (data.particle.state?.type === 'prey' && data.distance < minDist) {
                            nearestPrey = data.particle;
                            minDist = data.distance;
                            preyDx = data.dx;
                            preyDy = data.dy;
                        }
                    }
        
                    // Energy depletion
                    p.state.energy -= 0.05;
        
                    if (p.state.energy <= 0) {
                        p.remove = true;
                        return [0, 0];
                    }
        
                    if (nearestPrey) {
                        // Chase prey with stronger force
                        const attract = 8 * fontSize / (minDist + 1);
                        fx = attract * preyDx/minDist;
                        fy = attract * preyDy/minDist;
        
                        // Eating logic with wider radius
                        if (minDist < fontSize) {
                            nearestPrey.remove = true;
                            p.state.energy += 100;
                        }
                    } else {
                        fx = (Math.random() - 0.5) * fontSize;
                        fy = (Math.random() - 0.5) * fontSize;
                    }
        
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
                    vx: (Math.random() - 0.5) * fontSize,
                    vy: (Math.random() - 0.5) * fontSize,
                    mass: 1,
                    characterSet: 'dna',
                    fontSize: fontSize,
                    fadeSpeed: 0.1,
                    charUpdateRate: 0.01,
                    character: 'A',
                    lockCharacter: true,
                    color: 'rgb(0, 255, 0)',
                    glowEffect: true,
                    glowColor: 'rgba(0, 255, 0, 0.3)',
                    glowRadius: 2 * finalConfig.glowRadius,
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
                    vx: (Math.random() - 0.5) * fontSize * 1.5,
                    vy: (Math.random() - 0.5) * fontSize * 1.5,
                    mass: 1.5,
                    characterSet: 'dna',
                    fontSize: fontSize * 1.2,
                    fadeSpeed: 0.1,
                    charUpdateRate: 0.01,
                    character: 'T',
                    lockCharacter: true,
                    color: 'rgb(255, 0, 0)',
                    glowEffect: true,
                    glowColor: 'rgba(255, 0, 0, 0.3)',
                    glowRadius: 2 * finalConfig.glowRadius,
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







        default:
            return createScene('matrixRain', config);
    }
};

// Initialize the demo
export function initializeDemo() {
    const app = new MatrixApp('matrix-canvas');

    // Set up scene switching
    const sceneSelect = document.getElementById('scene-select');
    sceneSelect.addEventListener('change', (e) => {
        app.clear();
        const particles = createScene(e.target.value, {
            width: window.innerWidth,
            height: window.innerHeight
        });
        app.addParticles(particles);
    });

    // Initialize with first scene
    const particles = createScene(sceneSelect.value, {
        width: window.innerWidth,
        height: window.innerHeight
    });
    app.addParticles(particles);

    // Start animation
    app.start();
}

export { createScene };