export const baseConfig = {
    // Core properties
    size: {
        value: 28,
        min: 8,
        max: 48,
        step: 1,
        label: 'Particle Size',
        unit: 'px'
    },
    mass: {
        value: 1,
        min: 0.1,
        max: 5,
        step: 0.1,
        label: 'Mass'
    },
    dt: {
        value: 1/60,
        min: 1/120,
        max: 1/30,
        step: 1/120,
        label: 'Time Step',
        unit: 's'
    },
    neighbors: {
        radius: {
            value: 50,
            min: 10,
            max: 200,
            step: 1,
            label: 'Neighbor Search Radius',
            unit: 'px'
        }
    },
    
    vx: {
        value: 0,
        min: -1000,
        max: 1000,
        step: 10,
        label: 'X Velocity',
        unit: 'px/s'
    },
    vy: {
        value: 0,
        min: -1000,
        max: 1000,
        step: 10,
        label: 'Y Velocity',
        unit: 'px/s'
    },
    
    character: {
        set: {
            value: 'katakana',
            options: ['katakana', 'hiragana', 'latin', 'digits', 'binary', 'aramaic', 'sanskrit', 'dna'],
            label: 'Character Set'
        },
        rate: {
            value: 1.0,
            min: 0.1,
            max: 50,
            step: 0.1,
            label: 'Update Rate',
            unit: 'Hz'
        }
    },

    trail: {
        rate: {
            value: 0.05,
            min: 0.001,
            max: 1,
            step: 0.001,
            label: 'Trail Fade Speed'
        }
    },
    
    glow: {
        radius: {
            value: 3,
            min: 1,
            max: 100,
            step: 1,
            label: 'Glow Radius',
            unit: 'px'
        },
        color: {
            value: 'rgba(0, 255, 70, 0.2)',
            label: 'Glow Color'
        }
    },

    boundaries: {
        top: {
            value: 'periodic',
            options: ['periodic', 'reflecting', 'randomDelay', 'reset'],
            label: 'Top Boundary'
        },
        bottom: {
            value: 'periodic',
            options: ['periodic', 'reflecting', 'randomDelay', 'reset'],
            label: 'Bottom Boundary'
        },
        left: {
            value: 'periodic',
            options: ['periodic', 'reflecting', 'randomDelay', 'reset'],
            label: 'Left Boundary'
        },
        right: {
            value: 'periodic',
            options: ['periodic', 'reflecting', 'randomDelay', 'reset'],
            label: 'Right Boundary'
        },
        probability: {
            value: 0.975,
            min: 0.1,
            max: 1,
            step: 0.001,
            label: 'Boundary Probability'
        }
    }
};

// Default UI organization that scenes can override
export const defaultUIOrganization = {
    physics: {
        label: 'Physics Properties',
        fields: ['size', 'mass', 'dt']
    },
    motion: {
        label: 'Motion',
        fields: ['vx', 'vy']
    },
    appearance: {
        label: 'Appearance',
        fields: ['character.set', 'character.rate', 'trail.rate', 'glow']
    },
    boundaries: {
        label: 'Boundaries',
        fields: ['boundaries']
    }
};

// utils.js - ConfigManager class implementation
// utils.js
class ConfigManager {
    constructor(baseConfig) {
        this.baseConfig = this.deepClone(baseConfig);
        this.sceneConfigs = new Map();
        this.activeConfig = null;
        this.activeScene = null;
        this.listeners = new Set();
        this.uiOrganization = {
            motion: {
                label: 'Motion',
                fields: ['vx', 'vy', 'mass']
            },
            appearance: {
                label: 'Appearance',
                fields: ['size', 'character.set', 'character.rate', 'trail.rate', 'glow']
            },
            physics: {
                label: 'Physics',
                fields: ['dt', 'neighbors.radius']
            },
            boundaries: {
                label: 'Boundaries',
                fields: ['boundaries']
            }
        };
    }

    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    registerScene(name, config) {
        const sceneConfig = this.deepClone(config);
        this.sceneConfigs.set(name, sceneConfig);
        return sceneConfig;
    }

    getConfigValue(config, path) {
        if (!config) return undefined;
        const parts = path.split('.');
        let current = config;
        for (const part of parts) {
            if (!current[part]) return undefined;
            current = current[part];
        }
        return current;
    }

