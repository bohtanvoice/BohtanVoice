/* ============================================================
   app.js — общая логика BohtanVoice
   Работает на всех страницах: index.html, video1.html, samples.html
   ============================================================ */

/* ---------- Ключи localStorage ---------- */
const STORAGE = {
    theme: 'bv_theme',
    lang: 'bv_lang',
    favorites: 'bv_favorites',
    fontSize: 'bv_fontsize',
    density: 'bv_density',
    autowave: 'bv_autowave'
};

/* ---------- Системная тема ---------- */
const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)');

/* ---------- SVG сердечка (для анимаций) ---------- */
const HEART_SVG = `
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
    </svg>
`;

/* ============================================================
   ТЕМА
   ============================================================ */
function getSavedTheme() {
    return localStorage.getItem(STORAGE.theme) || 'auto';
}

function applyTheme() {
    const saved = getSavedTheme();
    let effective;

    if (saved === 'auto') {
        effective = systemPrefersDark.matches ? 'dark' : 'light';
    } else {
        effective = saved;
    }

    const isDark = effective === 'dark';
    document.documentElement.classList.toggle('light-theme', !isDark);

    document.querySelectorAll('#themeToggle .lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-theme') === saved);
    });

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', isDark ? '#0b0c10' : '#f4f6f7');
}

systemPrefersDark.addEventListener('change', () => {
    if (getSavedTheme() === 'auto') applyTheme();
});

/* ============================================================
   ЯЗЫК
   ============================================================ */
function getLang() {
    return localStorage.getItem(STORAGE.lang) || 'en';
}

function applyLanguage(lang) {
    document.querySelectorAll('[data-en]').forEach(el => {
        el.innerHTML = lang === 'ru'
            ? el.getAttribute('data-ru')
            : el.getAttribute('data-en');
    });

    document.querySelectorAll('[data-en-placeholder]').forEach(el => {
        el.placeholder = lang === 'ru'
            ? el.getAttribute('data-ru-placeholder')
            : el.getAttribute('data-en-placeholder');
    });

    const langEnBtn = document.getElementById('langEn');
    const langRuBtn = document.getElementById('langRu');
    if (langEnBtn) langEnBtn.classList.toggle('active', lang === 'en');
    if (langRuBtn) langRuBtn.classList.toggle('active', lang === 'ru');

    document.documentElement.lang = lang;

    if (typeof renderFavorites === 'function') renderFavorites();
    if (typeof updateFavButtonLabel === 'function') updateFavButtonLabel();
    if (typeof renderNavSearchResults === 'function') renderNavSearchResults();
    if (typeof updateNavTooltips === 'function') updateNavTooltips();
}

/* ============================================================
   РАЗМЕР ШРИФТА
   ============================================================ */
function applyFontSize(size) {
    document.documentElement.classList.remove('font-small', 'font-large');
    if (size === 'small') document.documentElement.classList.add('font-small');
    if (size === 'large') document.documentElement.classList.add('font-large');

    document.querySelectorAll('#fontSizeToggle .size-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-size') === size);
    });
}

/* ============================================================
   ПЛОТНОСТЬ
   ============================================================ */
function applyDensity(density) {
    document.documentElement.classList.remove('density-compact', 'density-comfortable');
    if (density === 'compact') document.documentElement.classList.add('density-compact');
    if (density === 'comfortable') document.documentElement.classList.add('density-comfortable');

    document.querySelectorAll('#densityToggle .density-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-density') === density);
    });
}

/* ============================================================
   ТОСТ
   ============================================================ */
let toastTimer;
function showToast(text, icon = '✓', duration = 2200) {
    const toastEl = document.getElementById('toast');
    const toastIcon = document.getElementById('toastIcon');
    const toastText = document.getElementById('toastText');
    if (!toastEl) return;

    if (toastIcon) toastIcon.textContent = icon;
    if (toastText) toastText.textContent = text;

    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), duration);
}

/* ============================================================
   ПАНЕЛИ
   ============================================================ */
