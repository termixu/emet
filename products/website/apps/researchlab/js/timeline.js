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
        return '<div class="tl-roadmap-segment' + activeClass + '" data-tl-id="' + escapeHtml(tl.id) + '" role="listitem" tabindex="0" aria-label="' + escapeHtml(tl.title) + '">' +
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
      return '<article class="tl-detail-event" style="--tl-event-index:' + index + '" role="listitem">' +
        '<div class="tl-detail-event-date">' + escapeHtml(event.date) + '</div>' +
        '<h3 class="tl-detail-event-title">' + escapeHtml(event.title) + '</h3>' +
        '<p class="tl-detail-event-desc">' + escapeHtml(event.description || '') + '</p>' +
      '</article>';
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
  }

  function pluralize(n, one, two, five) {
    n = Math.abs(n) % 100;
    var n1 = n % 10;
    if (n > 10 && n < 20) return five;
    if (n1 > 1 && n1 < 5) return two;
    if (n1 === 1) return one;
    return five;
  }

  /* applyRoute — перерисовка при повторном заходе на модуль (hashchange):
     #timeline → каталог, #timeline/<id> → детальный экран (unknown id → каталог). */
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

  return {
    init: init,
    render: renderCatalog,
    applyRoute: applyRoute,
    renderDetail: renderDetail
  };
})();

window.Timeline = Timeline;
