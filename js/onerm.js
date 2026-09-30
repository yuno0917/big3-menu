/* BIG3 メニューメーカー: 推定 1RM（Epley の式） */
(function (root) {
  'use strict';
  const Big3 = root.Big3 = root.Big3 || {};

  // 重量 × 回数から 1 回だけ挙げられる最大重量を推定する。
  // 回数が多いほど誤差が大きくなるため、10 回を上限として計算する。
  function estimate1RM(weight, reps) {
    const w = Number(weight);
    let r = Math.round(Number(reps));
    if (!(w > 0) || !(r >= 1)) return null;
    if (r > 10) r = 10;
    if (r === 1) return w;
    return Math.round(w * (1 + r / 30) * 100) / 100;
  }

  Big3.estimate1RM = estimate1RM;
})(typeof window !== 'undefined' ? window : globalThis);