function openPanel(panelId, overlayId) {
    const panel = document.getElementById(panelId);
    const overlay = document.getElementById(overlayId);
    if (!panel || !overlay) return;

    panel.classList.add('open');
    overlay.classList.add('open');
    document.body.classList.add('panel-open');
}

function closePanel(panelId, overlayId) {
    const panel = document.getElementById(panelId);
    const overlay = document.getElementById(overlayId);
    if (!panel || !overlay) return;

    panel.classList.remove('open');
    overlay.classList.remove('open');
    setTimeout(() => {
        if (!document.querySelector('.about-panel.open')) {
            document.body.classList.remove('panel-open');
        }
    }, 50);
}

function closeAllPanels() {
    document.querySelectorAll('.about-panel.open').forEach(p => p.classList.remove('open'));
    document.querySelectorAll('.about-overlay.open').forEach(o => o.classList.remove('open'));
    document.body.classList.remove('panel-open');
}

/* ============================================================
   ИЗБРАННОЕ
   ============================================================ */
function getFavorites() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE.favorites)) || [];
    } catch {
        return [];
    }
}

function setFavorites(list) {
    localStorage.setItem(STORAGE.favorites, JSON.stringify(list));
}

function updateBadge() {
    const favs = getFavorites();
    const favBadge = document.getElementById('favBadge');
    const favoritesBtn = document.getElementById('favoritesBtn');
    if (!favBadge) return;

    if (favs.length > 0) {
        favBadge.textContent = favs.length;
        favBadge.classList.add('visible');
        if (favoritesBtn) favoritesBtn.classList.add('has-items');
    } else {
        favBadge.classList.remove('visible');
        if (favoritesBtn) favoritesBtn.classList.remove('has-items');
    }
}

function applyFavStateOnPosters() {
    const favs = getFavorites();
    document.querySelectorAll('.fav-toggle').forEach(btn => {
        const id = btn.getAttribute('data-fav-id');
        btn.classList.toggle('is-fav', favs.includes(id));
    });
}

function renderFavorites() {
    const favList = document.getElementById('favList');
    const favEmpty = document.getElementById('favEmpty');
    if (!favList || !favEmpty) return;

    const favs = getFavorites();
    const lang = getLang();
    favList.innerHTML = '';

    if (favs.length === 0) {
        favEmpty.style.display = 'block';
        return;
    }
    favEmpty.style.display = 'none';

    favs.forEach(id => {
        const vid = (typeof getVideoById === 'function') ? getVideoById(id) : null;
        if (!vid) return;

        const title = getVideoTitle(vid, lang);

        const li = document.createElement('li');
        li.innerHTML = `
            <a href="${vid.url}" class="fav-item">
                <img class="fav-item-thumb" src="${vid.poster}" alt="">
                <span class="fav-item-title">${title}</span>
                <button class="fav-item-remove" data-remove-id="${id}" aria-label="Remove">&times;</button>
            </a>
        `;
        favList.appendChild(li);
    });

    favList.querySelectorAll('.fav-item-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const id = btn.getAttribute('data-remove-id');
            const lang = getLang();
            let favs = getFavorites();
            favs = favs.filter(x => x !== id);
            setFavorites(favs);

            breakHeart(btn);

            const favItem = btn.closest('.fav-item');
            if (favItem) {
                favItem.classList.add('card-removed');
                setTimeout(() => favItem.classList.remove('card-removed'), 550);
            }

            updateBadge();
            applyFavStateOnPosters();
            renderFavorites();
            showToast(
                lang === 'ru' ? 'Удалено из избранного' : 'Removed from favorites',
                '💔'
            );
        });
    });
}

/* ============================================================
   FLY-TO-FAVORITE
   ============================================================ */
