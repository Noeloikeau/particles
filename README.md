# Particles

A creative application of particle physics in JavaScript/HTML.

<!-- Main visualization image -->
![Particle System Visualization](screenshots/main-visualization.png)

*Example: Matrix Rain simulation*


## Overview

This project implements a particle physics system for creating visual effects and simulations in a web browser. The system combines a physics engine, rendering pipeline, and character management to produce various interactive visualizations.

## Components

### Core Architecture

The system consists of four main components:

1. **MatrixApp** (main.js): Orchestrates the interaction between the physics system and renderer, manages animation frames, and handles window resizing.

2. **PhysicsSystem** (physics.js): Handles particle dynamics including force application, collision detection, boundary behaviors, and neighbor awareness.

3. **Renderer** (renderer.js): Manages the canvas rendering pipeline, including character drawing, trail effects, and glow effects.

4. **CharacterManager** (characters.js): Provides character sets from different writing systems and manages character update timing.

### Particle

The `Particle` class (particle.js) is the fundamental unit of the system. Each particle encapsulates:

- Physical properties: position, velocity, acceleration, mass
- Visual properties: character, color, glow, size
- Behavioral properties: forces, boundaries, phase

The particle implementation supports:
- Multiple force vectors
- Customizable boundary behaviors
- Character representation and update rates
- Trail and glow effects
- Phase-based color cycling

### Scenes

The system includes several pre-defined scenes demonstrating different applications:

- **Matrix Rain**: Falling character effect reminiscent of The Matrix
- **Sacred Mandala**: Multi-layered rotating particle system with orbital mechanics
- **DNA Helix**: Double helix structure with character swapping between strands
- **Game of Life**: Implementation of Conway's Game of Life cellular automaton
- **Ecosystem**: Predator-prey dynamics with emergent behaviors
- **Supernova**: Dual-ring celestial formation with orbital physics
- **Gravity Field**: N-body gravitational system with realistic physics
- **Wave Function**: Quantum-inspired wave interference patterns
- **Plasma Flow**: Complex plasma dynamics with electromagnetic waves
- **Crystal Automata**: Crystalline growth patterns with state transitions

## Technical Features

### Physics Engine

The physics engine supports:

- Verlet integration for position and velocity updates
- Force accumulators for each particle
- Collision detection and resolution
- Boundary handling with multiple behaviors:
  - Periodic (wrap-around)
  - Reflecting (bounce)
  - Random delay (probabilistic wrap)
  - Reset (return to initial state)
- Spatial partitioning for efficient neighbor queries

### Rendering System

The rendering pipeline provides:

- Character-based particle representation
- Trail effects with customizable fade rates
- Glow effects with configurable radius and color
- Background handling and canvas management

### Character System

The character management system offers:

- Multiple character sets including:
  - Katakana and Hiragana (Japanese)
  - Latin alphabet
  - Digits
  - Binary
  - Aramaic
  - Sanskrit
  - DNA nucleotides (ATCG)
- Time-based character updates
- Character locking for stable representations

### Configuration System

The extensive configuration system allows customization of:

- Physics parameters (time step, mass, etc.)
- Visual properties (size, color, glow)
- Character behavior (update rate, character set)
- Scene-specific parameters
- Boundary behaviors

## Visualizations

### Matrix Rain
Classical falling character effect with a cyberpunk aesthetic. Characters fall from the top of the screen with varying speeds and random character updates.

![Matrix Rain](screenshots/matrix-rain.png)

### Sacred Mandala
A geometric visualization featuring multiple layers of rotating particles. Uses orbital physics to create stable, concentric rings of characters with varying rotational speeds and directions.

![Sacred Mandala](screenshots/sacred-mandala.png)

### DNA Helix
Simulates a DNA double helix structure where two strands intertwine and characters (representing nucleotides) flow along the structure. Includes character swapping between strands when they approach.

![DNA Helix](screenshots/dna-helix.png)

### Game of Life
Implementation of Conway's Game of Life cellular automaton. Cells change state based on neighbor counts, following the classic rules: underpopulation, survival, reproduction, and overpopulation.

![Game of Life](screenshots/game-of-life.png)

### Ecosystem
A predator-prey simulation with emergent behaviors. Prey (represented as 'A' characters) reproduce and flee from predators, while predators (represented as 'T' characters) hunt prey and consume them for energy.

![Ecosystem](screenshots/ecosystem.png)

## Implementation Notes

### Force System

Forces in the system can be applied as:

- Constant forces (gravity, wind)
- Position-dependent forces (orbits, springs)
- Velocity-dependent forces (drag, damping)
- Neighbor-aware forces (flocking, avoidance)

Neighbor-aware forces use the `useNeighbors` flag and receive neighbor data from the physics system's spatial partitioning.

### Boundary System

