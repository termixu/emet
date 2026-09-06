/**
 * section-renderer.js — единая визуальная сборка статей библиотеки.
 * Нормализует старые blocks heading/body в sections id/title/content.
 */
const SectionRenderer = (function() {
  'use strict';

  var ICON_BASE = 'assets/icons/32/';
  var DEFAULT_ICON = ICON_BASE + 'scribe/scroll.png';

  function escapeHtml(value) {
    var node = document.createElement('div');
    node.textContent = value == null ? '' : String(value);
    return node.innerHTML;
  }

  function renderMarkdown(value) {
    if (Array.isArray(value)) {
      return '<ul>' + value.map(function(item) { return '<li>' + escapeHtml(item) + '</li>'; }).join('') + '</ul>';
    }
    if (value == null || value === '') return '';
    var text = String(value);
    var html = (typeof marked !== 'undefined' && marked.parse) ? marked.parse(text) : '<p>' + escapeHtml(text).replace(/\n/g, '<br>') + '</p>';
    return (typeof DOMPurify !== 'undefined' && DOMPurify.sanitize) ? DOMPurify.sanitize(html) : escapeHtml(text).replace(/\n/g, '<br>');
  }

  // В контексте ТаНаХа разделяем квадратный текст, транслитерацию и перевод.
  function renderTanakh(value) {
    var html = renderMarkdown(value);
    return html.replace(/<blockquote>([\s\S]*?)<\/blockquote>/gi, function(_, inner) {
      var clean = inner.replace(/<\/p>\s*<p>/gi, '<br>').replace(/<\/?p>/gi, '');
      var lines = clean.split(/<br\s*\/?>\s*/i).filter(function(line) { return line.trim(); });
      if (lines.length < 2) return '<blockquote class="tanakh-quote">' + clean + '</blockquote>';
      var seenHebrew = false;
      var nonHebrewLines = 0;
      var rendered = lines.map(function(line) {
        var isHebrew = /[\u0590-\u05ff]/.test(line);
        var className = isHebrew ? 'tanakh-quote-line tanakh-hebrew-line' : 'tanakh-quote-line';
        var divider = false;
        if (isHebrew) seenHebrew = true;
        else if (seenHebrew) {
          nonHebrewLines += 1;
          divider = nonHebrewLines === 1;
          className += ' tanakh-translation-line';
        }
        return { html: '<span class="' + className + '">' + line + '</span>', divider: divider };
      });
      return '<blockquote class="tanakh-quote">' + rendered.map(function(line) {
        return (line.divider ? '<span class="tanakh-quote-divider" aria-hidden="true"></span>' : '') + line.html;
      }).join('') + '</blockquote>';
    });
  }

  function typologyIcon(name, description) {
    var text = (String(name || '') + ' ' + String(description || '')).toLowerCase();
    var icon = 'ui/anchor.png';
    if (/скини|ковчег|свит|тора/.test(text)) icon = 'scribe/scroll.png';
    else if (/голгоф|гиппократ|пленени|вопрос/.test(text)) icon = 'ui/question.png';
    else if (/огонь|жар|плам|свет|ламп/.test(text)) icon = 'archaeology/lamp.png';
    else if (/камень|опор|основан/.test(text)) icon = 'ui/anchor.png';
    return ICON_BASE + icon;
  }

  // Превращает строки «связь — пояснение» в сканируемую галерею карточек.
  function renderTypology(value) {
    var items = Array.isArray(value) ? value : String(value || '').split(/\r?\n/);
    var cards = items.map(function(item) {
      var line = String(item || '').replace(/^\s*[-*+]\s+/, '').trim();
      if (!line || /^---+$/.test(line)) return '';
      var parts = line.split(/\s+—\s+/);
      var name = parts.shift().trim();
      var description = parts.join(' — ').trim() || 'Связь в образной цепочке';
      return '<article class="typology-link-card">' +
        '<img class="typology-link-icon" src="' + escapeHtml(typologyIcon(name, description)) + '" alt="" width="32" height="32" loading="lazy">' +
        '<div class="typology-link-copy"><strong class="typology-link-name">' + escapeHtml(name) + '</strong>' +
        '<span class="typology-link-description">' + escapeHtml(description) + '</span></div>' +
      '</article>';
    }).filter(Boolean);
    return '<div class="typology-links-gallery" role="list">' + cards.map(function(card) {
      return card.replace('<article ', '<article role="listitem" ');
    }).join('') + '</div>';
  }

  function patchIcon(id, title, detail, index) {
    var text = (String(title || '') + ' ' + String(detail || '')).toLowerCase();
    var iconSets = {
      etymology: ['archaeology/testtube.png', 'ui/book.png', 'scribe/scroll.png'],
      exposure: ['weapons/sword.png', 'ui/question.png', 'ui/anchor.png'],
      practice: ['paleo/track.png', 'archaeology/lamp.png', 'ui/anchor.png'],
      summary: ['ui/scales.png', 'ui/book.png', 'scribe/scrolls.png']
    };
    if (/корень|этимолог|слово|палео|букв/.test(text)) return ICON_BASE + 'archaeology/testtube.png';
    if (/искаж|подмен|греческ|латин|перевод/.test(text)) return ICON_BASE + 'weapons/sword.png';
    if (/практи|сдел|шаг|примен|провер/.test(text)) return ICON_BASE + 'paleo/track.png';
    if (/свод|итог|уров|вывод|ключ/.test(text)) return ICON_BASE + 'ui/scales.png';
    var icons = iconSets[id] || ['ui/book.png', 'scribe/scroll.png', 'archaeology/testtube.png'];
    return ICON_BASE + icons[(index || 0) % icons.length];
  }

  // Списки в аналитических карточках становятся компактными смысловыми плашками.
  function renderPatchCards(items, id, offset) {
    var cards = items.map(function(item, index) {
      var content = String(item || '').replace(/^\s*(?:[-*+]\s+|•\s*)/, '').trim();
      if (!content) return '';
      var plain = content.replace(/<[^>]+>/g, '').replace(/\*\*/g, '').trim();
      var parts = plain.split(/\s+—\s+|\s*:\s+/);
      var title = parts.shift().trim() || 'Фрагмент';
      var detail = parts.join(' — ').trim() || plain;
      return '<article class="section-patch-card" role="listitem">' +
        '<img class="section-patch-icon" src="' + escapeHtml(patchIcon(id, title, detail, (offset || 0) + index)) + '" alt="" width="28" height="28" loading="lazy">' +
        '<div class="section-patch-copy"><strong class="section-patch-title">' + escapeHtml(title) + '</strong>' +
        '<span class="section-patch-detail">' + escapeHtml(detail) + '</span></div>' +
      '</article>';
    }).filter(Boolean);
    return '<div class="section-patches-gallery" role="list">' + cards.join('') + '</div>';
  }

  function renderPatchList(value, id) {
    if (Array.isArray(value)) return renderPatchCards(value, id, 0);
    var lines = String(value || '').split(/\r?\n/);
    var output = [];
    var list = [];
    var listIndex = 0;
    function flushList() {
      if (!list.length) return;
      output.push(renderPatchCards(list, id, listIndex));
      listIndex += list.length;
      list = [];
    }
    lines.forEach(function(line) {
      if (/^\s*(?:[-*+]\s+|•\s*)/.test(line)) {
        list.push(line);
      } else {
        flushList();
        if (line.trim()) output.push(renderMarkdown(line));
      }
    });
    flushList();
    return output.join('');
  }

  // Оригинальные цитаты разделяем на отдельные карточки «цитата → разбор».
  function renderOriginalCards(cards) {
    if (!Array.isArray(cards)) return renderMarkdown(cards);
    return '<div class="original-subcards" role="list">' + cards.map(function(card) {
      return '<article class="original-subcard" role="listitem">' +
        '<h3 class="original-subcard-title">' + escapeHtml(card.title || 'Цитата') + '</h3>' +
        '<blockquote class="original-subcard-quote">' + renderMarkdown(card.quote || '') + '</blockquote>' +
        '<div class="original-subcard-analysis"><strong>Разбор</strong>' + renderMarkdown(card.analysis || '') + '</div>' +
      '</article>';
    }).join('') + '</div>';
  }

  // Сравнение собираем в две подписанные колонки, чтобы цвет не был единственным маркером.
  function renderComparison(comparison) {
    if (!comparison) return '';
    var left = comparison.left || {};
    var right = comparison.right || {};
    var rows = Array.isArray(comparison.rows) ? comparison.rows : [];
    return '<div class="comparison-grid" role="table" aria-label="Сравнение">' +
      '<div class="comparison-header" role="row">' +
        '<div class="comparison-column comparison-column-left" role="columnheader">' + escapeHtml(left.title || 'Левая сторона') + '</div>' +
        '<div class="comparison-column comparison-column-right" role="columnheader">' + escapeHtml(right.title || 'Правая сторона') + '</div>' +
      '</div>' +
      '<div class="comparison-rows">' + rows.map(function(row) {
        return '<div class="comparison-row" role="row">' +
          '<div class="comparison-cell comparison-cell-left" role="cell">' + escapeHtml(row.left || '') + '</div>' +
          '<div class="comparison-cell comparison-cell-right" role="cell">' + escapeHtml(row.right || '') + '</div>' +
        '</div>';
      }).join('') + '</div>' +
    '</div>';
  }

  function cleanTitle(value) {
    var title = String(value || 'Раздел').replace(/^!\[icon\]\([^)]*\)\s*/i, '').trim();
    return title || 'Раздел';
  }

  // Сокращает заголовок секции до 1–2 слов по правилам проекта.
  // Используется и для карточек внутри статьи, и для оглавления (TOC).
  function shortenTitle(value) {
    var title = cleanTitle(value);
    var upper = title.toUpperCase();
    var exact = {
      'СУТЬ': 'Суть',
      'ВВЕДЕНИЕ': 'Введение',
      'КОНТЕКСТ ТАНАХА': 'Контекст Танаха',
      'СВЯЗЬ С МАШИАХОМ': 'Связь с Машиахом',
      'ИСКАЖЕНИЯ': 'Искажения',
      'РАЗОБЛАЧЕНИЕ': 'Разоблачение',
      'ПРАКТИКА': 'Практика',
      'СВОДКА': 'Сводка',
      'ТИПОЛОГИЧЕСКИЕ СВЯЗИ': 'Типологии',
      'ОРИГИНАЛ': 'Оригинал',
      'СДВИГ': 'Сдвиг',
      'СВИДЕТЕЛЬСТВА': 'Свидетельства',
      'РЕКОНСТРУКЦИЯ': 'Реконструкция',
      'ОГОВОРКИ': 'Оговорки',
      'ЦЕПОЧКА ПЕРЕДАЧИ': 'Цепочка передачи',
      'ЭТИМОЛОГИЯ': 'Этимология'
    };
    if (exact[upper]) return exact[upper];
    if (/^ЧАСТЬ\s+\d+\s*:/.test(upper)) {
      var after = title.replace(/^Часть\s+\d+\s*:\s*/i, '').trim();
      var firstWord = after.split(/\s+/).filter(function(w) { return w && !/^[—–-]$/.test(w); })[0];
      if (firstWord) return firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase();
      return 'Раздел';
    }
    if (/^КОНТЕКСТ/.test(upper)) return 'Контекст';
    if (/^СВЯЗАННЫЕ/.test(upper)) return 'Связанные';
    var words = title.split(/\s+/).filter(function(w) { return w && !/^[—–-]$/.test(w); });
    if (!words.length) return 'Раздел';
    if (words.length <= 2) {
      return words.map(function(w) { return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(); }).join(' ');
    }
    return words[0].charAt(0).toUpperCase() + words[0].slice(1).toLowerCase();
  }

  function idForTitle(value) {
    var title = cleanTitle(value).toLowerCase();
    var known = [
      { id: 'essence', words: ['суть', 'тезис'] },
      { id: 'etymology', words: ['этимология', 'оригинал', 'корень'] },
      { id: 'tanakh', words: ['танах', 'контекст', 'свидетельства'] },
      { id: 'exposure', words: ['искажения', 'разоблачение', 'сдвиг'] },
      { id: 'practice', words: ['практика', 'применение'] },
      { id: 'summary', words: ['сводка', 'вывод', 'реконструкция'] },
      { id: 'typology', words: ['типологические связи'] },
      { id: 'related', words: ['связанные файлы', 'связанные материалы'] },
      { id: 'transmission', words: ['цепочка передачи'] },
      { id: 'caveats', words: ['оговорки'] }
    ];
    for (var i = 0; i < known.length; i += 1) {
      if (known[i].words.some(function(word) { return title.indexOf(word) !== -1; })) return known[i].id;
    }
    return title.replace(/[^a-zа-яё0-9]+/gi, '-').replace(/^-+|-+$/g, '') || 'section';
  }

  function iconForLegacy(value) {
    var match = String(value || '').match(/([^/\\]+?)(?:\.png|\.svg)?$/i);
    var name = match ? match[1].toLowerCase() : '';
    var paths = {
      scroll: 'scribe/scroll.png',
      book: 'ui/book.png',
      hourglass: 'ui/hourglass.png',
      sword: 'weapons/sword.png',
      anchor: 'ui/anchor.png',
      lamp: 'archaeology/lamp.png',
      scales: 'ui/scales.png',
      question: 'ui/question.png'
    };
    return ICON_BASE + (paths[name] || 'scribe/scroll.png');
  }

  function normalizeSection(section) {
    var title = cleanTitle(section && (section.title || section.heading));
    return {
      id: (section && section.id) || idForTitle(title),
      title: title,
      tocTitle: section && section.tocTitle ? String(section.tocTitle) : '',
      content: section && section.content !== undefined ? section.content : (section && section.body) || '',
      icon: section && section.icon ? iconForLegacy(section.icon) : null,
      layout: section && section.layout ? String(section.layout) : '',
      cards: section && Array.isArray(section.cards) ? section.cards : null,
      comparison: section && section.comparison ? section.comparison : null
    };
  }

  function normalizeArticle(article) {
    article = article || {};
    var source = article.sections;
    if (Array.isArray(source)) {
      var usedArrayIds = {};
      return source.filter(function(section) {
        return !isHiddenSection(section);
      }).map(function(section) {
        var normalized = normalizeSection(section);
        normalized.id = uniqueId(normalized.id, usedArrayIds);
        return normalized;
      });
    }

    source = source || {};
    var sections = [];
    var usedIds = {};
    function uniqueId(id, registry) {
      var base = id || 'section';
      var unique = base;
      var suffix = 2;
      var used = registry || usedIds;
      while (used[unique]) {
        unique = base + '-' + suffix;
        suffix += 1;
      }
      used[unique] = true;
      return unique;
    }
    function add(title, content, icon) {
      if (content == null || content === '' || (Array.isArray(content) && !content.length)) return;
      var section = normalizeSection({ title: title, content: content, icon: icon });
      section.id = uniqueId(section.id);
      sections.push(section);
    }

    if (source.original) {
      var original = source.original;
      var originalLines = [];
      if (original.hebrew) originalLines.push(original.hebrew);
      if (original.translit) originalLines.push(original.translit);
      if (original.root) originalLines.push('Корень: ' + original.root);
      if (Array.isArray(original.paleo) && original.paleo.length) originalLines.push(original.paleo.join(' '));
      add('Этимология', originalLines, 'book');
    }
    add('Сдвиг', source.shift, 'sword');
    if (Array.isArray(source.transmissionChain) && source.transmissionChain.length) {
      add('Цепочка передачи', source.transmissionChain.map(function(step) {
        return [step.layer, step.word, step.meaning].filter(Boolean).join(' — ');
      }), 'hourglass');
    }
    (source.content || []).filter(function(section) {
      return !isHiddenSection(section);
    }).forEach(function(section) {
      var normalized = normalizeSection(section);
      normalized.id = uniqueId(normalized.id);
      sections.push(normalized);
    });
    if (Array.isArray(source.evidence) && source.evidence.length) {
      add('Свидетельства', source.evidence.map(function(item) {
        return [item.type, item.ref, item.hebrew, item.note].filter(Boolean).join(' — ');
      }), 'scales');
    }
    add('Реконструкция', source.reconstruction, 'lamp');
    if (Array.isArray(source.caveats) && source.caveats.length) {
      add('Оговорки', source.caveats.map(function(item) { return [item.kind, item.text].filter(Boolean).join(' — '); }), 'question');
    }
    return sections;
  }

  function isHiddenSection(section) {
    var title = String(section && (section.title || section.heading) || '').replace(/^!\[icon\]\([^)]*\)\s*/i, '').trim().toLowerCase();
    var id = String(section && section.id || '').toLowerCase();
    return id === 'related' || id === 'связанные-файлы' || title === 'связанные файлы' || title === 'связанные материалы';
  }

  var RULES = {
    essence: { icon: ICON_BASE + 'scribe/scroll.png', className: 'essence-card', render: renderMarkdown },
    etymology: { icon: ICON_BASE + 'archaeology/testtube.png', className: 'etymology-card', render: function(value) { return renderPatchList(value, 'etymology'); } },
    tanakh: { icon: ICON_BASE + 'ui/book.png', className: 'tanakh-card', render: renderTanakh },
    exposure: { icon: ICON_BASE + 'weapons/sword.png', className: 'exposure-card exposure-section-card', render: function(value) { return renderPatchList(value, 'exposure'); } },
    distortions: { icon: ICON_BASE + 'weapons/sword.png', className: 'exposure-card exposure-section-card', render: function(value) { return renderPatchList(value, 'exposure'); } },
    practice: { icon: ICON_BASE + 'archaeology/lamp.png', className: 'practice-card', render: function(value) { return renderPatchList(value, 'practice'); } },
    summary: { icon: ICON_BASE + 'ui/scales.png', className: 'summary-card', render: function(value) { return renderPatchList(value, 'summary'); } },
    typology: { icon: ICON_BASE + 'ui/anchor.png', className: 'typology-card', render: renderTypology },
    related: { icon: ICON_BASE + 'scribe/scrolls.png', className: 'related-card', render: renderMarkdown },
    transmission: { icon: ICON_BASE + 'ui/hourglass.png', className: 'transmission-card', render: renderMarkdown },
    caveats: { icon: ICON_BASE + 'ui/question.png', className: 'caveats-card', render: renderMarkdown }
  };

  function ruleFor(section) {
    var baseId = String(section.id || '').replace(/-\d+$/, '');
    var content = section && section.content;
    var hasListMarkers = Array.isArray(content) || /(?:^|\n)\s*(?:[-*+]\s+|•\s*)/.test(String(content || ''));
    var knownRule = RULES[baseId];
    // Специализированные форматы сохраняют приоритет над универсальным списком.
    if (knownRule && (baseId === 'tanakh' || baseId === 'typology')) return knownRule;
    if (hasListMarkers) {
      return {
        icon: (knownRule && knownRule.icon) || section.icon || DEFAULT_ICON,
        className: (knownRule && knownRule.className) || 'generic-card list-card',
        render: function(value) { return renderPatchList(value, baseId || 'generic'); }
      };
    }
    if (knownRule) return knownRule;
    return { icon: section.icon || DEFAULT_ICON, className: 'generic-card', render: renderMarkdown };
  }

  function renderSection(section, index) {
    var rule = ruleFor(section);
    var body = section.layout === 'original-cards'
      ? renderOriginalCards(section.cards)
      : (section.layout === 'comparison' ? renderComparison(section.comparison) : rule.render(section.content));
    return '<article class="exposure-section research-section-card ' + rule.className + '" id="exposure-section-' + index + '" data-section-index="' + index + '" data-section-id="' + escapeHtml(section.id) + '">' +
      '<header class="research-section-card-head"><img class="exposure-section-icon" src="' + escapeHtml(rule.icon) + '" alt="" width="40" height="40" loading="lazy"><h2 class="exposure-section-heading-text">' + escapeHtml(shortenTitle(section.title)) + '</h2></header>' +
      '<div class="exposure-section-body">' + body + '</div>' +
    '</article>';
  }

  function renderArticle(article) {
    return normalizeArticle(article).map(renderSection).join('');
  }

  window.SectionRenderer = {
    rules: RULES,
    normalizeArticle: normalizeArticle,
    renderSection: renderSection,
    renderArticle: renderArticle,
    shortenTitle: shortenTitle
  };
  return window.SectionRenderer;
})();