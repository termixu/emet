/**
 * checkers-comparator.js — Сравнение переводов + Свидетели
 * Вкладка «Сравнение»: параллельный просмотр ТМ, LXX, Синодального.
 * Вкладка «Свидетели»: таблица текстуальных расхождений ТМ/LXX/Qumran/Пешитта + карта.
 */

const TransComp = (function() {
  'use strict';

  // Тестовые данные для демонстрации (вкладка «Сравнение»)
  const DATA = {
    'Берешит 1:1': {
      tm: 'בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ',
      lxx: 'Ἐν ἀρχῇ ἐποίησεν ὁ θεὸς τὸν οὐρανὸν καὶ τὴν γῆν',
      synodal: 'В начале сотворил Бог небо и землю.',
      // Тестовая карта источников для Берешит 1:1.
      sourceWitness: {
        qumran: 'בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ',
        samaritan: 'בְּרֵאשִׁית בָּרָא אֱלֹהִם אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ',
        note: 'Для Берешит 1:1 ТМ и Кумранское чтение совпадают; в Самаритянском слое отмечено одно расхождение написания.'
      }
    },
    'Берешит 1:2': {
      tm: 'וְהָאָרֶץ הָיְתָה תֹהוּ וָבֹהוּ וְחֹשֶׁךְ עַל־פְּנֵי תְהוֹם וְרוּחַ אֱלֹהִים מְרַחֶפֶת עַל־פְּנֵי הַמָּיִם',
      lxx: 'ἡ δὲ γῆ ἦν ἀόρατος καὶ ἀκατασκεύαστος, καὶ σκότος ἐπάνω τῆς ἀβύσσου, καὶ πνεῦμα θεοῦ ἐπεφέρετο ἐπάνω τοῦ ὕδατος',
      synodal: 'Земля же была безвидна и пуста, и тьма над бездною, и Дух Божий носился над водою.'
    },
    'Берешит 1:3': {
      tm: 'וַיֹּאמֶר אֱלֹהִים יְהִי אוֹר וַיְהִי אוֹר',
      lxx: 'καὶ εἶπεν ὁ θεός· γενηθήτω φῶς. καὶ ἐγένετο φῶς',
      synodal: 'И сказал Бог: да будет свет. И стал свет.'
    },
    'Теилим 23:1': {
      tm: 'מִזְמוֹר לְדָוִד יְהוָה רֹעִי לֹא אֶחְסָר',
      lxx: 'Ψαλμὸς τῷ Δαυίδ. Κύριος ποιμαίνει με, καὶ οὐδέν με ὑστερήσει',
      synodal: 'Псалом Давида. Господь — Пастырь мой; я ни в чем не буду нуждаться.'
    },
    'Теилим 23:2': {
      tm: 'בִּנְאוֹת דֶּשֶׁא יַרְבִּיצֵנִי עַל מֵי מְנֻחוֹת יְנַהֲלֵנִי',
      lxx: 'εἰς τόπον χλόης, ἐκεῖ με κατεσκήνωσεν, ἐπὶ ὕδατος ἀναπαύσεως ἐξέθρεψέν με',
      synodal: 'Он покоит меня на злачных пажитях и водит меня к водам тихим.'
    },
    'Исайя 53:5': {
      tm: 'וְהוּא מְחֹלָל מִפְּשָׁעֵינוּ מְדֻכָּא מֵעֲוֹנֹתֵינוּ מוּסַר שְׁלוֹמֵנוּ עָלָיו וּבַחֲבֻרָתוֹ נִרְפָּא לָנוּ',
      lxx: 'αὐτὸς δὲ ἐτραυματίσθη διὰ τὰς ἀνομίας ἡμῶν καὶ μεμαλάκισται διὰ τὰς ἁμαρτίας ἡμῶν· παιδεία εἰρήνης ἡμῶν ἐπʼ αὐτόν· τῷ μώλωπι αὐτοῦ ἡμεῖς ἰάθημεν',
      synodal: 'Он изъязвлен был за грехи наши и мучим за беззакония наши; наказание мира нашего было на Нем, и ранами Его мы исцелились.'
    },
    'Шмот 20:2': {
      tm: 'אָנֹכִי יְהוָה אֱלֹהֶיךָ אֲשֶׁר הוֹצֵאתִיךָ מֵאֶרֶץ מִצְרַיִם מִבֵּית עֲבָדִים',
      lxx: 'ἐγώ εἰμι κύριος ὁ θεός σου, ὅστις ἐξήγαγόν σε ἐκ γῆς Αἰγύπτου, ἐξ οἴκου δουλείας',
      synodal: 'Я Господь, Бог твой, который вывел тебя из земли Египетской, из дома рабства.'
    },
    'Шмот 20:3': {
      tm: 'לֹא יִהְיֶה לְךָ אֱלֹהִים אֲחֵרִים עַל פָּנָי',
      lxx: 'οὐκ ἔσονταί σοι θεοὶ ἕτεροι πλὴν ἐμοῦ',
      synodal: 'Да не будет у тебя других богов пред лицем Моим.'
    }
  };

  let _witnesses = null;
  let _activeWitnessId = null;

  function escHtml(s) {
    var d = document.createElement('div');
    d.textContent = s == null ? '' : String(s);
    return d.innerHTML;
  }

  function dataPath(name) {
    return new URL('data/' + name, document.baseURI).href;
  }

  // ===== СРАВНИТЕЛЬНАЯ КАРТА =====
  function search() {
    var query = document.getElementById('tc-search').value.trim();
    var results = document.getElementById('tc-results');
    var placeholder = document.getElementById('tc-placeholder');

    if (!query) {
      results.style.display = 'none';
      placeholder.style.display = 'block';
      placeholder.innerHTML = '<div class="lab-alert lab-alert-info">Введите ссылку на стих. Пример: <strong>Берешит 1:1</strong>.</div>';
      return;
    }

    var matchKey = null, exactMatch = null;
    Object.keys(DATA).forEach(function(key) {
      if (key.toLowerCase() === query.toLowerCase()) exactMatch = key;
      if (!matchKey && key.toLowerCase().indexOf(query.toLowerCase()) !== -1) matchKey = key;
    });
    matchKey = exactMatch || matchKey;

    if (!matchKey) {
      results.style.display = 'none';
      placeholder.style.display = 'block';
      placeholder.innerHTML = '<div class="lab-alert lab-alert-warn">Данные для «' + escHtml(query) + '» пока не загружены. Попробуйте: <strong>Берешит 1:1</strong>, <strong>Теилим 23:1</strong>, <strong>Исайя 53:5</strong>, <strong>Шмот 20:2</strong>.</div>';
      return;
    }

    var entry = DATA[matchKey];
    var render = function() {
      var witness = (_witnesses || []).find(function(item) {
        return item.ref.toLowerCase() === matchKey.toLowerCase();
      });
      renderComparisonMap(matchKey, entry, witness || entry.sourceWitness);
      results.style.display = 'block';
      placeholder.style.display = 'none';
    };

    if (_witnesses) render();
    else loadWitnesses().then(render).catch(render);
  }

  function setComparisonText(id, value, fallback) {
    var node = document.getElementById(id);
    if (node) node.textContent = value || fallback || 'Нет данных для этого стиха.';
  }

  function comparisonWords(value) {
    return String(value || '').trim().split(/\s+/).filter(Boolean);
  }

  function normalizeWord(word) {
    return String(word || '').replace(/[\u0591-\u05C7\u05D0-\u05EA]/g, function(mark) {
      return /[\u05D0-\u05EA]/.test(mark) ? mark : '';
    }).replace(/[.,;:!?()\[\]{}"'׳״־—-]/g, '');
  }

  function renderComparedText(id, value, reference, fallback, isReference) {
    var node = document.getElementById(id);
    if (!node) return { match: 0, diff: 0, minor: 0, missing: 0 };
    var words = comparisonWords(value);
    if (!words.length) {
      node.innerHTML = '<span class="tc-word tc-word-missing">[—] ' + escHtml(fallback) + '</span>';
      return { match: 0, diff: 0, minor: 0, missing: 1 };
    }
    var referenceWords = comparisonWords(reference);
    var counts = { match: 0, diff: 0, minor: 0, missing: 0 };
    node.innerHTML = words.map(function(word, index) {
      var status = isReference ? 'match' : (index >= referenceWords.length ? 'missing' : (normalizeWord(word) === normalizeWord(referenceWords[index]) ? 'match' : (normalizeWord(word).length === normalizeWord(referenceWords[index]).length ? 'minor' : 'diff')));
      counts[status]++;
      return '<span class="tc-word ' + (status === 'diff' ? 'red-zone' : 'tc-word-' + status) + '">' + escHtml(word) + '</span>';
    }).join(' ');
    if (!isReference && referenceWords.length > words.length) counts.missing += referenceWords.length - words.length;
    return counts;
  }

  function renderSourceAnalysis(tm, qumran, samaritan, witness) {
    var total = { match: 0, diff: 0, minor: 0, missing: 0 };
    [{ id: 'tc-qumran', value: qumran, fallback: 'Прямого фрагмента не сохранилось.' },
      { id: 'tc-samaritan', value: samaritan, fallback: 'Самаритянское чтение не сохранилось.' }].forEach(function(source) {
      var counts = renderComparedText(source.id, source.value, tm, source.fallback, false);
      total.match += counts.match; total.diff += counts.diff; total.minor += counts.minor; total.missing += counts.missing;
    });
    renderComparedText('tc-tm', tm, tm, 'Нет данных', true);
    var sum = total.match + total.diff + total.minor + total.missing || 1;
    var ratio = document.getElementById('tc-source-ratio');
    if (ratio) ratio.innerHTML = '<span class="tc-ratio-match">Совпадения ' + Math.round(total.match / sum * 100) + '%</span><span class="tc-ratio-diff">Расхождения ' + Math.round((total.diff + total.minor) / sum * 100) + '%</span><span class="tc-ratio-missing">Отсутствуют ' + Math.round(total.missing / sum * 100) + '%</span>';
    var keyDifference = document.getElementById('tc-source-key-difference');
    if (keyDifference) keyDifference.textContent = (witness && witness.note) || 'Слова источников сопоставлены с ТМ по позиции; отличия показывают сдвиг чтения, пропуски отмечены отдельно.';
  }

  function renderComparisonMap(ref, entry, witness) {
    renderSourceAnalysis(entry.tm, witness && witness.qumran, witness && witness.samaritan, witness);
    setComparisonText('tc-lxx', (witness && witness.lxx) || entry.lxx, 'Нет данных');
    setComparisonText('tc-peshitta', witness && witness.peshitta, 'Данные Пешитты не загружены.');
    setComparisonText('tc-synodal', entry.synodal, 'Нет данных');
    setComparisonText('tc-modern', '', 'Современный русский перевод пока не загружен.');
    setComparisonText('tc-divergence', witness && witness.note, 'Для этого стиха отдельное описание расхождения пока не загружено.');
    setComparisonText('tc-paleo-analysis', witness && witness.paleo_analysis, 'Палео-разбор для этого стиха пока не загружен.');

    var divergenceText = witness && witness.note;
    var paleoText = witness && witness.paleo_analysis;
    var analysisSection = document.getElementById('tc-analysis-section');
    if (analysisSection) analysisSection.hidden = !(divergenceText || paleoText);
    var divergenceBlock = document.getElementById('tc-divergence-block');
    var paleoBlock = document.getElementById('tc-paleo-block');
    if (divergenceBlock) divergenceBlock.hidden = !divergenceText;
    if (paleoBlock) paleoBlock.hidden = !paleoText;
    var status = witness ? (DIVERGENCE_CLASS[witness.divergence] || 'highlight-gold') : 'highlight-gold';
    var divergence = document.getElementById('tc-divergence');
    if (divergence) divergence.className = 'tc-analysis-text ' + status;
  }

  // ===== ВКЛАДКА «СВИДЕТЕЛИ» =====
  const DIVERGENCE_LABEL = { critical: 'Расходится', partial: 'Частично', minor: 'Совпадает' };
  const DIVERGENCE_CLASS = { critical: 'highlight-red', partial: 'highlight-gold', minor: 'highlight-green' };

  function loadWitnesses() {
    var panel = document.getElementById('tc-witnesses-table');
    if (panel) panel.innerHTML = '<div class="lab-spinner show"><div class="loader"></div><div class="spinner-text">Загрузка свидетелей...</div></div>';

    return fetch(dataPath('witnesses.json'))
      .then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function(data) {
        _witnesses = Array.isArray(data) ? data : [];
        renderWitnessesTable();
        renderDivergenceMap();
      })
      .catch(function(err) {
        _witnesses = [];
        if (panel) panel.innerHTML = '<div class="lab-alert lab-alert-error">Ошибка загрузки свидетелей: ' + escHtml(err.message) + '</div>';
      });
  }

  function renderWitnessesTable() {
    var panel = document.getElementById('tc-witnesses-table');
    if (!panel || !_witnesses) return;

    var rows = _witnesses.map(function(w) {
      var dcls = DIVERGENCE_CLASS[w.divergence] || '';
      return '<tr class="tc-witness-row" data-id="' + escHtml(w.id) + '">' +
        '<td><button type="button" class="tc-verse-btn" data-id="' + escHtml(w.id) + '">' + escHtml(w.ref) + '</button></td>' +
        '<td>' + escHtml(w.tm_note) + '</td>' +
        '<td>' + escHtml(w.lxx_note) + '</td>' +
        '<td>' + escHtml(w.qumran_note) + '</td>' +
        '<td>' + escHtml(w.peshitta_note) + '</td>' +
        '<td><span class="' + dcls + '">' + escHtml(DIVERGENCE_LABEL[w.divergence] || '') + '</span> — ' + escHtml(w.note) + '</td>' +
      '</tr>';
    }).join('');

    panel.innerHTML = '<table class="lab-table tc-witnesses-tbl">' +
      '<thead><tr><th>Стих</th><th>ТМ</th><th>LXX</th><th>Qumran</th><th>Пешитта</th><th>Примечание</th></tr></thead>' +
      '<tbody>' + rows + '</tbody></table>';

    panel.querySelectorAll('.tc-verse-btn').forEach(function(btn) {
      btn.addEventListener('click', function() { showWitnessDetail(btn.dataset.id); });
    });
  }

  function renderDivergenceMap() {
    var container = document.getElementById('tc-divergence-map');
    if (!container || !_witnesses || !_witnesses.length) return;

    // Легенда
    var legend = '<div class="tc-map-legend">' +
      '<span><span class="dot dot-match"></span> Совпадает</span>' +
      '<span><span class="dot dot-partial"></span> Частично</span>' +
      '<span><span class="dot dot-diverge"></span> Расходится</span>' +
    '</div>';

    // SVG-карта: радиальная, центр — стих, 4 источника по кругу
    var cx = 200, cy = 180, radius = 120;
    var sources = ['ТМ', 'LXX', 'Qumran', 'Пешитта'];
    var activeW = _activeWitnessId ? _witnesses.find(function(x) { return x.id === _activeWitnessId; }) : null;
    var title = activeW ? activeW.ref : 'Выберите стих';

    var nodes = '', lines = '';
    if (activeW) {
      // Определяем расхождение для каждого источника
      var statuses = {
        'ТМ': 'match', // ТМ — эталон
        'LXX': activeW.divergence === 'critical' ? 'diverge' : (activeW.divergence === 'partial' ? 'partial' : 'match'),
        'Qumran': activeW.divergence === 'critical' ? 'diverge' : (activeW.divergence === 'partial' ? 'partial' : 'match'),
        'Пешитта': activeW.divergence === 'minor' ? 'match' : 'partial'
      };

      sources.forEach(function(src, i) {
        var angle = (i / sources.length) * Math.PI * 2 - Math.PI / 2;
        var x = cx + radius * Math.cos(angle);
        var y = cy + radius * Math.sin(angle);
        var status = statuses[src];
        var lineClass = 'tc-map-line-' + status;
        var nodeClass = 'tc-node-' + status;

        lines += '<line class="' + lineClass + '" x1="' + cx + '" y1="' + cy + '" x2="' + x.toFixed(1) + '" y2="' + y.toFixed(1) + '"></line>';
        nodes += '<g class="tc-map-node ' + nodeClass + '" transform="translate(' + x.toFixed(1) + ',' + y.toFixed(1) + ')">' +
          '<circle r="28"></circle><text dy="4">' + escHtml(src) + '</text></g>';
      });
    }

    var svg = '<svg viewBox="0 0 400 360" role="img" aria-label="Карта расхождений">' +
      lines +
      '<g class="tc-map-center" transform="translate(' + cx + ',' + cy + ')"><circle r="32"></circle>' +
      '<text dy="4">' + escHtml(title.length > 12 ? title.substring(0, 11) + '…' : title) + '</text></g>' +
      nodes +
    '</svg>';

    container.innerHTML = legend + '<div class="tc-map">' + svg + '</div>';
  }

  function showWitnessDetail(id) {
    var w = (_witnesses || []).find(function(x) { return x.id === id; });
    if (!w) return;
    _activeWitnessId = id;

    document.querySelectorAll('.tc-witness-row').forEach(function(row) {
      row.classList.toggle('active', row.dataset.id === id);
    });
    renderDivergenceMap();

    var html = '<div class="tc-detail">' +
      '<div class="tc-detail-section"><h3>ТМ</h3><div class="tc-detail-hebrew" dir="rtl" lang="he">' + escHtml(w.tm) + '</div><div>' + escHtml(w.tm_note) + '</div></div>' +
      '<div class="tc-detail-section"><h3>LXX</h3><div>' + escHtml(w.lxx) + '</div><div>' + escHtml(w.lxx_note) + '</div></div>' +
      '<div class="tc-detail-section"><h3>Qumran</h3><div class="tc-detail-hebrew" dir="rtl">' + escHtml(w.qumran) + '</div><div>' + escHtml(w.qumran_note) + '</div></div>' +
      '<div class="tc-detail-section"><h3>Пешитта</h3><div dir="rtl">' + escHtml(w.peshitta) + '</div><div>' + escHtml(w.peshitta_note) + '</div></div>' +
      '<div class="tc-detail-section"><h3>Разбор</h3><p>' + escHtml(w.paleo_analysis) + '</p></div>' +
    '</div>';

    if (window.LabModal) {
      LabModal.show(w.ref + ' — ' + w.topic, html, '<button class="lab-btn lab-btn-secondary lab-btn-sm" onclick="LabModal.close()">Закрыть</button>');
    }
  }

  // ===== ИНИЦИАЛИЗАЦИЯ =====
  function init() {
    var root = document.getElementById('translation-comparator');
    if (!root) return;

    if (document.getElementById('tc-search')) {
      document.getElementById('tc-search').addEventListener('keydown', function(event) {
        if (event.key === 'Enter') search();
      });
    }
  }

  return {
    init: init,
    search: search,
    showWitnessDetail: showWitnessDetail
  };
})();

window.TransComp = TransComp;
