/* BIG3 メニューメーカー: メニュー生成（DOM に触れない純粋な関数） */
(function (root) {
  'use strict';
  const Big3 = root.Big3 = root.Big3 || {};
  const LIFT_ORDER = ['squat', 'bench', 'deadlift', 'ohp'];
  const r2 = n => Math.round(n * 100) / 100;

  function normalizeInput(input) {
    const src = input || {};
    const level = src.level === 'intermediate' ? 'intermediate' : 'beginner';
    const freq = [2, 3, 4].indexOf(Number(src.freq)) >= 0 ? Number(src.freq) : 3;
    const step = Number(src.step) === 5 ? 5 : 2.5;
    const maxes = {};
    LIFT_ORDER.forEach(lift => {
      const v = Number(src.maxes && src.maxes[lift]);
      if (v > 0) maxes[lift] = v;
    });
    return { level, freq, step, maxes };
  }

  // 種目が無効（MAX 未入力）なら fallback を使う。fallback も無ければその枠は飛ばす。
  function resolveSlot(slot, maxes) {
    if (!slot) return null;
    if (maxes[slot.lift]) return slot;
    return resolveSlot(slot.fallback, maxes);
  }

  function mainExercise(lift, spec, tm, light, step) {
    const D = Big3.DATA;
    let sets = spec.sets;
    let factor = 1;
    if (light) {
      factor = D.lightFactor;
      sets = Math.max(D.lightMinSets, sets - D.lightSetsMinus);
    }
    if (lift === 'deadlift') sets = Math.min(sets, D.deadliftMaxSets);
    const weight = Big3.roundWeight(tm * spec.pct * factor, step, D.barWeight);
    return {
      kind: 'main',
      lift,
      name: D.lifts[lift].name,
      light: !!light,
      weight,
      sets,
      reps: spec.reps,
      rpe: light ? D.lightRpe : spec.rpe,
      plates: Big3.platesPerSide(weight, D.barWeight, Big3.plateSetFor(step)).plates
    };
  }

  function accessoryExercise(key) {
    const D = Big3.DATA;
    const a = D.accessories[key];
    return { kind: 'acc', key, name: a.name, sets: a.sets, reps: a.reps, rpe: D.accRpe };
  }

  function testExercise(lift, max, step) {
    const D = Big3.DATA;
    const bar = D.barWeight;
    const plateSet = Big3.plateSetFor(step);
    const attempt = Big3.roundWeight(max, step, bar);
    const steps = [];
    const add = (weight, reps, label, isAttempt) => steps.push({
      weight, reps, label, attempt: !!isAttempt,
      plates: Big3.platesPerSide(weight, bar, plateSet).plates
    });

    let last = 0;
    if (bar < attempt) {
      add(bar, 10, 'ウォームアップ');
      last = bar;
    }
    D.testSteps.forEach(s => {
      const w = Big3.roundWeight(max * s.pct, step, bar);
      if (w > last && w < attempt) {
        add(w, s.reps, `ウォームアップ（MAXの${Math.round(s.pct * 100)}%）`);
        last = w;
      }
    });
    add(attempt, 1, '1回目の挑戦（現在のMAX）', true);

    return { kind: 'test', lift, name: D.lifts[lift].name, max, steps, nextTry: r2(attempt + step) };
  }

  function testDay(name, maxes, step) {
    const exercises = LIFT_ORDER.filter(l => maxes[l]).map(l => testExercise(l, maxes[l], step));
    return { name, test: true, exercises };
  }

  function generateProgram(rawInput) {
    const D = Big3.DATA;
    const input = normalizeInput(rawInput);
    const { level, freq, step, maxes } = input;

    const tms = {};
    Object.keys(maxes).forEach(l => { tms[l] = r2(maxes[l] * D.tmRatio[level]); });

    const template = D.templates[freq];
    const weeks = D.weeks[level].map((spec, wi) => {
      const days = template.map((dayDef, di) => {
        if (spec.test && di === template.length - 1) return testDay(dayDef.name, maxes, step);
        const exercises = [];
        dayDef.main.forEach(slot => {
          const s = resolveSlot(slot, maxes);
          if (s) exercises.push(mainExercise(s.lift, spec, tms[s.lift], s.light, step));
        });
        dayDef.acc.forEach(key => exercises.push(accessoryExercise(key)));
        return { name: dayDef.name, test: false, exercises };
      });
      return { week: wi + 1, deload: !!spec.deload, test: !!spec.test, note: spec.note || '', days };
    });

    return { level, freq, step, maxes, tms, weeks };
  }

  Big3.LIFT_ORDER = LIFT_ORDER;
  Big3.generateProgram = generateProgram;
})(typeof window !== 'undefined' ? window : globalThis);
