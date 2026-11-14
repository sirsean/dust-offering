import { challenge } from '../config/challenge.js';

export function challengeUrl(base) {
  const url = new URL(base);
  url.search = '';
  url.hash = '';
  url.searchParams.set('challenge', challenge.id);
  return url.href;
}
export function shareText(result, base) {
  return `Dust Offering — ${result.score}/1000\nLeft ${result.left.toLocaleString('en-US')} / ${challenge.leftTarget.toLocaleString('en-US')} · Right ${result.right.toLocaleString('en-US')} / ${challenge.rightTarget.toLocaleString('en-US')}\n${challengeUrl(base)}`;
}
export async function shareScore(result, base, platform) {
  const text = shareText(result, base);
  if (typeof platform.share === 'function') {
    try {
      await platform.share({
        title: 'Dust Offering',
        text: text.split('\n').slice(0, 2).join('\n'),
        url: challengeUrl(base),
      });
      return { status: 'shared', text };
    } catch (error) {
      if (error.name === 'AbortError') return { status: 'cancelled', text };
    }
  }
  try {
    if (!platform.clipboard?.writeText)
      throw new Error('Clipboard unavailable');
    await platform.clipboard.writeText(text);
    return { status: 'copied', text };
  } catch {
    return { status: 'manual', text };
  }
}
