export function readStored(storage, key, fallback = null) {
  try {
    return storage?.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}
export function writeStored(storage, key, value) {
  try {
    storage?.setItem(key, String(value));
    return true;
  } catch {
    return false;
  }
}
export function bestScore(storage, id) {
  const stored = readStored(storage, `dust-offering:best:${id}`);
  const score = stored === null ? NaN : Number(stored);
  return Number.isInteger(score) && score >= 0 && score <= 1000 ? score : null;
}
export function saveBest(storage, id, score) {
  const best = Math.max(bestScore(storage, id) ?? 0, score);
  return {
    best,
    saved: writeStored(storage, `dust-offering:best:${id}`, best),
  };
}