function flyHeartToNav(fromEl, onArrive) {
    const navHeart = document.getElementById('favoritesBtn');
    if (!navHeart) {
        if (typeof onArrive === 'function') onArrive();
        return;
    }

    const fromRect = fromEl.getBoundingClientRect();
    const toRect = navHeart.getBoundingClientRect();

    const startX = fromRect.left + fromRect.width / 2 - 14;
    const startY = fromRect.top + fromRect.height / 2 - 14;
    const endX = toRect.left + toRect.width / 2 - 14;
    const endY = toRect.top + toRect.height / 2 - 14;

    const heart = document.createElement('div');
    heart.className = 'fly-heart';
    heart.innerHTML = HEART_SVG;
    heart.style.left = startX + 'px';
    heart.style.top = startY + 'px';
    document.body.appendChild(heart);

    const midX = (startX + endX) / 2;
    const midY = Math.min(startY, endY) - 80;

    const anim = heart.animate([
        {
            transform: 'translate(0, 0) scale(0.8)',
            opacity: 1
        },
        {
            transform: `translate(${(midX - startX) * 0.6}px, ${(midY - startY) * 0.8}px) scale(1.3)`,
            opacity: 1,
            offset: 0.5
        },
        {
            transform: `translate(${endX - startX}px, ${endY - startY}px) scale(0.5)`,
            opacity: 0.7
        }
    ], {
        duration: 750,
        easing: 'cubic-bezier(0.4, 0, 0.6, 1)',
        fill: 'forwards'
    });

    anim.onfinish = () => {
        heart.remove();

        navHeart.classList.add('got-heart');
        setTimeout(() => navHeart.classList.remove('got-heart'), 500);

        const badge = document.getElementById('favBadge');
        if (badge) {
            badge.classList.add('bounce');
            setTimeout(() => badge.classList.remove('bounce'), 450);
        }

        if (typeof onArrive === 'function') onArrive();
    };
}

/* ============================================================
   BREAK-HEART
   ============================================================ */
function breakHeart(fromEl) {
    if (!fromEl) return;

    const rect = fromEl.getBoundingClientRect();
    const startX = rect.left + rect.width / 2 - 16;
    const startY = rect.top + rect.height / 2 - 16;

    const wrap = document.createElement('div');
    wrap.className = 'broken-heart';
    wrap.style.left = startX + 'px';
    wrap.style.top = startY + 'px';

    const left = document.createElement('div');
    left.className = 'broken-heart-half left';
    left.innerHTML = HEART_SVG;

    const right = document.createElement('div');
    right.className = 'broken-heart-half right';
    right.innerHTML = HEART_SVG;

    wrap.appendChild(left);
    wrap.appendChild(right);
    document.body.appendChild(wrap);

    setTimeout(() => wrap.remove(), 1000);
}

/* ============================================================
   TOGGLE FAVORITE
   ============================================================ */
function toggleFavorite(id, btnEl) {
    const lang = getLang();
    let favs = getFavorites();
    const wasFav = favs.includes(id);

    if (wasFav) {
        favs = favs.filter(x => x !== id);
        setFavorites(favs);

        if (btnEl) {
            breakHeart(btnEl);

            const card = btnEl.closest('.poster-card');
            if (card) {
                card.classList.add('card-removed');
                setTimeout(() => card.classList.remove('card-removed'), 550);
            } else {
                btnEl.classList.add('btn-removed');
                setTimeout(() => btnEl.classList.remove('btn-removed'), 550);
            }
        }

        updateBadge();
        applyFavStateOnPosters();
        if (typeof updateFavButtonLabel === 'function') updateFavButtonLabel();

        showToast(
            lang === 'ru' ? 'Удалено из избранного' : 'Removed from favorites',
            '💔'
        );
    } else {
        favs.push(id);
        setFavorites(favs);

        if (btnEl) {
            btnEl.classList.add('just-clicked');
            setTimeout(() => btnEl.classList.remove('just-clicked'), 500);

            const card = btnEl.closest('.poster-card');
            if (card) {
                card.classList.add('card-added');
                setTimeout(() => card.classList.remove('card-added'), 550);
            } else {
                btnEl.classList.add('btn-added');
                setTimeout(() => btnEl.classList.remove('btn-added'), 550);
            }

            flyHeartToNav(btnEl, () => {
                updateBadge();
                applyFavStateOnPosters();
                if (typeof updateFavButtonLabel === 'function') updateFavButtonLabel();
            });
        } else {
            updateBadge();
            applyFavStateOnPosters();
            if (typeof updateFavButtonLabel === 'function') updateFavButtonLabel();
        }

        showToast(
            lang === 'ru' ? 'Добавлено в избранное' : 'Added to favorites',
            '❤️'
        );
    }
}

