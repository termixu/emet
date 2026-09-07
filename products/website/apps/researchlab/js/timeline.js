/**
 * timeline.js — Палео-таймлайн (каталог контейнеров)
 *
 * Каждый таймлайн — отдельный белый контейнер с палео-иконкой,
 * названием, чипом количества событий и кнопкой.
 * Внутри — компактная горизонтальная лента событий.
 */

const Timeline = (function() {
  'use strict';

  var timelineItems = [];
  var timelineContainer = null;

  function escapeHtml(text) {
    var d = document.createElement('div');
    d.textContent = text == null ? '' : String(text);
    return d.innerHTML;
  }

  function init(container, parsed) {
    if (!container) return;

    timelineContainer = container;

    // Шапку модуля рисует LabHero (единственная шапка, как во всех модулях лаба).
    // Собственный hero удалён: он дублировал H1 «Каталог таймлайнов».
    container.innerHTML =
      '<div class="tl-spinner show"><div class="loader"></div><div class="spinner-text">Загрузка таймлайнов…</div></div>';

    // Загружаем данные
    fetch('data/timeline.json')
      .then(function(r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function(timelines) {
        timelineItems = Array.isArray(timelines) ? timelines : [];
        // Deep-link: #timeline/<id> открывает детальный экран сразу.
        var detailId = parsed && parsed.segments && parsed.segments[1];
        if (detailId && timelineItems.some(function(t) { return t.id === detailId; })) {
          renderDetail(detailId);
        } else {
          renderCatalog(container, timelineItems);
        }
      })
      .catch(function(err) {
        var spinner = container.querySelector('.tl-spinner');
        if (spinner) spinner.remove();
        container.innerHTML += '<div class="lab-alert lab-alert-error">Ошибка загрузки таймлайнов: ' + escapeHtml(err.message) + '</div>';
      });
  }

  function renderCatalog(container, timelines) {
    // Возврат к базовой шапке модуля (например, по кнопке «назад» из детального экрана).
    // Override сбрасываем: applyModuleHero после applyRoute не должен подставлять
    // заголовок закрытого детального экрана.
    container._labHeroOverride = null;
    if (!timelines || !timelines.length) {
      container.innerHTML = '<div class="lab-alert lab-alert-info">Таймлайны пока не добавлены.</div>';
      if (window.LabHero && window.LabHero.setView) {
        window.LabHero.setView('timeline', null, (window.LabHero.views && window.LabHero.views.timeline) || {});
      }
      return;
    }

    // ROADMAP SCALE: горизонтальная шкала всех таймлайнов (Linear Roadmap pattern)
    var roadmapHtml = '<div class="tl-roadmap" role="list" aria-label="Шкала таймлайнов">' +
      timelines.map(function(tl, idx) {
        var count = tl.events ? tl.events.length : 0;
        var activeClass = idx === 0 ? ' active' : '';
        return '<div class="tl-roadmap-segment' + activeClass + '" data-tl-id="' + escapeHtml(tl.id) + '" role="listitem" tabindex="0" aria-label="' + escapeHtml(tl.title) + '" style="--tl-index:' + idx + '">' +
          '<div class="tl-roadmap-bar"><div class="tl-roadmap-bar-fill" style="width:' + Math.min(100, count * 20) + '%"></div></div>' +
          '<span class="tl-roadmap-label">' + escapeHtml(tl.title) + '</span>' +
          '<span class="tl-roadmap-count">' + count + '</span>' +
        '</div>';
      }).join('') +
    '</div>';

    // FILTER CHIPS: сегментный фильтр (все + количество)
    var totalEvents = timelines.reduce(function(sum, tl) { return sum + (tl.events ? tl.events.length : 0); }, 0);
    var filtersHtml = '<div class="tl-filters" role="tablist" aria-label="Фильтры таймлайнов">' +
      '<button class="tl-filter-chip active" data-filter="all" role="tab" aria-selected="true">Все<span class="chip-count">' + timelines.length + '</span></button>' +
      '<button class="tl-filter-chip" data-filter="ancient" role="tab" aria-selected="false">Древность<span class="chip-count">' + countByEra(timelines, 'ancient') + '</span></button>' +
      '<button class="tl-filter-chip" data-filter="modern" role="tab" aria-selected="false">Современность<span class="chip-count">' + countByEra(timelines, 'modern') + '</span></button>' +
    '</div>';

    var catalogHtml = timelines.map(function(tl) {
      var count = tl.events ? tl.events.length : 0;

      var events = tl.events || [];
      var visibleEvents = events.slice(0, 3);
      var hiddenEvents = events.slice(3);
      var eventMarkup = function(ev, hidden) {
          return '' +
            '<div class="timeline-event-row' + (hidden ? ' event-card-hidden' : '') + '"' + (hidden ? ' hidden' : '') + '>' +
              '<span class="timeline-date">' + escapeHtml(ev.date) + '</span>' +
              '<span class="timeline-title">' + escapeHtml(ev.title) + '</span>' +
            '</div>';
      };
      var eventsHtml = visibleEvents.map(function(ev) { return eventMarkup(ev, false); }).join('') +
        hiddenEvents.map(function(ev) { return eventMarkup(ev, true); }).join('');
      var moreHtml = hiddenEvents.length
        ? '<button class="tl-show-all" type="button" aria-expanded="false">… показать все (ещё ' + hiddenEvents.length + ')</button>'
        : '';

      return '' +
        '<article class="tl-container" data-timeline-id="' + escapeHtml(tl.id) + '" tabindex="0" role="button" aria-label="Открыть таймлайн: ' + escapeHtml(tl.title) + '">' +
          '<div class="tl-container-header">' +
            '<div class="tl-header-left">' +
              '<span class="tl-container-icon" lang="hbo" aria-hidden="true">' + escapeHtml(tl.paleoIcon) + '</span>' +
              '<h2 class="tl-container-title">' + escapeHtml(tl.title) + '</h2>' +
            '</div>' +
            '<div class="tl-header-right">' +
              '<span class="tl-container-chip">• ' + count + ' ' + pluralize(count, 'событие', 'события', 'событий') + '</span>' +
            '</div>' +
          '</div>' +
          '<p class="tl-container-description">' + escapeHtml(tl.description || '') + '</p>' +
          '<div class="tl-event-list">' +
            eventsHtml +
          '</div>' +
          moreHtml +
          '<div class="tl-container-footer">' +
            '<span class="tl-container-meta">Хронология</span>' +
            '<button class="tl-container-btn" type="button" title="Открыть таймлайн">→ Открыть</button>' +
          '</div>' +
        '</article>';
    }).join('');

    // Шапку рисует LabHero — ПОСЛЕ innerHTML: присвоение container.innerHTML
    // стирает секцию .lab-hero, и вызов setView до него терялся (hero
    // пересоздавался scan-ом из базового конфига каталога).
    container.innerHTML = roadmapHtml + filtersHtml + '<div class="tl-catalog">' + catalogHtml + '</div>';
    if (window.LabHero && window.LabHero.setView) {
      window.LabHero.setView('timeline', null, (window.LabHero.views && window.LabHero.views.timeline) || {});
    }

    // Обработчики roadmap segments
    var segments = container.querySelectorAll('.tl-roadmap-segment');
    segments.forEach(function(seg) {
      seg.addEventListener('click', function() {
        var tlId = seg.getAttribute('data-tl-id');
        if (tlId) location.hash = '#timeline/' + tlId;
      });
      seg.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          var tlId = seg.getAttribute('data-tl-id');
          if (tlId) location.hash = '#timeline/' + tlId;
        }
      });
    });

    // Обработчики filter chips
    var chips = container.querySelectorAll('.tl-filter-chip');
    chips.forEach(function(chip) {
      chip.addEventListener('click', function() {
        chips.forEach(function(c) { c.classList.remove('active'); c.setAttribute('aria-selected', 'false'); });
        chip.classList.add('active');
        chip.setAttribute('aria-selected', 'true');
        var filter = chip.getAttribute('data-filter');
        applyFilter(container, timelines, filter);
      });
    });
  }

  function countByEra(timelines, era) {
    // Простая эвристика: ancient = содержит даты до н.э. или древние названия
    var ancientIds = ['timeline-writing', 'shin-history', 'alphabet-history', 'root-path'];
    var modernIds = ['timeline-digital', 'seven-states', 'word-history'];
    var ids = era === 'ancient' ? ancientIds : modernIds;
    return timelines.filter(function(tl) { return ids.indexOf(tl.id) !== -1; }).length;
  }

  function applyFilter(container, timelines, filter) {
    var catalog = container.querySelector('.tl-catalog');
    if (!catalog) return;
    var items = catalog.querySelectorAll('.tl-container');
    items.forEach(function(item) {
      var tlId = item.getAttribute('data-timeline-id');
      if (!tlId) return;
      var ancientIds = ['timeline-writing', 'shin-history', 'alphabet-history', 'root-path'];
      var show = filter === 'all' ||
        (filter === 'ancient' && ancientIds.indexOf(tlId) !== -1) ||
        (filter === 'modern' && ancientIds.indexOf(tlId) === -1);
      item.style.display = show ? '' : 'none';
    });
    bindCatalogEvents(container);
  }

  function bindCatalogEvents(container) {
    container.querySelectorAll('.tl-container').forEach(function(card) {
      // Навигация через hash: детальный экран становится deep-link-able.
      var open = function() {
        location.hash = '#timeline/' + card.getAttribute('data-timeline-id');
      };
      card.addEventListener('click', function(event) {
        if (event.target.closest('button')) return;
        open();
      });
      card.addEventListener('keydown', function(event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          open();
        }
      });
      var button = card.querySelector('.tl-container-btn');
      if (button) button.addEventListener('click', function(event) {
        event.stopPropagation();
        open();
      });
      var showAll = card.querySelector('.tl-show-all');
      if (showAll) showAll.addEventListener('click', function(event) {
        event.stopPropagation();
        var expanded = this.getAttribute('aria-expanded') === 'true';
        card.querySelectorAll('.event-card-hidden').forEach(function(eventCard) {
          eventCard.hidden = expanded;
        });
        this.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        this.textContent = expanded ? '… показать все (ещё ' + card.querySelectorAll('.event-card-hidden').length + ')' : '← свернуть события';
      });
    });
  }

  function renderDetail(timelineId) {
    var timeline = timelineItems.filter(function(item) {
      return item.id === timelineId;
    })[0];
    if (!timeline || !timelineContainer) return;

    var eventsHtml = (timeline.events || []).map(function(event, index) {
      return renderEventRow(event, index, timeline.id);
    }).join('');

    // Шапку детального экрана рисует LabHero. Внутри — back-ссылка,
    // мета-строка и события. Кнопка «назад» ведёт к каталогу (renderCatalog
    // восстанавливает базовую шапку LabHero).
    timelineContainer.innerHTML =
      '<section class="tl-detail" aria-label="Таймлайн: ' + escapeHtml(timeline.title) + '">' +
        '<button class="tl-detail-back" type="button">← Каталог таймлайнов</button>' +
        '<div class="tl-detail-meta tl-meta-line">' +
          '<span class="tl-detail-glyph" lang="hbo" aria-hidden="true">' + escapeHtml(timeline.paleoIcon) + '</span>' +
          '<span class="meta-sep">·</span>' +
          '<span>' + (timeline.events || []).length + ' ' + pluralize((timeline.events || []).length, 'событие', 'события', 'событий') + '</span>' +
        '</div>' +
        '<div class="tl-detail-events" role="list" aria-label="События таймлайна">' + eventsHtml + '</div>' +
      '</section>';

    // Шапка модуля подменяется на динамический заголовок таймлайна — ПОСЛЕ
    // innerHTML (иначе присвоение стирает секцию .lab-hero, и setView терялся).
    // Override дублируем в container._labHeroOverride: applyModuleHero вызывает
    // setView ПОСЛЕ Timeline.applyRoute и без него вернёт базовую шапку каталога
    // (тот же контракт, что в load-researches.js и workbench.js).
    timelineContainer._labHeroOverride = {
      kicker: 'ГОЛЕМ · ПАЛЕО-ТАЙМЛАЙН',
      title: timeline.title,
      subtitle: timeline.description || '',
      icon: 'paleo/track.png'
    };
    if (window.LabHero && window.LabHero.setView) {
      window.LabHero.setView('timeline', 'detail', timelineContainer._labHeroOverride);
      if (window.LabRouter && LabRouter.parseHash) {
        LabRouter.renderBreadcrumbs('timeline', LabRouter.parseHash());
      }
    }

    var backButton = timelineContainer.querySelector('.tl-detail-back');
    if (backButton) backButton.addEventListener('click', function() {
      // Возврат через hash — роутер сам вызовет renderCatalog (applyRoute).
      location.hash = '#timeline';
    });

    // Inline actions на событиях: открыть / копировать ссылку
    var actionButtons = timelineContainer.querySelectorAll('.tl-event-action-btn');
    actionButtons.forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var action = btn.getAttribute('data-action');
        var eventIdx = parseInt(btn.getAttribute('data-event-idx'), 10);
        var event = timeline.events[eventIdx];
        if (!event) return;

        if (action === 'open') {
          // Визуальный отклик — можно расширить до модалки с деталями
          var eventEl = btn.closest('.tl-detail-event');
          if (eventEl) {
            eventEl.style.background = 'var(--bg-tertiary)';
            setTimeout(function() { eventEl.style.background = ''; }, 200);
          }
        } else if (action === 'copy') {
          var shareUrl = location.origin + location.pathname + '#timeline/' + timeline.id + '/event/' + eventIdx;
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(shareUrl).then(function() {
              showToast('Ссылка скопирована');
            }).catch(function() {
              fallbackCopy(shareUrl);
            });
          } else {
            fallbackCopy(shareUrl);
          }
        }
      });
    });
  }

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); showToast('Ссылка скопирована'); }
    catch(e) { showToast('Не удалось скопировать'); }
    document.body.removeChild(ta);
  }

  function showToast(message) {
    var existing = document.querySelector('.tl-toast');
    if (existing) existing.remove();
    var toast = document.createElement('div');
    toast.className = 'tl-toast';
    toast.textContent = message;
    toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);' +
      'background:var(--bg-dark);color:var(--text-light);padding:8px 16px;border-radius:6px;' +
      'font-family:var(--font-ui);font-size:13px;font-weight:600;z-index:10001;' +
      'box-shadow:0 4px 16px rgba(0,0,0,0.3);animation:fadeIn 0.2s ease both;';
    document.body.appendChild(toast);
    setTimeout(function() { toast.remove(); }, 2000);
  }

  function pluralize(n, one, two, five) {
    n = Math.abs(n) % 100;
    var n1 = n % 10;
    if (n > 10 && n < 20) return five;
    if (n1 > 1 && n1 < 5) return two;
    if (n1 === 1) return one;
    return five;
  }

  // Определение статуса события по ключевым словам (для status dots)
  function getEventStatus(event) {
    var text = (event.title + ' ' + (event.description || '')).toLowerCase();
    if (/обнаружен|открыт|найден|создание|рождение|начало/.test(text)) return 'done';
    if (/публикац|выпуск|издан|выпуск|представлен/.test(text)) return 'active';
    if (/перевод|трансформац|эволюц|развитие|распространен/.test(text)) return 'active';
    return 'pending';
  }

  // Рендеринг одного события с status dot и inline actions
  function renderEventRow(event, index, tlId) {
    var status = getEventStatus(event);
    var statusLabels = { done: 'Завершено', active: 'В процессе', pending: 'Предстоит' };
    return '<article class="tl-detail-event" style="--tl-event-index:' + index + '" role="listitem">' +
      '<div class="tl-event-row-inner">' +
        '<span class="tl-status-dot tl-status-dot--' + status + '" aria-label="' + statusLabels[status] + '"></span>' +
        '<div class="tl-detail-event-main">' +
          '<div class="tl-detail-event-date">' + escapeHtml(event.date) + '</div>' +
          '<h3 class="tl-detail-event-title">' + escapeHtml(event.title) + '</h3>' +
          '<p class="tl-detail-event-desc">' + escapeHtml(event.description || '') + '</p>' +
        '</div>' +
        '<div class="tl-event-actions">' +
          '<button class="tl-event-action-btn" type="button" data-action="open" data-event-idx="' + index + '" title="Открыть событие">→</button>' +
          '<button class="tl-event-action-btn" type="button" data-action="copy" data-event-idx="' + index + '" title="Копировать ссылку">⎘</button>' +
        '</div>' +
      '</div>' +
    '</article>';
  }

  function applyRoute(parsed) {
    if (!timelineContainer || !timelineItems.length) return;
    var detailId = parsed && parsed.segments && parsed.segments[1];
    var exists = detailId && timelineItems.some(function(t) { return t.id === detailId; });
    if (exists) {
      renderDetail(detailId);
    } else {
      renderCatalog(timelineContainer, timelineItems);
    }
  }

  // ===== COMMAND PALETTE (⌘K) =====
  var cpState = { open: false, selectedIdx: 0, results: [] };

  function buildSearchIndex() {
    var index = [];
    timelineItems.forEach(function(tl) {
      index.push({
        type: 'timeline',
        id: tl.id,
        title: tl.title,
        subtitle: tl.description || '',
        icon: tl.paleoIcon,
        count: tl.events ? tl.events.length : 0
      });
      (tl.events || []).forEach(function(event, idx) {
        index.push({
          type: 'event',
          id: tl.id + '--event-' + idx,
          parentId: tl.id,
          parentTitle: tl.title,
          title: event.title,
          subtitle: event.date + ' · ' + tl.title,
          icon: tl.paleoIcon,
          eventIdx: idx
        });
      });
    });
    return index;
  }

  function renderCpResults(container, results, query) {
    if (!results.length) {
      container.innerHTML = '<div class="tl-cp-empty">Ничего не найдено</div>';
      return;
    }
    container.innerHTML = results.map(function(item, idx) {
      var selectedClass = idx === cpState.selectedIdx ? ' selected' : '';
      return '<div class="tl-cp-item' + selectedClass + '" data-cp-idx="' + idx + '" role="option" aria-selected="' + (idx === cpState.selectedIdx) + '">' +
        '<span class="tl-cp-item-icon" lang="hbo" aria-hidden="true">' + escapeHtml(item.icon || 'א') + '</span>' +
        '<div class="tl-cp-item-content">' +
          '<div class="tl-cp-item-title">' + escapeHtml(item.title) + '</div>' +
          '<div class="tl-cp-item-subtitle">' + escapeHtml(item.subtitle) + '</div>' +
        '</div>' +
        (item.type === 'timeline' ? '<span class="tl-cp-item-meta">' + item.count + ' соб.</span>' : '<span class="tl-cp-item-meta">событие</span>') +
      '</div>';
    }).join('');

    var items = container.querySelectorAll('.tl-cp-item');
    items.forEach(function(el) {
      el.addEventListener('click', function() {
        var idx = parseInt(el.getAttribute('data-cp-idx'), 10);
        selectCpItem(cpState.results[idx]);
      });
    });
  }

  function updateCpSelection(container) {
    var items = container.querySelectorAll('.tl-cp-item');
    items.forEach(function(el, idx) {
      el.classList.toggle('selected', idx === cpState.selectedIdx);
      el.setAttribute('aria-selected', idx === cpState.selectedIdx);
    });
    if (items[cpState.selectedIdx]) {
      items[cpState.selectedIdx].scrollIntoView({ block: 'nearest' });
    }
  }

  function selectCpItem(item) {
    if (!item) return;
    closeCommandPalette();
    if (item.type === 'timeline') {
      location.hash = '#timeline/' + item.id;
    } else if (item.type === 'event') {
      location.hash = '#timeline/' + item.parentId;
    }
  }

  function closeCommandPalette() {
    var overlay = document.getElementById('tl-cp-overlay');
    if (!overlay) return;
    overlay.classList.remove('open');
    setTimeout(function() { overlay.remove(); }, 150);
    cpState.open = false;
  }

  function openCommandPalette() {
    if (cpState.open) return;
    var index = buildSearchIndex();
    cpState = { open: true, selectedIdx: 0, results: index, query: '' };

    var overlay = document.createElement('div');
    overlay.className = 'tl-cp-overlay';
    overlay.id = 'tl-cp-overlay';
    overlay.innerHTML =
      '<div class="tl-cp-modal glass-modal" role="dialog" aria-modal="true" aria-label="Поиск по таймлайнам">' +
        '<div class="tl-cp-input-row">' +
          '<span class="tl-cp-icon">⌘</span>' +
          '<input class="tl-cp-input" type="text" placeholder="Поиск таймлайнов и событий…" aria-label="Поиск" autofocus>' +
          '<kbd class="tl-cp-kbd">ESC</kbd>' +
        '</div>' +
        '<div class="tl-cp-results" role="listbox" aria-label="Результаты поиска"></div>' +
      '</div>';

    document.body.appendChild(overlay);
    requestAnimationFrame(function() { overlay.classList.add('open'); });

    var input = overlay.querySelector('.tl-cp-input');
    var resultsContainer = overlay.querySelector('.tl-cp-results');
    input.focus();

    renderCpResults(resultsContainer, index, '');

    input.addEventListener('input', function() {
      var query = input.value.trim().toLowerCase();
      cpState.query = query;
      cpState.selectedIdx = 0;
      if (query) {
        var filtered = index.filter(function(item) {
          return item.title.toLowerCase().indexOf(query) !== -1 ||
                 item.subtitle.toLowerCase().indexOf(query) !== -1;
        });
        cpState.results = filtered;
      } else {
        cpState.results = index;
      }
      renderCpResults(resultsContainer, cpState.results, query);
    });

    input.addEventListener('keydown', function(e) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        cpState.selectedIdx = Math.min(cpState.selectedIdx + 1, cpState.results.length - 1);
        updateCpSelection(resultsContainer);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        cpState.selectedIdx = Math.max(cpState.selectedIdx - 1, 0);
        updateCpSelection(resultsContainer);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        selectCpItem(cpState.results[cpState.selectedIdx]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closeCommandPalette();
      }
    });

    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) closeCommandPalette();
    });
  }

  // Глобальный хоткей ⌘K / Ctrl+K
  document.addEventListener('keydown', function(e) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      if (cpState.open) {
        closeCommandPalette();
      } else {
        openCommandPalette();
      }
    }
  });

  return {
    init: init,
    render: renderCatalog,
    applyRoute: applyRoute,
    renderDetail: renderDetail,
    openCommandPalette: openCommandPalette
  };
})();

window.Timeline = Timeline;
