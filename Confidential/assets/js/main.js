window.App = window.App || {};

document.addEventListener('DOMContentLoaded', () => {
    const gridContainer = document.getElementById('characters-grid');
    const searchInput = document.getElementById('search-input');
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const pageInfo = document.getElementById('page-info');

    let currentUrl = `${window.App.config.API_BASE_URL}/character`;
    let lastLoadedUrl = '';
    let prevUrl = null;
    let nextUrl = null;
    let loadRequestId = 0;

    if (window.App.state) {
        window.App.state.updateDeckCount();
    }
    if (window.App.ui && window.App.ui.initEconomyUI) {
        window.App.ui.initEconomyUI();
    }

    async function loadCharacters(url) {
        const requestId = ++loadRequestId;
        lastLoadedUrl = url;
        gridContainer.innerHTML = '<p class="loading-text">Acessando banco de dados confidencial...</p>';

        btnPrev.disabled = true;
        btnNext.disabled = true;

        const data = await window.App.api.fetchCharacters(url);
        if (requestId !== loadRequestId) return;

        if (data && data.results && data.results.length > 0) {
            window.App.ui.renderCharacters(data.results, gridContainer);

            prevUrl = data.info ? data.info.prev : null;
            nextUrl = data.info ? data.info.next : null;

            let currentPage = 1;
            try {
                const urlObj = new URL(url);
                if (urlObj.searchParams.has('page')) {
                    currentPage = parseInt(urlObj.searchParams.get('page'));
                }
            } catch (e) {}

            const totalPages = data.info ? data.info.pages : 1;
            pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;

            btnPrev.disabled = !prevUrl;
            btnNext.disabled = !nextUrl;
        } else {
            window.App.ui.renderCharacters([], gridContainer);
            pageInfo.textContent = `0 resultados`;
            btnPrev.disabled = true;
            btnNext.disabled = true;
        }
    }

    let currentStatus = '';

    function buildFilterUrl() {
        const name = searchInput.value.trim();
        const status = currentStatus;

        let url = `${window.App.config.API_BASE_URL}/character/?`;
        if (name) url += `name=${encodeURIComponent(name)}&`;
        if (status) url += `status=${status}&`;

        if (url.endsWith('&') || url.endsWith('?')) {
            url = url.slice(0, -1);
        }
        return url;
    }

    function applyFilters() {
        loadCharacters(buildFilterUrl());
    }

    let searchTimeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);

        const term = searchInput.value.trim().toLowerCase();
        if ((term === 'expurgo' || term === 'purge') && window.App.purge) {
            searchInput.value = '';
            searchInput.blur();
            window.App.purge.start();
            const defaultUrl = buildFilterUrl();
            if (lastLoadedUrl !== defaultUrl) {
                loadCharacters(defaultUrl);
            }
            return;
        }

        // Evita busca desnecessária na API enquanto o usuário digita a palavra-chave do minigame
        if (term.length >= 3 && ('expurgo'.startsWith(term) || 'purge'.startsWith(term))) {
            return;
        }

        searchTimeout = setTimeout(applyFilters, 500);
    });

    const statusChips = document.querySelectorAll('.status-chip');
    statusChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const nextStatus = chip.getAttribute('data-value');
            if (nextStatus === currentStatus && chip.classList.contains('active')) return;
            statusChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentStatus = nextStatus;
            applyFilters();
        });
    });

    btnPrev.addEventListener('click', () => {
        if (prevUrl) {
            loadCharacters(prevUrl);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });

    btnNext.addEventListener('click', () => {
        if (nextUrl) {
            loadCharacters(nextUrl);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });

    const btnHamburger = document.getElementById('btn-hamburger');
    if (btnHamburger) {
        btnHamburger.addEventListener('click', () => {
            if (window.App.ui && window.App.ui.openDeckPanel) {
                window.App.ui.openDeckPanel();
            }
        });
    }

    const panelBtnArena = document.getElementById('panel-btn-arena');
    if (panelBtnArena) {
        panelBtnArena.addEventListener('click', async () => {
            const panel = document.getElementById('deck-panel');
            const overlay = document.getElementById('deck-overlay');
            if (panel) panel.classList.remove('open');
            if (overlay) overlay.classList.remove('open');

            if (window.App.ui && window.App.ui.initArena) {
                let deckChars = [];
                const deckIds = window.App.state.getDeck();
                if (deckIds.length > 0) {
                    deckChars = await window.App.api.fetchMultipleCharacters(deckIds);
                }
                window.App.ui.initArena(deckChars);
            }
        });
    }

    const inlineRadio = document.getElementById('inline-radio');
    const inlineRadioToggle = document.getElementById('inline-radio-toggle');
    const inlineRadioControls = document.getElementById('inline-radio-controls');
    const inlineAudio = document.getElementById('native-radio-audio');

    let radioStations = [
        { name: "Lofi Chill", url: "https://streams.ilovemusic.de/iloveradio17.mp3" },
        { name: "Pop Hits", url: "https://streams.ilovemusic.de/iloveradio14.mp3" },
        { name: "Old School Hip Hop", url: "https://listen.181fm.com/181-oldschool_128k.mp3" },
        { name: "Classic Rock / Alt", url: "https://stream.radioparadise.com/rock-128" },
        { name: "Sci-Fi / Eclectic", url: "https://stream.radioparadise.com/eclectic-128" }
    ];
    let currentStationIndex = 0;
    let isRadioExpanded = false;
    let isRadioPlaying = false;

    window.App.checkRadioUnlock = () => {
        const eco = window.App.state ? window.App.state.getEconomy() : null;
        if (eco && eco.radioUnlocked) {
            if (!radioStations.some(s => s.name.includes("Human Music"))) {
                radioStations.push({ name: "Human Music (Federação)", url: "./assets/media/Human-Music.m4a" });
            }
        }
    };

    if (inlineRadio && inlineRadioToggle && inlineAudio) {
        inlineAudio.src = radioStations[currentStationIndex].url;
        inlineAudio.volume = 0.5;

        const btnPlay = document.getElementById('inline-btn-play');
        const btnPrev = document.getElementById('inline-btn-prev');
        const btnNext = document.getElementById('inline-btn-next');
        const volSlider = document.getElementById('inline-radio-volume');
        const stationName = document.getElementById('inline-radio-name');

        const updatePlayIcon = () => {
            if (isRadioPlaying) {
                btnPlay.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>';
                inlineRadioToggle.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>';
                inlineRadioToggle.style.color = '#97ce4c';
            } else {
                btnPlay.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
                inlineRadioToggle.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
                inlineRadioToggle.style.color = 'var(--accent-color)';
            }
            stationName.textContent = radioStations[currentStationIndex].name;
        };

        const togglePlay = (e) => {
            if (e) e.stopPropagation();
            if (inlineAudio.paused) {
                inlineAudio.play().catch(err => console.log("Áudio bloqueado", err));
                isRadioPlaying = true;
            } else {
                inlineAudio.pause();
                isRadioPlaying = false;
            }
            updatePlayIcon();
        };

        const skipNext = (e) => {
            if (e) e.stopPropagation();
            currentStationIndex = (currentStationIndex + 1) % radioStations.length;
            inlineAudio.src = radioStations[currentStationIndex].url;
            if (isRadioPlaying) inlineAudio.play();
            updatePlayIcon();
        };

        const skipPrev = (e) => {
            if (e) e.stopPropagation();
            currentStationIndex = (currentStationIndex - 1 + radioStations.length) % radioStations.length;
            inlineAudio.src = radioStations[currentStationIndex].url;
            if (isRadioPlaying) inlineAudio.play();
            updatePlayIcon();
        };

        btnPlay.addEventListener('click', togglePlay);
        btnNext.addEventListener('click', skipNext);
        btnPrev.addEventListener('click', skipPrev);

        volSlider.addEventListener('input', (e) => {
            e.stopPropagation();
            inlineAudio.volume = e.target.value;
            const perc = e.target.value * 100;
            volSlider.style.background = `linear-gradient(to right, var(--accent-color) ${perc}%, #333 ${perc}%)`;
        });
        volSlider.dispatchEvent(new Event('input'));

        inlineAudio.addEventListener('playing', () => { isRadioPlaying = true; updatePlayIcon(); });
        inlineAudio.addEventListener('pause', () => { isRadioPlaying = false; updatePlayIcon(); });

        inlineRadioToggle.addEventListener('click', (e) => {
            if (e) e.stopPropagation();
            isRadioExpanded = !isRadioExpanded;
            inlineRadio.classList.toggle('inline-radio--expanded', isRadioExpanded);
            if (isRadioExpanded) {
                inlineRadio.style.maxWidth = '350px';
                setTimeout(() => { inlineRadioControls.style.opacity = '1'; }, 200);
            } else {
                inlineRadioControls.style.opacity = '0';
                setTimeout(() => { inlineRadio.style.maxWidth = '32px'; }, 100);
            }
        });

        document.addEventListener('click', (e) => {
            if (isRadioExpanded && inlineRadio && !inlineRadio.contains(e.target)) {
                if (!e.target.closest('#btn-hamburger') && !e.target.closest('#panel-btn-radio')) {
                    inlineRadioToggle.click();
                }
            }
        });

        window.openRadio = () => {
            const panel = document.getElementById('deck-panel');
            const overlay = document.getElementById('deck-overlay');
            if (panel) panel.classList.remove('open');
            if (overlay) overlay.classList.remove('open');

            window.App.checkRadioUnlock();

            if (inlineRadio) {
                inlineRadio.style.display = 'flex';
                if (!isRadioExpanded) {
                    inlineRadioToggle.click();
                }
            }
        };
    } else {
        window.openRadio = () => {};
    }

    const panelBtnRadio = document.getElementById('panel-btn-radio');
    if (panelBtnRadio) {
        panelBtnRadio.addEventListener('click', () => window.openRadio());
    }

    const panelBtnMarket = document.getElementById('panel-btn-market');
    if (panelBtnMarket) {
        panelBtnMarket.addEventListener('click', () => {
            const panel = document.getElementById('deck-panel');
            const overlay = document.getElementById('deck-overlay');
            if (panel) panel.classList.remove('open');
            if (overlay) overlay.classList.remove('open');

            const modalMarket = document.getElementById('market-modal');
            if (modalMarket && window.App.ui && window.App.ui.updateMarketUI) {
                window.App.ui.updateMarketUI();
                modalMarket.showModal();
            }
        });
    }

    const btnCloseRadio = document.getElementById('btn-close-radio');
    if (btnCloseRadio) {
        btnCloseRadio.addEventListener('click', () => {
            if (typeof radioPlayer !== 'undefined' && radioPlayer) radioPlayer.style.display = 'none';
        });
    }

    if (window.App.ui && window.App.ui.initSpaceshipEasterEgg) {
        window.App.ui.initSpaceshipEasterEgg();
    }

    loadCharacters(currentUrl);
});
