/* BIG3 メニューメーカー: 重量の丸めとプレート計算 */
(function (root) {
  'use strict';
  const Big3 = root.Big3 = root.Big3 || {};

  // 一般的なジムにあるプレート（kg）。大きい順。
  const ALL_PLATES = [20, 15, 10, 5, 2.5, 1.25];
  const EPS = 1e-9;
  const r3 = n => Math.round(n * 1000) / 1000;

  // 刻み（step）の最も近い値に丸める。バー重量より軽くはしない。
  function roundWeight(weight, step, bar) {
    const rounded = Math.round(Math.round(weight / step) * step * 100) / 100;
    return rounded < bar ? bar : rounded;
  }

  // 総重量 2.5kg 刻みなら片側 1.25kg、5kg 刻みなら片側 2.5kg が最小プレート。
  function plateSetFor(step) {
    const smallest = step / 2;
    return ALL_PLATES.filter(p => p >= smallest - EPS);
  }

  // 片側に付けるプレートを大きい順に選ぶ。
  function platesPerSide(total, bar, plates) {
    let side = r3((total - bar) / 2);
    const result = [];
    if (side <= 0) return { plates: result, remainder: 0 };
    for (const p of plates) {
      while (side >= p - EPS) {
        result.push(p);
        side = r3(side - p);
      }
    }
    return { plates: result, remainder: side };
  }

  function formatPlates(plates) {
    return plates.length ? '片側 ' + plates.join(' + ') + 'kg' : 'バーのみ';
  }

  Object.assign(Big3, { PLATES: ALL_PLATES, roundWeight, plateSetFor, platesPerSide, formatPlates });
})(typeof window !== 'undefined' ? window : globalThis);
