# Дизайн-система «Голем»

**Статус:** Активен
**Источник истины:** `products/website/researchlab/css/lab.css`
**Область:** Research Lab (SPA). Другие CSS-файлы модулей (`admin.css`, `root-dictionary.css` и т.д.) не вводят новых переменных — все используют переменные `lab.css`.

Документ описывает текущую реализацию дизайн-системы как она есть в коде. Где реализация расходится с ранее заявленными целевыми значениями — это отмечено отдельно, а не тихо исправлено.

## Содержание
1. [Цвета](#1-цвета)
2. [Типографика](#2-типографика)
3. [Отступы и сетка](#3-отступы-и-сетка)
4. [UI-элементы](#4-ui-элементы)
5. [Тени и глубина](#5-тени-и-глубина)
6. [Анимации](#6-анимации)
6.1 [Слой «современный манускрипт»](#61-слой-современный-манускрипт-этап-b)
6.2 [Linear-Paleo слой](#62-linear-paleo-слой-редизайн-интерфейсов)
  - [Roadmap Scale](#roadmap-scale)
  - [Filter Chips](#filter-chips)
  - [Status Dots](#status-dots)
  - [Meta Line](#meta-line)
  - [Stagger-анимация](#stagger-анимация)
  - [Inline Actions](#inline-actions)
  - [Command Palette](#command-palette-⌘k)
6.3 [Liquid Glass слой](#63-liquid-glass-слой)
7. [Иконки](#7-иконки)
8. [Адаптивность](#8-адаптивность)

---

## 1. Цвета

Две темы переключаются атрибутом `[data-theme="dark"]` на `<html>`/`<body>`. Светлая тема — значения в `:root`, названа в коде «пергамент». Тёмная — переопределения в блоке `[data-theme="dark"]`, названа «скрипторий».

### Светлая тема (пергамент) — `:root`

| Переменная | HEX | Назначение |
|---|---|---|
| `--bg-primary` | `#ede0c8` | Основной фон страницы |
| `--bg-secondary` | `#faf3e0` | Вторичный фон (сайдбар, превью) |
| `--bg-tertiary` | `#f5edd5` | Третичный фон (hover-подложки) |
| `--bg-dark` | `#2c1810` | Фон хедера/футера |
| `--bg-dark-hover` | `#3a2215` | Hover для тёмных элементов (поиск) |
| `--bg-card` | `#faf3e0` | Фон карточек |
| `--text-primary` | `#2c1810` | Основной текст |
| `--text-secondary` | `#5c4a3a` | Вторичный текст |
| `--text-muted` | `#8a7a6a` | Приглушённый текст |
| `--text-light` | `#ede0c8` | Текст на тёмном фоне (хедер) |
| `--text-gold` | `#b8860b` | Золотой текст-акцент |
| `--border-light` | `#d4c4a8` | Светлая граница |
| `--border-dark` | `#4a3020` | Тёмная граница |
| `--border-gold` | `#b8860b` | Золотая граница |
| `--accent-gold` | `#b8860b` | Основной акцент |
| `--accent-gold-hover` | `#8b6508` | Акцент при hover |
| `--accent-red` | `#c0392b` | Опасность/удаление |
| `--accent-red-hover` | `#a93226` | Опасность при hover |
| `--accent-green` | `#2a6a2a` | Успех/подтверждение |
| `--shadow-card` | `rgba(44,24,16,0.08)` | Базовая тень карточки |
| `--shadow-card-hover` | `rgba(44,24,16,0.15)` | Тень карточки при hover |
| `--shadow-soft` | `0 2px 12px rgba(44,24,16,0.10)` | Готовый composite-shadow |

### Тёмная тема (скрипторий) — `[data-theme="dark"]`

| Переменная | HEX | Назначение |
|---|---|---|
| `--bg-primary` | `#2a1f18` | Основной фон |
| `--bg-secondary` | `#33261e` | Вторичный фон |
| `--bg-tertiary` | `#3d2e24` | Третичный фон |
| `--bg-dark` | `#1e1611` | Фон хедера/футера |
| `--bg-dark-hover` | `#2a1f18` | Hover для тёмных элементов |
| `--bg-card` | `#33261e` | Фон карточек |
| `--text-primary` | `#e8dcc8` | Основной текст |
| `--text-secondary` | `#bfae96` | Вторичный текст |
| `--text-muted` | `#8a7a6a` | Приглушённый текст (не меняется) |
| `--text-light` | `#e8dcc8` | Текст на тёмном фоне |
| `--text-gold` | `#d4a030` | Золотой текст-акцент (светлее) |
| `--border-light` | `#4a382a` | Светлая граница |
| `--border-dark` | `#5c3a2a` | Тёмная граница |
| `--accent-gold` | `#d4a030` | Основной акцент (светлее для контраста) |
| `--accent-gold-hover` | `#b8860b` | Акцент при hover |
| `--shadow-card` | `rgba(0,0,0,0.3)` | Базовая тень |
| `--shadow-card-hover` | `rgba(0,0,0,0.5)` | Тень при hover |
| `--shadow-soft` | `0 2px 12px rgba(0,0,0,0.35)` | Composite-shadow |

Примечание: `--border-gold`, `--accent-red`, `--accent-red-hover`, `--accent-green` не переопределены в тёмной теме — используются значения светлой темы в обоих режимах.

### Точечные цвета вне переменных
Алерты и highlight-классы используют захардкоженные HEX (не CSS-переменные), одинаковые в обеих темах:
- `.lab-alert-info`: фон `#e8f0e0`, граница `#b8d0a0`, текст `#2c4a1a`
- `.lab-alert-warn`: фон `#fff5e0`, граница `#e0c8a0`, текст `#6a4a1a`
- `.lab-alert-error`: фон `#fff0f0`, граница `#e0a0a0`, текст `#5c2a2a`
- `.lab-alert-success`: фон `#e8f5e0`, граница `#a0d0a0`, текст `#2a5c2a`
- `.highlight` / `.highlight-gold`: фон `#f5e6c8`
- `.highlight-red`: фон `#fdd`
- `.highlight-green`: фон `#dfd`

---

## 2. Типографика

### Шрифты (переменные)

| Переменная | Стек | Назначение |
|---|---|---|
| `--font-serif` | `'EB Garamond', Georgia, 'Times New Roman', serif` | Основной текст |
| `--font-heading` | `'Cormorant Garamond', Georgia, serif` | Заголовки |
| `--font-hand` | `'Caveat', cursive` | Рукописный акцент |
| `--font-hebrew` | `'Noto Serif Hebrew', 'Times New Roman', serif` | Иврит (`.hebrew`, `[lang="he"]`) |
| `--font-mono` | `'JetBrains Mono', 'Consolas', 'Courier New', monospace` | Код, транслитерация (`code`, `pre`, `kbd`, `.translit`, `.mono`) |

Палео-иврит использует отдельный инлайновый стек (не через переменную): `'Noto Sans Phoenician', 'Segoe UI Historic', 'Arial Unicode MS', 'Times New Roman', serif` — см. `.pk-key-symbol`, `.pk-output-symbol`, `.pk-modal-glyph-fallback` в `lab.css`. Есть fallback-режим `.paleo-fallback`, показывающий `attr(data-fallback)` вместо глифа, когда шрифт не поддерживается.

Все шрифты подключены из Google Fonts одним `@import` в начале `lab.css`.

### Размеры

| Элемент | Размер | Где |
|---|---|---|
| Заголовок модуля (h1) | `38px` | `.module h1` |
| Заголовок модуля (h2) | `28px` | `.module h2` |
| Заголовок дашборда | `40px` | `.dashboard h1` |
| Основной текст (body) | `18px` | `body` |
| Подзаголовок модуля | `17px` | `.module .subtitle` |
| Форма (input/textarea/select) | `16px` | `.lab-input`, `.lab-textarea` |
| Карточка (заголовок) | `20px` | `.lab-card-header` |
| Карточка (текст) | `16px` | `.lab-card-body` |
| Таблица | `15px` | `.lab-table th/td` |
| Мелкий текст | `13-15px` | `.text-small`, футер, поиск |

Примечание: целевые размеры h3 (22px), small (14px), caption (12px) как фиксированные утилитарные классы в коде не заведены — размеры задаются точечно на уровне конкретных селекторов (см. таблицу выше), а не через единую шкалу типографики.

### Межстрочный интервал

- Основной текст (`body`): `line-height: 1.8`
- Карточки, превью, секции: `1.6–1.7` (`.lab-card-body`, `.research-preview`, `.research-section-content`)
- Заголовки (`.module h1`, `.dashboard h1`): не задан явно, наследуется от body (`1.8`); целевое значение `1.4` из плана не реализовано в коде.
- Палео-клавиатура вывод (`.pk-output`): `1.6`

---

## 3. Отступы и сетка

Код не использует единую шкалу spacing-переменных (`--space-xs` и т.п.) — отступы заданы точечно в пикселях на каждом селекторе. Ниже — фактически используемые значения, сгруппированные по величине:

| Категория | Значения в коде | Примеры использования |
|---|---|---|
| xs (~4px) | `4px` | gap между строками клавиатуры, padding бейджей |
| sm (~8px) | `6px, 8px` | gap кнопок хедера, padding вкладок |
| md (~16px) | `14px, 16px, 18px, 20px` | padding карточек, алертов, модалок |
| lg (~24px) | `20px, 24px, 28px` | padding хедера, .lab-content (частично), отступы под подзаголовком |
| xl (~32px) | `30px, 36px` | padding `.lab-content` (30px 36px) |
| 2xl (~48px) | не используется как фиксированное значение | — |

Максимальная ширина контента:
- `.research-preview`: `max-width: 920px` (читаемый текст исследования)
- `.lab-layout`: `max-width: 1400px` (общий layout лаборатории)
- `.research-json-module`: `max-width: 1200px` (JSON-страницы словарей/принципов)

Целевые значения 680px (текст) и 1200px (сетки) из плана: 1200px подтверждён (`.research-json-module`), 680px в коде не встречается — для длинного текста фактически используется 920px (`.research-preview`).

Сетка карточек инструментов (`.tool-grid`):
```css
grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
gap: 20px;
```
На узких экранах (≤900px) переключается на `minmax(200px, 1fr)`, на ≤768px — на `1fr` (одна колонка), `gap: 12px`.

---

## 4. UI-элементы

### Карточки

**`.lab-card`** — универсальная карточка контента.
- padding: `20px`, margin-bottom: `20px`
- border: `1px solid var(--border-light)`, border-radius: `6px`
- shadow: `var(--shadow-soft)` → hover: `0 4px 16px var(--shadow-card-hover)`
- `.lab-card-header`: `20px`, `font-weight: 600`, италик, цвет `--accent-gold`, разделитель снизу
- `.lab-card-body`: `16px`, `line-height: 1.7`

**`.tool-card`** — карточка инструмента на дашборде.
- padding: `24px 20px`, border-radius: `6px`, flex-column, центрирование
- hover: `translateY(-4px)` + тень `0 6px 20px var(--shadow-card-hover)` + граница `--accent-gold`
- active: `translateY(-2px)`
- `.tool-icon`: `48×48px`
- `.tool-name`: `20px`, шрифт `--font-heading`
- `.tool-badge`: `11px`, uppercase, `.new` → фон `--accent-gold`, `.beta` → фон `--bg-dark`

### Кнопки

Общий `.lab-btn`: padding `10px 22px`, `16px`, `font-weight: 700`, border-radius `6px`, тень `0 2px 6px rgba(0,0,0,0.08)`; hover — `translateY(-1px)` + тень усиливается; active — `translateY(1px)`.

| Класс | Фон | Текст | Особое |
|---|---|---|---|
| `.lab-btn-primary` | `--accent-gold` | `#2c1810` | disabled: фон `--border-light`, курсор `not-allowed` |
| `.lab-btn-secondary` | прозрачный | `--accent-gold` | граница `1px solid --accent-gold`, без тени в покое |
| `.lab-btn-danger` | `--accent-red` | `#faf3e0` | hover → `--accent-red-hover`, active → `#8a2a1e` |
| `.lab-btn-sm` | — | `13px` | padding `6px 14px` (модификатор размера) |

Все кнопки и кнопочные компоненты модулей Research Lab (`button`, submit/reset-контролы, `[role="button"]`, `.btn`/`.button`-ссылки) обязаны использовать `border-radius: var(--radius-sm)`. Локальные числовые радиусы и острые углы для кнопок запрещены. Круглая форма (`50%`) допускается только для индикаторов, а pill-форма (`--radius-pill`) — для статусов и чипов.

### Поля ввода

`.lab-input`, `.lab-textarea`, `.lab-select`: padding `10px 14px`, `16px`, border `1px solid var(--border-light)`, border-radius `4px`, фон `--bg-card`.
Focus: граница `--accent-gold` + `box-shadow: 0 0 0 2px rgba(184,134,11,0.15)` (в тёмной теме — `rgba(212,160,48,0.20)`).
`.lab-textarea` — `resize: vertical`. `.lab-select` — `cursor: pointer`.

### Скругление страниц пайплайнов

На страницах списка, создания и деталей пайплайнов острые углы не используются. Каждый визуально самостоятельный контейнер, карточка, заголовочный блок, строка истории или агента, поле ввода и модальное окно получает скругление через токен:

- `--radius-md` — внешние контейнеры, карточки, заголовки и диалоги;
- `--radius-sm` — вложенные блоки, поля, строки списка и группы данных;
- `50%` или `999px` — только для круглых индикаторов и статусов.

При добавлении или изменении UI пайплайна запрещено задавать `border-radius: 0`, `none` либо локальное числовое значение вместо этих токенов.

### Модалки

`.modal-overlay`: fullscreen fixed, фон `rgba(0,0,0,0.55)`, `backdrop-filter: blur(4px)`, z-index `9998`.
`.modal-window`: max-width `600px`, max-height `80vh`, border-radius `6px`, тень `0 8px 32px rgba(0,0,0,0.25)`, анимация появления `modalIn 0.25s ease` (scale 0.95→1 + translateY 8px→0).
Структура: `.modal-header` (padding `16px 20px`, разделитель) / `.modal-body` (padding `20px`, `15px`, `line-height: 1.7`) / `.modal-footer` (padding `12px 20px`, кнопки справа).
Окно `#labModal` несёт класс `.glass-modal` (Liquid Glass, §6.3): полупрозрачное пергаментное стекло + backdrop-blur; на десктопе ширина каппится 480px.

### Алерты

`.lab-alert`: padding `14px 18px`, border-radius `4px`, `15px`, `line-height: 1.6`. Варианты `-info/-warn/-error/-success` — см. таблицу цветов в разделе 1.

### Спиннер

`.lab-spinner .loader`: круг `36×36px`, граница `4px`, верхняя граница `--accent-gold`, анимация `spin 1s linear infinite`.

### Таблицы

`.lab-table`: `border-collapse: collapse`, ячейки padding `10px 14px`, `15px`, разделитель `1px solid var(--border-light)`; заголовок — фон `--bg-primary`, шрифт `--font-heading`; hover строки — фон `--bg-tertiary`.

---

## 5. Тени и глубина

| Уровень | Значение | Где используется |
|---|---|---|
| card | `--shadow-soft` = `0 2px 12px rgba(44,24,16,0.10)` (тёмная тема: `rgba(0,0,0,0.35)`) | `.lab-card`, `.tool-card`, `.export-bar`, `.research-generator-form` в покое |
| card-hover | `0 4px 16px var(--shadow-card-hover)` / `0 6px 20px var(--shadow-card-hover)` | `.lab-card:hover`, `.tool-card:hover` |
| modal | `0 8px 32px rgba(0,0,0,0.25)` | `.modal-window` |
| header/footer | нет тени, только `border-bottom`/`border-top: 1px solid var(--border-dark)` | `.lab-header`, `.lab-footer` |
| sidebar | `4px 0 16px rgba(0,0,0,0.06)` (тёмная тема: `rgba(0,0,0,0.3)`) | `.lab-sidebar` |
| button | `0 2px 6px rgba(0,0,0,0.08)` → hover `0 4px 12px rgba(0,0,0,0.12)` → active `0 1px 3px rgba(0,0,0,0.10)` | `.lab-btn` |
| toast/tooltip | нет собственной тени — граница `1px solid var(--accent-gold)` | `.pk-toast`, `.hotkey-hint` |

---

## 6. Анимации

### Длительность и easing

Заданы двумя переменными (не тремя, как в целевом плане — `slow` отдельной переменной нет, для медленных переходов длительность указывается инлайн):

| Переменная/значение | Длительность | Easing | Где |
|---|---|---|---|
| `--transition-fast` | `0.15s` | `ease` | быстрые hover-переходы (модальное закрытие, `pk-key`) |
| `--transition` | `0.2s` | `ease` | стандартный переход (кнопки, карточки, тема, сайдбар) |
| инлайн `0.25s ease` | `0.25s` | `ease` | `modalIn` (появление модалки) |
| инлайн `0.35s ease` | `0.35s` | `ease` | `fadeIn` (появление модуля) — это и есть де-факто «slow» |

### Появление модулей

```css
.module.active { animation: fadeIn 0.35s ease both; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
```
Целевое значение из плана — `fadeIn 0.2s ease`; фактическое в коде — `0.35s`.

### Staggered-анимация карточек модулей

Задержка через `nth-child`, шаг **50ms**, что совпадает с планом:
```css
.module:nth-child(2).active { animation-delay: 0.05s; }
.module:nth-child(3).active { animation-delay: 0.10s; }
.module:nth-child(4).active { animation-delay: 0.15s; }
.module:nth-child(5).active { animation-delay: 0.20s; }
```
Работает только для первых 5 дочерних `.module` — далее задержка не увеличивается (ограничение текущей реализации).

### Ховеры

Практически все интерактивные элементы (`.lab-btn`, `.tool-card`, `.lab-card`, `.sidebar-item`) анимируют `transform` (translateY) совместно с `box-shadow`, длительность `var(--transition)` = `0.2s`.

### Прочие keyframes

- `spin` (1s linear infinite) — вращение спиннера
- `modalIn` (0.25s ease) — scale + translateY при открытии модалки

## 6.1 Слой «современный манускрипт» (Этап B)

Новый слой токенов и базовых классов по `tasks/design-inspiration.md`. Применение к модулям — Этап C (задача 5); на Этапе B модули не затрагивались.

### Новые токены (tokens.css, секция «Слой современного манускрипта»)

| Токен | Значение | Источник-техника |
|---|---|---|
| `--grad-parchment` | `linear-gradient(135deg, bg-secondary, bg-primary 55%, bg-tertiary)` | №1 hypercolor-адаптация |
| `--grad-dark` | `linear-gradient(160deg, bg-dark, bg-dark-hover)` | №1 |
| `--grad-gold-cta` | золото 8b6508→b8860b→d4a030 (тёмная: b8860b→d4a030) | №1/17 |
| `--texture-noise` | SVG fractal-noise data-URI, тайл 160px, opacity 0.05 | №2 transparenttextures |
| `--card-spacing` / `--card-spacing-lg` | `16px` / `24px` | №7 shadcn |
| `--dur-3`, `--ease-standard`, `--motion-lift`, `--motion-reveal` | `480ms`, `cubic-bezier(0.4,0,0.2,1)`, `300ms`, `480ms` | №9/11 |
| `--text-hero`, `--text-section`, `--glyph-hero` | `clamp(2.25rem,5vw,3.5rem)`, `clamp(1.75rem,3vw,2.5rem)`, `clamp(4rem,10vw,8rem)` | №13 |
| `--glow-glyph`, `--glow-edge` | `none` (светлые) / золотой glow (тёмная) | №18 |

### Новые базовые классы (lab.css)

| Класс | Назначение | Техника |
|---|---|---|
| `.lab-kicker` | caps-kicker: золото, tracking, xs | №14 |
| `.glyph-inline` | палео-глиф в строке: 1.35em, золотой | №16 |
| `.lab-noise` / `.lab-noise-dark` | фон: noise-тайл поверх градиента (два слоя background-image) | №1+2 |
| `.reveal` + `.is-visible` | вход: opacity+translateY(16px), stagger `--i`×90ms; триггер — IO в Этапе C | №11 |
| `.glow-glyph` | text-shadow glow (тёмная тема) | №18 |
| `.lab-frame-gold` | золотая градиентная рамка (padding-box/border-box) | №10 |
| `.lab-btn-cta` | градиентная CTA: lift −2px, press scale(0.97) | №9/17/19 |
| `.lab-shimmer` | блик на CTA (::after, 1.8s, пауза 4s) | №17 |
| `.lab-badge` + `--confirmed/--hypothesis/--disputed` | pill-бейджи уверенности (эмет/шекер) | №15 |

### Политика reduced-motion

`prefers-reduced-motion: reduce` отключает `.reveal`-сдвиг, shimmer и CTA-lift точечно (глобальный запрет не вводился, чтобы не конфликтовать с существующими анимациями модулей).

### Применение слоя (Этап C, 2026-09-04)

Пилот (hero Рабочего стола) одобрен пользователем; слой применён к **всем модульным hero** через `css/manuscript.css` (скоуп `[data-lab-hero]`, подключён в `lab.css`). Использовано: `--grad-dark` + `--texture-noise`, заголовок `--text-light` по `--text-hero` (иерархия размером, не цветом), подзаголовок 56ch/1.7, глиф-монограмма א (Пховел, U+10900) как единственный фирменный акцент; на ≤640px watermark скрыт. Эффекты-кандидаты (`.lab-shimmer`, `.glow-glyph`, `.lab-frame-gold`, aurora, spotlight) — **не применены** как противоречащие минимализму; классы остаются в lab.css для точечных решений. Кадры «после»: `tasks/pilot/after-*.png`; smoke:quick после раскатки — 9/9.

---

## 6.2 Linear-Paleo слой (редизайн интерфейсов)

Слой компонентов, вдохновлённых Linear (linear.app). Применяется к модулям через `css/redesign.css` (глобальные контролы, сайдбар, шапка) и `css/linear-timeline.css` (компоненты таймлайна). Приоритет: плотность, рамки вместо теней, hairline-разделители.

### Roadmap Scale

Горизонтальная шкала эпох (Linear Roadmap pattern). Используется в каталоге таймлайнов.

```css
.tl-roadmap          — контейнер, flex, overflow-x: auto
.tl-roadmap-segment  — один таймлайн (кликабельный, с клавиатурным фокусом)
.tl-roadmap-bar      — 4px bar, заполнение пропорционально количеству событий
.tl-roadmap-dot      — точка-маркер события (6px, gold border)
.tl-roadmap-label    — название (11px, 600, uppercase tracking)
.tl-roadmap-count    — счётчик событий (10px, muted)
.tl-roadmap-segment.active — активный сегмент (gold label + bar)
```

### Filter Chips

Сегментный фильтр каталогов (Linear segmented control).

```css
.tl-filters          — flex-контейнер, gap 4px, wrap (mobile: nowrap + scroll)
.tl-filter-chip      — чип 28px height, 12px 600, transparent → hover bg
.tl-filter-chip.active — gold text + bg + border
.chip-count          — пилюля-счётчик (10px, rounded 8px, bg tertiary)
```

### Status Dots

Цветовые индикаторы статуса (Linear project status).

```css
.tl-status           — inline-flex, gap 4px
.tl-status-dot       — 6px circle
.tl-status-dot--done     — зелёный #34c759
.tl-status-dot--active   — янтарный #ff9f0a
.tl-status-dot--pending  — серый #8e8e93
```

Токены статус-цветов в `tokens.css`: `--status-green`, `--status-amber`, `--status-gray`, `--status-red`.

### Meta Line

Единый паттерн мета-информации (автор · время · счётчик).

```css
.tl-meta-line        — flex, gap 6px, 12px muted
.meta-sep            — разделитель «·» (border color)
```

### Stagger-анимация

Появление сегментов roadmap с задержкой (Linear-style).

```css
.tl-roadmap-segment  — animation: tl-segment-in 0.35s ease both
                       animation-delay: calc(var(--tl-index, 0) * 50ms)
@media (prefers-reduced-motion: reduce) — animation: none
```

### Inline Actions

Действия на hover строк событий (открыть / копировать ссылку).

```css
.tl-event-row-inner       — flex, gap 10px, padding-right 72px
.tl-detail-event-main     — flex: 1, контент события
.tl-event-actions         — absolute right, display: none → flex on hover
.tl-event-action-btn      — 28×28px, rounded, border → gold on hover
@keyframes tl-action-appear — opacity + translateX(4px) → 0
```

### Command Palette (⌘K)

Поиск по таймлайнам и событиям (Linear command palette).

```css
.tl-cp-overlay       — fixed fullscreen, bg rgba(0,0,0,0.5), blur
.tl-cp-modal         — max-width 520px, scale + translateY transition; с классом .glass-modal — стекло (§6.3), кап 480px
.tl-cp-input-row     — flex, padding, border-bottom
.tl-cp-input         — 14px, transparent bg, no border
.tl-cp-results       — max-height 320px, overflow-y
.tl-cp-item          — flex, padding, hover bg, selected bg
.tl-cp-item-icon     — 28×28px, paleo glyph, gold
.tl-cp-item-title    — 13px 600, truncate
.tl-cp-item-subtitle — 11px muted, truncate
```

JS API: `buildSearchIndex()`, `openCommandPalette()`, `closeCommandPalette()`, `renderCpResults()`, `updateCpSelection()`, `selectCpItem()`. Хоткей: `⌘K` / `Ctrl+K`.

### 6.3 Liquid Glass слой (2026-09-07)

Адаптация принципов Liquid Glass под «современный манускрипт»: стекло = полупрозрачный пергамент + backdrop-blur + световая кромка (свет сверху, тень снизу) + layered-тень. Классы и токены живут в `lab.css` (секция «LIQUID GLASS layer»). Применение — **точечное, только по реестру ниже**; новый элемент получает glass-класс, только если попадает в этот список.

#### Классы

| Класс | Состав | Применение (реестр) |
|---|---|---|
| `.glass-modal` | полупрозрачный пергамент `color-mix(bg-card, transparent)` + `backdrop-filter: blur(14px) saturate(1.3)` + inset-кромки + layered-тень `--glass-shadow`; ширина каппится `min(480px, 92vw)` | окно `#labModal` (`.modal-window.glass-modal` — подтверждения, просмотры, формы); command palette (`.tl-cp-overlay .tl-cp-modal.glass-modal`, `⌘K`) |
| `.glass-btn-gold` | градиент `--grad-gold-cta` + inset-блик сверху / тень снизу + золотое гало; hover `translateY(-1px)` + brightness, active `scale(0.98)`, focus `--ring-focus` | select модели в #neurochat (`#ec-model`, вместе с `.lab-select`); годится модификатором к `.lab-btn` |
| `.glass-card-elevated` | подложка 86% + `blur(12px)` + кромки + `--shadow-floating` | toast `#lab-toast` (тёмный тонированный вариант: `--glass-fallback: var(--bg-dark)`, золотая кромка сохранена); будущие поповеры/дропдауны уже 500px |

#### Токены

`--glass-blur` (14px), `--glass-saturate` (1.3), `--glass-tint` (74%), `--glass-border`, `--glass-edge-top/bottom`, `--glass-shadow`, `--glass-fallback`. Тёмные темы (`dark`, `brown`) переопределяют кромки (тише: top `0.14`, bottom `rgba(0,0,0,.35)`) и плотность стекла (tint 68%). Все подложки считаются от тематических переменных (`--bg-card`, `--bg-dark`, `--border-light`), поэтому четыре темы работают без отдельных правил.

#### Где НЕ применять (осознанный запрет)

- **Шапка и hero** — сохраняют глиф-водяной знак и noise-пергамент (`--grad-dark` + `--texture-noise`);
- **Карточки модулей** (`.lab-card`, `.tool-card`) — пергаментная текстура, стекло на них не накладывается;
- **Сайдбар** — минимализм навигации, без стекла и elevation.

#### Performance-правила (обязательные)

- `backdrop-filter` разрешён только элементам **уже 500px** по ширине: `.glass-modal` жёстко каппится `max-width: min(480px, 92vw)`; кнопка и тост по природе малы;
- на **≤767px blur отключён целиком** — fallback на solid `var(--glass-fallback)` / `var(--bg-card)`; мобильные модалки остаются на всю ширину (правила responsive.css не сломаны);
- **`prefers-reduced-motion: reduce`** отключает и transform (hover-lift кнопки, `modalIn`), и blur (solid fallback) — зеркально мобильному блоку;
- специфичность подобрана под каскад: `.tl-cp-overlay .tl-cp-modal.glass-modal` перекрывает `[data-theme="dark"] .tl-cp-modal` из linear-timeline.css (он подключён позже lab.css); `#lab-toast.glass-card-elevated` перекрывает базовый класс.

#### Границы применения

Нативные `window.confirm()` CSS не стилизует — их перевод на кастомные модалки через `LabModal.show` (и, соответственно, на `.glass-modal`) — отдельная задача; до тех пор «модалки подтверждения» = все вызовы `LabModal`. Бонусные эффекты Liquid Glass (specular-подсветка за курсором, refract-искажения) сознательно не внедрены — противоречат минимализму манускрипта.

---

## 7. Иконки

### Фактическое расположение

Иконки лежат не в `researchlab/`, а на уровень выше, в `products/website/assets/icons/32/`, и используются из researchlab через относительный путь `../assets/icons/32/<pack>/<name>`. Единственный используемый в коде размер на диске — **32px** (папка `32/`); других размерных папок (`20/`, `24/`, `48/`) не существует — нужный размер получают атрибутами `width`/`height` у одного и того же файла. Для изолированного smoke-сервера (корень = `researchlab/`) в `apps/researchlab/assets/` существует локальное зеркало иконок 32px и логотипа (Этап A2) — ссылки при этом не менялись.

### Размеры применения (из кода)

| Размер | Где | Пример |
|---|---|---|
| `18×18` | `.lab-icon-sm` | мелкие инлайн-иконки |
| `20×20` | `.lab-icon`, `.sidebar-item .icon img` | иконки в сайдбаре и тексте |
| `24×24` | переключатель темы | `themeBtn` (`moon.png`/`sun.png`) |
| `32×32` | иконки в шапке, модалках, карточках инструментов | `.tool-icon`, поиск, кнопка закрытия |

Целевые размеры 20/24/32/48px подтверждаются использованием в коде; отдельного набора 48×48 файлов нет — `.tool-icon` растягивает те же 32px-исходники до 48px через CSS (`width: 48px; height: 48px`).

### Формат

Смешанный: **PNG** преобладает (большинство паков), часть паков — **SVG** (`desert/`, и `placeholder.svg` во всех папках как заглушка для недостающих иконок). Целевой формат «SVG предпочтительно, PNG резерв» на практике инвертирован — PNG сейчас основной формат для активно используемых иконок.

### Структура папок и карта паков

Путь: `assets/icons/32/[pack]/[name].[png|svg]` — 15 паков, как и в плане:

| Пак | Файлы |
|---|---|
| `archaeology/` | `lamp.png`, `testtube.png`, `vase.png` |
| `crafts/` | `hammer-and-chisel.png` |
| `desert/` | `camel.svg`, `cloud.svg`, `donkey.svg`, `footprints.svg`, `manna.svg`, `pillar-fire.svg`, `quail.svg`, `rock.svg`, `staff.svg`, `tent-peg.svg`, `tent.svg`, `well.svg` |
| `feasts/` | — (только `placeholder.svg`) |
| `food/` | — (только `placeholder.svg`) |
| `israel/` | `heart.png` |
| `map/` | — (только `placeholder.svg`) |
| `nav/` | `alert.png`, `door.png`, `home.png` |
| `paleo/` | `track.png` |
| `scribe/` | `scroll.png`, `scrolls.png` |
| `seals/` | `ring.png` |
| `signs/` | — (только `placeholder.svg`) |
| `temple/` | `torch.png` |
| `ui/` | `book.png`, `hourglass.png`, `keyboard.png`, `moon.png`, `question.png`, `scales.png`, `settings.png`, `sun.png` |
| `weapons/` | `shield.png`, `sword.png` |

Каждый пак содержит `placeholder.svg` — заглушку для незаполненных слотов. Паки `feasts`, `food`, `map`, `signs` пока полностью пустые (только placeholder) — это открытый участок работы, а не ошибка документации (см. задачу «Иконки — перерисовать в SVG» в `CLAUDE.md`).

### Слой Lucide (UI-иконки) — добавлен 2026-09-03

UI-хром (шапка, сайдбар, модалки, кнопки, поиск) переведён на **Lucide** — иконки локально, без CDN:

- Vendored UMD: `apps/researchlab/js/vendor/lucide.min.js` (v0.462.0).
- Инициализация: `apps/researchlab/js/lucide-init.js` — `lucide.createIcons()` + `MutationObserver` на все DOM-изменения + автодополнение иконок в `.lab-btn` по тексту кнопки (правила в `TEXT_ICON_RULES`).
- Публичный API: `LabIcons.icon(name, cls)` → разметка `<i data-lucide>`, затем `LabIcons.sync()`.
- Стили: `css/components/lucide.css` (размеры в шапке/сайдбаре/кнопках, hover-микродвижение, reduced-motion).
- Стиль: `stroke="currentColor"`, цвет наследуется от контекста — одна иконка работает в «пёргаменте», «скриптории» и «белой» теме.
- **Правило слоёв:** Lucide — только UI-хром и кнопки. Тематические паки (`archaeology/`, `desert/`, `feasts/`, `food/`, `paleo/`, `signs/`…) остаются PNG/SVG из `assets/icons/32/` (в т.ч. иконки шапок разделов `lab-hero` и иконки агентов).

Подробная карта — [карта иконок](ICON-MAP.md).

---

## 8. Адаптивность

Брейкпоинты в коде — `max-width: 900px` и `max-width: 768px` (плюс `760px` для отдельных research-страниц и `print`). Целевой брейкпоинт 375px как отдельная media query не заведён — мобильные правила покрывают весь диапазон до 768px включительно, 375px не является точкой перелома в текущем CSS.

| Брейкпоинт (код) | Назначение |
|---|---|
| `≤ 1400px` (max-width layout) | Ограничение ширины `.lab-layout`, дальше — просто центрирование |
| `≤ 900px` | Сайдбар сужается до `200px`, `.lab-content` padding `20px`, сетка карточек `minmax(200px, 1fr)`, поиск в хедере `max-width: 180px` |
| `≤ 768px` | Основной мобильный режим (описан ниже) |
| `≤ 760px` | `.research-controls`, `.research-term-card` переходят в одну колонку (JSON-страницы словарей) |
| `print` | Скрывается сайдбар/хедер/футер, фон становится светлым независимо от темы |

### Мобильный режим (≤768px)

- **Layout:** `.lab-layout` становится column; `.lab-content` padding `16px`.
- **Сайдбар → бургер:** `.lab-sidebar` уходит в `position: fixed`, скрыт за `translateX(-105%)`, открывается классом `.open`; появляется `.lab-hamburger` (`44×44px`) в хедере; затемняющий `.lab-sidebar-overlay` за спиной.
- **Хедер:** становится `flex-wrap`, высота авто; `.header-subtitle` и `nav` скрываются; поиск переносится на всю ширину новой строкой (`order: 3`).
- **Одна колонка:** `.tool-grid` → `1fr`, `.lab-tabs`/`.search-wrap`/`.export-bar` → column.
- **Тач-таргеты 44×44px:** `.lab-hamburger`, `.sidebar-item` (`min-height: 44px`), `.lab-btn`, `.lab-input/.lab-textarea/.lab-select`, `.modal-close` — все подняты до минимума `44px` по высоте.
- **Шрифт 16px+:** `body` остаётся `18px`; поля ввода принудительно `16px` (чтобы iOS Safari не увеличивал зум при фокусе); `.sidebar-item` — `16px`.
- **Модалки:** на мобильном занимают весь экран (`.modal-window`: `width: 100%`, `border-radius: 0`, `margin-top: 56px` под хедер).
- **Таблицы:** `.lab-table` получает `overflow-x: auto` и `white-space: nowrap` в ячейках вместо переноса в колонку.

---

## Известные расхождения с целевым планом

Список того, что было заявлено как цель, но не совпадает с текущей реализацией — чтобы не потерять эти пункты как будущие задачи:

1. Единой шкалы spacing-переменных (`xs/sm/md/lg/xl/2xl` как CSS custom properties) нет — отступы заданы точечно в пикселях.
2. `max-width` текста в коде — `920px` (`.research-preview`), а не `680px`.
3. Утилитарных размеров типографики h3/small/caption как отдельного стандарта нет — размеры разбросаны по селекторам.
4. `line-height: 1.4` для заголовков не применяется — заголовки наследуют `1.8` от `body`.
5. `fadeIn` длится `0.35s`, а не `0.2s`.
6. Иконки физически лежат в `products/website/assets/icons/32/`, а не в `docs/design/icons/` или отдельной по-размерной структуре внутри researchlab.
7. Формат иконок сейчас в основном PNG, а не SVG (кроме `desert/`).
8. Брейкпоинт `375px` не выделен отдельно.

---

## Слой LINEAR-PALEO (Этап 0–1 редизайна, 2026-09-05)

Спека: `docs/10-DESIGN/REDESIGN-LINEAR-PALEO.md`. Реализация — последний CSS-слой `products/website/apps/researchlab/css/redesign.css` (подключается отдельным `<link>` последним в `index.html`, чтобы побеждать каскад модульных CSS), токены — блок «LINEAR-PALEO ТОКЕНЫ» в `css/tokens.css`.

- **UI-шрифт (инструменты):** `--font-ui` = DM Sans; контент/заголовки остаются serif.
- **Размеры UI:** `--ui-13 / --ui-12 / --ui-11` (13/12/11px).
- **Высоты контролов:** `--control-h: 28px`, `--control-h-sm: 24px`.
- **Слои поверхности:** `--surface / --surface-hover / --surface-2 / --line / --line-strong` — псевдонимы существующих тематических токенов.
- **Статусы:** `--status-ok / --status-warn / --status-danger / --status-neutral`.
- **Фокус:** `--focus-outline` + `--ring-focus` (золото) на `:focus-visible` для всех интерактивных элементов.
- **Бейджи-статусы:** `.lab-badge` (+ `--ok/--warn/--danger/--neutral`, `--dotless`) — 18px, 11px, точка-индикатор через `::before`.
- **Изменённые компоненты:** `.lab-btn`/`.lab-btn-sm`/`.lab-btn-compact` (28/24px, гротеск 13/12px, без тени), `.lab-input/.lab-select/.lab-textarea` (28px, 13px), сайдбар (пункты 28px, актив = золотая полоса слева 2px), `.lab-content` (плоскость, без `--shadow-soft`, радиус `--radius-md`), хедер-кнопки 30px.
- **Мобильные тач-таргеты 44px не отменяются**: в `responsive.css` (до слоя redesign) правила ≤768px поднимают контролы; при желании пересмотреть — отдельной задачей, не ломая текущие правила.
- **reduced-motion** принудительно глобально (`prefers-reduced-motion: reduce`).

## Монолитные темы и компактность v2 (2026-09-05)

- **Палитры тем монолитны** (блок «МОНОЛИТНЫЕ ПАЛИТРЫ ТЕМ» в `css/tokens.css` и пресеты в `user-preferences.js`): `white` = белая (всё белое, включая шапку/поиск/плашки), `beige` = бежевая пастельная лёгкая (светлые бежевые поверхности, тоже монолит), `dark` = чёрная (тёплый чёрный), `brown` = коричневая. Старая бежевая (`parchment`/`light`) удалена. Внутри темы нет смешения посторонних цветов; семантика (status/warn/error/info) — тёплые приглушённые тона той же семьи.
- **Набор тем** в переключателе `LabTheme.themes`: `white → beige → brown → dark`; в `user-preferences.js` фолбэк для устаревшей сохранённой темы — белая.
- **Шапка — 48px** (`.lab-header`), логотип 28px; сайдбар синхронизирован (`top/height: calc(100vh - 48px)`, ширина 224px).
- **Экраны плотнее**: `.lab-content` — отступы `space-4`, hero-блоки разделов компактные (padding 14×18, заголовок `clamp(19–26px)`), карточки dashboard/инструментов — padding 14×16 и текст 13–15px. Читалки (манифест, писания, исследования) сохраняют крупный вид за счёт собственных правил модулей.

## Постаудитский компактный слой (2026-09-06)

UI/UX-аудит (десктоп 1280×800 + мобайл 320–640) выявил: hero-заголовки фактически оставались 38px из-за побеждающей специфичности `[data-lab-hero] .lab-hero__title` (manuscript.css) над `.lab-hero__title` (redesign.css); мобильная шапка распадалась на два ряда и поиск перекрывал контент; кнопочные пагинации обрезались. Исправления — последний блок `css/redesign.css` («ПОСТАУДИТСКИЙ СЛОЙ»):

- **Hero модулей:** единый компактный размер `clamp(18px, 2vw, 24px)` (селекторы `[data-lab-hero] .lab-hero__title` и `.module .lab-hero__title`, специфичность ≥ manuscript.css, файл подключён последним), kicker 11px, subtitle 14px, padding hero 16×20.
- **Базовый текст модулей:** 15px/1.6 вместо унаследованных 18px/1.8; читалки (#manifest, #scripture-reader) явно 16px/1.7.
- **Логотип:** `height: 28px !important` (inline `style="height:40px"` блокировал каскад), бейдж BETA 10px/18px.
- **Мобильная шапка (≤768px):** одна строка 48px: логотип 28px + гибкий поиск 36px + тема 40px + гамбургер 40px; дублирующие mobile-ссылки и иконки сайт/github скрыты (доступны в футере); drawer сайдбара начинается с `top: 48px`. Тач-таргеты 44px для контентных контролов сохранены; шапочные 40px — осознанное упрощение для компактности.
- **Мобильные кнопочные группы:** `.rd-pagination`/`.pagination` — `flex-wrap: wrap`.
- **JS-закрепление:** глобальные сервисы (`LabTheme/LabSidebar/LabModal/LabExport/LabToast/LabHotkeys`) экспортируются на `window` (иначе top-level `const` недоступны модулям: тема не включалась автоматически, тосты/модалки не работали, хоткеи не вешались). `document.title` обновляется на каждый маршрут (ранее липал «Манифест» после захода на #manifest). Версия SW-кэша поднята до v19.

### Пилот Linear-плотности: палео-таймлайн (2026-09-06)

Референс-карта заимствований — `docs/10-DESIGN/DESIGN-INSPIRATION.md`. Изменения модуля #timeline:

- **Один H1 на маршрут:** собственный hero модуля (`.tl-hero`) удалён — шапку рисует LabHero; при возврате из детального экрана шапка восстанавливается (`LabHero.setView('timeline', null, VIEWS.timeline)`).
- **Каталог строками (Linear List rows):** одна колонка `--shell-read`, hairline-разделители событий, без `box-shadow`; hover — смена фона на `--bg-tertiary` + заголовок в золото, без elevation.
- **Чип-счётчик** событий — пилюля с рамкой (Linear count chip), UI-текст модуля переведён на `--font-ui` (11–13px); serif остаётся только в контенте.
- **Детальный экран:** back-ссылка «← Каталог таймлайнов» (починен мёртвый биндинг `.tl-detail-back` — кнопка раньше вообще не рендерилась), мета-строка 12px с палео-глифом, события — компактные строки без теней; ширина консолидирована на `--shell-read`.
- Правило для остальных модулей: при переводе на строковые списки — UI-текст `--font-ui`, hover фоном, тени только оверлеям.
