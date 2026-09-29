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

/* ============================================================
   ТЕМА (auto / light / dark)
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
   ПАНЕЛИ (About / Project / Settings / Favorites)
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

function toggleFavorite(id, btnEl) {
    const lang = getLang();
    let favs = getFavorites();
    const wasFav = favs.includes(id);

    if (wasFav) {
        favs = favs.filter(x => x !== id);
        showToast(
            lang === 'ru' ? 'Удалено из избранного' : 'Removed from favorites',
            '💔'
        );
    } else {
        favs.push(id);
        if (btnEl) {
            btnEl.classList.add('just-clicked');
            setTimeout(() => btnEl.classList.remove('just-clicked'), 500);
        }
        showToast(
            lang === 'ru' ? 'Добавлено в избранное' : 'Added to favorites',
            '❤️'
        );
    }

    setFavorites(favs);
    updateBadge();
    applyFavStateOnPosters();
    if (typeof updateFavButtonLabel === 'function') updateFavButtonLabel();
}

/* ============================================================
   ТУЛТИПЫ для иконок в навбаре
   ============================================================ */
function updateNavTooltips() {
    const lang = getLang();

    const tooltips = {
        searchNavBtn: lang === 'ru' ? 'Поиск' : 'Search',
        favoritesBtn: lang === 'ru' ? 'Избранное' : 'Favorites',
        settingsBtn: lang === 'ru' ? 'Настройки' : 'Settings',
        menuToggle:   lang === 'ru' ? 'Меню' : 'Menu'
    };

    Object.keys(tooltips).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.setAttribute('data-tooltip', tooltips[id]);
    });
}

/* ============================================================
   NAV SEARCH — поиск в навбаре (работает на всех страницах)
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

    /* ---------- Обновление высоты навбара ---------- */
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
   ИНИЦИАЛИЗАЦИЯ — вызывается на каждой странице
   ============================================================ */
function initCommon() {
    /* Тема */
    applyTheme();
    document.querySelectorAll('#themeToggle .lang-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            localStorage.setItem(STORAGE.theme, btn.getAttribute('data-theme'));
            applyTheme();
        });
    });

    /* Язык */
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

    /* Размер шрифта */
    applyFontSize(localStorage.getItem(STORAGE.fontSize) || 'normal');
    document.querySelectorAll('#fontSizeToggle .size-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const size = btn.getAttribute('data-size');
            localStorage.setItem(STORAGE.fontSize, size);
            applyFontSize(size);
        });
    });

    /* Плотность */
    applyDensity(localStorage.getItem(STORAGE.density) || 'normal');
    document.querySelectorAll('#densityToggle .density-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const density = btn.getAttribute('data-density');
            localStorage.setItem(STORAGE.density, density);
            applyDensity(density);
        });
    });

    /* Авто-анимация */
    const autowaveSwitch = document.getElementById('autowaveSwitch');
    if (autowaveSwitch) {
        autowaveSwitch.checked = localStorage.getItem(STORAGE.autowave) !== 'off';
        autowaveSwitch.addEventListener('change', () => {
            localStorage.setItem(STORAGE.autowave, autowaveSwitch.checked ? 'on' : 'off');
        });
    }

    /* Бургер-меню */
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

    /* Кнопки в навигации: избранное / настройки */
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

    /* Ссылки на About / Project в меню */
    const aboutLink = document.getElementById('aboutLink');
    if (aboutLink) {
        aboutLink.addEventListener('click', (e) => {
            e.preventDefault();
            openPanel('aboutPanel', 'aboutOverlay');
        });
    }
    const projectLink = document.getElementById('projectLink');
    if (projectLink) {
        projectLink.addEventListener('click', (e) => {
            e.preventDefault();
            openPanel('projectPanel', 'projectOverlay');
        });
    }

    /* Кнопки закрытия панелей */
    const panelBindings = [
        ['aboutClose', 'aboutPanel', 'aboutOverlay'],
        ['projectClose', 'projectPanel', 'projectOverlay'],
        ['settingsClose', 'settingsPanel', 'settingsOverlay'],
        ['favoritesClose', 'favoritesPanel', 'favoritesOverlay']
    ];

    panelBindings.forEach(([closeId, panelId, overlayId]) => {
        const closeBtn = document.getElementById(closeId);
        const overlay = document.getElementById(overlayId);
        if (closeBtn) closeBtn.addEventListener('click', () => closePanel(panelId, overlayId));
        if (overlay) overlay.addEventListener('click', () => closePanel(panelId, overlayId));
    });

    /* Esc закрывает всё */
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeAllPanels();
    });

    /* Кнопки избранного на постерах */
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

    /* Back to top */
    const backToTop = document.getElementById('backToTop');
    if (backToTop) {
        const toggleBackToTop = () => {
            backToTop.classList.toggle('visible', window.scrollY > 400);
        };
        window.addEventListener('scroll', toggleBackToTop, { passive: true });
        toggleBackToTop();
        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    /* Cross-tab sync */
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

    /* Поиск в навбаре */
    initNavSearch();

    /* Тултипы для иконок */
    updateNavTooltips();
}

document.addEventListener('DOMContentLoaded', initCommon);