    mergeConfigs(sceneConfig) {
        const result = this.deepClone(this.baseConfig);
        const resultingUI = this.deepClone(this.uiOrganization);
        
        const merge = (target, source, path = '') => {
            if (!source) return;
            
            for (const [key, value] of Object.entries(source)) {
                // Skip UI organization metadata
                if (key === '_uiOrganization') continue;
                
                const currentPath = path ? `${path}.${key}` : key;
                const baseValue = this.getConfigValue(this.baseConfig, currentPath);

                if (value && typeof value === 'object' && !Array.isArray(value)) {
                    if (!target[key]) {
                        target[key] = {};
                    }
                    
                    if ('value' in value) {
                        const field = value.field || this.getFieldForPath(currentPath);
                        const label = value.label || (baseValue?.label || this.generateLabel(key));
                        
                        target[key] = {
                            ...(baseValue || {}),
                            ...value
                        };
                        
                        this.addToUIOrganization(resultingUI, field, currentPath, label);
                    } else {
                        merge(target[key], value, currentPath);
                    }
                } else {
                    const field = this.getFieldForPath(currentPath);
                    const label = baseValue?.label || this.generateLabel(key);
                    
                    target[key] = {
                        ...(baseValue || {}),
                        value
                    };
                    
                    this.addToUIOrganization(resultingUI, field, currentPath, label);
                }
            }
        };
        
        merge(result, sceneConfig);
        
        // Store UI organization separately from the config
        this.currentUIOrganization = this.cleanupUIOrganization(resultingUI);
        
        return result;
    }

    getUIOrganization() {
        return this.currentUIOrganization || this.uiOrganization;
    }

    getFieldForPath(path) {
        // Check if path exists in default organization
        for (const [group, config] of Object.entries(this.uiOrganization)) {
            if (config.fields.some(field => {
                if (field.includes('*')) {
                    const prefix = field.replace('*', '');
                    return path.startsWith(prefix);
                }
                return field === path;
            })) {
                return group;
            }
        }
        return 'scene';
    }

    addToUIOrganization(uiOrg, field, path, label) {
        if (!uiOrg[field]) {
            uiOrg[field] = {
                label: this.generateLabel(field),
                fields: []
            };
        }
        if (!uiOrg[field].fields.includes(path)) {
            uiOrg[field].fields.push(path);
        }
    }

    cleanupUIOrganization(uiOrg) {
        const cleaned = {};
        for (const [group, config] of Object.entries(uiOrg)) {
            if (config.fields.length > 0) {
                cleaned[group] = {
                    label: config.label,
                    fields: config.fields.sort()
                };
            }
        }
        return cleaned;
    }

    getInheritedField(path) {
        const baseValue = this.getConfigValue(this.baseConfig, path);
        return baseValue?.field || 'scene';
    }

    generateLabel(key) {
        return key.charAt(0).toUpperCase() + 
               key.slice(1).replace(/([A-Z])/g, ' $1').trim();
    }

    updateUIOrganization(uiOrg, field, path) {
        if (!uiOrg[field]) {
            uiOrg[field] = {
                label: this.generateLabel(field),
                fields: []
            };
        }
        if (!uiOrg[field].fields.includes(path)) {
            uiOrg[field].fields.push(path);
        }
    }

    activateScene(name) {
        const sceneConfig = this.sceneConfigs.get(name);
        this.activeConfig = this.mergeConfigs(sceneConfig);
        this.activeScene = name;
        return this.activeConfig;
    }

    getCurrentConfig() {
        return this.activeConfig;
    }

    updateValue(path, value) {
        if (!this.activeConfig) return false;
        
        const keys = path.split('.');
        let current = this.activeConfig;
        
        // Navigate to the parent object
        for (let i = 0; i < keys.length - 1; i++) {
            if (!(keys[i] in current)) return false;
            current = current[keys[i]];
        }
        
        const lastKey = keys[keys.length - 1];
        
        // Update the value while preserving UI metadata
        if (typeof current[lastKey] === 'object') {
            current[lastKey] = {
                ...current[lastKey],
                value: value
            };
        } else {
            current[lastKey] = value;
        }

        // Update the scene config as well
        const sceneConfig = this.sceneConfigs.get(this.activeScene);
        if (sceneConfig) {
            let sceneTarget = sceneConfig;
            for (let i = 0; i < keys.length - 1; i++) {
                if (!(keys[i] in sceneTarget)) {
                    sceneTarget[keys[i]] = {};
                }
                sceneTarget = sceneTarget[keys[i]];
            }
            if (typeof value === 'object' && 'value' in value) {
                sceneTarget[lastKey] = value;
            } else {
                sceneTarget[lastKey] = value;
            }
        }
        
        // Notify listeners of the change
        this.notifyListeners();
        return true;
    }

    addListener(callback) {
        this.listeners.add(callback);
    }

    removeListener(callback) {
        this.listeners.delete(callback);
    }

    notifyListeners() {
        this.listeners.forEach(callback => callback(this.activeConfig));
    }
}

export const configManager = new ConfigManager(baseConfig);

// Extract values while preserving structure
export function extractConfigValues(config) {
    if (!config) return {};
    
    const result = {};
    
    for (const [key, value] of Object.entries(config)) {
        if (value && typeof value === 'object') {
            if ('value' in value) {
                result[key] = value.value;
            } else {
                result[key] = extractConfigValues(value);
            }
        } else {
            result[key] = value;
        }
    }
    
    return result;
}