/* ============================================================
   ТУЛТИПЫ
   ============================================================ */
function updateNavTooltips() {
    const lang = getLang();

    const tooltips = {
        searchNavBtn: lang === 'ru' ? 'Поиск' : 'Search',
        favoritesBtn: lang === 'ru' ? 'Избранное' : 'Favorites',
        settingsBtn: lang === 'ru' ? 'Настройки' : 'Settings',
        menuToggle:   lang === 'ru' ? 'Меню' : 'Menu',
        sharePageBtn: lang === 'ru' ? 'Поделиться' : 'Share',
        backToTop:    lang === 'ru' ? 'Наверх' : 'Top'
    };

    Object.keys(tooltips).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.setAttribute('data-tooltip', tooltips[id]);
    });
}

/* ============================================================
   NAV SEARCH
   ============================================================ */
function renderNavSearchResults() {
    const resultsBox = document.getElementById('navSearchResults');
    const searchInput = document.getElementById('navSearchInput');
    if (!resultsBox || !searchInput) return;

    const q = searchInput.value.trim().toLowerCase();
    resultsBox.innerHTML = '';

    if (q === '') {
        resultsBox.classList.remove('open');
        return;
    }

    const matches = ALL_VIDEOS.filter(v => {
        const hay = `${v.titleEn} ${v.titleRu} ${v.searchEn || ''} ${v.searchRu || ''}`.toLowerCase();
        return hay.includes(q);
    });

    const lang = getLang();

    if (matches.length === 0) {
        resultsBox.innerHTML = `<div class="nav-search-no-results">${
            lang === 'ru' ? 'Ничего не найдено' : 'Nothing found'
        }</div>`;
        resultsBox.classList.add('open');
        return;
    }

    matches.forEach(v => {
        const a = document.createElement('a');
        a.href = v.url;
        a.className = 'nav-search-result';
        a.innerHTML = `
            <img src="${v.poster}" alt="">
            <span class="nav-search-result-title">${getVideoTitle(v, lang)}</span>
        `;
        resultsBox.appendChild(a);
    });

    resultsBox.classList.add('open');
}

function initNavSearch() {
    const searchBtn = document.getElementById('searchNavBtn');
    const searchWrap = document.getElementById('navSearchWrap');
    const searchInput = document.getElementById('navSearchInput');
    const searchClear = document.getElementById('navSearchClear');
    const resultsBox = document.getElementById('navSearchResults');

    if (!searchBtn || !searchWrap || !searchInput) return;

    function updateNavHeight() {
        const nav = document.querySelector('nav');
        if (!nav) return;
        const h = nav.offsetHeight;
        document.documentElement.style.setProperty('--nav-height', h + 'px');
    }

    updateNavHeight();
    window.addEventListener('resize', updateNavHeight);
    window.addEventListener('orientationchange', () => setTimeout(updateNavHeight, 100));

    function openSearch() {
        searchWrap.classList.add('open');
        searchBtn.classList.add('active');
        setTimeout(() => searchInput.focus(), 250);
    }

    function closeSearch() {
        searchWrap.classList.remove('open');
        searchBtn.classList.remove('active');
        searchInput.value = '';
        if (searchClear) searchClear.classList.remove('visible');
        if (resultsBox) {
            resultsBox.classList.remove('open');
            resultsBox.innerHTML = '';
        }
    }

    function toggleSearch() {
        if (searchWrap.classList.contains('open')) closeSearch();
        else openSearch();
    }

    searchBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const menuToggle = document.getElementById('menuToggle');
        const navLinks = document.getElementById('navLinks');
        if (menuToggle) menuToggle.classList.remove('open');
        if (navLinks) navLinks.classList.remove('open');
        closeAllPanels();
        toggleSearch();
    });

    searchInput.addEventListener('input', () => {
        const q = searchInput.value;
        if (searchClear) searchClear.classList.toggle('visible', q !== '');
        renderNavSearchResults();
    });

    if (searchClear) {
        searchClear.addEventListener('click', () => {
            searchInput.value = '';
            searchClear.classList.remove('visible');
            renderNavSearchResults();
            searchInput.focus();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && searchWrap.classList.contains('open')) {
            closeSearch();
        }
    });

    document.addEventListener('click', (e) => {
        if (!searchWrap.classList.contains('open')) return;
        if (searchWrap.contains(e.target)) return;
        if (searchBtn.contains(e.target)) return;
        closeSearch();
    });
}

