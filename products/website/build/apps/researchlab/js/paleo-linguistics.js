/**
 * paleo-linguistics.js — Модуль «Палео-лингвистика»
 *
 * Эволюция алфавита: прото-ханаанский > палео-иврит > финикийский.
 * Маршрут: #paleo-linguistics, #paleo-linguistics/<language-id>
 */

const PaleoLinguistics = (function() {
  'use strict';

  const COMPARE_KEY = 'golem_pl_compare';
  let languages = [];
  let letters = [];
  let langCache = {};
  let dataPromise = null;
  let currentLang = null;
  let currentTab = 'alphabet';
  let routeVersion = 0;

  function escapeHtml(text) {
    var d = document.createElement('div');
    d.textContent = text == null ? '' : String(text);
    return d.innerHTML;
  }

  // В карточке оставляем только имя языка; подробности открываются по клику.
  function cardLanguageName(name) {
    return String(name == null ? '' : name).replace(/\s*\([^)]*\)/g, '').trim();
  }

  function dataPath(name) {
    return new URL('data/paleo-linguistics/' + name, document.baseURI).href;
  }

  function read(key, fallback) {
    try {
      var v = JSON.parse(localStorage.getItem(key));
      return v == null ? fallback : v;
    } catch (e) { return fallback; }
  }

  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }

  // ===== ИНИЦИАЛИЗАЦИЯ =====
  function init(parsed) {
    var container = document.getElementById('paleo-linguistics');
    if (!container) return;
    var version = ++routeVersion;

    loadCore().then(function() {
      route(container, parsed, version);
    }).catch(function(error) {
      if (version !== routeVersion) return;
      container.innerHTML = '<div class="lab-alert lab-alert-error">Ошибка загрузки: ' + escapeHtml(error.message) + '</div>';
    });
  }

  // ===== МАРШРУТИЗАЦИЯ ВНУТРИ МОДУЛЯ =====
  // #paleo-linguistics — карточки языков
  // #paleo-linguistics/<lang-id> — страница языка (таб по умолчанию "Алфавит")
  function isCurrentRoute(langId) {
    var hash = window.location.hash.replace(/^#/, '').split('?')[0].split('/');
    return hash[0] === 'paleo-linguistics' && (langId ? hash[1] === langId : !hash[1]);
  }

  function route(container, parsed, version) {
    version = version || ++routeVersion;
    var segId = parsed && parsed.segments && parsed.segments[1];
    if (segId) {
      showLanguage(container, segId, version);
    } else {
      renderLangGrid(container, version);
    }
  }

  // ===== ЗАГРУЗКА ОБЩИХ ДАННЫХ (список языков + буквы эволюции) =====
  function loadCore() {
    if (languages.length && letters.length) return Promise.resolve();
    if (dataPromise) return dataPromise;

    dataPromise = Promise.all([
      fetch(dataPath('languages.json')).then(function(r) {
        if (!r.ok) throw new Error('HTTP ' + r.status + ' (languages.json)');
        return r.json();
      }),
      fetch(dataPath('evolution.json')).then(function(r) {
        if (!r.ok) throw new Error('HTTP ' + r.status + ' (evolution.json)');
        return r.json();
      })
    ]).then(function(results) {
      languages = results[0];
      letters = results[1];
    }).catch(function(err) {
      dataPromise = null;
      throw err;
    });

    return dataPromise;
  }

  // ===== ЗАГРУЗКА ДАННЫХ ОДНОГО ЯЗЫКА =====
  function loadLanguage(langMeta) {
    if (langCache[langMeta.id]) return Promise.resolve(langCache[langMeta.id]);
    return fetch(dataPath(langMeta.file)).then(function(r) {
      if (!r.ok) throw new Error('HTTP ' + r.status + ' (' + langMeta.file + ')');
      return r.json();
    }).then(function(data) {
      langCache[langMeta.id] = data;
      return data;
    });
  }

  // ===== СЕТКА КАРТОЧЕК ЯЗЫКОВ =====
  function renderLangGrid(container, version) {
    Promise.all(languages.map(loadLanguage)).then(function(metas) {
      if (version !== routeVersion || !isCurrentRoute()) return;
      var cards = metas.map(function(lang, i) {
        return '<div class="lab-card pl-lang-card" data-id="' + escapeHtml(lang.id) + '" role="button" tabindex="0" aria-label="Открыть язык: ' + escapeHtml(cardLanguageName(lang.name)) + '" style="animation-delay:' + (i * 60) + 'ms">' +
          '<div class="pl-lang-card-icon"><img src="assets/icons/32/' + escapeHtml(languages[i].icon) + '.png" width="32" height="32" alt="" onerror="this.style.display=\'none\'"></div>' +
          '<h2 class="pl-lang-title">' + escapeHtml(cardLanguageName(lang.name)) + '</h2>' +
          '<div class="pl-lang-role">' + escapeHtml(lang.role) + '</div>' +
        '</div>';
      }).join('');

      container.innerHTML =
        '<h1><img src="assets/icons/32/scribe/scroll.png" class="lab-icon" alt=""> Палео-лингвистика</h1>' +
        '<p class="subtitle">Эволюция алфавита от прото-ханаанского письма через палео-иврит к финикийскому. Выберите язык для изучения.</p>' +
        '<div class="pl-lang-grid">' + cards + '</div>';

      container.querySelectorAll('.pl-lang-card').forEach(function(card) {
        function openCard() {
          var id = card.getAttribute('data-id');
          if (!id) return;
          if (typeof LabRouter !== 'undefined') LabRouter.navigate('paleo-linguistics', [id]);
          route(container, { segments: ['paleo-linguistics', id] });
        }
        card.addEventListener('click', openCard);
        card.addEventListener('keydown', function(event) {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openCard();
          }
        });
      });
    }).catch(function(error) {
      if (version !== routeVersion || !isCurrentRoute()) return;
      container.innerHTML = '<div class="lab-alert lab-alert-error">Ошибка загрузки языков: ' + escapeHtml(error.message) + '</div>';
    });
  }

  // ===== СТРАНИЦА ЯЗЫКА =====
  function showLanguage(container, langId, version) {
    var meta = languages.filter(function(l) { return l.id === langId; })[0];
    if (!meta) {
      container.innerHTML = '<div class="lab-alert lab-alert-error">Язык «' + escapeHtml(langId) + '» не найден.</div>' +
        '<button class="lab-btn lab-btn-secondary pl-back-btn" onclick="LabRouter.navigate(\'paleo-linguistics\')">< Назад к языкам</button>';
      return;
    }

    loadLanguage(meta).then(function(lang) {
      if (version !== routeVersion || !isCurrentRoute(langId)) return;
      currentLang = lang;
      currentTab = 'alphabet';
      container.innerHTML = renderLangPage(lang);
      // РЁР°РїРєР° РјРѕРґСѓР»СЏ РїРѕРґРјРµРЅСЏРµС‚СЃСЏ РЅР° СЏР·С‹Рє
      if (window.LabHero && window.LabHero.setView) {
        window.LabHero.setView('paleo-linguistics', 'detail', {
          kicker: 'Р“РћР›Р•Рњ В· РџРђР›Р•Рћ-Р›РРќР“Р’РРЎРўРРљРђ',
          title: lang.name,
          subtitle: lang.role || '',
          icon: 'scribe/scroll.png'
        });
      }
      bindLangPageEvents(container, lang);
      var back = container.querySelector('.pl-back-btn');
      if (back) back.addEventListener('click', function(event) {
        event.preventDefault();
        if (typeof LabRouter !== 'undefined') LabRouter.navigate('paleo-linguistics');
      });
    }).catch(function(error) {
      if (version !== routeVersion || !isCurrentRoute(langId)) return;
      container.innerHTML = '<div class="lab-alert lab-alert-error">Ошибка загрузки языка: ' + escapeHtml(error.message) + '</div>';
    });
  }

  function renderLangPage(lang) {
    return '<div class="pl-lang-page">' +
      '<button class="lab-btn lab-btn-secondary lab-btn-sm pl-back-btn" onclick="LabRouter.navigate(\'paleo-linguistics\')">< Назад к языкам</button>' +
      '<div class="pl-lang-head">' +
        '<div class="pl-lang-title-wrap"><img src="assets/icons/32/scribe/scroll.png" class="lab-icon" alt="">' + escapeHtml(lang.name) + '</div>' +
        '<p class="subtitle">' + escapeHtml(lang.role) + '</p>' +
        '<div class="pl-lang-meta">' + escapeHtml(lang.period) + ' · ' + escapeHtml(lang.script) + '</div>' +
      '</div>' +
      '<div class="lab-tabs">' +
        '<button type="button" class="lab-tab active" data-tab="alphabet">Алфавит</button>' +
        '<button type="button" class="lab-tab" data-tab="roots">Корни</button>' +
        '<button type="button" class="lab-tab" data-tab="texts">Тексты</button>' +
        '<button type="button" class="lab-tab" data-tab="grammar">Грамматика</button>' +
      '</div>' +
      '<div id="pl-tab-alphabet" class="pl-tab-panel">' + renderAlphabetTab() + '</div>' +
      '<div id="pl-tab-roots" class="pl-tab-panel" style="display:none;">' + renderRootsTab(lang) + '</div>' +
      '<div id="pl-tab-texts" class="pl-tab-panel" style="display:none;">' + renderTextsTab(lang) + '</div>' +
      '<div id="pl-tab-grammar" class="pl-tab-panel" style="display:none;">' + renderGrammarTab(lang) + '</div>' +
    '</div>';
  }

  function stageKey(langId) {
    return langId.replace(/-/g, '_');
  }

  // ===== ТАБ «АЛФАВИТ» =====
  function renderAlphabetTab() {
    if (currentLang.alphabet_mode === 'standalone') return renderStandaloneAlphabetTab();
    return renderEvolutionAlphabetTab();
  }

  // Языки общей ветви письма (прото-ханаанский, палео-иврит, финикийский, арамейский)
  function renderEvolutionAlphabetTab() {
    if (!letters.length) return '<div class="lab-alert lab-alert-info">Буквы пока не загружены.</div>';
    var cards = letters.map(function(letter) {
      var stage = letter.stages[stageKey(currentLang.id)];
      var glyph = stage && stage.glyph ? escapeHtml(stage.glyph) :
        (stage && stage.placeholder ? '<img src="' + escapeHtml(stage.placeholder) + '" width="28" height="28" alt="">' : escapeHtml(letter.hebrew));
      return '<div class="pl-letter-card" data-letter-id="' + escapeHtml(letter.id) + '">' +
        '<div class="pl-letter-glyph">' + glyph + '</div>' +
        '<div class="pl-letter-name">' + escapeHtml(letter.name) + '</div>' +
        '<div class="pl-letter-sound">' + escapeHtml(letter.sound) + '</div>' +
      '</div>';
    }).join('');
    return '<p class="subtitle">22 буквы. Нажмите на букву, чтобы увидеть её эволюцию через стадии письма.</p>' +
      '<div class="pl-alphabet-grid">' + cards + '</div>';
  }

  // Языки без общей эволюции с 22-буквенным алфавитом (клинопись, арабский, угаритский)
  function renderStandaloneAlphabetTab() {
    var signs = currentLang.own_alphabet || [];
    if (!signs.length) return '<div class="lab-alert lab-alert-info">Знаки пока не загружены.</div>';
    var note = currentLang.alphabet_note
      ? '<p class="subtitle">' + escapeHtml(currentLang.alphabet_note) + '</p>' : '';
    var fontClass = 'pl-script-' + escapeHtml(currentLang.id);
    var cards = signs.map(function(s) {
      return '<div class="pl-sign-card" data-sign-id="' + escapeHtml(s.id) + '">' +
        '<div class="pl-sign-glyph ' + fontClass + '">' + escapeHtml(s.symbol) + '</div>' +
        '<div class="pl-sign-reading">' + escapeHtml(s.reading) + '</div>' +
        '<div class="pl-sign-type">' + escapeHtml(s.type) + '</div>' +
      '</div>';
    }).join('');
    return note + '<div class="pl-alphabet-grid">' + cards + '</div>';
  }

  // ===== МОДАЛКА ЭВОЛЮЦИИ БУКВЫ =====
  function showEvolution(letterId) {
    var letter = letters.filter(function(l) { return l.id === letterId; })[0];
    if (!letter) return;

    var order = [
      { key: 'proto_canaanite', label: 'Прото-ханаанский' },
      { key: 'paleo_hebrew', label: 'Палео-иврит' },
      { key: 'phoenician', label: 'Финикийский' },
      { key: 'imperial_aramaic', label: 'Арамейский' }
    ].filter(function(o) { return letter.stages[o.key]; });

    var stages = order.map(function(o, i) {
      var s = letter.stages[o.key] || {};
      var glyph = s.glyph ? escapeHtml(s.glyph) :
        (s.placeholder ? '<img src="' + escapeHtml(s.placeholder) + '" alt="">' : '?');
      var arrow = i < order.length - 1 ? '<span class="pl-evolution-arrow">></span>' : '';
      return '<div class="pl-evolution-stage">' +
          '<div class="pl-stage-label">' + escapeHtml(o.label) + '</div>' +
          '<div class="pl-stage-glyph">' + glyph + '</div>' +
          '<div class="pl-stage-period">' + escapeHtml(s.period || '') + '</div>' +
          '<div class="pl-stage-desc">' + escapeHtml(s.description || '') + '</div>' +
        '</div>' + arrow;
    }).join('');

    var html = '<div class="pl-evolution-row">' + stages + '</div>' +
      '<div class="lab-alert lab-alert-info">Звук: <strong>' + escapeHtml(letter.sound) + '</strong> · Образ: <strong>' + escapeHtml(letter.meaning) + '</strong></div>';

    LabModal.show(
      '<img src="assets/icons/32/paleo/track.png" width="24" height="24" alt=""> ' + escapeHtml(letter.name) + ' (' + escapeHtml(letter.hebrew) + ')',
      html,
      '<button class="lab-btn lab-btn-secondary lab-btn-sm" onclick="LabModal.close()">Закрыть</button>' +
      '<button class="lab-btn lab-btn-primary lab-btn-sm" onclick="PaleoLinguistics.addToCompare(\'evolution\',\'' + letter.id + '\')">Добавить в сравнение</button>'
    );
  }

  // ===== МОДАЛКА ЗНАКА (STANDALONE-АЛФАВИТЫ) =====
  function showSignDetail(signId) {
    var signs = (currentLang && currentLang.own_alphabet) || [];
    var sign = signs.filter(function(s) { return s.id === signId; })[0];
    if (!sign) return;

    var html = '<div class="pl-sign-detail">' +
        '<div class="pl-sign-detail-glyph lang-' + escapeHtml(currentLang.id) + '">' + escapeHtml(sign.symbol) + '</div>' +
        '<div class="pl-sign-detail-reading">' + escapeHtml(sign.reading) + '</div>' +
        '<div class="lab-alert lab-alert-info">Тип: <strong>' + escapeHtml(sign.type) + '</strong></div>' +
        '<div class="pl-sign-detail-meaning">' + escapeHtml(sign.meaning) + '</div>' +
      '</div>';

    LabModal.show(
      '<img src="assets/icons/32/scribe/scroll.png" width="24" height="24" alt=""> ' + escapeHtml(sign.reading),
      html,
      '<button class="lab-btn lab-btn-secondary lab-btn-sm" onclick="LabModal.close()">Закрыть</button>' +
      '<button class="lab-btn lab-btn-primary lab-btn-sm" onclick="PaleoLinguistics.addToCompare(\'' + currentLang.id + '\',\'' + sign.id + '\')">Добавить в сравнение</button>'
    );
  }

  // ===== ТАБ «КОРНИ» =====
  function renderRootsTab(lang) {
    var roots = lang.common_roots || [];
    if (!roots.length) return '<div class="lab-alert lab-alert-info">Общие корни пока не описаны.</div>';
    var rows = roots.map(function(r) {
      return '<tr class="pl-root-row" data-hebrew="' + escapeHtml(r.hebrew) + '">' +
        '<td>' + escapeHtml(r.language) + '</td>' +
        '<td dir="rtl" lang="he">' + escapeHtml(r.hebrew) + '</td>' +
        '<td>' + escapeHtml(r.meaning) + '</td>' +
      '</tr>';
    }).join('');
    return '<p class="subtitle">Нажмите на корень, чтобы найти его в Корневом словаре.</p>' +
      '<table class="lab-table"><thead><tr><th>Форма</th><th>Иврит</th><th>Значение</th></tr></thead><tbody>' + rows + '</tbody></table>';
  }

  // ===== ТАБ «ТЕКСТЫ» =====
  function renderTextsTab(lang) {
    var texts = lang.texts || [];
    if (!texts.length) return '<div class="lab-alert lab-alert-info">Примеры текстов пока не подобраны.</div>';
    return texts.map(function(t) {
      return '<div class="lab-card pl-text-card"><div class="lab-card-body">' +
        '<div class="pl-text-original">' + linkifyWords(t.original) + '</div>' +
        '<div class="pl-text-translit">' + escapeHtml(t.transliteration) + '</div>' +
        '<div class="pl-text-translation">' + escapeHtml(t.translation) + '</div>' +
      '</div></div>';
    }).join('');
  }

  // Оборачивает ивритские слова в клик-ссылки на #word-analyzer
  function linkifyWords(original) {
    return original.split(' ').map(function(w) {
      var clean = escapeHtml(w);
      if (!/[?-?]/.test(w)) return clean;
      return '<span class="pl-text-word" data-word="' + clean + '">' + clean + '</span>';
    }).join(' ');
  }

  // ===== ТАБ «ГРАММАТИКА» =====
  function renderGrammarTab(lang) {
    var g = lang.grammar || {};
    var items = [
      ['Порядок слов', g.order],
      ['Падежи', g.cases],
      ['Примечание', g.note]
    ].filter(function(pair) { return pair[1]; });
    if (!items.length) return '<div class="lab-alert lab-alert-info">Грамматика пока не описана.</div>';
    return items.map(function(pair) {
      return '<div class="pl-grammar-item"><strong>' + escapeHtml(pair[0]) + ':</strong> ' + escapeHtml(pair[1]) + '</div>';
    }).join('');
  }

  // ===== ОБРАБОТЧИКИ СОБЫТИЙ СТРАНИЦЫ ЯЗЫКА =====
  function bindLangPageEvents(container, lang) {
    container.querySelectorAll('.lab-tab').forEach(function(btn) {
      btn.addEventListener('click', function() { switchTab(container, this.dataset.tab); });
    });

    container.querySelectorAll('.pl-letter-card').forEach(function(card) {
      card.addEventListener('click', function() { showEvolution(this.getAttribute('data-letter-id')); });
    });

    container.querySelectorAll('.pl-sign-card').forEach(function(card) {
      card.addEventListener('click', function() { showSignDetail(this.getAttribute('data-sign-id')); });
    });

    bindRootAndTextEvents(container);
  }

  function bindRootAndTextEvents(container) {
    container.querySelectorAll('.pl-root-row').forEach(function(row) {
      row.addEventListener('click', function() {
        var hebrew = this.getAttribute('data-hebrew');
        if (hebrew && typeof LabRouter !== 'undefined') LabRouter.navigate('root-dictionary', null, { q: hebrew });
      });
    });

    container.querySelectorAll('.pl-text-word').forEach(function(span) {
      span.addEventListener('click', function() {
        var word = this.getAttribute('data-word');
        if (word && typeof LabRouter !== 'undefined') LabRouter.navigate('word-analyzer', null, { q: word });
      });
    });
  }

  function switchTab(container, tabId) {
    currentTab = tabId;
    container.querySelectorAll('.lab-tab').forEach(function(btn) {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    ['alphabet', 'roots', 'texts', 'grammar'].forEach(function(id) {
      var panel = container.querySelector('#pl-tab-' + id);
      if (panel) panel.style.display = (id === tabId) ? '' : 'none';
    });
  }

  // ===== СРАВНЕНИЕ (localStorage) =====
  // Ключ — "source:id", т.к. знаки разных языков (напр. алеф эволюции и
  // аккадский силлабознак) не должны схлопываться в один id.
  function addToCompare(source, signId) {
    var key = source + ':' + signId;
    var list = read(COMPARE_KEY, []);
    if (list.indexOf(key) === -1) list.push(key);
    write(COMPARE_KEY, list);
    if (typeof LabToast !== 'undefined') LabToast.show('Добавлено в сравнение');
  }

  function getCompareList() {
    return read(COMPARE_KEY, []);
  }

  window.PaleoLinguistics = {
    init: init,
    showEvolution: showEvolution,
    showSignDetail: showSignDetail,
    addToCompare: addToCompare,
    getCompareList: getCompareList
  };
  return window.PaleoLinguistics;
})();
