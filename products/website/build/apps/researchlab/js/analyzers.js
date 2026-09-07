/*
 * analyzers.js — frontend-модуль анализаторов Research Lab
 * Метаданные: заголовок — Анализаторы; описание — интерфейс слоя, ИИ и диалекта;
 * версия — 1.0.0; дата создания — 2026-08-02.
 *
 * Архитектура: AnalyzerAdapter сначала пробует локальный endpoint, затем
 * использует автономный mock. UI не зависит от способа получения результата.
 */
(function(window, document) {
  'use strict';

  var ICONS = {
    layer: 'assets/icons/32/ui/map.png',
    ai: 'assets/icons/32/crafts/hammer-and-chisel.png',
    dialect: 'assets/icons/32/scribe/scroll.png',
    tensor: 'assets/icons/32/ui/scales.png',
    word: 'assets/icons/32/ui/scroll.png',
    state: 'assets/icons/32/paleo/track.png'
  };
  var LAYERS = [
    { id: 'hellenization', name: 'Эллинизация', markers: ['абстракц', 'идея', 'философ', 'категор', 'теор'], diagnosis: 'Предметное действие переводится в отвлечённую идею или категорию.' },
    { id: 'psychologization', name: 'Психологизация', markers: ['психик', 'эмоц', 'личност', 'мотивац', 'травм', 'чувств'], diagnosis: 'Источник движения помещается во внутреннее состояние вместо описания среды и действия.' },
    { id: 'juridization', name: 'Юридизация', markers: ['закон', 'право', 'обязан', 'долг', 'вина', 'контракт', 'запрет'], diagnosis: 'Живое отношение собирается как норма, долг, вина или контракт.' },
    { id: 'technology', name: 'Технослой', markers: ['систем', 'алгоритм', 'оптимиз', 'ресурс', 'функц', 'интерфейс', 'контрол'], diagnosis: 'Поток описывается как управляемый ресурс, система или функция.' },
    { id: 'media', name: 'Медиа-слой', markers: ['информац', 'сообщен', 'новост', 'контент', 'аудитор', 'нарратив', 'публикац'], diagnosis: 'Событие может быть заменено его упаковкой, сообщением или метрикой внимания.' },
    { id: 'religious_calque', name: 'Религиозная калька', markers: ['бог', 'господ', 'свят', 'грех', 'молитв', 'жертв', 'спасен', 'церков'], diagnosis: 'Готовая переводная рамка закрывает исходную механику образа.' },
    { id: 'paleo', name: 'Палео-слой', markers: ['поток', 'двер', 'дом', 'крюк', 'оград', 'огон', 'движен', 'сред', 'давар', 'свив', 'хук', 'эмет', 'шекер'], diagnosis: 'Сохраняется предметная механика потока, среды, прохода и перехода.' },
    { id: 'physical', name: 'Физический слой', markers: ['тел', 'ног', 'глаз', 'земл', 'камен', 'ветер', 'дыхан', 'давлен', 'удар', 'откры', 'закры'], diagnosis: 'Текст опирается на наблюдаемое тело и материальную среду.' }
  ];
  var DIALECTS = {
    grecisims: { title: 'Грецизмы', terms: { 'философия': 'חכמה / мудрость действия', 'теория': 'ראיה / наблюдаемый образ', 'категория': 'שורש / корень', 'психология': 'Свива / среда и отношение', 'идея': 'Давар / слово-действие' } },
    latinisms: { title: 'Латинизмы', terms: { 'контракт': 'ברית / связка', 'обязанность': 'Хук / установленный ход', 'юрисдикция': 'граница действия', 'ресурс': 'поток', 'эффективность': 'коах / действующая сила' } }
  };

  function esc(value) { var node = document.createElement('div'); node.textContent = value == null ? '' : String(value); return node.innerHTML; }
  function words(text) { return (text.match(/[\p{L}\p{N}_-]+/gu) || []); }
  function sentences(text) { return text.split(/(?<=[.!?…])\s+|\n+/).filter(function(item) { return item.trim(); }); }
  function markerMatches(word, marker) { var value = word.toLowerCase(); if (marker === 'право') return /^(право|права|праву|праве|правы)$/.test(value); return value.indexOf(marker) !== -1; }

  function layerAnalysis(text) {
    var tokens = words(text), results = LAYERS.map(function(layer) {
      var found = {}, markerCounts = {};
      tokens.forEach(function(word, index) {
        layer.markers.forEach(function(marker) {
          if (markerMatches(word, marker)) { found[index] = word; markerCounts[marker] = (markerCounts[marker] || 0) + 1; }
        });
      });
      var count = Object.keys(found).length;
      return { id: layer.id, name: layer.name, count: count, percentage: tokens.length ? +(count / tokens.length * 100).toFixed(2) : 0, markers: markerCounts, diagnosis: layer.diagnosis };
    });
    var dominant = results.reduce(function(best, item) { return !best || item.count > best.count ? item : best; }, null);
    return { words: tokens.length, sentences: sentences(text).length, layers: results, dominant: dominant && dominant.count ? dominant : null };
  }

  function dialectAnalysis(text) {
    var lower = text.toLowerCase(), result = {};
    Object.keys(DIALECTS).forEach(function(group) {
      result[group] = Object.keys(DIALECTS[group].terms).filter(function(term) { return lower.indexOf(term) !== -1; }).map(function(term) { return { term: term, replacement: DIALECTS[group].terms[term] }; });
    });
    result.total = result.grecisims.length + result.latinisms.length;
    return result;
  }

  function mockAnalyze(text, kind, settings) {
    var layer = layerAnalysis(text);
    if (kind === 'layer') return Promise.resolve({ source: 'mock', kind: kind, layer: layer });
    if (kind === 'dialect') return Promise.resolve({ source: 'mock', kind: kind, dialect: dialectAnalysis(text), layer: layer });
    var dominant = layer.dominant ? layer.dominant.name : 'не выявлен';
    return Promise.resolve({ source: 'mock', kind: kind, model: settings.model, mode: settings.mode, layer: layer, interpretation: 'Смысловой контур текста тяготеет к слою «' + dominant + '». Это предварительная интерпретация: её следует проверить через Давар, Свиву и критерий эмет / шекер.', recommendations: ['Отделить наблюдаемое действие от абстрактного ярлыка.', 'Вернуть в текст тело, среду и направление потока.', 'Сверить заменяемый термин с палео-аналогом и зафиксировать основание замены.'] });
  }

  var AnalyzerAdapter = {
    endpoint: '/api/analyzers/analyze',
    analyze: function(text, kind, settings) {
      if (!text.trim()) return Promise.reject(new Error('Введите текст перед запуском анализа.'));
      return fetch(this.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: text, kind: kind, settings: settings || {} }) }).then(function(response) {
        if (!response.ok) throw new Error('API unavailable');
        return response.json();
      }).catch(function() { return mockAnalyze(text, kind, settings || { model: 'golem-local', mode: 'local' }); });
    }
  };

  function hero(kicker, title, description, meta) {
    if (window.LabHero && window.LabHero.render) {
      return window.LabHero.render({
        kicker: kicker,
        title: title,
        subtitle: description,
        icon: 'archaeology/testtube.png',
        meta: meta || ['8 слоёв', 'локальный mock', 'эмет / шекер']
      });
    }
    return '<div class="analyzers-hero">' + esc(kicker) + '</div><div><h1>' + esc(title) + '</h1><p>' + esc(description) + '</p></div>';
  }
  function pageHead(icon, title, description) { return '<div class="analyzer-page-head"><img class="analyzer-page-head__icon" src="' + icon + '" alt=""><div><h1>' + esc(title) + '</h1><p>' + esc(description) + '</p></div></div>'; }
  function card(icon, title, description, route) { return '<a class="gc-card" href="#' + route + '"><span class="gc-card-icon"><img src="' + icon + '" width="20" height="20" alt=""></span><span class="gc-card-body"><span class="gc-card-title">' + esc(title) + '</span><span class="gc-card-desc">' + esc(description) + '</span></span><span class="gc-card-arrow" aria-hidden="true">→</span></a>'; }

  function renderOverview(container) {
    container.innerHTML = '<div class="analyzers-shell"><div class="analyzers-grid">' + card(ICONS.layer, 'Слой-анализ', 'Показывает процентное соотношение восьми слоёв подмен и формирует краткую диагностику доминирующего слоя.', 'layer-analyzer') + card(ICONS.ai, 'ИИ-анализ', 'Даёт смысловую интерпретацию и рекомендации. Сейчас работает автономный mock; API подключается через единый адаптер.', 'ai-analyzer') + card(ICONS.dialect, 'Диалект-анализ', 'Находит грецизмы и латинизмы и предлагает ивритские или палео-аналоги для дальнейшей проверки.', 'dialect-analyzer') + card(ICONS.state, 'Анализатор состояний', 'Выберите состояние и получите соответствующий псалом с краткой диагностикой перехода.', 'state-analyzer') + card(ICONS.tensor, 'Лингвистический тензор', 'Точечное сравнение двух языков по шести осям: где поток удерживает действие, корень и физику образа.', 'linguistic-tensor') + card(ICONS.word, 'Разбор слов', 'Разбирает слово по палео-механике: показывает палео-образы, корень, значение и цепочку подмен.', 'word-analyzer') + '</div></div>';
  }

  function copyText(text, status) {
    function done() { status.textContent = 'Текст псалма скопирован.'; }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(function() { fallback(); });
      return;
    }
    fallback();
    function fallback() {
      var area = document.createElement('textarea');
      area.value = text;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      try { document.execCommand('copy'); done(); } catch (error) { status.textContent = 'Не удалось скопировать текст.'; }
      document.body.removeChild(area);
    }
  }

  function renderStateAnalyzer(container) {
    container.innerHTML = '<div class="analyzers-shell">' + pageHead(ICONS.state, 'Анализатор состояний', 'Выберите состояние потока и получите связанный псалом с краткой диагностикой.') + '<div class="state-analyzer-workspace"><section class="analyzer-panel"><label class="analyzer-label" for="state-analyzer-select">Состояние</label><select class="analyzer-select" id="state-analyzer-select"><option value="">Выберите состояние</option></select><p class="analyzer-helper">Псалом и диагностика загружаются из локального набора данных Research Lab.</p></section><section class="analyzer-panel state-analyzer-result" id="state-analyzer-result" aria-live="polite"><div class="analyzer-empty">Выберите состояние, чтобы открыть псалом.</div></section></div></div>';
    var select = container.querySelector('#state-analyzer-select');
    var result = container.querySelector('#state-analyzer-result');
    fetch('data/tehillim.json').then(function(response) {
      if (!response.ok) throw new Error('Не удалось загрузить Теhилим.');
      return response.json();
    }).then(function(items) {
      items.forEach(function(item) {
        var option = document.createElement('option');
        option.value = item.state;
        option.textContent = item.label || item.state;
        select.appendChild(option);
      });
      select.addEventListener('change', function() {
        var item = items.find(function(entry) { return entry.state === select.value; });
        if (!item) { result.innerHTML = '<div class="analyzer-empty">Выберите состояние, чтобы открыть псалом.</div>'; return; }
        var copyPayload = 'Теhилим ' + item.psalm + '\n\n' + item.text;
        result.innerHTML = '<div class="state-analyzer-heading"><span class="analyzers-chip">' + esc(item.label || item.state) + '</span><strong>Псалом ' + esc(item.psalm) + '</strong></div><div class="state-analyzer-psalm" dir="auto">' + esc(item.text) + '</div><div class="analyzer-diagnosis"><strong>Диагностика состояния</strong>' + esc(item.diagnosis) + '</div><div class="analyzer-controls"><button class="lab-btn lab-btn-secondary" type="button" id="state-analyzer-copy">Скопировать текст</button><span class="analyzer-status" id="state-analyzer-status" role="status" aria-live="polite"></span></div>';
        container.querySelector('#state-analyzer-copy').addEventListener('click', function() { copyText(copyPayload, container.querySelector('#state-analyzer-status')); });
      });
    }).catch(function(error) { result.innerHTML = '<div class="lab-alert lab-alert-error">' + esc(error.message) + '</div>'; });
  }

  function resultShell(container, body) { var result = container.querySelector('.analyzer-result'); if (result) result.innerHTML = body; }
  function layerResult(result) {
    var rows = result.layers.map(function(item) { return '<div class="analyzer-layer-row"><div class="analyzer-layer-row__head"><span>' + esc(item.name) + '</span><span class="analyzer-layer-row__value">' + item.percentage.toFixed(2) + '% · ' + item.count + '</span></div><div class="analyzer-bar"><span style="width:' + item.percentage + '%"></span></div></div>'; }).join('');
    var table = result.layers.map(function(item) { var markers = Object.keys(item.markers).map(function(key) { return esc(key) + ' × ' + item.markers[key]; }).join(', ') || '—'; return '<tr><td>' + esc(item.name) + '</td><td>' + markers + '</td><td>' + item.percentage.toFixed(2) + '%</td></tr>'; }).join('');
    return '<div class="analyzer-result__summary"><div class="analyzer-stat"><strong>' + result.words + '</strong><span>слов</span></div><div class="analyzer-stat"><strong>' + result.sentences + '</strong><span>предложений</span></div><div class="analyzer-stat"><strong>' + (result.dominant ? esc(result.dominant.name) : '—') + '</strong><span>доминанта</span></div></div><div aria-label="Проценты слоёв">' + rows + '</div><div class="analyzer-table-wrap"><table class="analyzer-table"><thead><tr><th>Слой</th><th>Маркеры</th><th>Доля</th></tr></thead><tbody>' + table + '</tbody></table></div>' + (result.dominant ? '<div class="analyzer-diagnosis"><strong>Диагностика: ' + esc(result.dominant.name) + '</strong>' + esc(result.dominant.diagnosis) + '</div>' : '<div class="analyzer-empty">Маркеры слоёв не выявлены. Проверьте текст через физический образ и Свиву.</div>');
  }
  function dialectResult(result) {
    function group(key) { var items = result.dialect[key]; return '<div class="analyzer-dialect-card"><h3>' + esc(DIALECTS[key].title) + ' <small>(' + items.length + ')</small></h3>' + (items.length ? items.map(function(item) { return '<div class="analyzer-dialect-item"><span class="analyzer-mark">' + esc(item.term) + '</span><span>→ ' + esc(item.replacement) + '</span></div>'; }).join('') : '<p class="analyzer-helper">Не найдены</p>') + '</div>'; }
    return '<div class="analyzer-result__summary"><div class="analyzer-stat"><strong>' + result.dialect.total + '</strong><span>маркеров</span></div><div class="analyzer-stat"><strong>' + result.layer.words + '</strong><span>слов проверено</span></div></div><div class="analyzer-dialect-grid">' + group('grecisims') + group('latinisms') + '</div><div class="analyzer-diagnosis"><strong>Рекомендация</strong>Рассматривайте замену как рабочую гипотезу: подтвердите её через корень, палео-образ и физическую конструкцию.</div>';
  }
  function aiResult(result) { return '<div class="analyzer-diagnosis"><strong>Источник: ' + esc(result.mode === 'api' ? 'API' : 'локальный mock') + ' · модель: ' + esc(result.model) + '</strong>' + esc(result.interpretation) + '</div><div class="analyzer-ai-copy"><h3>Рекомендации по очищению</h3><ul class="analyzer-list">' + result.recommendations.map(function(item) { return '<li>' + esc(item) + '</li>'; }).join('') + '</ul></div><div class="analyzer-diagnosis"><strong>Слой-сигнал</strong>' + layerResult(result.layer) + '</div>'; }

  function renderAnalyzerPage(container, kind) {
    var isLayer = kind === 'layer', isAI = kind === 'ai';
    var title = isLayer ? 'Слой-анализ' : isAI ? 'ИИ-анализ' : 'Диалект-анализ';
    var desc = isLayer ? 'Измерьте присутствие восьми слоёв и найдите доминирующий сдвиг.' : isAI ? 'Получите смысловую интерпретацию с прозрачным выбором режима и модели.' : 'Найдите грецизмы и латинизмы и соберите карту возможных замен.';
    var settings = isAI ? '<div class="analyzer-settings"><label class="analyzer-label">Модель<select class="analyzer-select" id="analyzer-model"><option value="golem-local">Golem Local</option><option value="paleo-reasoner">Paleo Reasoner</option><option value="api-default">API Default</option></select></label><label class="analyzer-label">Режим<select class="analyzer-select" id="analyzer-mode"><option value="local">Локально</option><option value="api">API</option></select></label></div>' : '';
    container.innerHTML = '<div class="analyzers-shell">' + pageHead(isLayer ? ICONS.layer : isAI ? ICONS.ai : ICONS.dialect, title, desc) + '<div class="analyzer-workspace"><form class="analyzer-panel" id="analyzer-form"><h2>Входной Давар</h2>' + settings + '<label class="analyzer-label" for="analyzer-input">Текст для анализа</label><textarea class="analyzer-textarea" id="analyzer-input" required placeholder="Вставьте текст для вертикального прохода…"></textarea><div class="analyzer-controls"><button class="lab-btn lab-btn-primary" type="submit">Запустить анализ</button><button class="lab-btn lab-btn-secondary" type="button" id="analyzer-clear">Очистить</button></div><p class="analyzer-helper">Результат — диагностический сигнал, а не автоматический приговор. Сверяйте его с методологией MANIFEST.</p><div class="analyzer-status" id="analyzer-status" role="status" aria-live="polite"></div></form><section class="analyzer-panel" aria-live="polite"><h2>Результат прохода</h2><div class="analyzer-result"><div class="analyzer-empty">Заполните поле и запустите анализ.</div></div></section></div></div>';
    var form = container.querySelector('#analyzer-form'), input = container.querySelector('#analyzer-input'), status = container.querySelector('#analyzer-status');
    form.addEventListener('submit', function(event) { event.preventDefault(); status.textContent = 'Проход выполняется…'; var settingsValue = { model: container.querySelector('#analyzer-model') ? container.querySelector('#analyzer-model').value : 'golem-local', mode: container.querySelector('#analyzer-mode') ? container.querySelector('#analyzer-mode').value : 'local' }; AnalyzerAdapter.analyze(input.value, kind, settingsValue).then(function(result) { status.textContent = result.source === 'mock' ? 'Готово · автономный mock' : 'Готово · API'; resultShell(container, isLayer ? layerResult(result.layer) : kind === 'dialect' ? dialectResult(result) : aiResult(result)); }).catch(function(error) { status.textContent = error.message; }); });
    container.querySelector('#analyzer-clear').addEventListener('click', function() { input.value = ''; status.textContent = ''; resultShell(container, '<div class="analyzer-empty">Заполните поле и запустите анализ.</div>'); input.focus(); });
  }

  window.GolemAnalyzers = { render: function(container, moduleId) { if (moduleId === 'analyzers') renderOverview(container); else if (moduleId === 'state-analyzer') renderStateAnalyzer(container); else renderAnalyzerPage(container, moduleId === 'layer-analyzer' ? 'layer' : moduleId === 'ai-analyzer' ? 'ai' : 'dialect'); }, adapter: AnalyzerAdapter, layers: LAYERS };
})(window, document);