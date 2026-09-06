/**
 * vision-ui.js — Визуальный анализатор v2
 * Bug #6 fix: сохранение режима в localStorage
 */

const VisionUI = (function() {
  'use strict';

  const HF_API_URL = 'https://api-inference.huggingface.co/models/HuggingFaceTB/SmolVLM-256M-Instruct';
  const LOCAL_API_URL = 'http://localhost:8000/describe';
  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
  const API_KEY_STORAGE = 'golem_hf_api_key';
  const MODE_STORAGE = 'golem_vision_mode';

  let state = {
    mode: localStorage.getItem(MODE_STORAGE) || 'huggingface',
    currentBase64: null,
    isAnalyzing: false
  };

  function init() {
    var savedKey = localStorage.getItem(API_KEY_STORAGE);
    if (savedKey) {
      var el = document.getElementById('vi-apikey');
      if (el) el.value = savedKey;
    }
    // Восстанавливаем режим
    setMode(state.mode);
  }

  function setMode(mode) {
    state.mode = mode;
    localStorage.setItem(MODE_STORAGE, mode);
    document.querySelectorAll('#vision .lab-btn[data-mode]').forEach(function(btn) {
      btn.className = 'lab-btn ' + (btn.dataset.mode === mode ? 'lab-btn-primary' : 'lab-btn-secondary');
    });
  }

  function saveKey() {
    var el = document.getElementById('vi-apikey');
    if (el && el.value.trim()) {
      localStorage.setItem(API_KEY_STORAGE, el.value.trim());
      showToast('API ключ сохранён');
    } else {
      localStorage.removeItem(API_KEY_STORAGE);
      showToast('API ключ удалён');
    }
  }

  function load(event) {
    var file = event.target.files[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      showError('Неподдерживаемый формат. Используйте PNG, JPG или WEBP.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      showError('Файл слишком большой. Максимум 10 МБ.');
      return;
    }

    var reader = new FileReader();
    reader.onload = function(e) {
      state.currentBase64 = e.target.result;
      var img = document.getElementById('vi-img');
      if (img) img.src = state.currentBase64;
      var preview = document.getElementById('vi-preview');
      if (preview) preview.style.display = 'block';
      var placeholder = document.getElementById('vi-placeholder');
      if (placeholder) placeholder.style.display = 'none';
      var btn = document.getElementById('vi-analyze-btn');
      if (btn) btn.disabled = false;
      hideError();
    };
    reader.readAsDataURL(file);
  }

  function remove() {
    state.currentBase64 = null;
    var img = document.getElementById('vi-img');
    if (img) img.src = '';
    var preview = document.getElementById('vi-preview');
    if (preview) preview.style.display = 'none';
    var placeholder = document.getElementById('vi-placeholder');
    if (placeholder) placeholder.style.display = 'block';
    var fileInput = document.getElementById('vi-file');
    if (fileInput) fileInput.value = '';
    var btn = document.getElementById('vi-analyze-btn');
    if (btn) btn.disabled = true;
    var result = document.getElementById('vi-result');
    if (result) result.style.display = 'none';
    hideError();
  }

  async function analyze() {
    if (state.isAnalyzing || !state.currentBase64) return;

    var key = document.getElementById('vi-apikey') ? document.getElementById('vi-apikey').value.trim() : '';
    if (state.mode === 'huggingface' && !key) {
      showError('Введите API ключ Hugging Face.');
      return;
    }

    state.isAnalyzing = true;
    var btn = document.getElementById('vi-analyze-btn');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i data-lucide="loader-circle" aria-hidden="true"></i> Анализ…';
      if (window.LabIcons) window.LabIcons.sync();
    }
    var spinner = document.getElementById('vi-spinner');
    if (spinner) spinner.classList.add('show');
    var result = document.getElementById('vi-result');
    if (result) result.style.display = 'none';
    hideError();

    try {
      var description;
      if (state.mode === 'huggingface') {
        description = await analyzeHF(key);
      } else {
        description = await analyzeLocal();
      }

      var body = document.getElementById('vi-result-body');
      if (body) body.textContent = description;
      var badge = document.getElementById('vi-model-badge');
      if (badge) badge.textContent = state.mode === 'huggingface' ? 'SmolVLM-256M (HF)' : 'SmolVLM-256M (Local)';
      var ts = document.getElementById('vi-timestamp');
      if (ts) ts.textContent = new Date().toLocaleString('ru-RU');
      if (result) result.style.display = 'block';

    } catch (err) {
      showError(err.message || 'Ошибка анализа.');
      console.error('[VisionUI]', err);
    } finally {
      state.isAnalyzing = false;
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i data-lucide="image" aria-hidden="true"></i> Анализировать';
        if (window.LabIcons) window.LabIcons.sync();
      }
      if (spinner) spinner.classList.remove('show');
    }
  }

  async function analyzeHF(apiKey) {
    var base64Data = state.currentBase64.split(',')[1];
    var response = await fetch(HF_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: {
          image: base64Data,
          prompt: 'Опиши подробно, что изображено на этой картинке. Обрати внимание на текст, символы, знаки, объекты и их расположение. Если видишь древние письмена, символы или подозрительные элементы — укажи их.'
        },
        parameters: { max_new_tokens: 500, temperature: 0.2, top_p: 0.95 }
      })
    });

    if (!response.ok) {
      var errMsg = 'Ошибка API: ' + response.status;
      try {
        var errData = await response.json();
        if (errData.error) errMsg += ' — ' + errData.error;
      } catch(e) {}
      throw new Error(errMsg);
    }

    var data = await response.json();
    if (Array.isArray(data) && data.length > 0) {
      return data[0].generated_text || JSON.stringify(data[0]);
    }
    return data.generated_text || JSON.stringify(data);
  }

  async function analyzeLocal() {
    var response = await fetch(LOCAL_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: state.currentBase64,
        prompt: 'Опиши подробно, что изображено на этой картинке.'
      })
    });

    if (!response.ok) {
      var errMsg = 'Ошибка сервера: ' + response.status;
      try {
        var errData = await response.json();
        if (errData.detail) errMsg += ' — ' + errData.detail;
      } catch(e) {}
      throw new Error(errMsg);
    }

    var data = await response.json();
    return data.description || data.text || data.result || JSON.stringify(data);
  }

  function showError(msg) {
    var el = document.getElementById('vi-error');
    if (el) {
      el.textContent = msg;
      el.style.display = 'block';
    }
  }

  function hideError() {
    var el = document.getElementById('vi-error');
    if (el) el.style.display = 'none';
  }

  function showToast(msg) {
    var t = document.getElementById('vision-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'vision-toast';
      t.style.cssText = 'position:fixed;top:24px;left:50%;transform:translateX(-50%);background:#2c1810;color:#ede0c8;padding:10px 24px;font-size:14px;font-family:"EB Garamond",serif;opacity:0;pointer-events:none;z-index:9999;border-radius:4px;border:1px solid #b8860b;transition:opacity 0.4s;';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = '1';
    setTimeout(function() { t.style.opacity = '0'; }, 2000);
  }

  return {
    init: init,
    setMode: setMode,
    saveKey: saveKey,
    load: load,
    remove: remove,
    analyze: analyze
  };
})();
