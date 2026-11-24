import { seededRandom } from '../simulation/random.js';

export function recordFor(story, chapter, nextOffering) {
  const { records, fieldObservations, marginNotes } = story;
  if (records[chapter]) return records[chapter];

  const random = seededRandom(nextOffering.seed);
  const { title, text } =
    fieldObservations[Math.floor(random() * fieldObservations.length)];
  return {
    title,
    paragraphs: [text, marginNotes[Math.floor(random() * marginNotes.length)]],
  };
}