The boundary system handles four edge cases (top, bottom, left, right) with different behaviors:

- `reflecting`: Particles bounce off the boundary with velocity inversion
- `periodic`: Particles wrap around to the opposite boundary
- `randomDelay`: Particles have a probability to wrap around
- `reset`: The entire simulation returns to its initial state

### Character System

Characters update based on:

- Time interval (`charUpdateRate`)
- Character set selection
- Lock state (`lockCharacter`)

This allows effects ranging from rapid character cycling to stable representations.

## System Interaction

The components interact in the following way:

1. MatrixApp maintains the animation loop and tracks time
2. On each frame:
   - Physics system updates all particle positions and velocities
   - Character manager updates particle characters based on timing
   - Renderer draws particles with their current properties
3. User inputs modify the configuration of active scenes
4. Configuration changes trigger particle system updates

The interaction between these systems allows for a wide range of visual effects and simulations while maintaining a consistent underlying framework.

## Usage Examples

### Basic Setup

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Particles Demo</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            overflow: hidden;
            background: black;
        }
        canvas {
            display: block;
            position: fixed;
            top: 0;
            left: 0;
        }
    </style>
</head>
<body>
    <canvas id="particles-canvas"></canvas>
    <script type="module">
        import MatrixApp from './main.js';
        import { createScene } from './examples.js';

        // Initialize app
        const app = new MatrixApp('particles-canvas');
        
        // Create particles for a scene
        const particles = createScene('matrixRain', {
            width: window.innerWidth,
            height: window.innerHeight
        });
        
        // Add particles to the system
        app.addParticles(particles);
        
        // Start animation
        app.start();
    </script>
</body>
</html>
```

### Creating a Custom Scene

```javascript
import Particle from './particle.js';

function createCustomScene(width, height) {
    const particles = [];
    const columns = Math.floor(width / 30); // 30px spacing
    
    // Create column particles falling from top to bottom
    for (let i = 0; i < columns; i++) {
        particles.push(new Particle({
            x: 15 + i * 30,
            y: Math.random() * height * 2 - height,
            vx: 0,
            vy: 200, // Falling speed
            mass: 1,
            size: 28,
            character: {
                set: 'katakana',
                rate: 10 // Character update rate
            },
            trail: {
                rate: 0.02 // Trail fade rate
            },
            boundaries: {
                top: 'periodic',
                bottom: 'periodic',
                left: 'reflecting',
                right: 'reflecting'
            }
        }));
    }
    
    return particles;
}

// Usage:
const app = new MatrixApp('canvas-id');
app.addParticles(createCustomScene(window.innerWidth, window.innerHeight));
app.start();
```

### Adding Custom Forces

```javascript
import Particle from './particle.js';

// Create a particle with custom forces
const particle = new Particle({
    x: 100,
    y: 100,
    vx: 0,
    vy: 0,
    mass: 1,
    character: {
        set: 'binary',
        rate: 5
    },
    forces: [
        // Gravity force
        (p) => {
            return [0, 9.8 * p.mass];
        },
        
        // Oscillatory force
        (p, sys) => {
            const frequency = 2; // Hz
            const amplitude = 50; // Pixels
            const time = sys.time;
            return [amplitude * Math.sin(2 * Math.PI * frequency * time), 0];
        },
        
        // Neighbor-aware force
        (p, sys) => {
            let fx = 0, fy = 0;
            const neighbors = sys.getNeighbors(p);
            
            // React to neighbors within 50px
            for (const [_, data] of neighbors) {
                if (data.distance < 50) {
                    // Repulsion force
                    fx -= 10 * data.dx / (data.distance * data.distance);
                    fy -= 10 * data.dy / (data.distance * data.distance);
                }
            }
            
            return [fx, fy];
        }
    ]
});

// Mark the neighbor-aware force as needing neighbors
particle.forces[2].useNeighbors = true;
```

### Working with Particle State

```javascript
import Particle from './particle.js';

// Create a particle with custom state
const particle = new Particle({
    x: 200,
    y: 200,
    character: {
        set: 'latin',
        value: 'A', // Initial character
        lock: true  // Don't randomize
    },
    state: {
        energy: 100,
        lastUpdate: performance.now(),
        type: 'custom',
        data: {
            visited: false,
            connections: []
        }
    }
});

// Custom force that uses the state
const stateBasedForce = (p) => {
    // Reduce energy over time
    p.state.energy -= 0.1;
    
    // Change visual properties based on state
    if (p.state.energy < 50) {
        p.color = `rgb(255, ${Math.floor(p.state.energy * 5.1)}, 0)`;
    }
    
    // Remove particle when energy depleted
    if (p.state.energy <= 0) {
        p.remove = true;
    }
    
    return [0, 0]; // No physical force in this example
};

// Add the force to the particle
particle.forces.push(stateBasedForce);
```
