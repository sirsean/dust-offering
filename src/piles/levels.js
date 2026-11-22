import { pileLevels, piles } from '../config/piles.js';
import { stone } from '../simulation/geometry.js';
import { seededRandom } from '../simulation/random.js';

// Upper and lower ring sites leave a lane for wells and cross-stone sweeps.
const layouts = [
  {
    upper: [
      [80, 54],
      [55, 99],
      [105, 99],
    ],
    lower: [
      [35, 153],
      [80, 155],
      [125, 153],
    ],
    single: [[80, 113]],
    split: [
      [61, 124],
      [99, 124],
    ],
  },
  {
    upper: [
      [80, 57],
      [49, 111],
      [111, 111],
    ],
    lower: [
      [38, 157],
      [80, 149],
      [122, 157],
    ],
    single: [[80, 92]],
    split: [
      [59, 135],
      [101, 135],
    ],
  },
  {
    upper: [
      [80, 51],
      [61, 89],
      [99, 89],
    ],
    lower: [
      [37, 144],
      [80, 157],
      [123, 144],
    ],
    single: [[80, 116]],
    split: [
      [65, 118],
      [95, 118],
    ],
  },
];

function hash(text) {
  let value = 2166136261;
  for (let i = 0; i < text.length; i++)
    value = Math.imul(value ^ text.charCodeAt(i), 16777619);
  return value >>> 0;
}

export function chapterAt(number) {
  return Math.max(
    0,
    Math.ceil((number - piles.openingLength) / piles.chapterLength),
  );
}

export function endsChapter(number) {
  return (
    number >= piles.openingLength &&
    (number - piles.openingLength) % piles.chapterLength === 0
  );
}

function sample(points, count, random) {
  const available = points.slice();
  return Array.from(
    { length: count },
    () => available.splice(Math.floor(random() * available.length), 1)[0],
  );
}

const slope = stone.halfWidth / (stone.bottom - stone.top);
const edgeScale = Math.hypot(1, slope);
function fits({ x, y }, radius) {
  return (
    y + radius <= stone.bottom &&
    Math.abs(x - stone.x) + radius * edgeScale <= slope * (y - stone.top)
  );
}

function valid(targets, wells) {
  return (
    targets.every(
      (target, i) =>
        fits(target, target.radius + 1) &&
        targets
          .slice(i + 1)
          .every(
            (other) =>
              Math.hypot(target.x - other.x, target.y - other.y) >=
              target.radius + other.radius + 3,
          ) &&
        wells.every(
          (well) =>
            Math.hypot(target.x - well.x, target.y - well.y) >=
            target.radius + 8,
        ),
    ) &&
    wells.every(
      (well, i) =>
        fits(well, 7) &&
        wells
          .slice(i + 1)
          .every(
            (other) => Math.hypot(well.x - other.x, well.y - other.y) >= 23,
          ),
    )
  );
}

export function levelFor(seed, number) {
  const opening = pileLevels[number - 1];
  if (opening) return { ...opening, number };

  const chapter = chapterAt(number);
  const layoutSeed = hash(
    JSON.stringify([seed, number, 'layout', piles.runVersion]),
  );
  const random = seededRandom(layoutSeed);
  const layout = layouts[Math.floor(random() * layouts.length)];
  const count = Math.min(6, 4 + Math.max(0, chapter - 1));
  const topMin = Math.max(1, count - 3);
  const topMax = Math.min(3, count - 1);
  const top = topMin + Math.floor(random() * (topMax - topMin + 1));
  const sites = [
    ...sample(layout.upper, top, random),
    ...sample(layout.lower, count - top, random),
  ];
  const sources = count >= 4 ? layout.split : layout.single;
  const radius = 16 - (4 * chapter) / (chapter + 6);
  const fill = 0.6 + (0.16 * chapter) / (chapter + 6);
  const supply = count * (318 + Math.floor(random() * 17));
  const mirror = random() < 0.5;
  const point = ([x, y], spread) => ({
    x: (mirror ? 2 * stone.x - x : x) + Math.round((2 * random() - 1) * spread),
    y: y + Math.round((2 * random() - 1) * spread),
  });

  let targets, wells;
  for (let attempt = 0; attempt <= 16; attempt++) {
    // The unjittered sites fit at every difficulty, so generation always ends.
    const spread = attempt === 16 ? 0 : 5;
    targets = sites.map((site) => ({
      ...point(site, spread),
      radius: radius + (spread ? random() - 0.5 : 0),
    }));
    wells = sources.map((site, i) => ({
      ...point(site, spread),
      grains:
        Math.floor((supply * (i + 1)) / sources.length) -
        Math.floor((supply * i) / sources.length),
    }));
    if (valid(targets, wells)) break;
  }

  return {
    id: `offering-${number}`,
    number,
    seed: hash(JSON.stringify([seed, number, 'grains', piles.runVersion])),
    wells,
    targets,
    fill,
  };
}
