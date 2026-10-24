window.App = window.App || {};

window.App.ui = {
    initEconomyUI() {
        window.App.state.updateFlurbosDisplay();

        const modalMarket = document.getElementById('market-modal');
        const btnCloseMarket = document.getElementById('btn-close-market');

        const btnMarket = document.getElementById('btn-open-market');
        if (btnMarket && modalMarket) {
            btnMarket.onclick = () => {
                this.updateMarketUI();
                modalMarket.showModal();
            };
        }

        if (btnCloseMarket && modalMarket) {
            btnCloseMarket.onclick = () => modalMarket.close();
        }

        if (modalMarket) {
            document.getElementById('btn-buy-slot').onclick = () => {
                const currentEco = window.App.state.getEconomy();
                if (currentEco.maxDeckSize >= 5) return;
                
                let cost = 100;
                if (currentEco.maxDeckSize === 2) cost = 250;
                if (currentEco.maxDeckSize === 3) cost = 500;
                if (currentEco.maxDeckSize === 4) cost = 1000;
                
                if (window.App.state.spendFlurbos(cost)) {
                    const updatedEco = window.App.state.getEconomy();
                    updatedEco.maxDeckSize++;
                    window.App.state.saveEconomy(updatedEco);
                    this.updateMarketUI();
                } else {
                    alert("Flurbos insuficientes!");
                }
            };

            document.getElementById('btn-buy-radio').onclick = () => {
                const currentEco = window.App.state.getEconomy();
                if (currentEco.radioUnlocked) return;
                if (window.App.state.spendFlurbos(999)) {
                    const updatedEco = window.App.state.getEconomy();
                    updatedEco.radioUnlocked = true;
                    window.App.state.saveEconomy(updatedEco);
                    this.updateMarketUI();
                    alert("Frequência da Federação desbloqueada! Verifique a rádio.");
                    if (window.App.checkRadioUnlock) {
                        window.App.checkRadioUnlock();
                    }
                } else {
                    alert("Flurbos insuficientes!");
                }
            };
        }
    },

    updateMarketUI() {
        const eco = window.App.state.getEconomy();
        window.App.state.updateFlurbosDisplay();

        const btnSlot = document.getElementById('btn-buy-slot');
        const descSlot = document.getElementById('market-slot-desc');
        if (eco.maxDeckSize >= 5) {
            descSlot.textContent = `Máximo atingido (5/5)`;
            btnSlot.innerHTML = "Máx";
            btnSlot.disabled = true;
        } else {
            descSlot.textContent = `Atual: ${eco.maxDeckSize}/5 slots`;
            let cost = 100;
            if (eco.maxDeckSize === 2) cost = 250;
            if (eco.maxDeckSize === 3) cost = 500;
            if (eco.maxDeckSize === 4) cost = 1000;
            btnSlot.innerHTML = `<img src="./assets/media/filecoin.png" style="width: 14px; height: 14px; margin-right: 4px;"> ${cost}`;
            btnSlot.disabled = eco.flurbos < cost;
        }

        const btnRadio = document.getElementById('btn-buy-radio');
        if (eco.radioUnlocked) {
            btnRadio.innerHTML = "Adquirido";
            btnRadio.disabled = true;
        } else {
            btnRadio.innerHTML = `<img src="./assets/media/filecoin.png" style="width: 14px; height: 14px; margin-right: 4px;"> 999`;
            btnRadio.disabled = eco.flurbos < 999;
        }
    },

    renderCharacters(characters, container) {
        container.innerHTML = '';
        
        if (!characters || characters.length === 0) {
            container.innerHTML = '<p class="no-results">Nenhum registro encontrado no arquivo confidencial.</p>';
            return;
        }

        characters.forEach(character => {
            const card = document.createElement('article');
            card.classList.add('character-card');
            card.dataset.id = character.id;

            const cardHeader = document.createElement('div');
            cardHeader.classList.add('card-header');
            
            const idSpan = document.createElement('span');
            idSpan.classList.add('card-id');
            idSpan.textContent = `ARQ-${character.id.toString().padStart(3, '0')}`;
            
            const btnFavorite = document.createElement('button');
            btnFavorite.classList.add('btn-favorite');
            btnFavorite.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';
            btnFavorite.title = "Adicionar ao Deck";
            
            if (window.App.state && window.App.state.isInDeck(character.id)) {
                btnFavorite.style.color = 'var(--accent-color)';
            }
            
            btnFavorite.addEventListener('click', (e) => {
                e.stopPropagation();
                if (window.App.state) {
                    const added = window.App.state.toggleDeckItem(character.id);
                    btnFavorite.style.color = added ? 'var(--accent-color)' : '#444';
                }
            });

            cardHeader.appendChild(idSpan);
            cardHeader.appendChild(btnFavorite);

            const imgContainer = document.createElement('div');
            imgContainer.classList.add('card-img-container');
            
            const img = document.createElement('img');
            img.src = character.image;
            img.alt = character.name;
            img.loading = 'lazy';
            img.decoding = 'async';
            img.classList.add('card-img');
            if (character.rawImage) {
                img.onerror = () => {
                    if (img.src !== character.rawImage) img.src = character.rawImage;
                };
            }
            
            imgContainer.appendChild(img);

            const infoContainer = document.createElement('div');
            infoContainer.classList.add('card-info');
            
            const name = document.createElement('h3');
            name.classList.add('card-name');
            name.textContent = character.name;
            
            const statusBox = document.createElement('div');
            statusBox.classList.add('card-status-box');
            
            const statusDot = document.createElement('span');
            statusDot.classList.add('status-dot');
            statusDot.classList.add(`status-${character.status.toLowerCase()}`);
            
            const statusText = document.createElement('span');
            statusText.textContent = `${character.status} - ${character.species}`;
            
            statusBox.appendChild(statusDot);
            statusBox.appendChild(statusText);
            
            const stats = window.App.state ? window.App.state.calculateAttributes(character) : {vida:0, forca:0, inteligencia:0, sorte:0};
            
            const statsDiv = document.createElement('div');
            statsDiv.classList.add('card-stats-compact');
            statsDiv.textContent = `VID ${stats.vida} · FOR ${stats.forca} · INT ${stats.inteligencia} · SOR ${stats.sorte}`;
            
            infoContainer.appendChild(name);
            infoContainer.appendChild(statusBox);
            infoContainer.appendChild(statsDiv);

            card.appendChild(cardHeader);
            card.appendChild(imgContainer);
            card.appendChild(infoContainer);

            card.addEventListener('click', () => {
                window.App.ui.openModal(character);
            });

            container.appendChild(card);

            if (window.App.tilt) {
                window.App.tilt.attachToCard(card);
            }
        });
    },

    openModal(character) {
        const modal = document.getElementById('character-modal');
        const modalBody = document.getElementById('modal-body');
        
        const stats = window.App.state ? window.App.state.calculateAttributes(character) : {vida:0, forca:0, inteligencia:0, sorte:0};

        modalBody.innerHTML = `
            <div class="modal-grid">
                <div class="modal-left-col">
                    <div class="modal-img-container">
                        <img src="${character.image}" alt="${character.name}">
                    </div>
                    <div class="modal-meta" style="margin-bottom: 0;">
                        <p><strong>Status:</strong> ${character.status}</p>
                        <p><strong>Espécie:</strong> ${character.species} ${character.type ? `(${character.type})` : ''}</p>
                        <p><strong>Gênero:</strong> ${character.gender}</p>
                        <p><strong>Origem:</strong> ${character.origin.name}</p>
                    </div>
                </div>

                <div class="modal-details">
                    <div style="display: flex; justify-content: flex-start; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                        <h2 style="color: var(--accent-color); font-size: 2.5rem; margin: 0; line-height: 1;">${character.name}</h2>
                        <button id="modal-btn-favorite" class="btn-favorite" title="Adicionar aos Favoritos" style="font-size: 1.5rem; margin-top: 5px;">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                        </button>
                    </div>
                    
                    <div id="video-container" class="video-container" style="margin-bottom: 2rem;">
                        ${this._renderDossierBlock(character)}
                    </div>

                    <div class="stats-container" style="margin-top: 0;">
                        <h3 style="color: #fff; margin-bottom: 1.5rem;">Atributos Base</h3>
                        
                        ${this._createStatBar('Vida', stats.vida)}
                        ${this._createStatBar('Força', stats.forca)}
                        ${this._createStatBar('Inteligência', stats.inteligencia)}
                        ${this._createStatBar('Sorte', stats.sorte)}
                    </div>
                </div>
            </div>
        `;

        modal.showModal();

        const modalBtnFav = document.getElementById('modal-btn-favorite');
        if (window.App.state && window.App.state.isInDeck(character.id)) {
            modalBtnFav.style.color = 'var(--accent-color)';
        } else {
            modalBtnFav.style.color = '#444';
        }
        
        modalBtnFav.onclick = () => {
            if (window.App.state) {
                const added = window.App.state.toggleDeckItem(character.id);
                modalBtnFav.style.color = added ? 'var(--accent-color)' : '#444';
                const outerCardBtn = document.querySelector(`.character-card[data-id="${character.id}"] .btn-favorite`);
                if (outerCardBtn) {
                    outerCardBtn.style.color = added ? 'var(--accent-color)' : '#444';
                }
            }
        };

        // Delay curto para disparar a transição de largura das barras de atributo
        setTimeout(() => {
            const bars = modalBody.querySelectorAll('.stat-bar-fill');
            bars.forEach(bar => {
                bar.style.width = bar.dataset.val + '%';
            });
        }, 50);

        const btnClose = document.getElementById('btn-close-modal');
        btnClose.onclick = () => modal.close();
        
        modal.onclick = (e) => {
            if (e.target === modal) modal.close();
        };
    },

    _createStatBar(label, value) {
        return `
            <div class="stat-row">
                <div class="stat-label">
                    <span>${label}</span>
                    <span>${value}</span>
                </div>
                <div class="stat-bar-bg">
                    <div class="stat-bar-fill" data-val="${value}"></div>
                </div>
            </div>
        `;
    },

    _renderDossierBlock(charData) {
        let episodeList = charData.episode.map(url => url.split('/').pop());
        let episodeString = episodeList.length > 5 
            ? episodeList.slice(0, 5).join(', ') + ` ... (e mais ${episodeList.length - 5})`
            : episodeList.join(', ');

        return `
            <div style="width: 100%; background: #111; border-radius: 8px; border: 1px solid #333; padding: 1rem; text-align: left;">
                <h3 style="color: #888; font-family: 'Geist Mono', monospace; font-size: 1rem; margin-bottom: 1rem; border-bottom: 1px solid #333; padding-bottom: 0.5rem;">[ Dossiê da Federação ]</h3>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                    <div>
                        <p style="color: #666; font-size: 0.8rem; margin-bottom: 0.2rem;">Espécie / Gênero</p>
                        <p style="color: #fff; font-size: 0.9rem;">${charData.species} • ${charData.gender}</p>
                    </div>
                    <div>
                        <p style="color: #666; font-size: 0.8rem; margin-bottom: 0.2rem;">Tipo</p>
                        <p style="color: #fff; font-size: 0.9rem;">${charData.type || 'Desconhecido'}</p>
                    </div>
                    <div>
                        <p style="color: #666; font-size: 0.8rem; margin-bottom: 0.2rem;">Local de Origem</p>
                        <p style="color: #fff; font-size: 0.9rem;">${charData.origin.name}</p>
                    </div>
                    <div>
                        <p style="color: #666; font-size: 0.8rem; margin-bottom: 0.2rem;">Último Avistamento</p>
                        <p style="color: #fff; font-size: 0.9rem;">${charData.location.name}</p>
                    </div>
                </div>

                <div style="background: rgba(0,0,0,0.5); padding: 0.8rem; border-radius: 4px; border: 1px dashed #444;">
                    <p style="color: #666; font-size: 0.8rem; margin-bottom: 0.3rem;">Registros em Episódios</p>
                    <p style="color: var(--text-secondary); font-family: 'Geist Mono', monospace; font-size: 0.8rem;">[ ${episodeString} ]</p>
                </div>
            </div>
        `;
    },

    async openDeckPanel() {
        const panel = document.getElementById('deck-panel');
        const overlay = document.getElementById('deck-overlay');
        const content = document.getElementById('deck-content');
        
        panel.classList.add('open');
        overlay.classList.add('open');

        window.App.state.updateFlurbosDisplay();
        content.innerHTML = '<p style="color: var(--text-secondary); text-align: center; margin-top: 2rem;">Buscando fichas...</p>';
        
        const closePanel = () => {
            panel.classList.remove('open');
            overlay.classList.remove('open');
        };
        
        document.getElementById('btn-close-deck').onclick = closePanel;
        overlay.onclick = closePanel;
        
        const deckIds = window.App.state.getDeck();
        
        if (deckIds.length === 0) {
            content.innerHTML = '<p style="color: var(--text-secondary); text-align: center; margin-top: 2rem;">Seu deck está vazio. Adicione personagens clicando no coração nas fichas.</p>';
            return;
        }
        
        const characters = await window.App.api.fetchMultipleCharacters(deckIds);
        content.innerHTML = '';
        
        characters.forEach(char => {
            const stats = window.App.state.calculateAttributes(char);
            
            const miniCard = document.createElement('div');
            miniCard.style.display = 'flex';
            miniCard.style.gap = '1rem';
            miniCard.style.padding = '1rem';
            miniCard.style.backgroundColor = 'var(--bg-card)';
            miniCard.style.border = '1px solid #444';
            miniCard.style.borderRadius = '8px';
            miniCard.style.cursor = 'pointer';
            
            miniCard.innerHTML = `
                <img src="${char.image}" alt="${char.name}" style="width: 60px; height: 60px; border-radius: 4px; object-fit: cover;">
                <div style="flex: 1;">
                    <h4 style="color: var(--accent-color); margin-bottom: 0.2rem;">${char.name}</h4>
                    <p style="font-family: 'Geist Mono', monospace; font-size: 0.8rem; color: var(--text-secondary);">
                        Poder Total: ${stats.total}
                    </p>
                </div>
            `;
            
            miniCard.onclick = () => {
                closePanel();
                this.openModal(char);
            };
            
            content.appendChild(miniCard);
        });
    },

    async initArena(deckCharacters = []) {
        const appMain = document.querySelector('.app-main');
        const arenaMain = document.getElementById('arena-main');
        const headerControls = document.querySelector('.header-controls');
        const appHeader = document.querySelector('.app-header');
        const engine = window.App.GameEngine;
        
        appMain.style.display = 'none';
        arenaMain.style.display = 'flex';
        appHeader.style.display = 'none';
        headerControls.style.display = 'none'; 
        
        const phaseSelection = document.getElementById('squad-selection-phase');
        const phaseBattle = document.getElementById('battle-phase');
        const btnLeave = document.getElementById('btn-leave-arena');
        const stageInfo = document.getElementById('arena-stage-info');
        
        phaseSelection.style.display = 'block';
        phaseBattle.style.display = 'none';
        stageInfo.style.display = 'none';

        const deckList = document.getElementById('arena-deck-list');
        deckList.innerHTML = '<div style="color:#fff; text-align:center; grid-column:1/-1;">Buscando Agentes no Multiverso...</div>';

        const targetTotal = 42;
        const allRecruitsMap = new Map();

        if (deckCharacters && deckCharacters.length > 0) {
            deckCharacters.forEach(c => allRecruitsMap.set(c.id, c));
        }

        // Aproveita personagens já em cache para evitar rajadas desnecessárias de imagens
        if (window.App.api && typeof window.App.api.getCachedCharacters === 'function') {
            const cached = window.App.api.getCachedCharacters()
                .slice()
                .sort(() => 0.5 - Math.random());
            for (const c of cached) {
                if (allRecruitsMap.size >= targetTotal) break;
                allRecruitsMap.set(c.id, c);
            }
        }

        const missingCount = Math.max(0, targetTotal - allRecruitsMap.size);
        if (missingCount > 0) {
            const randomIds = [];
            while (randomIds.length < missingCount) {
                const id = Math.floor(Math.random() * 800) + 1;
                if (!allRecruitsMap.has(id) && !randomIds.includes(id)) {
                    randomIds.push(id);
                }
            }
            const randomCharacters = await window.App.api.fetchMultipleCharacters(randomIds);
            if (randomCharacters && randomCharacters.length > 0) {
                for (const c of randomCharacters) {
                    if (allRecruitsMap.size >= targetTotal) break;
                    allRecruitsMap.set(c.id, c);
                }
            }
        }
        
        let combinedCharacters = Array.from(allRecruitsMap.values());
        
        // Favoritos primeiro, depois ordem alfabética
        combinedCharacters.sort((a, b) => {
            const aFav = window.App.state.isInDeck(a.id);
            const bFav = window.App.state.isInDeck(b.id);
            if (aFav && !bFav) return -1;
            if (!aFav && bFav) return 1;
            return a.name.localeCompare(b.name);
        });

        engine.start(combinedCharacters.map(c => c.id));

        btnLeave.onclick = () => {
            arenaMain.style.display = 'none';
            appMain.style.display = 'block';
            appHeader.style.display = 'block';
            headerControls.style.display = 'flex';
            window.App.state.updateFlurbosDisplay();
        };

        this._initSquadSelection(combinedCharacters, engine);
    },

    _initSquadSelection(deckCharacters, engine) {
        const deckList = document.getElementById('arena-deck-list');
        const preview = document.getElementById('squad-slots-preview');
        const btnStart = document.getElementById('btn-start-journey');
        const btnPrev = document.getElementById('btn-recruit-prev');
        const btnNext = document.getElementById('btn-recruit-next');
        
        let currentPage = 0;
        const pageSize = 14;
        const totalPages = Math.ceil(deckCharacters.length / pageSize);

        btnStart.disabled = true;

        const updatePreview = () => {
            const eco = window.App.state ? window.App.state.getEconomy() : { maxDeckSize: 1 };
            
            const titleH3 = document.querySelector('#squad-selection-phase h3');
            if (titleH3) titleH3.textContent = `MONTE SEU ESQUADRÃO (${eco.maxDeckSize} LUTADORES)`;
            
            preview.innerHTML = '';
            for (let i = 0; i < eco.maxDeckSize; i++) {
                const char = engine.squad[i];
                const slot = document.createElement('div');
                slot.className = 'squad-preview-slot';
                slot.style.width = '80px';
                slot.style.height = '80px';
                slot.style.border = '2px dashed #666';
                slot.style.borderRadius = '50%';
                slot.style.display = 'flex';
                slot.style.alignItems = 'center';
                slot.style.justifyContent = 'center';
                
                if (char) {
                    slot.innerHTML = `<img src="${char.image}" style="width:100%; height:100%; border-radius:50%; object-fit:cover; border:2px solid var(--accent-color);">`;
                    slot.style.border = 'none';
                    slot.style.cursor = 'pointer';
                    slot.title = 'Clique para remover';
                    slot.onclick = () => {
                        if (window.App.audio) window.App.audio.sfxSelect();
                        engine.removeFromSquad(char.id);
                        updatePreview();
                    };
                } else {
                    slot.innerHTML = '<span style="color:#666; font-size: 2rem;">+</span>';
                }
                preview.appendChild(slot);
            }
            btnStart.disabled = !engine.isSquadFull();

            const allDeckCards = document.querySelectorAll('.arena-deck-card');
            allDeckCards.forEach(card => {
                const charId = parseInt(card.dataset.id);
                if (engine.squad.find(c => c.id === charId)) {
                    card.style.opacity = '0.3';
                    card.style.pointerEvents = 'none';
                } else {
                    card.style.opacity = '1';
                    card.style.pointerEvents = 'auto';
                }
            });
        };

        const renderPage = () => {
            deckList.innerHTML = '';
            const startIdx = currentPage * pageSize;
            const pageCharacters = deckCharacters.slice(startIdx, startIdx + pageSize);

            pageCharacters.forEach(char => {
                const card = document.createElement('div');
                card.className = 'arena-deck-card';
                card.dataset.id = char.id;
                
                const isFav = window.App.state.isInDeck(char.id);
                if (isFav) {
                    card.style.borderColor = 'var(--accent-color)';
                }
                
                card.innerHTML = `
                    <img src="${char.image}" alt="${char.name}" class="arena-deck-card-img">
                    <div class="arena-deck-card-info">
                        <p class="arena-deck-card-name">${char.name}</p>
                    </div>
                `;

                if (window.App.tilt) {
                    window.App.tilt.attachToCard(card);
                }
                
                card.onclick = () => {
                    if (window.App.audio) window.App.audio.sfxSelect();
                    if (engine.addToSquad(char)) {
                        updatePreview();
                    }
                };
                
                deckList.appendChild(card);
            });
            
            btnPrev.disabled = currentPage === 0;
            btnNext.disabled = currentPage >= totalPages - 1;
            
            btnPrev.style.opacity = btnPrev.disabled ? '0.5' : '1';
            btnNext.style.opacity = btnNext.disabled ? '0.5' : '1';
            
            updatePreview();
        };

        btnPrev.onclick = () => {
            if (currentPage > 0) {
                if (window.App.audio) window.App.audio.sfxSelect();
                currentPage--;
                renderPage();
            }
        };

        btnNext.onclick = () => {
            if (currentPage < totalPages - 1) {
                if (window.App.audio) window.App.audio.sfxSelect();
                currentPage++;
                renderPage();
            }
        };

        renderPage();

        btnStart.onclick = () => {
            if (engine.beginJourney()) {
                if (window.App.audio) window.App.audio.sfxSelect();
                this._startBattlePhase(engine);
            }
        };
    },

    async _startBattlePhase(engine) {
        document.getElementById('squad-selection-phase').style.display = 'none';
        document.getElementById('battle-phase').style.display = 'block';
        document.getElementById('arena-stage-info').style.display = 'block';
        
        await this._loadNextStage(engine);
        this._bindBattleControls(engine);
    },

    async _loadNextStage(engine) {
        const log = document.getElementById('arena-log');
        const stageInfo = document.getElementById('arena-stage-info');
        const btnNext = document.getElementById('btn-next-stage');
        const btnAttack = document.getElementById('btn-attack');
        const btnSpecial = document.getElementById('btn-special');
        
        btnNext.style.display = 'none';
        btnAttack.style.display = 'block';
        btnSpecial.style.display = 'block';
        btnAttack.disabled = true;
        btnSpecial.disabled = true;
        
        stageInfo.textContent = `Estágio ${engine.stage}`;
        log.innerHTML = 'Buscando oponente no multiverso...';
        if (window.App.audio) window.App.audio.sfxScan();
        
        const enemyPlaceholder = document.getElementById('enemy-placeholder');
        if (enemyPlaceholder) enemyPlaceholder.classList.add('glitch-anim');

        this._updateBattleUI(engine);

        const apiEnemy = await window.App.api.fetchRandomCharacter();
        engine.generateEnemy(apiEnemy);

        log.innerHTML = `Oponente Encontrado! Prepare-se para enfrentar ${engine.enemy.name}!`;
        
        btnAttack.disabled = false;
        this._updateBattleUI(engine);
    },

    _bindBattleControls(engine) {
        const btnAttack = document.getElementById('btn-attack');
        const btnSpecial = document.getElementById('btn-special');
        const btnNext = document.getElementById('btn-next-stage');

        btnAttack.onclick = () => this._handlePlayerAction(engine, false);
        btnSpecial.onclick = () => this._handlePlayerAction(engine, true);
        
        btnNext.onclick = () => {
            if (window.App.audio) window.App.audio.sfxSelect();
            engine.nextStage();
            this._loadNextStage(engine);
        };
    },

    _handlePlayerAction(engine, isSpecial) {
        const btnAttack = document.getElementById('btn-attack');
        const btnSpecial = document.getElementById('btn-special');
        
        btnAttack.disabled = true;
        btnSpecial.disabled = true;

        const result = engine.attack(isSpecial);
        if (!result) return;

        if (window.App.audio) window.App.audio.sfxClash();
        this._animateAction(1);
        this._applyVisualEffects(result, 2);
        
        this._logMessage(result.log);
        this._updateBattleUI(engine);

        if (engine.gameState === 'stage_clear') {
            if (window.App.audio) window.App.audio.sfxWin();
            this._showBuffSelection(engine);
            return;
        }

        setTimeout(() => {
            const enemyResult = engine.enemyTurn();
            if (!enemyResult) return;

            if (enemyResult.angelRevived) {
                if (window.App.audio && window.App.audio.playMedia) {
                    window.App.audio.playMedia('anjo.mp3', 1.0);
                }
                
                const screenFlash = document.createElement('div');
                screenFlash.style.position = 'fixed';
                screenFlash.style.top = '0';
                screenFlash.style.left = '0';
                screenFlash.style.width = '100vw';
                screenFlash.style.height = '100vh';
                screenFlash.style.backgroundColor = 'rgba(255, 215, 0, 0.8)';
                screenFlash.style.zIndex = '9999';
                screenFlash.style.pointerEvents = 'none';
                screenFlash.style.transition = 'opacity 2s ease-out';
                document.body.appendChild(screenFlash);
                setTimeout(() => screenFlash.style.opacity = '0', 100);
                setTimeout(() => screenFlash.remove(), 2100);

                const slot1 = document.getElementById('fighter-1-slot');
                if (slot1) {
                    slot1.style.boxShadow = '0 0 50px gold';
                    setTimeout(() => {
                        slot1.style.boxShadow = 'none';
                    }, 2500);
                }
            }

            if (enemyResult.stunned) {
                if (window.App.audio && window.App.audio.playMedia) {
                    window.App.audio.playMedia('gelo.mp3', 0.35);
                }
                
                const slot2 = document.getElementById('fighter-2-slot');
                slot2.classList.add('shake');
                setTimeout(() => slot2.classList.remove('shake'), 500);

                const cardInside = slot2.querySelector('.character-card');
                if (cardInside) {
                    const iceOverlay = document.createElement('div');
                    iceOverlay.classList.add('ice-overlay', 'active');
                    cardInside.appendChild(iceOverlay);
                    setTimeout(() => iceOverlay.remove(), 1500);
                }
            } else {
                // Evita que sfxClash abafe os áudios dedicados de Espelho, Escudo ou Anjo
                if (window.App.audio && !enemyResult.reflected && !enemyResult.blocked && !enemyResult.angelRevived) {
                    window.App.audio.sfxClash();
                }
                if (enemyResult.slept) {
                    if (window.App.audio && window.App.audio.playMedia) {
                        window.App.audio.playMedia('sono.mp3', 0.4);
                    }
                    this._showSleepEffect('fighter-2-slot');
                }
                this._animateAction(2);
                this._applyVisualEffects(enemyResult, 1);
            }
            
            this._logMessage(enemyResult.log);
            if (enemyResult.fighterSwitched) {
                // Mostra a vida zerando durante o impacto antes de trocar o card do lutador
                const hp1 = document.getElementById('hp-1');
                const hpText1 = document.getElementById('hp-text-1');
                const slot1 = document.getElementById('fighter-1-slot');
                if (hp1) hp1.style.width = '0%';
                if (hpText1) hpText1.textContent = `0/${ hpText1.textContent.split('/')[1] || 0 }`;
                if (slot1) {
                    const colorImg = slot1.querySelector('.card-img-color');
                    if (colorImg) colorImg.style.clipPath = 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)';
                }
                setTimeout(() => this._updateBattleUI(engine), 550);
            } else {
                this._updateBattleUI(engine);
            }

            if (engine.gameState === 'stage_clear') {
                setTimeout(() => {
                    if (window.App.audio) window.App.audio.sfxWin();
                    this._showBuffSelection(engine);
                }, 900);
                return;
            }

            if (engine.gameState === 'game_over') {
                if (window.App.audio) window.App.audio.sfxLose();
                btnAttack.style.display = 'none';
                btnSpecial.style.display = 'none';
                this._logMessage("FIM DE JOGO. A Federação rastreou o sinal.");
                
                setTimeout(() => {
                    document.getElementById('go-stages').textContent = engine.stage;
                    document.getElementById('go-flurbos').textContent = engine.flurbosEarned || 0;
                    document.getElementById('game-over-phase').style.display = 'flex';
                    
                    const btnRevive = document.getElementById('btn-revive-arena');
                    const eco = window.App.state ? window.App.state.getEconomy() : { flurbos: 0 };
                    
                    if (eco.flurbos >= 200) {
                        btnRevive.style.display = 'block';
                        btnRevive.onclick = () => {
                            if (window.App.state.spendFlurbos(200)) {
                                if (window.App.ui.initEconomyUI) window.App.ui.initEconomyUI();
                                engine.squad.forEach(c => c.hp = c.maxHp);
                                engine.currentFighterIndex = 0;
                                engine.gameState = 'battle';
                                engine.turn = 'player';
                                document.getElementById('game-over-phase').style.display = 'none';
                                btnAttack.style.display = 'block';
                                btnSpecial.style.display = 'block';
                                btnAttack.disabled = false;
                                this._logMessage("Protocolo de Ressurreição Ativado. A luta continua!");
                                this._updateBattleUI(engine);
                            }
                        };
                    } else {
                        btnRevive.style.display = 'none';
                    }

                    document.getElementById('btn-retry-arena').onclick = () => {
                        document.getElementById('game-over-phase').style.display = 'none';
                        
                        engine.stage = 1;
                        engine.flurbosEarned = 0;
                        engine.coinMultiplier = 1.0;
                        engine.playerSpecialCooldown = 0;
                        engine.gameState = 'battle';
                        engine.turn = 'player';
                        engine.currentFighterIndex = 0;
                        engine.tempEffects = { reflectCharges: 0, bonusCritCharges: 0, bonusCritValue: 0, lifestealCharges: 0, lifestealValue: 0, absorbCharges: 0, stunCharges: 0, blockCharges: 0, executeCharges: 0, angelCharges: 0, sleepCharges: 0 };
                        
                        engine.squad = engine.squad.map(c => engine._calculateStats(c, true));
                        window.App.ui._startBattlePhase(engine);
                    };
                }, 1500);
                
            } else {
                btnAttack.disabled = false;
                btnSpecial.disabled = engine.playerSpecialCooldown > 0;
                if (engine.playerSpecialCooldown > 0) {
                    btnSpecial.textContent = `ESPECIAL (${engine.playerSpecialCooldown})`;
                } else {
                    btnSpecial.textContent = `ESPECIAL`;
                }
            }
        }, 1500);
    },

    startRegeneration(engine) {
        if (this._regenInterval) clearInterval(this._regenInterval);
        let ticks = 0;
        this._regenInterval = setInterval(() => {
            if (engine.gameState !== 'battle' || ticks >= 10) {
                clearInterval(this._regenInterval);
                return;
            }
            const fighter = engine.getCurrentFighter();
            if (fighter && fighter.hp > 0) {
                fighter.hp = Math.min(fighter.hp + 2, fighter.maxHp);
                if (window.App.audio) window.App.audio.playTone(500, 'sine', 0.05, 0.05);
                const hpBar = document.getElementById('hp-1');
                if (hpBar) {
                    hpBar.style.boxShadow = '0 0 10px #4caf50';
                    setTimeout(() => { hpBar.style.boxShadow = 'none'; }, 200);
                }
                this._updateBattleUI(engine);
            }
            ticks++;
        }, 1000);
    },

    _showBuffSelection(engine) {
        document.getElementById('btn-attack').style.display = 'none';
        document.getElementById('btn-special').style.display = 'none';
        
        const buffPhase = document.getElementById('buff-selection-phase');
        const buffOptions = document.getElementById('buff-options');
        buffPhase.style.display = 'flex';
        buffOptions.innerHTML = '';

        const buffs = [
            { type: 'heal', name: 'Kit Médico', desc: 'Bandagens de gel intergaláctico contrabandeadas da Cidadela regeneram parte dos ferimentos de todo o esquadrão.' },
            { type: 'attack', name: 'Esteroides', desc: 'Hormônios ilegais de Gazorpazorp inflam a musculatura, ampliando permanentemente a força bruta dos ataques.' },
            { type: 'special', name: 'Semente Mega', desc: 'A essência das Mega Sementes sobrecarrega as sinapses, potencializando drasticamente o dano do Ataque Especial.' },
            { type: 'luck', name: 'Sorte Quântica', desc: 'Altera as probabilidades do multiverso a seu favor, elevando seus reflexos de esquiva e a precisão crítica.' },
            { type: 'maxhp', name: 'Mutação Robótica', desc: 'Enxertos cibernéticos reforçam a estrutura biológica, expandindo a vitalidade máxima do esquadrão.' },
            { type: 'fullheal', name: 'Clonagem Perfeita', desc: 'Substitui os corpos avariados por clones recém-saídos dos tanques, restaurando totalmente a vida da equipe.' },
            { type: 'glasscannon', name: 'Cristal Instável', desc: 'Canaliza energia pura que dobra o poder de ataque, mas fragiliza severamente a integridade física.' },
            { type: 'vampire', name: 'Parasita Simbiótico', desc: 'Um organismo alienígena funde-se ao esquadrão, regenerando todos os ferimentos e ampliando força e vitalidade.' },
            { type: 'tank', name: 'Armadura Juggernaut', desc: 'Reveste o esquadrão com blindagem pesada da Federação: vitalidade colossal, porém torna impossível esquivar.' },
            { type: 'berserker', name: 'Fúria Cega', desc: 'Um surto de adrenalina selvagem eleva a letalidade e os críticos, mas consome metade da vida atual no processo.' },
            { type: 'brain', name: 'Implante Neural', desc: 'Um capacete amplificador dobra o poder mental do Ataque Especial, mas atrofia a força física comum.' },
            { type: 'omega', name: 'Soro do Rick', desc: 'A fórmula secreta da garagem aprimora todos os atributos do esquadrão simultaneamente e restaura a vida por completo.' },
            { type: 'coin_detector', name: 'Detector de Flurbos', desc: 'Um radar sintonizado em metais interdimensionais aumenta permanentemente a coleta de Flurbos nesta jornada.' },
            { type: 'loan', name: 'Empréstimo Galáctico', desc: 'Agiotas do submundo depositam Flurbos imediatos na sua conta, mas drenam metade da sua força de ataque como garantia.' },
            { type: 'revive', name: 'Ressuscitação Clonada', desc: 'Uma bio-restauração em massa: revive todos os aliados caídos e restaura metade da vida de todo o esquadrão.' },
            { type: 'dark_matter', name: 'Soro de Matéria Escura', desc: 'Combustível concentrado que triplica o poder ofensivo e especial, mas deixa todos à beira do colapso vital.' },
            { type: 'microverse', name: 'Bateria do Microverso', desc: 'Sobrecarga dimensional que eleva a esquiva e o crítico a níveis absurdos, mas reduz a vitalidade máxima pela metade.' },
            { type: 'blemflarck', name: 'Ações de Blemflarck', desc: 'Especulação financeira na Cidadela multiplica seus ganhos de Flurbos, mas enfraquece o poder ofensivo da equipe.' },
            { type: 'portal_skip', name: 'Arma de Portal Instável', desc: 'Abre uma fenda que salta o próximo estágio instantaneamente, mas a radiação do portal fere todo o esquadrão.' },
            { type: 'mind_swap', name: 'Mind Blowers', desc: 'Sua percepção de realidade é invertida: seu Ataque vira sua Vida Máxima, e a Vida Máxima vira seu Ataque Base.' },
            { type: 'reflect_mirror', name: 'Espelho Interdimensional', desc: 'Materializa uma superfície quântica que reflete o dano dos próximos ataques.' },
            { type: 'temp_crit', name: 'Óculos de Precisão', desc: 'Calibra a sua visão. Seus próximos ataques atingirão pontos vitais críticos garantidos.' },
            { type: 'temp_lifesteal', name: 'Sanguessuga de Kalaxian', desc: 'Os cristais da sanguessuga drenam a força vital do alvo nos próximos ataques, curando você.' },
            { type: 'temp_absorb', name: 'Absorção Biológica', desc: 'Altera a sua polaridade. Impactos físicos iminentes contra você irão curá-lo em vez de feri-lo.' },
            { type: 'temp_stun', name: 'Granada de Estase', desc: 'Congela o tempo local. O inimigo fica paralisado e indefeso.' },
            { type: 'temp_block', name: 'Escudo de Neutrinos', desc: 'Gera um campo de força absoluto que bloqueia e anula completamente os próximos ataques.' },
            { type: 'temp_execute', name: 'Munição Perfurante', desc: 'Carrega munição letal. Se seus próximos ataques deixarem o inimigo gravemente ferido, ele será obliterado.' },
            { type: 'temp_angel', name: 'Anjo da Guarda', desc: 'Uma bênção divina protege o esquadrão. Se todos caírem em batalha, uma luz restaurará a vida de todos!' },
            { type: 'temp_sleep', name: 'Soro do Sono', desc: 'Induz o oponente a um estado de sonolência extrema, derrubando a força de seus ataques e prevenindo críticos.' },
            { type: 'temp_regen', name: 'Soro Regenerativo', desc: 'Nanobôs médicos aceleram o metabolismo. Durante os próximos 10 segundos, você recupera vida em tempo real!' }
        ];

        // A fonte 'Get Schwifty' não possui glifos acentuados
        const stripAccents = (str) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

        const slimePaths = [
            'M0,0 L220,0 L220,18 C206,18 202,38 192,38 C182,38 180,16 166,16 C152,16 150,52 138,52 C126,52 124,20 110,20 C98,20 96,34 86,34 C76,34 74,14 60,14 C46,14 44,46 32,46 C20,46 18,22 0,22 Z',
            'M0,0 L220,0 L220,24 C204,24 200,48 188,48 C176,48 174,16 158,16 C144,16 142,34 130,34 C118,34 114,14 98,14 C84,14 82,54 70,54 C58,54 56,18 40,18 C26,18 24,38 14,38 C6,38 4,18 0,18 Z',
            'M0,0 L220,0 L220,20 C208,20 204,34 194,34 C184,34 182,14 168,14 C154,14 152,46 140,46 C128,46 126,18 112,18 C98,18 94,50 82,50 C70,50 68,16 52,16 C38,16 36,36 24,36 C12,36 10,16 0,16 Z'
        ];

        const shuffled = buffs.sort(() => 0.5 - Math.random()).slice(0, 3);

        shuffled.forEach((buff, idx) => {
            const card = document.createElement('div');
            card.className = 'buff-card';
            const slimePath = slimePaths[idx % slimePaths.length];

            card.innerHTML = `
                <svg class="buff-slime-top" viewBox="0 0 220 58" preserveAspectRatio="none" aria-hidden="true">
                    <path class="slime-shadow" d="${slimePath}" transform="translate(0, 3)"/>
                    <path class="slime-fill" d="${slimePath}"/>
                </svg>
                <div class="buff-header">
                    <div class="buff-title">${stripAccents(buff.name)}</div>
                    <div class="buff-slime-divider"></div>
                </div>
                <div class="buff-body">
                    <div class="buff-desc">${buff.desc}</div>
                </div>
                <svg class="buff-slime-bottom" viewBox="0 0 220 28" preserveAspectRatio="none" aria-hidden="true">
                    <path class="slime-fill" d="M0,28 L220,28 L220,14 C198,14 192,24 172,24 C152,24 148,10 130,10 C112,10 108,24 88,24 C68,24 64,12 46,12 C28,12 22,22 0,18 Z"/>
                </svg>
            `;

            if (window.App && window.App.tilt) {
                window.App.tilt.attachToCard(card);
            }
            
            card.onclick = () => {
                if (card.classList.contains('selected') || card.classList.contains('sucked')) return;
                
                if (window.App.audio) {
                    window.App.audio.sfxSelect();
                    window.App.audio.sfxPortal();
                }
                
                card.classList.add('selected');
                
                const allCards = buffOptions.querySelectorAll('.buff-card');
                allCards.forEach(c => {
                    c.dataset.tiltDisabled = 'true';
                    if (c !== card) {
                        const rect = c.getBoundingClientRect();
                        const centerX = window.innerWidth / 2;
                        const centerY = window.innerHeight / 2;
                        const cardCenterX = rect.left + rect.width / 2;
                        const cardCenterY = rect.top + rect.height / 2;
                        const moveX = centerX - cardCenterX;
                        const moveY = centerY - cardCenterY;
                        
                        c.style.setProperty('--move-x', `${moveX}px`);
                        c.style.setProperty('--move-y', `${moveY}px`);
                        
                        c.style.transition = 'none';
                        c.classList.add('sucked-vortex');
                    }
                });
                
                setTimeout(() => {
                    engine.applyBuff(buff.type);
                    buffPhase.style.display = 'none';
                    engine.nextStage();
                    this._loadNextStage(engine);
                }, 1000);
            };
            
            buffOptions.appendChild(card);
        });
    },

    _updateBattleUI(engine) {
        const player = engine.getCurrentFighter();
        const enemy = engine.enemy;

        // Só reconstrói o card se o lutador do slot mudou, preservando animações ativas
        const slot1 = document.getElementById('fighter-1-slot');
        if (player && slot1.dataset.fighterId !== String(player.id)) {
            this._renderFighterInSlot(player, slot1, true);
            slot1.dataset.fighterId = player.id;
        }
        
        const slot2 = document.getElementById('fighter-2-slot');
        if (enemy && slot2.dataset.fighterId !== String(enemy.id)) {
            this._renderFighterInSlot(enemy, slot2, false);
            slot2.dataset.fighterId = enemy.id;
        }

        const hp1 = document.getElementById('hp-1');
        const hpText1 = document.getElementById('hp-text-1');
        if (player) {
            const pPct = Math.max(0, (player.hp / player.maxHp) * 100);
            hp1.style.width = pPct + '%';
            hpText1.textContent = `${player.hp}/${player.maxHp}`;
            hp1.style.backgroundColor = pPct < 30 ? 'red' : '#97ce4c';
            
            const colorImg = slot1.querySelector('.card-img-color');
            if (colorImg) {
                const missingHp = 100 - pPct;
                colorImg.style.clipPath = `polygon(0% ${missingHp}%, 100% ${missingHp}%, 100% 100%, 0% 100%)`;
            }
        }

        const hp2 = document.getElementById('hp-2');
        const hpText2 = document.getElementById('hp-text-2');
        if (enemy) {
            const ePct = Math.max(0, (enemy.hp / enemy.maxHp) * 100);
            hp2.style.width = ePct + '%';
            hpText2.textContent = `${enemy.hp}/${enemy.maxHp}`;
            
            const colorImg = slot2.querySelector('.card-img-color');
            if (colorImg) {
                const missingHp = 100 - ePct;
                colorImg.style.clipPath = `polygon(0% ${missingHp}%, 100% ${missingHp}%, 100% 100%, 0% 100%)`;
            }
        }

        const squadListMini = document.getElementById('squad-list-mini');
        squadListMini.innerHTML = '';
        engine.squad.forEach((c, index) => {
            const img = document.createElement('img');
            img.src = c.image;
            img.title = c.hp > 0 ? c.name : `${c.name} (Morto)`;
            img.style.width = '30px';
            img.style.height = '30px';
            img.style.borderRadius = '50%';
            img.style.border = index === engine.currentFighterIndex ? '2px solid var(--accent-color)' : '2px solid #333';
            
            if (c.hp <= 0) {
                img.style.filter = 'grayscale(100%) brightness(30%)';
            }
            squadListMini.appendChild(img);
        });
        
        const btnSpecial = document.getElementById('btn-special');
        if (engine.playerSpecialCooldown > 0) {
            btnSpecial.textContent = `ESPECIAL (${engine.playerSpecialCooldown})`;
            btnSpecial.disabled = true;
        } else {
            btnSpecial.textContent = `ESPECIAL`;
            btnSpecial.disabled = false;
        }

        const badgesContainer = document.querySelector('#fighter-1-slot .buff-badges-container');
        if (badgesContainer && engine.tempEffects) {
            badgesContainer.innerHTML = '';
            const t = engine.tempEffects;
            if (t.stunCharges > 0) badgesContainer.innerHTML += `<div class="buff-badge" title="Gelo / Estase">❄️ ${t.stunCharges}</div>`;
            if (t.absorbCharges > 0) badgesContainer.innerHTML += `<div class="buff-badge" title="Absorção Biológica">💚 ${t.absorbCharges}</div>`;
            if (t.blockCharges > 0) badgesContainer.innerHTML += `<div class="buff-badge" title="Escudo de Neutrinos">🛡️ ${t.blockCharges}</div>`;
            if (t.reflectCharges > 0) badgesContainer.innerHTML += `<div class="buff-badge" title="Reflexão">🪞 ${t.reflectCharges}</div>`;
            if (t.executeCharges > 0) badgesContainer.innerHTML += `<div class="buff-badge" title="Munição Perfurante">🎯 ${t.executeCharges}</div>`;
            if (t.bonusCritCharges > 0) badgesContainer.innerHTML += `<div class="buff-badge" title="Crítico">⚡ ${t.bonusCritCharges}</div>`;
            if (t.lifestealCharges > 0) badgesContainer.innerHTML += `<div class="buff-badge" title="Roubo de Vida">🧛 ${t.lifestealCharges}</div>`;
            if (t.sleepCharges > 0) badgesContainer.innerHTML += `<div class="buff-badge" title="Soro do Sono">💤 ${t.sleepCharges}</div>`;
            if (t.angelCharges > 0) badgesContainer.innerHTML += `<div class="buff-badge" title="Anjo da Guarda">👼 ${t.angelCharges}</div>`;
        }
    },

    // Injetado no slot (e não no card, que tem overflow: hidden)
    _showSleepEffect(slotId) {
        const slot = document.getElementById(slotId);
        if (!slot) return;
        const previous = slot.querySelector('.zzz-effect');
        if (previous) previous.remove();

        const zzz = document.createElement('div');
        zzz.className = 'zzz-effect';
        zzz.textContent = 'Zzz';
        slot.appendChild(zzz);
        setTimeout(() => zzz.remove(), 2000);
    },

    _renderFighterInSlot(character, slotElement, isPlayer) {
        if (!character) return;
        slotElement.classList.add('fighter-slot', 'has-fighter'); 
        slotElement.innerHTML = '';
        
        const card = document.createElement('article');
        card.classList.add('character-card');
        card.style.pointerEvents = 'none'; 
        
        if (!isPlayer) {
            card.style.boxShadow = '0 0 20px rgba(244, 67, 54, 0.15)';
        } else {
            card.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.1)';
        }
        
        const imgContainer = document.createElement('div');
        imgContainer.classList.add('card-img-container');
        imgContainer.style.position = 'relative';
        imgContainer.innerHTML = `
            <img src="${character.image}" class="card-img-bw" style="width: 100%; height: 100%; object-fit: cover; position: absolute; top: 0; left: 0; filter: grayscale(100%); z-index: 1;">
            <img src="${character.image}" class="card-img-color" style="width: 100%; height: 100%; object-fit: cover; position: relative; z-index: 2; transition: clip-path 0.5s ease;">
        `;
        
        const info = document.createElement('div');
        info.classList.add('card-info');
        
        info.innerHTML = `
            <h3 class="card-name" style="text-align: center; color: ${isPlayer ? 'var(--accent-color)' : 'var(--danger-color)'};">${character.name}</h3>
            <div class="card-stats-compact" style="justify-content: center; font-size: 0.8rem; flex-wrap: wrap;">
                ATK: ${character.baseAttack} | ESP: ${character.specialAttack}
            </div>
            <div class="card-stats-compact" style="justify-content: center; font-size: 0.8rem; flex-wrap: wrap;">
                CRIT: ${character.critChance}% | ESQ: ${character.dodgeChance}%
            </div>
        `;
        
        card.appendChild(imgContainer);
        card.appendChild(info);
        
        const badgesContainer = document.createElement('div');
        badgesContainer.classList.add('buff-badges-container');
        badgesContainer.style.position = 'absolute';
        badgesContainer.style.top = '10px';
        badgesContainer.style.right = '10px';
        badgesContainer.style.display = 'flex';
        badgesContainer.style.flexDirection = 'column';
        badgesContainer.style.gap = '5px';
        badgesContainer.style.zIndex = '50';
        card.appendChild(badgesContainer);

        slotElement.appendChild(card);
    },

    _logMessage(msg) {
        const log = document.getElementById('arena-log');
        log.innerHTML = msg;
    },

    _animateAction(attackerId) {
        const slot1 = document.getElementById('fighter-1-slot');
        const slot2 = document.getElementById('fighter-2-slot');
        
        slot1.classList.remove('clash-anim-left', 'shake');
        slot2.classList.remove('clash-anim-right', 'shake');
        
        void slot1.offsetWidth;
        void slot2.offsetWidth;

        if (attackerId === 1) {
            slot1.classList.add('clash-anim-left');
            setTimeout(() => slot2.classList.add('shake'), 200);
        } else {
            slot2.classList.add('clash-anim-right');
            setTimeout(() => slot1.classList.add('shake'), 200);
        }
        
        setTimeout(() => {
            slot1.classList.remove('clash-anim-left', 'shake');
            slot2.classList.remove('clash-anim-right', 'shake');
        }, 500);
    },

    _applyVisualEffects(result, defenderId) {
        if (!result) return;
        
        let targetSlotId = defenderId === 1 ? 'fighter-1-slot' : 'fighter-2-slot';
        let attackerSlotId = defenderId === 1 ? 'fighter-2-slot' : 'fighter-1-slot';
        
        let slotToFlash = result.reflected ? attackerSlotId : targetSlotId;

        const slot = document.getElementById(slotToFlash);
        const cardInside = slot ? slot.querySelector('.character-card') : null;
        if (!cardInside) return;

        const applyFlash = (colorClass) => {
            cardInside.classList.add(colorClass);
            setTimeout(() => cardInside.classList.remove(colorClass), 600);
        };

        if (result.reflected && window.App.audio && window.App.audio.playMedia) {
            window.App.audio.playMedia('espelho.mp3', 0.9);
        }

        setTimeout(() => {
            if (result.reflected) applyFlash('combat-effect-blue');
            else if (result.absorbed) applyFlash('combat-effect-green');
            else if (result.blocked) {
                applyFlash('combat-effect-blue');
                if (window.App.audio && window.App.audio.playMedia) {
                    window.App.audio.playMedia('metal.mp3', 0.7);
                }
                const metalOverlay = document.createElement('div');
                metalOverlay.classList.add('metal-overlay', 'active');
                cardInside.appendChild(metalOverlay);
                setTimeout(() => metalOverlay.remove(), 1000);
            }
            else if (result.executed) applyFlash('combat-effect-red');
            else if (result.crit) applyFlash('combat-effect-yellow');

            if (result.healed) {
                if (window.App.audio) {
                    window.App.audio.playTone(400, 'sine', 0.15, 0.1);
                    setTimeout(() => window.App.audio.playTone(600, 'sine', 0.25, 0.1), 150);
                }
                let healedSlotId = result.absorbed ? targetSlotId : attackerSlotId;
                let hpBarId = healedSlotId === 'fighter-1-slot' ? 'hp-1' : 'hp-2';
                const hpBar = document.getElementById(hpBarId);
                if (hpBar) {
                    hpBar.style.boxShadow = '0 0 20px #4caf50';
                    setTimeout(() => { hpBar.style.boxShadow = 'none'; }, 600);
                }
            }
        }, 200);
    },

    initSpaceshipEasterEgg(delayMs = 300000) {
        window.App.triggerShip = () => {
            this.initSpaceshipEasterEgg(100);
        };

        setTimeout(() => {
            const shipContainer = document.createElement('div');
            const shipImg = document.createElement('img');
            const audio = new Audio('./assets/media/nave.mp3');
            audio.volume = 0.25;
            
            shipImg.src = './assets/media/nave.png';
            shipImg.draggable = false;
            shipImg.style.width = window.innerWidth <= 768 ? '140px' : '200px';
            shipImg.style.filter = 'drop-shadow(0 20px 20px rgba(0,0,0,0.8))';
            shipImg.style.userSelect = 'none';
            shipImg.style.webkitUserSelect = 'none';
            shipImg.style.webkitUserDrag = 'none';
            shipImg.style.webkitTouchCallout = 'none';
            shipImg.style.webkitTapHighlightColor = 'transparent';
            shipImg.style.outline = 'none';
            shipImg.classList.add('ship-hover-anim');

            // Evita seleção azul e arraste fantasma da imagem ao clicar repetidamente
            shipImg.addEventListener('mousedown', (e) => e.preventDefault());
            shipImg.addEventListener('dragstart', (e) => e.preventDefault());
            shipImg.addEventListener('selectstart', (e) => e.preventDefault());
            shipImg.addEventListener('contextmenu', (e) => e.preventDefault());
            
            shipContainer.style.position = 'fixed';
            shipContainer.style.zIndex = '999999';
            shipContainer.style.top = '-250px';
            shipContainer.style.left = '-250px';
            shipContainer.style.cursor = 'pointer';
            shipContainer.style.userSelect = 'none';
            shipContainer.style.webkitUserSelect = 'none';
            shipContainer.style.webkitTapHighlightColor = 'transparent';
            shipContainer.style.outline = 'none';
            shipContainer.style.transition = 'all cubic-bezier(0.25, 1, 0.5, 1)';
            
            shipContainer.appendChild(shipImg);
            document.body.appendChild(shipContainer);
            
            let clickCount = 0;
            const maxClicks = 10;
            
            const flyAway = () => {
                if (shipContainer.dataset.leaving) return;
                shipContainer.dataset.leaving = 'true';
                shipContainer.style.transitionDuration = '1.5s'; 
                shipContainer.style.transitionTimingFunction = 'ease-in';
                shipContainer.style.top = '-300px'; 
                shipContainer.style.left = '100vw'; 
                setTimeout(() => shipContainer.remove(), 1500);
            };
            
            shipImg.addEventListener('click', (e) => {
                e.stopPropagation();
                if (clickCount < maxClicks) {
                    clickCount++;
                    window.App.state.addFlurbos(1);
                    if (window.App.ui && window.App.ui.initEconomyUI) {
                        window.App.ui.initEconomyUI();
                    }
                    
                    const plusOne = document.createElement('div');
                    plusOne.innerHTML = '<img src="./assets/media/filecoin.png" style="width:14px;height:14px;margin-right:4px;vertical-align:middle;">+1';
                    plusOne.style.position = 'fixed';
                    plusOne.style.left = `${e.clientX + 10}px`;
                    plusOne.style.top = `${e.clientY - 20}px`;
                    plusOne.style.color = '#97ce4c';
                    plusOne.style.fontWeight = 'bold';
                    plusOne.style.fontSize = '1.2rem';
                    plusOne.style.fontFamily = "'Geist Mono', monospace";
                    plusOne.style.textShadow = '0 0 5px #000';
                    plusOne.style.zIndex = '9999999';
                    plusOne.style.pointerEvents = 'none';
                    plusOne.style.transition = 'all 0.8s ease-out';
                    document.body.appendChild(plusOne);
                    
                    setTimeout(() => {
                        plusOne.style.top = `${e.clientY - 70}px`;
                        plusOne.style.opacity = '0';
                    }, 50);
                    setTimeout(() => plusOne.remove(), 800);
                    
                    shipImg.style.filter = 'drop-shadow(0 0 20px #97ce4c)';
                    setTimeout(() => {
                        shipImg.style.filter = 'drop-shadow(0 20px 20px rgba(0,0,0,0.8))';
                    }, 200);
                    
                    if (clickCount === maxClicks) {
                        setTimeout(flyAway, 400);
                    }
                }
            });
            
            audio.addEventListener('loadedmetadata', () => {
                const duration = audio.duration || 4;
                shipContainer.style.transitionDuration = `${duration}s`;
                
                audio.play().catch(e => console.log("Áudio bloqueado:", e));
                
                setTimeout(() => {
                    shipContainer.style.top = 'calc(100vh - 220px)';
                    shipContainer.style.left = 'calc(100vw - 250px)';
                }, 100);
                
                setTimeout(() => {
                    if (shipContainer.dataset.leaving) return;
                    setTimeout(() => {
                        flyAway();
                    }, 2000);
                }, duration * 1000);
            });
            
            audio.addEventListener('error', () => {
                shipContainer.style.transitionDuration = '4s';
                setTimeout(() => {
                    shipContainer.style.top = 'calc(100vh - 220px)';
                    shipContainer.style.left = 'calc(100vw - 250px)';
                    setTimeout(() => flyAway(), 6000);
                }, 100);
            });

        }, delayMs);
    }
};
