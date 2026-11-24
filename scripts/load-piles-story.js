import { readFileSync } from 'node:fs';
import { parse } from 'yaml';

export const storyFile = new URL(
  '../src/config/piles-story.yaml',
  import.meta.url,
);

const isText = (value) => typeof value === 'string' && value.trim().length > 0;
const isTextList = (value) =>
  Array.isArray(value) && value.length > 0 && value.every(isText);

export function loadPilesStory() {
  const story = parse(readFileSync(storyFile, 'utf8'));
  if (!isText(story?.recordLabel)) {
    throw new Error('Set recordLabel to nonempty text in piles-story.yaml.');
  }
  if (
    !Array.isArray(story.records) ||
    !story.records.every(
      (record) =>
        isTextList(record?.paragraphs) &&
        (record.title === undefined || isText(record.title)),
    )
  ) {
    throw new Error('Each story record needs paragraphs and can have a title.');
  }
  if (
    !Array.isArray(story.fieldObservations) ||
    !story.fieldObservations.length ||
    !story.fieldObservations.every(
      (entry) => isText(entry?.title) && isText(entry.text),
    )
  ) {
    throw new Error(
      'Add at least one field observation with a title and text.',
    );
  }
  if (!isTextList(story.marginNotes)) {
    throw new Error(
      'Add at least one margin note for the later story records.',
    );
  }
  return story;
}
