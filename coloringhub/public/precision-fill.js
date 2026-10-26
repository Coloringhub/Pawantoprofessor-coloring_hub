// Pawn to Professor · Precision Fill V2
// Extends an already-safe flood-fill into its blocked edge, NEVER into another free region.
// Existing flood-fill leak detection and user-defined barriers remain authoritative.
(function(root){
  'use strict';
  function expandIntoOutline({core, blocked, seen, stamp, width, bounds, radius = 2, protectedMask = null}) {
    if (!core || !core.length || !blocked || !seen || !width) return [];
    const [left, top, right, bottom] = bounds;
    const result = [];
    let frontier = core;
    const steps = Math.max(0, Math.min(4, Math.round(radius)));
    for (let pass = 0; pass < steps; pass++) {
      const next = [];
      for (let k = 0; k < frontier.length; k++) {
        const p = frontier[k], x = p % width, y = Math.floor(p / width);
        // Only enter original blocked edge pixels. Never grow into neighboring
        // light regions or outside the teacher-selected coloring rectangle.
        function consider(q) {
          if (blocked[q] !== 1 || seen[q] === stamp || (protectedMask && protectedMask[q])) return;
          seen[q] = stamp;
          next.push(q);
        }
        if (x > left) consider(p - 1);
        if (x < right - 1) consider(p + 1);
        if (y > top) consider(p - width);
        if (y < bottom - 1) consider(p + width);
      }
      if (!next.length) break;
      // Avoid argument-spread limits on heavily detailed, high-resolution pages.
      for (let i = 0; i < next.length; i++) result.push(next[i]);
      frontier = next;
    }
    return result;
  }
  const api = {expandIntoOutline};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.PTPPrecisionFillV2 = api;
})(typeof window !== 'undefined' ? window : null);