/* ============================================================
   FLOATING ACTIONS
   ============================================================ */
function initFloatingActions() {
    const actionsWrap = document.getElementById('floatingActions');
    const backBtn = document.getElementById('backToTop');
    const shareBtn = document.getElementById('sharePageBtn');
    if (!actionsWrap) return;

    function toggleVisible() {
        actionsWrap.classList.toggle('visible', window.scrollY > 300);
    }

    window.addEventListener('scroll', toggleVisible, { passive: true });
    toggleVisible();

    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    if (shareBtn) {
        shareBtn.addEventListener('click', async () => {
            const lang = getLang();
            const shareData = {
                title: document.title,
                text: lang === 'ru'
                    ? 'BohtanVoice — озвучка на диалекте Bohtan'
                    : 'BohtanVoice — voiceover in the Bohtan dialect',
                url: window.location.href
            };

            if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
                try { await navigator.share(shareData); } catch (err) {}
            } else {
                try {
                    await navigator.clipboard.writeText(window.location.href);
                    showToast(
                        lang === 'ru' ? 'Ссылка скопирована' : 'Link copied',
                        '✓'
                    );
                } catch {
                    prompt(lang === 'ru' ? 'Скопируйте ссылку:' : 'Copy the link:', window.location.href);
                }
            }
        });
    }
}

/* ============================================================
   PROGRESS BAR
   ============================================================ */
function initScrollProgress() {
    const bar = document.getElementById('scrollProgress');
    if (!bar) return;

    function update() {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        bar.style.width = pct + '%';
    }

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
}

/* ============================================================
   CLICK RIPPLE
   ============================================================ */
function initRippleEffect() {
    const selectors = [
        '.action-btn',
        '.icon-btn',
        '.lang-btn',
        '.floating-btn',
        '.fav-item',
        '.nav-links a',
        '.video-tab-btn'
    ];

    const elements = document.querySelectorAll(selectors.join(','));

    elements.forEach(el => {
        el.classList.add('ripple-host');
        el.addEventListener('click', (e) => {
            const rect = el.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            const ripple = document.createElement('span');
            ripple.className = 'ripple';
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';

            el.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        });
    });
}

/* ============================================================
   VIDEO TABS
   ============================================================ */
function initVideoTabs() {
    const tabsContainer = document.getElementById('videoTabs');
    if (!tabsContainer) return;

    const videoId = (typeof CURRENT_VIDEO_ID !== 'undefined') ? CURRENT_VIDEO_ID : null;
    const video = (videoId && typeof getVideoById === 'function') ? getVideoById(videoId) : null;

    const trailerPane = document.getElementById('videoPaneTrailer');
    const fullMoviePane = document.getElementById('videoPaneFull');
    const tabBtns = tabsContainer.querySelectorAll('.video-tab-btn');

    if (video) {
        if (video.trailer && trailerPane) {
            trailerPane.innerHTML = `<iframe src="${video.trailer}" allowfullscreen allow="autoplay; fullscreen"></iframe>`;
        }
        if (video.fullMovie && fullMoviePane) {
            fullMoviePane.innerHTML = `<iframe src="${video.fullMovie}" allowfullscreen allow="autoplay; fullscreen"></iframe>`;
        }
    }

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');

            tabBtns.forEach(b => b.classList.toggle('active', b === btn));

            document.querySelectorAll('.video-tab-pane').forEach(pane => {
                pane.classList.toggle('active', pane.getAttribute('data-tab') === targetTab);
            });
        });
    });
}

