/*
 * dom-navigator.js
 * Навігація по DOM-дереву сторінки за допомогою функцій зворотного виклику (callbacks).
 * Повідомлення показуються у власній графічній панелі (а не через confirm/alert).
 *
 * Підключення: перед закриваючим </body>
 *   <script src="dom-navigator.js"></script>
 */
(function () {
  'use strict';

  var START_BTN_ID = 'dom-nav-start';
  var PANEL_ID = 'dom-nav-panel';
  var STYLE_ID = 'dom-nav-style';
  var HIGHLIGHT_STYLE = '3px solid #e53935';

  // ---------- Стилі панелі ----------
  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var css =
      '#' + START_BTN_ID + '{position:fixed;right:20px;bottom:20px;z-index:9998;' +
      'padding:12px 18px;border:none;border-radius:8px;background:#1565c0;color:#fff;' +
      'font:15px Arial,sans-serif;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.3)}' +
      '#' + START_BTN_ID + ':hover{background:#0d47a1}' +
      '#' + PANEL_ID + '{position:fixed;left:20px;bottom:20px;z-index:9999;width:340px;' +
      'max-width:calc(100vw - 40px);background:#fff;color:#222;border-radius:12px;' +
      'box-shadow:0 8px 30px rgba(0,0,0,.35);font:14px/1.4 Arial,sans-serif;overflow:hidden}' +
      '#' + PANEL_ID + ' .dn-head{display:flex;justify-content:space-between;align-items:center;' +
      'padding:12px 16px;background:#1565c0;color:#fff;font-weight:bold}' +
      '#' + PANEL_ID + ' .dn-bar{height:4px;background:#bbdefb}' +
      '#' + PANEL_ID + ' .dn-bar i{display:block;height:100%;background:#e53935}' +
      '#' + PANEL_ID + ' .dn-body{padding:14px 16px}' +
      '#' + PANEL_ID + ' .dn-row{display:flex;gap:8px;margin-bottom:6px}' +
      '#' + PANEL_ID + ' .dn-row span{flex:0 0 130px;color:#666}' +
      '#' + PANEL_ID + ' .dn-row b{font-weight:normal;word-break:break-word}' +
      '#' + PANEL_ID + ' .dn-q{margin:12px 0 0;font-weight:bold}' +
      '#' + PANEL_ID + ' .dn-btns{display:flex;gap:10px;padding:0 16px 16px}' +
      '#' + PANEL_ID + ' button{flex:1;padding:10px;border-radius:8px;font:14px Arial,sans-serif;' +
      'cursor:pointer;border:1px solid #1565c0}' +
      '#' + PANEL_ID + ' .dn-yes{background:#1565c0;color:#fff}' +
      '#' + PANEL_ID + ' .dn-yes:hover{background:#0d47a1}' +
      '#' + PANEL_ID + ' .dn-no{background:#fff;color:#1565c0}' +
      '#' + PANEL_ID + ' .dn-no:hover{background:#e3f2fd}';
    var st = document.createElement('style');
    st.id = STYLE_ID;
    st.textContent = css;
    document.head.appendChild(st);
  }

  // ---------- Збір вузлів дерева (обхід у глибину, порядок документа) ----------
  function collectNodes(root) {
    var list = [];
    (function walk(el) {
      if (el.id === START_BTN_ID || el.id === PANEL_ID || el.tagName === 'SCRIPT') return;
      list.push(el);
      Array.prototype.forEach.call(el.children, walk);
    })(root);
    return list;
  }

  // ---------- Опис вузла ----------
  function depthOf(el) {
    var d = 0;
    while (el && el !== document.body) {
      d++;
      el = el.parentElement;
    }
    return d;
  }

  function ownText(el) {
    var t = '';
    Array.prototype.forEach.call(el.childNodes, function (n) {
      if (n.nodeType === Node.TEXT_NODE) t += n.textContent;
    });
    t = t.replace(/\s+/g, ' ').trim();
    return t.length > 120 ? t.slice(0, 120) + '…' : t;
  }

  function describe(el, index, total) {
    var name = el.tagName.toLowerCase();
    if (el.id) name += '#' + el.id;
    if (el.className && typeof el.className === 'string' && el.className.trim()) {
      name += '.' + el.className.trim().split(/\s+/).join('.');
    }
    var text = ownText(el);
    return {
      title: 'Вузол ' + (index + 1) + ' з ' + total,
      progress: (index + 1) / total,
      rows: [
        ['Елемент', '<' + name + '>'],
        ['Рівень вкладеності', String(depthOf(el))],
        ['Дочірніх елементів', String(el.children.length)],
        ['Власний текст', text ? '«' + text + '»' : '(немає)']
      ]
    };
  }

  // ---------- Підсвітка поточного вузла ----------
  var current = null;
  var savedOutline = '';

  function highlight(el) {
    clearHighlight();
    current = el;
    savedOutline = el.style.outline;
    el.style.outline = HIGHLIGHT_STYLE;
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  function clearHighlight() {
    if (current) {
      current.style.outline = savedOutline;
      current = null;
    }
  }

  // ---------- Графічна панель ----------
  function removePanel() {
    var old = document.getElementById(PANEL_ID);
    if (old) old.remove();
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  // Показує панель з двома кнопками.
  // onYes викликається при натисканні першої кнопки, onNo — другої.
  function ask(info, question, yesLabel, noLabel, onYes, onNo) {
    removePanel();
    var panel = el('div');
    panel.id = PANEL_ID;

    var head = el('div', 'dn-head', info.title);
    var bar = el('div', 'dn-bar');
    var fill = el('i');
    fill.style.width = Math.round(info.progress * 100) + '%';
    bar.appendChild(fill);

    var body = el('div', 'dn-body');
    info.rows.forEach(function (r) {
      var row = el('div', 'dn-row');
      row.appendChild(el('span', '', r[0]));
      row.appendChild(el('b', '', r[1]));
      body.appendChild(row);
    });
    body.appendChild(el('p', 'dn-q', question));

    var btns = el('div', 'dn-btns');
    var yes = el('button', 'dn-yes', yesLabel);
    var no = el('button', 'dn-no', noLabel);
    yes.type = 'button';
    no.type = 'button';
    yes.addEventListener('click', onYes);
    no.addEventListener('click', onNo);
    btns.appendChild(yes);
    btns.appendChild(no);

    panel.appendChild(head);
    panel.appendChild(bar);
    panel.appendChild(body);
    panel.appendChild(btns);
    document.body.appendChild(panel);
  }

  // ---------- Основна логіка ----------
  var running = false;

  function finish() {
    clearHighlight();
    removePanel();
    running = false;
  }

  function showNode(nodes, i) {
    highlight(nodes[i]);
    var info = describe(nodes[i], i, nodes.length);
    var last = nodes.length - 1;

    var next = function () { showNode(nodes, i + 1); };
    var back = function () { showNode(nodes, i - 1); };

    if (i === 0) {
      // перший вузол: далі або завершити
      ask(info, 'Перейти до наступного вузла?', 'Далі', 'Завершити', next, finish);
    } else if (i === last) {
      // останній вузол: назад або вийти
      ask(info, 'Це останній вузол. Що далі?', 'Назад', 'Вийти', back, finish);
    } else {
      // проміжні вузли: далі або назад
      ask(info, 'Пройти далі чи повернутися?', 'Далі', 'Назад', next, back);
    }
  }

  function start() {
    if (running) return;
    var nodes = collectNodes(document.body);
    if (!nodes.length) return;
    running = true;
    showNode(nodes, 0);
  }

  // ---------- Кнопка запуску ----------
  function addStartButton() {
    if (document.getElementById(START_BTN_ID)) return;
    injectStyles();
    var btn = document.createElement('button');
    btn.id = START_BTN_ID;
    btn.type = 'button';
    btn.textContent = 'Навігація по DOM';
    btn.addEventListener('click', start);
    document.body.appendChild(btn);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addStartButton);
  } else {
    addStartButton();
  }
})();
