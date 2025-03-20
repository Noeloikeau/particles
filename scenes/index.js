// index.js
import { configManager, extractConfigValues } from './utils.js';

const scenes = new Map();

export async function registerScene(name) {
    try {
        console.log(`Attempting to register scene: ${name}`);
        const module = await import(`./${name}.js`);
        console.log(`Loaded module for ${name}:`, module);
        
        const registeredConfig = configManager.registerScene(name, module.config || {});
        console.log(`Registered config for ${name}:`, registeredConfig);
        
        scenes.set(name, {
            createScene: (config) => {
                console.log(`Creating scene ${name} with config:`, config);
                // Make sure to deep clone the config to prevent mutations
                const cleanConfig = JSON.parse(JSON.stringify(config));
                const values = extractConfigValues(cleanConfig);
                console.log(`Extracted values for scene creation:`, values);
                return module.createScene(values);
            },
            config: registeredConfig,
            metadata: module.metadata
        });
        return true;
    } catch (error) {
        console.error(`Failed to load scene: ${name}`, error);
        return false;
    }
}

export function getScene(name) {
    return scenes.get(name);
}

export function getAllScenes() {
    return Array.from(scenes.entries()).map(([id, scene]) => ({
        id,
        ...scene.metadata,
        config: scene.config
    }));
}

export async function initializeScenes() {
    const sceneModules = [
        'matrixRain',
        'supernova',
        'sacredMandala',
        'dnaHelix',
        'gameOfLife',
        'ecosystem',
        'gravityField',
        'waveFunction',
        'plasmaFlow',
        'crystalAutomata'
    ];
    
    await Promise.all(sceneModules.map(registerScene));
}

export function updateActiveScene(app, sceneId, config) {
    console.log(`Updating active scene: ${sceneId}`, config);
    const scene = getScene(sceneId);
    if (!scene) return;

    app.clear();
    const particles = scene.createScene({
        ...config,
        width: window.innerWidth,
        height: window.innerHeight
    });
    
    app.addParticles(particles);
}