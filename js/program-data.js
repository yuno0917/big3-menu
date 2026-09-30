/* BIG3 メニューメーカー: メニューの設定値（データのみ。ここを書き換えるとメニューが変わる） */
(function (root) {
  'use strict';
  const Big3 = root.Big3 = root.Big3 || {};

  Big3.DATA = {
    barWeight: 20,

    // 基準重量（トレーニングマックス）= MAX × この比率。各週の重量は基準重量に対する % で決める。
    tmRatio: { beginner: 0.90, intermediate: 0.95 },

    // 「軽め」の日: その週の重量 × lightFactor、セット数は lightSetsMinus 減らす（最低 lightMinSets）。
    lightFactor: 0.85,
    lightSetsMinus: 2,
    lightMinSets: 2,
    lightRpe: '5〜6',

    // デッドリフトは疲労が大きいのでセット数に上限を設ける。
    deadliftMaxSets: 3,

    // 補助種目の目安 RPE。
    accRpe: '7〜8',

    lifts: {
      squat: { name: 'スクワット' },
      bench: { name: 'ベンチプレス' },
      deadlift: { name: 'デッドリフト' },
      ohp: { name: 'オーバーヘッドプレス' }
    },

    // 8 週間の波。pct は基準重量に対する割合。
    weeks: {
      beginner: [
        { pct: 0.70,  sets: 5, reps: 5, rpe: '6',    note: 'フォームを固める週です。余裕があっても重量は上げずに、同じ動きをくり返しましょう。' },
        { pct: 0.725, sets: 5, reps: 5, rpe: '6〜7', note: '先週より少しだけ重くなります。' },
        { pct: 0.75,  sets: 5, reps: 5, rpe: '7〜8', note: '前半でいちばんきつい週です。最後のセットまでフォームを崩さないことを優先します。' },
        { pct: 0.60,  sets: 3, reps: 5, rpe: '5',    deload: true, note: '軽め週です。疲れを抜いて後半に備えます。物足りなくても重量は上げません。' },
        { pct: 0.80,  sets: 5, reps: 3, rpe: '7',    note: 'ここから重量を上げて、回数を減らします。' },
        { pct: 0.825, sets: 5, reps: 3, rpe: '7〜8', note: '重さに慣れる週です。1回1回を丁寧に挙げましょう。' },
        { pct: 0.85,  sets: 4, reps: 3, rpe: '8',    note: 'プログラムでいちばん重い週です。補助者かセーフティバーを必ず使いましょう。' },
        { pct: 0.875, sets: 3, reps: 2, rpe: '7',    test: true, note: '前半の日は量を減らして体を休めます。最終日に新しいMAXを測ります。' }
      ],
      intermediate: [
        { pct: 0.725, sets: 4, reps: 6, rpe: '6〜7', note: '量をこなす週です。スピードを意識して挙げましょう。' },
        { pct: 0.775, sets: 4, reps: 5, rpe: '7',    note: '先週より重く、回数は少なくなります。' },
        { pct: 0.80,  sets: 5, reps: 4, rpe: '8',    note: '前半でいちばんきつい週です。' },
        { pct: 0.65,  sets: 3, reps: 5, rpe: '5',    deload: true, note: '軽め週です。疲れを抜いて後半に備えます。' },
        { pct: 0.825, sets: 5, reps: 3, rpe: '7',    note: 'ここから高重量の期間です。' },
        { pct: 0.85,  sets: 4, reps: 3, rpe: '8',    note: '重さに慣れる週です。' },
        { pct: 0.90,  sets: 3, reps: 2, rpe: '8〜9', note: 'プログラムでいちばん重い週です。補助者かセーフティバーを必ず使いましょう。' },
        { pct: 0.95,  sets: 2, reps: 1, rpe: '8',    test: true, note: '前半の日は重さの確認だけにとどめます。最終日に新しいMAXを測ります。' }
      ]
    },

    // MAX 測定日のウォームアップ（現在の MAX に対する割合）。
    testSteps: [
      { pct: 0.5, reps: 5 },
      { pct: 0.7, reps: 3 },
      { pct: 0.8, reps: 2 },
      { pct: 0.9, reps: 1 }
    ],

    // 週の回数ごとの組み方。fallback はその種目が無効なときの代わり。
    templates: {
      2: [
        { name: 'Day 1', main: [{ lift: 'squat' }, { lift: 'bench' }], acc: ['row', 'facepull', 'plank'] },
        { name: 'Day 2', main: [{ lift: 'deadlift' }, { lift: 'ohp', fallback: { lift: 'bench', light: true } }], acc: ['lat', 'bulgarian', 'curl'] }
      ],
      3: [
        { name: 'Day 1', main: [{ lift: 'squat' }, { lift: 'bench' }], acc: ['row', 'plank'] },
        { name: 'Day 2', main: [{ lift: 'deadlift' }, { lift: 'ohp', fallback: { lift: 'bench', light: true } }], acc: ['lat', 'facepull'] },
        { name: 'Day 3', main: [{ lift: 'squat', light: true }, { lift: 'bench' }], acc: ['bulgarian', 'curl'] }
      ],
      4: [
        { name: 'Day 1', main: [{ lift: 'squat' }], acc: ['bulgarian', 'backext'] },
        { name: 'Day 2', main: [{ lift: 'bench' }, { lift: 'ohp' }], acc: ['row', 'facepull'] },
        { name: 'Day 3', main: [{ lift: 'deadlift' }, { lift: 'squat', light: true }], acc: ['lat', 'plank'] },
        { name: 'Day 4', main: [{ lift: 'bench', light: true }], acc: ['dip', 'curl'] }
      ]
    },

    accessories: {
      row:       { name: 'ダンベルロウ',           sets: 3, reps: '10回' },
      lat:       { name: 'ラットプルダウン',       sets: 3, reps: '10回' },
      bulgarian: { name: 'ブルガリアンスクワット', sets: 3, reps: '片脚8回' },
      facepull:  { name: 'フェイスプル',           sets: 3, reps: '15回' },
      plank:     { name: 'プランク',               sets: 3, reps: '30秒' },
      backext:   { name: 'バックエクステンション', sets: 3, reps: '12回' },
      curl:      { name: 'ダンベルカール',         sets: 3, reps: '12回' },
      dip:       { name: 'ディップス',             sets: 3, reps: '8〜10回' }
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
