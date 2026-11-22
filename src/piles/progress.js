import { piles } from '../config/piles.js';

function key(seed) {
  return `dust-offering:piles:${piles.runVersion}:${seed}`;
}

export function loadProgress(seed) {
  try {
    const saved = JSON.parse(localStorage.getItem(key(seed)));
    if (
      Number.isSafeInteger(saved?.level) &&
      saved.level > 1 &&
      Array.isArray(saved.discovery)
    ) {
      return saved;
    }
  } catch {
    // Private or blocked storage still allows a run in this page.
  }
  return null;
}

export function saveProgress(seed, level, discovery) {
  try {
    if (loadProgress(seed)?.level > level) return;
    localStorage.setItem(
      key(seed),
      JSON.stringify({ level, discovery: discovery.snapshot() }),
    );
  } catch {
    // Saving is optional when storage is unavailable or full.
  }
}
