window.App = window.App || {};

window.App.state = {
    // Gera atributos de 1 a 100 de forma fixa a partir dos dados do personagem
    calculateAttributes(character) {
        const clamp = (val) => Math.max(1, Math.min(100, Math.floor(val)));

        const id = character.id;
        const name = character.name.toLowerCase();
        const species = character.species.toLowerCase();
        const status = character.status.toLowerCase();
        const numEpisodes = character.episode ? character.episode.length : 0;

        let int = 50 + (id % 10);
        if (name.includes('rick')) int = 100;
        else if (name.includes('morty')) int = 40 + (id % 20);
        else if (name.includes('jerry')) int = 15;
        else if (species.includes('robot')) int += 30;

        let vid = 40 + (name.length * 2) + (id % 15);
        if (status === 'alive') vid += 20;
        else if (status === 'dead') vid -= 30;

        let force = 30 + (id % 25) + (name.length);
        if (species.includes('alien')) force += 25;
        if (species.includes('mythological') || species.includes('creature')) force += 40;
        if (species === 'human') force -= 5;
        if (name.includes('pickle rick')) force = 95;

        let luck = 20 + (numEpisodes * 2) + (id % 12);
        if (name.includes('jerry')) luck -= 15;
        if (numEpisodes > 20) luck += 15;
        if (name.includes('rick')) luck += 10;

        const stats = {
            vida: clamp(vid),
            forca: clamp(force),
            inteligencia: clamp(int),
            sorte: clamp(luck)
        };
        stats.total = stats.vida + stats.forca + stats.inteligencia + stats.sorte;

        return stats;
    },

    getEconomy() {
        try {
            const data = localStorage.getItem('rick_and_morty_economy');
            return data ? JSON.parse(data) : {
                flurbos: 0,
                maxDeckSize: 1,
                radioUnlocked: false
            };
        } catch (e) {
            return { flurbos: 0, maxDeckSize: 1, radioUnlocked: false };
        }
    },

    saveEconomy(eco) {
        localStorage.setItem('rick_and_morty_economy', JSON.stringify(eco));
    },

    addFlurbos(amount) {
        const eco = this.getEconomy();
        eco.flurbos = (Number(eco.flurbos) || 0) + (Number(amount) || 0);
        this.saveEconomy(eco);
        this.updateFlurbosDisplay();
        return eco.flurbos;
    },

    spendFlurbos(amount) {
        const eco = this.getEconomy();
        eco.flurbos = Number(eco.flurbos) || 0;
        if (eco.flurbos >= amount) {
            eco.flurbos -= amount;
            this.saveEconomy(eco);
            this.updateFlurbosDisplay();

            if (window.App.audio && window.App.audio.playMedia) {
                window.App.audio.playMedia('cash.mp3', 0.5);
            }

            return true;
        }
        return false;
    },

    updateFlurbosDisplay() {
        const display = document.getElementById('flurbos-display');
        if (!display) return;
        const eco = this.getEconomy();
        display.innerHTML = `<img src="./assets/media/filecoin.png" style="width: 14px; height: 14px; vertical-align: middle; margin-right: 6px;"> ${Number(eco.flurbos) || 0} Flurbos`;
    },

    getDeck() {
        try {
            const data = localStorage.getItem('rick_and_morty_deck');
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    },

    toggleDeckItem(id) {
        let deck = this.getDeck();
        const index = deck.indexOf(id);
        let added = false;

        if (index === -1) {
            deck.push(id);
            added = true;
        } else {
            deck.splice(index, 1);
        }

        localStorage.setItem('rick_and_morty_deck', JSON.stringify(deck));
        this.updateDeckCount();
        return added;
    },

    updateDeckCount() {
        const countSpan = document.getElementById('deck-count');
        if (countSpan) {
            const deck = this.getDeck();
            countSpan.textContent = deck.length;
        }
    },

    isInDeck(id) {
        return this.getDeck().includes(id);
    }
};

window.App.audio = {
    ctx: null,
    _activeMedia: [],

    playMedia(filename, volume = 0.8) {
        try {
            const audio = new Audio(`./assets/media/${filename}?t=${Date.now()}`);
            audio.volume = Math.max(0, Math.min(1, volume));
            this._activeMedia.push(audio);
            const cleanup = () => {
                this._activeMedia = this._activeMedia.filter(a => a !== audio);
            };
            audio.addEventListener('ended', cleanup, { once: true });
            audio.addEventListener('error', cleanup, { once: true });
            audio.play().catch(err => {
                console.warn(`Não foi possível reproduzir ${filename}:`, err);
                cleanup();
            });
            return audio;
        } catch (e) {
            return null;
        }
    },

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    },

    playTone(freq, type, duration, vol = 0.1) {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    },

    playNoise(duration) {
        if (!this.ctx) return;
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1000;

        gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start();
    },

    sfxSelect() {
        this.init();
        this.playTone(600, 'square', 0.1, 0.05);
    },

    sfxScan() {
        this.init();
        this.playTone(800 + Math.random() * 400, 'square', 0.05, 0.02);
    },

    sfxClash() {
        this.init();
        this.playNoise(0.5);
        this.playTone(150, 'sawtooth', 0.3, 0.2);
    },

    sfxWin() {
        this.init();
        setTimeout(() => this.playTone(400, 'square', 0.1, 0.1), 0);
        setTimeout(() => this.playTone(500, 'square', 0.1, 0.1), 100);
        setTimeout(() => this.playTone(600, 'square', 0.3, 0.1), 200);
    },

    sfxLose() {
        this.init();
        setTimeout(() => this.playTone(300, 'sawtooth', 0.2, 0.1), 0);
        setTimeout(() => this.playTone(250, 'sawtooth', 0.2, 0.1), 200);
        setTimeout(() => this.playTone(200, 'sawtooth', 0.4, 0.1), 400);
    },

    sfxPortal() {
        this.init();
        if (!this.ctx) return;
        const ctx = this.ctx;
        const now = ctx.currentTime;
        const duration = 1.0;

        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(900, now + 0.35);
        osc.frequency.exponentialRampToValueAtTime(60, now + duration);

        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.value = 14;
        lfoGain.gain.value = 35;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);

        oscGain.gain.setValueAtTime(0.001, now);
        oscGain.gain.exponentialRampToValueAtTime(0.12, now + 0.1);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        osc.connect(oscGain);
        oscGain.connect(ctx.destination);

        const bufferSize = Math.floor(ctx.sampleRate * duration);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.Q.value = 4;
        filter.frequency.setValueAtTime(300, now);
        filter.frequency.exponentialRampToValueAtTime(2500, now + 0.35);
        filter.frequency.exponentialRampToValueAtTime(200, now + duration);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.001, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.25, now + 0.15);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(ctx.destination);

        osc.start(now);
        lfo.start(now);
        noise.start(now);
        osc.stop(now + duration);
        lfo.stop(now + duration);
        noise.stop(now + duration);
    }
};
