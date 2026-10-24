window.App = window.App || {};

window.App.purge = {
    DURATION_MS: 30000,
    MAX_PORTALS: 4,
    GOLDEN_CHANCE: 0.1,

    active: false,
    running: false,
    _session: 0,
    _timers: [],
    _els: null,
    _pool: [],
    _earned: 0,
    _hits: 0,
    _startTime: 0,
    _onKeyDown: null,
    _bgm: null,
    _wasRadioPlaying: false,

    async start() {
        if (this.active) return;
        this.active = true;
        this.running = false;
        this._earned = 0;
        this._hits = 0;
        this._timers = [];
        const session = ++this._session;
        const alive = () => this.active && this._session === session;

        this._buildOverlay();
        this._startMusic();

        const poolPromise = this._loadPool();
        await this._countdown(['3', '2', '1']);
        if (!alive()) return;

        this._pool = await poolPromise;
        if (!alive()) return;

        if (this._pool.length === 0) {
            this._stopMusic();
            this._showPanel('Sinal Perdido', 'Não foi possível abrir os portais.');
            return;
        }

        await this._countdown(['EXPURGO!']);
        if (!alive()) return;
        this._run();
    },

    finish() {
        if (!this.active) return;
        if (!this.running) {
            this._close();
            return;
        }
        this.running = false;
        this._clearTimers();
        this._stopMusic();
        this._els.field.innerHTML = '';
        this._els.btnFlee.style.display = 'none';
        if (window.App.audio) window.App.audio.sfxWin();
        this._showPanel(
            'Fim do Expurgo',
            `Alvos neutralizados: ${this._hits}`,
            this._earned
        );
    },

    _buildOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'purge-overlay';

        const hud = document.createElement('div');
        hud.className = 'purge-hud';

        const title = document.createElement('h2');
        title.className = 'purge-title';
        title.textContent = 'A Noite do Expurgo';

        const stats = document.createElement('div');
        stats.className = 'purge-stats';

        const timer = document.createElement('span');
        timer.className = 'purge-stat purge-timer';
        timer.textContent = `${Math.ceil(this.DURATION_MS / 1000)}s`;

        const score = document.createElement('span');
        score.className = 'purge-stat';
        const coin = document.createElement('img');
        coin.src = './assets/media/filecoin.png';
        coin.alt = '';
        coin.className = 'purge-coin';
        const scoreValue = document.createElement('span');
        scoreValue.textContent = '0';
        score.appendChild(coin);
        score.appendChild(scoreValue);

        const btnFlee = document.createElement('button');
        btnFlee.className = 'purge-btn-flee';
        btnFlee.textContent = 'Fugir (Esc)';
        btnFlee.addEventListener('click', () => this.finish());

        stats.appendChild(timer);
        stats.appendChild(score);
        stats.appendChild(btnFlee);
        hud.appendChild(title);
        hud.appendChild(stats);

        const field = document.createElement('div');
        field.className = 'purge-field';

        const center = document.createElement('div');
        center.className = 'purge-center-msg';

        overlay.appendChild(hud);
        overlay.appendChild(field);
        overlay.appendChild(center);
        document.body.appendChild(overlay);

        this._onKeyDown = (e) => {
            if (e.key === 'Escape') this.finish();
        };
        document.addEventListener('keydown', this._onKeyDown);

        this._els = { overlay, timer, scoreValue, field, center, btnFlee };
    },

    _countdown(steps) {
        return new Promise((resolve) => {
            let i = 0;
            const next = () => {
                if (!this._els) return;
                const center = this._els.center;
                if (i >= steps.length) {
                    center.innerHTML = '';
                    resolve();
                    return;
                }
                center.innerHTML = '';
                const el = document.createElement('div');
                el.className = 'purge-countdown';
                el.textContent = steps[i];
                center.appendChild(el);

                if (window.App.audio) {
                    window.App.audio.init();
                    window.App.audio.playTone(steps[i] === 'EXPURGO!' ? 880 : 440, 'square', 0.15, 0.06);
                }
                i++;
                this._later(next, 800);
            };
            next();
        });
    },

    _showPanel(titleText, bodyText, flurbos = null) {
        const center = this._els.center;
        center.innerHTML = '';

        const panel = document.createElement('div');
        panel.className = 'purge-panel';

        const title = document.createElement('h3');
        title.className = 'purge-panel-title';
        title.textContent = titleText;

        const body = document.createElement('p');
        body.className = 'purge-panel-text';
        body.textContent = bodyText;

        panel.appendChild(title);
        panel.appendChild(body);

        if (flurbos !== null) {
            const row = document.createElement('div');
            row.className = 'purge-panel-reward';
            const coin = document.createElement('img');
            coin.src = './assets/media/filecoin.png';
            coin.alt = '';
            coin.className = 'purge-coin';
            const value = document.createElement('span');
            value.textContent = `+${flurbos} Flurbos`;
            row.appendChild(coin);
            row.appendChild(value);
            panel.appendChild(row);
        }

        const btnBack = document.createElement('button');
        btnBack.className = 'btn-market purge-panel-btn';
        btnBack.textContent = 'Voltar ao Arquivo';
        btnBack.addEventListener('click', () => this._close());
        panel.appendChild(btnBack);

        center.appendChild(panel);
    },

    _run() {
        this.running = true;
        this._startTime = Date.now();

        const tick = () => {
            if (!this.running) return;
            const remaining = Math.max(0, this.DURATION_MS - (Date.now() - this._startTime));
            this._els.timer.textContent = `${Math.ceil(remaining / 1000)}s`;
            this._els.timer.classList.toggle('low', remaining <= 5000);
            if (remaining <= 0) {
                this.finish();
                return;
            }
            this._later(tick, 200);
        };
        tick();
        this._spawnLoop();
    },

    _progress() {
        return Math.min(1, (Date.now() - this._startTime) / this.DURATION_MS);
    },

    _spawnLoop() {
        if (!this.running) return;
        const openPortals = this._els.field.querySelectorAll('.purge-portal:not(.closing)').length;
        if (openPortals < this.MAX_PORTALS) {
            this._spawnPortal();
        }
        this._later(() => this._spawnLoop(), 900 - 450 * this._progress());
    },

    _spawnPortal() {
        const field = this._els.field;
        const rect = field.getBoundingClientRect();
        const size = Math.round(Math.max(90, Math.min(140, rect.width * 0.22)));
        const pos = this._randomPosition(rect, size);
        if (!pos) return;

        const char = this._pool[Math.floor(Math.random() * this._pool.length)];
        const golden = Math.random() < this.GOLDEN_CHANCE;
        const reward = golden ? 3 : 1;

        const portal = document.createElement('div');
        portal.className = 'purge-portal';
        portal.style.width = `${size}px`;
        portal.style.height = `${size}px`;
        portal.style.left = `${pos.x}px`;
        portal.style.top = `${pos.y}px`;

        const gif = document.createElement('img');
        gif.src = './assets/media/portal.gif';
        gif.alt = '';
        gif.draggable = false;
        gif.className = 'purge-portal-gif';

        const target = document.createElement('img');
        target.src = char.image;
        target.alt = char.name;
        target.title = char.name;
        target.draggable = false;
        target.className = 'purge-target' + (golden ? ' golden' : '');

        portal.appendChild(gif);
        portal.appendChild(target);
        field.appendChild(portal);

        let resolved = false;
        const closePortal = () => {
            this._later(() => {
                portal.classList.add('closing');
                this._later(() => portal.remove(), 300);
            }, 200);
        };

        target.addEventListener('pointerdown', (e) => {
            if (resolved || !this.running) return;
            resolved = true;
            e.preventDefault();
            e.stopPropagation();
            this._hit(e, reward, golden);
            target.classList.add('hit');
            closePortal();
        });

        const lifetime = 1500 - 650 * this._progress();
        this._later(() => {
            if (resolved) return;
            resolved = true;
            target.classList.add('escaping');
            closePortal();
        }, lifetime + 450);
    },

    _randomPosition(rect, size) {
        const existing = Array.from(this._els.field.querySelectorAll('.purge-portal')).map(p => ({
            x: parseFloat(p.style.left),
            y: parseFloat(p.style.top)
        }));
        const maxX = Math.max(0, rect.width - size);
        const maxY = Math.max(0, rect.height - size);
        for (let i = 0; i < 12; i++) {
            const x = Math.random() * maxX;
            const y = Math.random() * maxY;
            if (existing.every(p => Math.hypot(p.x - x, p.y - y) > size * 1.1)) {
                return { x, y };
            }
        }
        return null;
    },

    _hit(e, reward, golden) {
        this._hits++;
        this._earned += reward;
        this._els.scoreValue.textContent = this._earned;
        if (window.App.state) window.App.state.addFlurbos(reward);
        this._playShot(golden);

        const float = document.createElement('div');
        float.className = 'purge-float' + (golden ? ' golden' : '');
        float.innerHTML = `<img src="./assets/media/filecoin.png" alt="" style="width:14px;height:14px;margin-right:4px;vertical-align:middle;">+${reward}`;
        float.style.left = `${e.clientX + 10}px`;
        float.style.top = `${e.clientY - 20}px`;
        document.body.appendChild(float);
        setTimeout(() => {
            float.style.top = `${e.clientY - 70}px`;
            float.style.opacity = '0';
        }, 50);
        setTimeout(() => float.remove(), 850);
    },

    async _loadPool() {
        if (!window.App.api) return [];
        // Reutiliza os personagens já carregados no catálogo para evitar rajada de requisições (erro 429)
        const cached = window.App.api.getCachedCharacters();
        if (cached.length >= 12) {
            return cached;
        }
        const ids = [1, 2, 3, 4, 5, 47, 118, 196, 242, 244, 265, 331];
        return await window.App.api.fetchMultipleCharacters(ids);
    },

    _startMusic() {
        this._stopMusic();
        const radioAudio = document.getElementById('native-radio-audio');
        if (radioAudio && !radioAudio.paused) {
            this._wasRadioPlaying = true;
            radioAudio.pause();
        } else {
            this._wasRadioPlaying = false;
        }

        try {
            const bgm = new Audio(`./assets/media/expurgo.mp3?t=${Date.now()}`);
            bgm.loop = true;
            bgm.volume = 0.5;
            bgm.play().catch(() => {});
            this._bgm = bgm;
        } catch (e) {
            this._bgm = null;
        }
    },

    _stopMusic() {
        if (this._bgm) {
            try {
                this._bgm.pause();
                this._bgm.currentTime = 0;
            } catch (e) {}
            this._bgm = null;
        }
        if (this._wasRadioPlaying) {
            const radioAudio = document.getElementById('native-radio-audio');
            if (radioAudio) radioAudio.play().catch(() => {});
            this._wasRadioPlaying = false;
        }
    },

    _playShot(golden) {
        const audio = window.App.audio;
        if (!audio) return;
        audio.init();
        audio.playNoise(0.12);
        audio.playTone(golden ? 1320 : 880, 'square', 0.08, 0.05);
        if (golden) setTimeout(() => audio.playTone(1760, 'square', 0.1, 0.04), 80);
    },

    _later(fn, ms) {
        const id = setTimeout(() => {
            this._timers = this._timers.filter(t => t !== id);
            fn();
        }, ms);
        this._timers.push(id);
        return id;
    },

    _clearTimers() {
        this._timers.forEach(clearTimeout);
        this._timers = [];
    },

    _close() {
        this.running = false;
        this._clearTimers();
        this._stopMusic();
        if (this._onKeyDown) document.removeEventListener('keydown', this._onKeyDown);
        this._onKeyDown = null;

        if (this._els) {
            const overlay = this._els.overlay;
            overlay.classList.add('closing');
            setTimeout(() => overlay.remove(), 300);
        }
        this._els = null;
        this.active = false;
        if (window.App.state) window.App.state.updateFlurbosDisplay();
    }
};

window.App.triggerPurge = () => window.App.purge.start();