/* ============================================================
   CONFETTI
   ============================================================ */
function initEasterEgg() {
    const heroTitle = document.getElementById('heroTitle');
    if (!heroTitle) return;

    let clickCount = 0;
    let clickTimer = null;
    let confettiRunning = false;

    heroTitle.addEventListener('click', () => {
        if (confettiRunning) return;

        clickCount++;

        clearTimeout(clickTimer);
        clickTimer = setTimeout(() => {
            clickCount = 0;
        }, 2000);

        if (clickCount >= 5) {
            clickCount = 0;
            clearTimeout(clickTimer);
            launchConfetti();
        }
    });

    function launchConfetti() {
        confettiRunning = true;

        const rect = heroTitle.getBoundingClientRect();
        const originX = rect.left + rect.width / 2;
        const originY = rect.top + rect.height / 2;

        const pieces = 90;
        const shapes = ['circle', 'square', 'long', ''];

        for (let i = 0; i < pieces; i++) {
            const angle = (Math.PI * 2 * i) / pieces + (Math.random() - 0.5) * 0.4;
            const distance = 250 + Math.random() * 450;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance + 150 + Math.random() * 200;
            const rot = (Math.random() - 0.5) * 900;
            const scale = 0.4 + Math.random() * 1.0;
            const delay = Math.random() * 250;

            const piece = document.createElement('div');
            const shape = shapes[Math.floor(Math.random() * shapes.length)];
            piece.className = 'confetti-piece' + (shape ? ' ' + shape : '');

            piece.style.left = originX + 'px';
            piece.style.top = originY + 'px';

            piece.style.setProperty('--tx', tx + 'px');
            piece.style.setProperty('--ty', ty + 'px');
            piece.style.setProperty('--rot', rot + 'deg');
            piece.style.setProperty('--scale', scale);

            const hue = 170 + Math.random() * 20;
            piece.style.backgroundColor = `hsl(${hue}, 90%, ${60 + Math.random() * 15}%)`;

            document.body.appendChild(piece);

            setTimeout(() => {
                piece.style.animation = `confettiFly ${2000 + Math.random() * 1200}ms cubic-bezier(0.15, 0.7, 0.35, 1) forwards`;
            }, delay);

            setTimeout(() => piece.remove(), 3500 + delay);
        }

        const lang = getLang();
        setTimeout(() => {
            showToast(
                lang === 'ru' ? '🎉 Секрет найден!' : '🎉 Secret found!',
                '✨',
                2500
            );
        }, 400);

        setTimeout(() => {
            confettiRunning = false;
        }, 3500);
    }
}

/* ============================================================
   ИНИЦИАЛИЗАЦИЯ
   ============================================================ */
