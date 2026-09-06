/* =============================================
   nav-enhance.js — Этап 6: навигация
   Фильтр сайдбара + палитра команд (Ctrl/Cmd+K).
   Только навигационная оболочка: палео-логику
   и рендеры модулей не затрагивает.
   ============================================= */
(function () {
  'use strict';

  var INDEX = [];
  var pal = null, listEl = null, inpEl = null;
  var flat = [], sel = -1, opener = null;

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  /* ---- индекс навигации из DOM ---- */
  function collectItems() {
    var out = [];
    document.querySelectorAll('a.sidebar-item').forEach(function (a) {
      var secEl = a.closest('.sidebar-section');
      var sec = '';
      if (secEl) {
        var h = secEl.querySelector('.sidebar-section-header span:not(.toggle-icon)');
        if (h) sec = h.textContent.trim();
      }
      out.push({
        el: a,
        title: a.textContent.replace(/\s+/g, ' ').trim(),
        id: a.getAttribute('data-module') || '',
        hash: a.getAttribute('href'),
        section: sec
      });
    });
    return out;
  }

  /* ---- фильтр сайдбара ---- */
  function applyFilter(qRaw) {
    var q = qRaw.trim().toLowerCase();
    INDEX.forEach(function (it) {
      var hay = (it.title + ' ' + it.id + ' ' + it.section).toLowerCase();
      it.el.style.display = (!q || hay.indexOf(q) > -1) ? '' : 'none';
    });
    document.querySelectorAll('.sidebar-section').forEach(function (sec) {
      var any = false;
      sec.querySelectorAll('.sidebar-item').forEach(function (i) {
        if (i.style.display !== 'none') any = true;
      });
      sec.style.display = any ? '' : 'none';
    });
  }

  function installFilter() {
    var items = document.querySelector('.lab-sidebar .sidebar-items');
    if (!items || document.getElementById('labNavFilter')) return;
    var box = document.createElement('div');
    box.className = 'lab-nav-filter';
    var inp = document.createElement('input');
    inp.type = 'search';
    inp.id = 'labNavFilter';
    inp.placeholder = 'Поиск по разделам…';
    inp.setAttribute('aria-label', 'Фильтр навигации');
    inp.addEventListener('input', function () { applyFilter(this.value); });
    box.appendChild(inp);
    items.insertBefore(box, items.firstChild);
  }

  /* ---- палитра команд ---- */
  function ensurePalette() {
    if (pal) return;
    pal = document.createElement('div');
    pal.className = 'lab-palette-backdrop';
    pal.style.display = 'none';
    pal.innerHTML =
      '<div class="lab-palette" role="dialog" aria-modal="true" aria-label="Быстрая навигация">' +
      '<input type="text" aria-label="Поиск по разделам" autocomplete="off" spellcheck="false">' +
      '<div class="lab-palette-list" role="listbox"></div>' +
      '</div>';
    document.body.appendChild(pal);
    inpEl = pal.querySelector('input');
    listEl = pal.querySelector('.lab-palette-list');

    pal.addEventListener('mousedown', function (e) {
      if (e.target === pal) closePalette();
    });
    inpEl.addEventListener('input', render);
    inpEl.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        move(e.key === 'ArrowDown' ? 1 : -1);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        go(sel);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closePalette();
      }
    });
  }

  function render() {
    var q = inpEl.value.trim().toLowerCase();
    flat = INDEX.filter(function (it) {
      if (!q) return true;
      return (it.title + ' ' + it.id + ' ' + it.section).toLowerCase().indexOf(q) > -1;
    }).slice(0, 25);
    sel = flat.length ? 0 : -1;
    listEl.innerHTML = '';
    flat.forEach(function (it, i) {
      var d = document.createElement('div');
      d.className = 'lab-palette-item';
      d.setAttribute('role', 'option');
      d.setAttribute('aria-selected', i === sel ? 'true' : 'false');
      d.innerHTML = '<span>' + esc(it.title) + '</span>' +
        (it.section ? '<kbd>' + esc(it.section) + '</kbd>' : '');
      d.addEventListener('click', function () { go(i); });
      d.addEventListener('mousemove', function () { if (sel !== i) { sel = i; paint(); } });
      listEl.appendChild(d);
    });
    if (!flat.length) {
      var empty = document.createElement('div');
      empty.className = 'lab-palette-empty';
      empty.textContent = 'Ничего не найдено';
      listEl.appendChild(empty);
    } else {
      paint();
    }
  }

  function paint() {
    listEl.querySelectorAll('.lab-palette-item').forEach(function (n, i) {
      n.setAttribute('aria-selected', i === sel ? 'true' : 'false');
    });
    var s = listEl.querySelector('[aria-selected="true"]');
    if (s && s.scrollIntoView) s.scrollIntoView({ block: 'nearest' });
  }

  function move(d) {
    if (!flat.length) return;
    sel = (sel + d + flat.length) % flat.length;
    paint();
  }

  function go(i) {
    if (i < 0 || !flat[i]) return;
    var hash = flat[i].hash;
    closePalette();
    if (location.hash !== hash) location.hash = hash;
    if (window.LabSidebar && typeof LabSidebar.close === 'function') LabSidebar.close();
  }

  function openPalette() {
    ensurePalette();
    opener = document.activeElement;
    pal.style.display = 'block';
    inpEl.value = '';
    render();
    setTimeout(function () { inpEl.focus(); }, 0);
  }

  function closePalette() {
    if (!pal || pal.style.display === 'none') return;
    pal.style.display = 'none';
    if (opener && typeof opener.focus === 'function') {
      try { opener.focus(); } catch (e) { /* нода исчезла */ }
    }
  }

  /* ---- глобальные клавиши и мост мёртвого хедер-поиска ---- */
  function installKeys() {
    window.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K' || e.code === 'KeyK')) {
        e.preventDefault();
        openPalette();
      } else if (e.key === 'Escape' && pal && pal.style.display !== 'none') {
        /* Этап 6: Escape гасит палитру независимо от того, где фокус */
        closePalette();
      }
    }, true);

    var gs = document.getElementById('globalSearch');
    if (!gs) return;
    var gi = gs.querySelector('input');
    if (gi) {
      gi.readOnly = true;
      gi.tabIndex = -1;
      gi.removeAttribute('oninput');
      gi.removeAttribute('onkeydown');
    }
    gs.addEventListener('click', function (e) {
      e.preventDefault();
      openPalette();
    });
  }

  /* ===== Иконки: используются пиксельные PNG из assets/icons/32 =====
     (инлайн-SVG замена убрана — сайдбар показывает PNG из папки icons/32). */

  function init() {
    if (!document.querySelector('.lab-sidebar')) return;
    INDEX = collectItems();
    installFilter();
    installKeys();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

      /* ===== Хлебные крошки удалены (Этап 7) =====
         Крошки «Главная / <Текущий>» больше не рендерятся —
         навигация идёт через единую шапку модуля. */
  window.LabNav = { openPalette: openPalette, closePalette: closePalette };
})();
