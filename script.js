document.addEventListener('DOMContentLoaded', () => {
    // ===== DOM-ELEMENTE =====
    const elements = {
        // Audio-Steuerung
        audio: document.getElementById('audio'),
        playPauseBtn: document.getElementById('playPauseBtn'),
        volumeSlider: document.getElementById('volumeSlider'),
        volumePercent: document.getElementById('volumePercent'),
        muteBtn: document.getElementById('muteBtn'),
        nowPlaying: document.getElementById('nowPlaying'),

        // Favoriten
        favoritesList: document.getElementById('favoritesList'),
        newFavoriteUrl: document.getElementById('newFavoriteUrl'),
        newFavoriteName: document.getElementById('newFavoriteName'),
        addFavoriteBtn: document.getElementById('addFavorite'),

        // Spiele
        gameMenuBtn: document.getElementById('gameMenuBtn'),
        gameMenu: document.querySelector('.game-menu')
    };

    // ===== AUDIO-STEUERUNG =====
    const audioControl = {
        init() {
            // Initiale Werte setzen
            elements.audio.volume = 0.01;
            elements.volumeSlider.value = 0.01;
            elements.volumePercent.textContent = "1%";
            elements.nowPlaying.textContent = "sweden.mp3";

            // Event-Listener hinzufügen
            elements.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
            elements.volumeSlider.addEventListener('input', () => this.updateVolume());
            elements.muteBtn.addEventListener('click', () => this.toggleMute());

            // Autoplay versuchen
            this.tryAutoplay();
        },

        tryAutoplay() {
            // Audio zunächst stumm schalten für Autoplay
            elements.audio.muted = true;
            const playPromise = elements.audio.play();

            if (playPromise !== undefined) {
                playPromise.then(() => {
                    // Erfolg: Stummschaltung aufheben
                    setTimeout(() => {
                        elements.audio.muted = false;
                        elements.playPauseBtn.textContent = '❚❚';
                    }, 300);
                }).catch(error => {
                    // Bei Fehler: Play-Button hervorheben
                    this.showPlayPrompt();
                });
            }
        },

        showPlayPrompt() {
            // Visuelles Feedback für notwendige Interaktion
            elements.playPauseBtn.classList.add('pulse');

            const startOnInteraction = () => {
                document.body.removeEventListener('click', startOnInteraction);
                elements.audio.muted = false;
                elements.audio.play()
                    .then(() => {
                        elements.playPauseBtn.textContent = '❚❚';
                        elements.playPauseBtn.classList.remove('pulse');
                    });
            };

            document.body.addEventListener('click', startOnInteraction);
        },

        togglePlayPause() {
            if (elements.audio.paused) {
                elements.audio.play()
                    .then(() => {
                        elements.playPauseBtn.textContent = '❚❚';
                    })
                    .catch(error => {
                        console.error("Playback failed:", error);
                    });
            } else {
                elements.audio.pause();
                elements.playPauseBtn.textContent = '▶';
            }
        },

        updateVolume() {
            elements.audio.volume = elements.volumeSlider.value;
            elements.volumePercent.textContent = `${Math.round(elements.audio.volume * 100)}%`;

            // Visuelles Feedback bei Lautstärke
            if (elements.audio.volume > 0.5) {
                elements.volumePercent.style.color = '#4CAF50'; // Grün
            } else if (elements.audio.volume > 0.1) {
                elements.volumePercent.style.color = '#FFC107'; // Gelb
            } else {
                elements.volumePercent.style.color = '#FF5252'; // Rot
            }
        },

        toggleMute() {
            const isMuted = elements.audio.volume === 0;

            if (isMuted) {
                // Stummschaltung aufheben
                elements.audio.volume = parseFloat(elements.volumeSlider.value);
                elements.muteBtn.textContent = '🔊';
                elements.muteBtn.classList.remove('muted');
            } else {
                // Stummschalten
                elements.volumeSlider.value = elements.audio.volume;
                elements.audio.volume = 0;
                elements.muteBtn.textContent = '🔇';
                elements.muteBtn.classList.add('muted');
            }

            elements.volumePercent.style.color = isMuted ? 'white' : '#ff4d4d';
        }
    };

    // ===== FAVORITEN-MANAGER =====
    const favorites = {
        init() {
            this.load();
            this.setupEventListeners();
        },

        setupEventListeners() {
            elements.addFavoriteBtn.addEventListener('click', () => this.add());

            // Enter-Taste für Formular
            [elements.newFavoriteUrl, elements.newFavoriteName].forEach(input => {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') this.add();
                });
            });

            // Löschen von Favoriten
            elements.favoritesList.addEventListener('click', (e) => {
                if (e.target.closest('.delete-favorite')) {
                    const item = e.target.closest('.favorite-item');
                    this.delete(parseInt(item.dataset.id));
                }
            });
        },

        async load() {
            const saved = JSON.parse(localStorage.getItem('favorites')) || [];

            // Favoritenliste erstellen
            const favoritesHTML = await Promise.all(
                saved.map(async (fav, index) => this.createFavoriteItem(fav, index))
            ).then(items => items.join(''));

            elements.favoritesList.innerHTML = favoritesHTML;
        },

        async createFavoriteItem(fav, index) {
            try {
                const url = new URL(fav.url);
                const favicon = `https://www.google.com/s2/favicons?domain=${url.hostname}`;

                return `
                    <div class="favorite-item" data-id="${index}">
                        <img class="favicon" src="${favicon}" alt="" onerror="this.style.display='none'">
                        <a href="${fav.url}" class="favorite-link" target="_blank" rel="noopener">
                            ${fav.name || url.hostname}
                        </a>
                        <button class="delete-favorite" aria-label="Entfernen" title="Favorit entfernen">
                            <svg viewBox="0 0 24 24" width="16" height="16">
                                <path stroke="currentColor" stroke-width="2" d="M18 6L6 18M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>
                `;
            } catch {
                return ''; // Bei ungültiger URL nichts anzeigen
            }
        },

        add() {
            try {
                const urlInput = elements.newFavoriteUrl.value.trim();
                const nameInput = elements.newFavoriteName.value.trim();

                if (!urlInput) {
                    alert('Bitte eine URL eingeben');
                    return;
                }

                // URL validieren
                const url = new URL(urlInput.includes('://') ? urlInput : `https://${urlInput}`);
                const name = nameInput || url.hostname.replace('www.', '');

                // Existierende Favoriten laden
                const saved = JSON.parse(localStorage.getItem('favorites')) || [];

                // Überprüfen ob bereits vorhanden
                if (!saved.some(fav => fav.url === url.href)) {
                    saved.push({ name, url: url.href });
                    localStorage.setItem('favorites', JSON.stringify(saved));

                    // UI aktualisieren
                    this.load();
                    elements.newFavoriteUrl.value = '';
                    elements.newFavoriteName.value = '';

                    // Visuelles Feedback
                    elements.addFavoriteBtn.classList.add('success');
                    setTimeout(() => {
                        elements.addFavoriteBtn.classList.remove('success');
                    }, 1000);
                } else {
                    alert('Diese Website ist bereits in deinen Favoriten!');
                }
            } catch (error) {
                alert('Bitte eine gültige URL eingeben (z.B. "beispiel.de" oder "https://beispiel.de")');
                console.error("Fehler beim Hinzufügen des Favoriten:", error);
            }
        },

        delete(index) {
            const saved = JSON.parse(localStorage.getItem('favorites'));
            if (saved && saved[index]) {
                saved.splice(index, 1);
                localStorage.setItem('favorites', JSON.stringify(saved));
                this.load();
            }
        }
    };

    // ===== SPIELE-MENÜ =====
    const gameMenu = {
        init() {
            this.setupMenuToggle();
            this.setupGameButtons();
        },

        setupMenuToggle() {
            // Menü-Toggle
            elements.gameMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                elements.gameMenu.classList.toggle('hidden');
            });

            // Klick außerhalb schließt Menü
            document.addEventListener('click', () => {
                elements.gameMenu.classList.add('hidden');
            });

            // Menü selbst soll nicht schließen bei Klick
            elements.gameMenu.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        },

        setupGameButtons() {
            document.querySelectorAll('.game-option').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.startGame(e.target.closest('.game-option').dataset.game);
                    elements.gameMenu.classList.add('hidden');
                });
            });
        },

        startGame(game) {
            const gameWindows = {
                snake: {
                    width: 440,
                    height: 520,
                    title: "Snake Spiel"
                },
                tictactoe: {
                    width: 440,
                    height: 550,
                    title: "Tic-Tac-Toe"
                },
                connect4: {
                    width: 500,
                    height: 550,
                    title: "Vier Gewinnt"
                }
            };

            const { width, height, title } = gameWindows[game];
            const left = (screen.width - width) / 2;
            const top = (screen.height - height) / 2;

            // Spiel in neuem Fenster öffnen
            const gameWindow = window.open(
                `games/${game}.html`,
                title,
                `width=${width},height=${height},left=${left},top=${top},resizable=yes`
            );

            // Fokus auf das neue Fenster
            if (gameWindow) {
                gameWindow.focus();
            } else {
                alert('Pop-up wurde blockiert. Bitte erlauben Sie Pop-ups für diese Website.');
            }
        }
    };

    // ===== INITIALISIERUNG =====
    const init = () => {
        audioControl.init();
        favorites.init();
        gameMenu.init();

        // UI langsam einblenden für bessere UX
        setTimeout(() => {
            document.querySelectorAll('.audio-controls, .favorites-bar').forEach(el => {
                el.style.opacity = '1';
            });
        }, 100);
    };

    init();
});