function initCommon() {
    applyTheme();
    document.querySelectorAll('#themeToggle .lang-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            localStorage.setItem(STORAGE.theme, btn.getAttribute('data-theme'));
            applyTheme();
        });
    });

    applyLanguage(getLang());
    const langEnBtn = document.getElementById('langEn');
    const langRuBtn = document.getElementById('langRu');
    if (langEnBtn) langEnBtn.addEventListener('click', () => {
        localStorage.setItem(STORAGE.lang, 'en');
        applyLanguage('en');
    });
    if (langRuBtn) langRuBtn.addEventListener('click', () => {
        localStorage.setItem(STORAGE.lang, 'ru');
        applyLanguage('ru');
    });

    applyFontSize(localStorage.getItem(STORAGE.fontSize) || 'normal');
    document.querySelectorAll('#fontSizeToggle .size-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const size = btn.getAttribute('data-size');
            localStorage.setItem(STORAGE.fontSize, size);
            applyFontSize(size);
        });
    });

    applyDensity(localStorage.getItem(STORAGE.density) || 'normal');
    document.querySelectorAll('#densityToggle .density-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const density = btn.getAttribute('data-density');
            localStorage.setItem(STORAGE.density, density);
            applyDensity(density);
        });
    });

    const autowaveSwitch = document.getElementById('autowaveSwitch');
    if (autowaveSwitch) {
        autowaveSwitch.checked = localStorage.getItem(STORAGE.autowave) !== 'off';
        autowaveSwitch.addEventListener('change', () => {
            localStorage.setItem(STORAGE.autowave, autowaveSwitch.checked ? 'on' : 'off');
        });
    }

    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('open');
            navLinks.classList.toggle('open');
        });

        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                menuToggle.classList.remove('open');
                navLinks.classList.remove('open');
            });
        });
    }

    const favoritesBtn = document.getElementById('favoritesBtn');
    if (favoritesBtn) {
        favoritesBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (menuToggle) menuToggle.classList.remove('open');
            if (navLinks) navLinks.classList.remove('open');
            renderFavorites();
            openPanel('favoritesPanel', 'favoritesOverlay');
        });
    }

    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (menuToggle) menuToggle.classList.remove('open');
            if (navLinks) navLinks.classList.remove('open');
            openPanel('settingsPanel', 'settingsOverlay');
        });
    }

    /* Ссылки на About / Dialect в меню */
    const aboutLink = document.getElementById('aboutLink');
    if (aboutLink) {
        aboutLink.addEventListener('click', (e) => {
            e.preventDefault();
            openPanel('aboutPanel', 'aboutOverlay');
        });
    }
    const dialectLink = document.getElementById('dialectLink');
    if (dialectLink) {
        dialectLink.addEventListener('click', (e) => {
            e.preventDefault();
            openPanel('dialectPanel', 'dialectOverlay');
        });
    }

    /* Ссылка на «Контакты» — плавная прокрутка */
    const contactsLink = document.getElementById('contactsLink');
    if (contactsLink) {
        contactsLink.addEventListener('click', (e) => {
            e.preventDefault();
            const contactsSection = document.getElementById('contacts');
            if (contactsSection) {
                if (menuToggle) menuToggle.classList.remove('open');
                if (navLinks) navLinks.classList.remove('open');
                contactsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }

    const panelBindings = [
        ['aboutClose', 'aboutPanel', 'aboutOverlay'],
        ['dialectClose', 'dialectPanel', 'dialectOverlay'],
        ['settingsClose', 'settingsPanel', 'settingsOverlay'],
        ['favoritesClose', 'favoritesPanel', 'favoritesOverlay']
    ];

    panelBindings.forEach(([closeId, panelId, overlayId]) => {
        const closeBtn = document.getElementById(closeId);
        const overlay = document.getElementById(overlayId);
        if (closeBtn) closeBtn.addEventListener('click', () => closePanel(panelId, overlayId));
        if (overlay) overlay.addEventListener('click', () => closePanel(panelId, overlayId));
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeAllPanels();
    });

    document.querySelectorAll('.fav-toggle').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite(btn.getAttribute('data-fav-id'), btn);
        });
    });

    updateBadge();
    applyFavStateOnPosters();
    renderFavorites();

    initFloatingActions();
    initScrollProgress();
    initRippleEffect();
    initVideoTabs();
    initEasterEgg();

    window.addEventListener('storage', (e) => {
        if (e.key === STORAGE.theme) applyTheme();
        if (e.key === STORAGE.lang) applyLanguage(e.newValue || 'en');
        if (e.key === STORAGE.favorites) {
            updateBadge();
            applyFavStateOnPosters();
            renderFavorites();
        }
        if (e.key === STORAGE.fontSize) applyFontSize(e.newValue || 'normal');
        if (e.key === STORAGE.density) applyDensity(e.newValue || 'normal');
        if (e.key === STORAGE.autowave) {
            const sw = document.getElementById('autowaveSwitch');
            if (sw) sw.checked = e.newValue !== 'off';
        }
    });

    initNavSearch();
    updateNavTooltips();
}

document.addEventListener('DOMContentLoaded', initCommon);