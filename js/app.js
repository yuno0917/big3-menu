/* BIG3 メニューメーカー: 画面の処理（フォーム・描画・保存・共有） */
(function () {
  'use strict';
  const B = window.Big3;
  const D = B.DATA;

  const STORAGE_KEY = 'big3menu:v1';
  const LIFTS = B.LIFT_ORDER;
  const REQUIRED = ['squat', 'bench', 'deadlift'];
  const URL_KEYS = { squat: 'sq', bench: 'bp', deadlift: 'dl', ohp: 'ohp' };
  const MIN_MAX = 20;
  const MAX_MAX = 500;

  const form = document.getElementById('menu-form');
  const formSection = document.getElementById('form-section');
  const errorBox = document.getElementById('form-error');
  const resultSection = document.getElementById('result');
  const summaryMeta = document.getElementById('summary-meta');
  const summaryList = document.getElementById('summary-list');
  const tabsEl = document.getElementById('week-tabs');
  const panelsEl = document.getElementById('week-panels');
  const shareBtn = document.getElementById('share-btn');
  const printBtn = document.getElementById('print-btn');
  const shareBox = document.getElementById('share-box');
  const shareInput = document.getElementById('share-url');
  const shareStatus = document.getElementById('share-status');

  let currentInput = null;

  // ---- 小さな DOM ヘルパー（文字列は必ず textContent として入れる） ----
  function h(tag, props, ...children) {
    const node = document.createElement(tag);
    if (props) {
      Object.keys(props).forEach(k => {
        const v = props[k];
        if (v == null || v === false) return;
        if (k === 'class') node.className = v;
        else if (k === 'text') node.textContent = v;
        else if (k.slice(0, 2) === 'on') node.addEventListener(k.slice(2), v);
        else node.setAttribute(k, v === true ? '' : String(v));
      });
    }
    children.flat(Infinity).forEach(c => {
      if (c == null || c === false) return;
      node.append(c instanceof Node ? c : document.createTextNode(String(c)));
    });
    return node;
  }
  const fmt = n => String(Math.round(n * 100) / 100);
  const field = name => form.elements.namedItem(name);

  // ---- フォームの状態 ----
  function readForm() {
    const state = {
      mode: form.elements.mode.value,
      level: form.elements.level.value,
      freq: form.elements.freq.value,
      step: form.elements.step.value,
      ohpOn: field('ohp-on').checked,
      values: {}
    };
    LIFTS.forEach(l => {
      state.values[l] = { max: field(l + '-max').value, w: field(l + '-w').value, r: field(l + '-r').value };
    });
    return state;
  }

  function setRadio(name, value) {
    const inputs = Array.from(form.querySelectorAll('input[name="' + name + '"]'));
    const match = inputs.find(i => i.value === String(value));
    if (match) match.checked = true;
  }

  function applyState(s) {
    if (!s || typeof s !== 'object') return;
    setRadio('mode', s.mode);
    setRadio('level', s.level);
    setRadio('freq', s.freq);
    setRadio('step', s.step);
    field('ohp-on').checked = !!s.ohpOn;
    LIFTS.forEach(l => {
      const v = (s.values && s.values[l]) || {};
      field(l + '-max').value = v.max != null ? v.max : '';
      field(l + '-w').value = v.w != null ? v.w : '';
      field(l + '-r').value = v.r != null ? v.r : '';
    });
    syncForm();
  }

  function syncForm() {
    const mode = form.elements.mode.value;
    form.querySelectorAll('.mode-max').forEach(e => { e.hidden = mode !== 'max'; });
    form.querySelectorAll('.mode-reps').forEach(e => { e.hidden = mode !== 'reps'; });
    const on = field('ohp-on').checked;
    const ohpRow = form.querySelector('[data-lift="ohp"]');
    ohpRow.classList.toggle('is-off', !on);
    ohpRow.querySelectorAll('input[type="number"]').forEach(i => { i.disabled = !on; });
  }

  function computeMaxes(s) {
    const maxes = {};
    const lifts = s.ohpOn ? LIFTS : REQUIRED;
    for (const l of lifts) {
      const name = D.lifts[l].name;
      const v = s.values[l];
      let max;
      if (s.mode === 'reps') {
        const w = parseFloat(v.w);
        const r = Number(v.r);
        if (!(w > 0)) return { error: name + 'の重量を入力してください。', field: l + '-w' };
        if (!Number.isInteger(r) || r < 1 || r > 10) {
          return { error: name + 'の回数は1〜10回で入力してください。回数が多いほど推定がずれます。', field: l + '-r' };
        }
        max = Math.round(B.estimate1RM(w, r) * 2) / 2;
      } else {
        max = parseFloat(v.max);
        if (!(max > 0)) return { error: name + 'のMAXを入力してください。', field: l + '-max' };
      }
      if (max < MIN_MAX || max > MAX_MAX) {
        return {
          error: name + 'のMAXは' + MIN_MAX + '〜' + MAX_MAX + 'kgの範囲で入力してください。' + (s.mode === 'reps' ? '（推定値 ' + fmt(max) + 'kg）' : ''),
          field: l + (s.mode === 'reps' ? '-w' : '-max')
        };
      }
      maxes[l] = max;
    }
    return { maxes };
  }

  function showError(message, fieldName) {
    errorBox.textContent = message || '';
    errorBox.hidden = !message;
    form.querySelectorAll('[aria-invalid]').forEach(i => i.removeAttribute('aria-invalid'));
    if (message && fieldName) {
      const f = field(fieldName);
      if (f) { f.setAttribute('aria-invalid', 'true'); f.focus(); }
    }
  }

  // ---- 保存（使えないブラウザでも動くように try/catch で囲む） ----
  function save(s) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch (e) { /* 保存できなくても続行 */ }
  }
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  // ---- URL での共有 ----
  function toParams(input) {
    const p = new URLSearchParams();
    p.set('lv', input.level === 'intermediate' ? 'i' : 'b');
    p.set('f', String(input.freq));
    p.set('st', String(input.step));
    LIFTS.forEach(l => { if (input.maxes[l]) p.set(URL_KEYS[l], fmt(input.maxes[l])); });
    return p;
  }

  function fromParams(search) {
    const p = new URLSearchParams(search);
    if (!REQUIRED.every(l => p.has(URL_KEYS[l]))) return null;
    const freq = p.get('f');
    const state = {
      mode: 'max',
      level: p.get('lv') === 'i' ? 'intermediate' : 'beginner',
      freq: ['2', '3', '4'].indexOf(freq) >= 0 ? freq : '3',
      step: p.get('st') === '5' ? '5' : '2.5',
      ohpOn: p.has(URL_KEYS.ohp),
      values: {}
    };
    LIFTS.forEach(l => { state.values[l] = { max: p.get(URL_KEYS[l]) || '', w: '', r: '' }; });
    return state;
  }

  const baseUrl = () => location.href.split(/[?#]/)[0];
  const shareUrl = input => baseUrl() + '?' + toParams(input).toString();

  function updateUrl(input) {
    try { history.replaceState(null, '', '?' + toParams(input).toString()); } catch (e) { /* file:// などで失敗しても続行 */ }
  }

  // ---- 描画 ----
  function renderSummary(program, estimated) {
    const levelLabel = program.level === 'intermediate' ? '中級者' : '初心者';
    summaryMeta.textContent = levelLabel + '・週' + program.freq + '回・' + fmt(program.step) + 'kg刻み';
    summaryList.replaceChildren(...LIFTS.filter(l => program.maxes[l]).map(l =>
      h('li', null,
        h('span', { class: 'sum-name', text: D.lifts[l].name }),
        h('span', { class: 'sum-val', text: 'MAX ' + fmt(program.maxes[l]) + 'kg' + (estimated ? '（推定）' : '') }),
        h('span', { class: 'sum-tm', text: '基準重量 ' + String(Math.round(program.tms[l] * 10) / 10) + 'kg' })
      )
    ));
  }

  function renderExercise(ex) {
    if (ex.kind === 'main') {
      return h('li', { class: 'ex ex-main' + (ex.light ? ' is-light' : '') },
        h('div', { class: 'ex-top' },
          h('span', { class: 'ex-name', text: ex.name }),
          ex.light ? h('span', { class: 'badge badge-light', text: '軽め' }) : null
        ),
        h('div', { class: 'ex-load' },
          h('span', { class: 'ex-weight' }, fmt(ex.weight), h('small', { text: 'kg' })),
          h('span', { class: 'ex-sets', text: ex.sets + 'セット × ' + ex.reps + '回' })
        ),
        h('div', { class: 'ex-meta' },
          h('span', { text: 'RPE目安 ' + ex.rpe }),
          h('span', { text: B.formatPlates(ex.plates) })
        )
      );
    }
    return h('li', { class: 'ex ex-acc' },
      h('div', { class: 'ex-top' },
        h('span', { class: 'ex-name', text: ex.name }),
        h('span', { class: 'badge badge-acc', text: '補助' })
      ),
      h('div', { class: 'ex-load' }, h('span', { class: 'ex-sets', text: ex.sets + 'セット × ' + ex.reps })),
      h('div', { class: 'ex-meta' }, h('span', { text: '重さは RPE ' + ex.rpe + ' になるように調整' }))
    );
  }

  function renderDay(d) {
    return h('article', { class: 'day' },
      h('h4', { class: 'day-title', text: d.name }),
      h('ul', { class: 'ex-list' }, d.exercises.map(renderExercise))
    );
  }

  function renderTestDay(d) {
    return h('article', { class: 'day day-test' },
      h('h4', { class: 'day-title' }, d.name, h('span', { class: 'badge badge-test', text: 'MAX測定' })),
      h('p', { class: 'day-lead', text: '前回のトレーニングから中2日以上あけて行います。補助者をつけるか、セーフティバーを必ず使ってください。' }),
      d.exercises.map(ex => h('div', { class: 'test-lift' },
        h('h5', { text: ex.name }),
        h('ol', { class: 'test-steps' }, ex.steps.map(s =>
          h('li', { class: s.attempt ? 'is-attempt' : null },
            h('span', { class: 'ts-weight', text: fmt(s.weight) + 'kg × ' + s.reps + '回' }),
            h('span', { class: 'ts-note', text: s.label + '・' + B.formatPlates(s.plates) })
          )
        )),
        h('p', { class: 'test-next', text: '成功したら ' + fmt(ex.nextTry) + 'kg 以上に挑戦します。挑戦は2〜3回までにします。' })
      )),
      h('button', { type: 'button', class: 'secondary', onclick: goToForm, text: '新しいMAXでメニューを作り直す' })
    );
  }

  function renderWeek(w, i) {
    const panel = h('section', {
      class: 'week-panel',
      role: 'tabpanel',
      id: 'panel-w' + w.week,
      'aria-labelledby': 'tab-w' + w.week,
      tabindex: '0',
      hidden: i !== 0
    });
    panel.append(
      h('div', { class: 'week-head' },
        h('h3', null,
          '第' + w.week + '週',
          w.deload ? h('span', { class: 'badge badge-light', text: '軽め週' }) : null,
          w.test ? h('span', { class: 'badge badge-test', text: 'MAX測定週' }) : null
        ),
        w.note ? h('p', { class: 'week-note', text: w.note }) : null
      ),
      h('div', { class: 'days' }, w.days.map(d => (d.test ? renderTestDay(d) : renderDay(d))))
    );
    return panel;
  }

  function render(program, estimated) {
    renderSummary(program, estimated);
    const sqLink = document.getElementById('squat-goal-link');
    if (sqLink) sqLink.href = '/squat-goal/' + (program.maxes.squat ? '?m=' + encodeURIComponent(String(program.maxes.squat)) : '');
    tabsEl.replaceChildren(...program.weeks.map((w, i) =>
      h('button', {
        type: 'button',
        role: 'tab',
        id: 'tab-w' + w.week,
        'aria-controls': 'panel-w' + w.week,
        'aria-selected': i === 0 ? 'true' : 'false',
        tabindex: i === 0 ? '0' : '-1',
        class: 'tab' + (w.deload ? ' is-light' : '') + (w.test ? ' is-test' : ''),
        onclick: () => selectWeek(i, false)
      },
      h('span', { text: w.week + '週' }),
      h('span', { class: 'tab-tag', text: w.deload ? '軽め' : (w.test ? '測定' : ' ') }))
    ));
    panelsEl.replaceChildren(...program.weeks.map((w, i) => renderWeek(w, i)));
  }

  function selectWeek(index, focus) {
    const tabs = Array.from(tabsEl.children);
    const panels = Array.from(panelsEl.children);
    tabs.forEach((t, i) => {
      const on = i === index;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
    });
    panels.forEach((p, i) => { p.hidden = i !== index; });
    const tab = tabs[index];
    if (tab) {
      if (focus) tab.focus();
      tab.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  }

  tabsEl.addEventListener('keydown', e => {
    const tabs = Array.from(tabsEl.children);
    const cur = tabs.indexOf(document.activeElement);
    if (cur < 0) return;
    let next = null;
    if (e.key === 'ArrowRight') next = (cur + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') next = (cur - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    if (next == null) return;
    e.preventDefault();
    selectWeek(next, true);
  });

  function goToForm() {
    setRadio('mode', 'max');
    syncForm();
    formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const first = field('squat-max');
    if (first) first.focus({ preventScroll: true });
  }

  function planCell(spec) {
    return fmt(spec.pct * 100) + '%　' + spec.sets + 'セット × ' + spec.reps + '回';
  }

  function renderPlanTable() {
    const tbody = document.querySelector('#plan-table tbody');
    if (!tbody) return;
    const b = D.weeks.beginner;
    const m = D.weeks.intermediate;
    tbody.replaceChildren(...b.map((spec, i) =>
      h('tr', { class: spec.deload ? 'is-light' : (spec.test ? 'is-test' : null) },
        h('th', { scope: 'row', text: (i + 1) + (spec.deload ? '（軽め）' : spec.test ? '（測定）' : '') }),
        h('td', { text: planCell(spec) }),
        h('td', { text: planCell(m[i]) })
      )
    ));
  }

  // ---- 生成 ----
  function generate(scroll) {
    const s = readForm();
    const r = computeMaxes(s);
    if (r.error) {
      showError(r.error, scroll ? r.field : null);
      return false;
    }
    showError('');
    const input = { level: s.level, freq: Number(s.freq), step: Number(s.step), maxes: r.maxes };
    const program = B.generateProgram(input);
    currentInput = input;
    render(program, s.mode === 'reps');
    resultSection.hidden = false;
    shareBox.hidden = true;
    save(s);
    updateUrl(input);
    if (scroll) resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return true;
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    generate(true);
  });
  form.addEventListener('change', syncForm);

  shareBtn.addEventListener('click', async () => {
    if (!currentInput) return;
    const url = shareUrl(currentInput);
    shareInput.value = url;
    shareBox.hidden = false;
    try {
      await navigator.clipboard.writeText(url);
      shareStatus.textContent = 'リンクをコピーしました。開くと同じメニューが表示されます。';
    } catch (e) {
      shareInput.focus();
      shareInput.select();
      shareStatus.textContent = 'リンクを選択しました。コピーして共有してください。';
    }
  });

  printBtn.addEventListener('click', () => window.print());

  // ---- 起動時: URL のパラメータ → 前回の入力 の順で復元 ----
  renderPlanTable();
  const fromUrl = fromParams(location.search);
  const initial = fromUrl || load();
  if (initial) {
    applyState(initial);
    const ok = generate(false);
    if (!ok && !fromUrl) showError('');
  } else {
    syncForm();
  }
})();
