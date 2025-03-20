// characters.js - Fixed character management with proper timing
class CharacterManager {
    constructor() {
        this.sets = {
            katakana: "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜｦﾝ",
            hiragana: "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん",
            latin: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
            digits: "0123456789",
            binary: "01",
            aramaic: "ܐ ܒ ܓ ܕ ܗ ܘ ܙ ܚ ܛ ܝ ܟ ܠ ܡ ܢ ܣ ܥ ܦ ܨ ܩ ܪ ܫ ܬ",
            sanskrit : "अ आ इ ई उ ऊ ऋ ॠ ऌ ॡ ए ऐ ओ औ अं अः क ख ग घ ङ च छ ज झ ञ ट ठ ड ढ ण त थ द ध न प फ ब भ म य र ल व श ष स ह क्ष त्र ज्ञ",
            dna : "ATCG",
            all: "" // Will be populated in constructor
        };

        // Clean up whitespace and convert to arrays
        Object.entries(this.sets).forEach(([key, value]) => {
            if (key !== 'all') {
                this.sets[key] = Array.from(value.replace(/\s+/g, ''));
            }
        });

        // Initialize 'all' set
        this.sets.all = Object.entries(this.sets)
            .filter(([key]) => key !== 'all')
            .flatMap(([_, chars]) => chars);
        // Check if characters were properly initialized
        //console.log('DNA set:', this.sets.dna); // Debug
        this.charCache = new Map();
    }

    getRandomCharacter(setName = 'katakana') {
        const set = this.sets[setName] || this.sets.katakana;
        return set[Math.floor(Math.random() * set.length)];
    }

    // Updated to use proper time-based character updates
    updateParticleChar(particle, currentTimeSeconds) {
        if (particle.lockCharacter) return;
        //console.log('Particle lock status:', particle.lockCharacter);
        if (!particle.character || !particle.lastCharUpdate) {
            particle.character = this.getRandomCharacter(particle.characterSet);
            particle.lastCharUpdate = currentTimeSeconds;
            return;
        }

        // charUpdateRate is in Hz (updates per second)
        const updateInterval = 1 / particle.charUpdateRate;
        
        if (currentTimeSeconds - particle.lastCharUpdate >= updateInterval) {
            particle.character = this.getRandomCharacter(particle.characterSet);
            particle.lastCharUpdate = currentTimeSeconds;
        }
    }

    clearCache() {
        this.charCache.clear();
    }
}

export const characterManager = new CharacterManager();
export default characterManager;