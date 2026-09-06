// web/app.js — Golem Web Interface v11.0 (модульная архитектура)

(function() {
    'use strict';

    // Загрузка модулей
    const GolemState = window.GolemState;
    const GolemAPI = window.GolemAPI;
    const GolemUI = window.GolemUI;
    const GolemParser = window.GolemParser;

    if (!GolemState || !GolemAPI || !GolemUI || !GolemParser) {
        console.error('Ошибка: не все модули загружены');
        return;
    }

    const IS_LOCAL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    // Инициализация
    GolemState.loadFromStorage();
    GolemUI.setFontSize(GolemState.state.fontSize);

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    function openFile(p) {
        GolemState.state.currentPath = p;
        
        if (GolemUI.isMobile()) {
            const filePage = document.getElementById('file-page');
            const filePathHint = document.getElementById('file-path-hint');
            const bm = document.getElementById('file-bookmark-btn');
            const isBm = GolemState.isBookmarked(p);
            
            filePage.style.display = 'block';
            filePathHint.textContent = p;
            bm.textContent = isBm ? '★' : '☆';
            bm.className = 'bookmark-btn' + (isBm ? ' active' : '');
            bm.onclick = function() { toggleBookmark(p); };
            document.getElementById('mobile-list-view').style.display = 'none';
            document.getElementById('stats-mobile').style.display = 'none';
        } else {
            const c = document.getElementById('content');
            c.classList.remove('fade-in');
            c.innerHTML = '<div class="spinner"></div>';
        }
        
        GolemAPI.loadFile(p, function(md) {
            const isBm = GolemState.isBookmarked(p);
            const file = GolemState.state.FILES.find(function(x) { return x.path === p; });
            const iconHtml = (file && file.icon && file.icon !== 'scrolls.png')
                ? '<img src="assets/icons/32/' + file.icon + '" class="content-icon" alt="" style="width:28px;height:28px;vertical-align:middle;margin-right:10px;">'
                : '';
            
            if (GolemUI.isMobile()) {
                const c = document.getElementById('file-content-mobile');
                c.innerHTML = GolemParser.parseMD(md, iconHtml) + GolemUI.renderRelatedMobile(p);
            } else {
                const c = document.getElementById('content');
                c.innerHTML = '<div id="breadcrumbs">' + GolemUI.renderBreadcrumbs(p) + '</div>' +
                    '<div class="path-hint">' + GolemUI.esc(p) + ' <span class="bookmark-btn' + (isBm ? ' active' : '') +
                    '" onclick="toggleBookmark(\'' + p.replace(/'/g, "\\'") + '\')">' + (isBm ? '★' : '☆') + '</span></div>' +
                    GolemParser.parseMD(md, iconHtml) + GolemUI.renderRelated(p);
                GolemState.addToHistory(p);
                GolemUI.buildTOC(md);
                GolemUI.setupQuoteCopy();
                void c.offsetWidth;
                c.classList.add('fade-in');
            }
            GolemState.addToHistory(p);
        }, function() { 
            const errorHtml = '<div style="color:#c0392b;padding:40px;">Ошибка: ' + GolemUI.esc(p) + '</div>';
            if (GolemUI.isMobile()) {
                document.getElementById('file-content-mobile').innerHTML = errorHtml;
            } else {
                document.getElementById('content').innerHTML = errorHtml;
            }
        });
    }

    function toggleBookmark(p) {
        if (!p) return;
        GolemState.toggleBookmark(p);
        if (GolemUI.isMobile()) {
            const bm = document.getElementById('file-bookmark-btn');
            const isBm = GolemState.isBookmarked(p);
            bm.textContent = isBm ? '★' : '☆';
            bm.className = 'bookmark-btn' + (isBm ? ' active' : '');
        } else {
            openFile(p);
        }
    }

    function randomFile() {
        if (!GolemState.state.FILES.length) return;
        GolemUI.closeBurger();
        const p = GolemState.state.FILES[Math.floor(Math.random() * GolemState.state.FILES.length)].path;
        openFile(p);
    }

    function copyCurrentLink() {
        if (!GolemState.state.currentPath) return;
        const u = window.location.origin + (IS_LOCAL ? '/api/file?path=' : '/') + encodeURIComponent(GolemState.state.currentPath);
        navigator.clipboard.writeText(u).then(GolemUI.showToast);
    }

    // Обработчик ресайза
    let lastWidth = window.innerWidth;
    window.addEventListener('resize', function() {
        const w = window.innerWidth;
        if ((lastWidth <= 768) !== (w <= 768)) {
            lastWidth = w;
            if (GolemState.state.FILES.length) {
                GolemUI.render();
            }
        } else {
            lastWidth = w;
        }
    });

    // Инициализация
    GolemUI.setFontSize(GolemState.state.fontSize);
    window.addEventListener('scroll', GolemUI.updateProgressBar);
    window.addEventListener('scroll', function() {
        const bt = document.getElementById('back-to-top'); 
        if (bt) bt.style.display = window.scrollY > 400 ? 'flex' : 'none';
    });

    document.addEventListener('keydown', function(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
        const m = GolemUI.isMobile();
        if (e.key === '/') { 
            const s = m ? document.getElementById('search-mobile') : document.getElementById('search'); 
            if (s) s.focus(); 
            e.preventDefault(); 
        }
        if (e.key === 'Escape') { 
            if (m && GolemState.state.currentPath) GolemUI.closeFile(); 
            else { 
                const s2 = m ? document.getElementById('search-mobile') : document.getElementById('search'); 
                if (s2) s2.blur(); 
            } 
        }
        if (e.key === 'b' && GolemState.state.currentPath) toggleBookmark(GolemState.state.currentPath);
        if (e.key === 'r') randomFile();
    });

    // Экспорт функций в window для HTML обработчиков
    window.toggleBurger = GolemUI.toggleBurger;
    window.closeBurger = GolemUI.closeBurger;
    window.randomFile = randomFile;
    window.copyCurrentLink = copyCurrentLink;
    window.toggleBookmark = toggleBookmark;
    window.closeFile = GolemUI.closeFile;
    window.render = GolemUI.render;
    window.setFontSize = GolemUI.setFontSize;
    window.openFile = openFile;

    // Загрузка данных
    GolemAPI.scanFiles(function(data) {
        GolemState.state.FILES = data;
        GolemUI.buildSelects();
        
        // Debounce для поиска
        const searchInput = document.getElementById('search');
        const searchMobile = document.getElementById('search-mobile');
        if (searchInput) {
            searchInput.addEventListener('input', debounce(function() {
                GolemState.state.filteredCache = null;
                GolemUI.render();
            }, 300));
        }
        if (searchMobile) {
            searchMobile.addEventListener('input', debounce(function() {
                GolemState.state.filteredCache = null;
                GolemUI.render();
            }, 300));
        }
        
        GolemUI.render();
    
        // Open file from hash
        const hash = window.location.hash;
        if (hash && hash.indexOf('#open=') === 0) {
            const filePath = decodeURIComponent(hash.substring(6));
            setTimeout(function() {
                openFile(filePath);
            }, 100);
        }
    }, function(e) {
        console.error(e.message);
        const el = GolemUI.isMobile() ? document.getElementById('mobile-list-view') : document.getElementById('file-list');
        if (el) {
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = 'padding:20px;color:#c0392b;';
            errorDiv.textContent = 'Ошибка загрузки';
            el.innerHTML = '';
            el.appendChild(errorDiv);
        }
    });

    // Глобальный обработчик ошибок
    window.addEventListener('error', function(e) {
        console.error('Глобальная ошибка:', e.error);
    });

    window.addEventListener('unhandledrejection', function(e) {
        console.error('Необработанный Promise rejection:', e.reason);
    });

})();
