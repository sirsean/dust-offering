import { seededRandom } from '../simulation/random.js';

// Original Dust Offering fiction, told through records left at the Black Pyramid.
const records = [
  {
    title: 'The receipt',
    paragraphs: [
      'Under the dust is a Pyramid Order receipt. The date is tomorrow. The box for a signature contains the little crescent your thumbnail just left in the grease.',
      'There is a note in the margin. “We can weigh what came back. Leave room for what is still coming.”',
    ],
  },
  {
    title: 'Two columns',
    paragraphs: [
      'The Order kept two columns for this reach of the Scablands. In one they wrote the names of the people who had returned. In the other they wrote what those people had left behind.',
      'Someone has drawn a line through the word boots and written the way she walked. You can feel the correction in the stone with your eyes closed.',
    ],
  },
  {
    title: 'A dry test',
    paragraphs: [
      'An early survey lists three faces of the Black Pyramid. A later copy lists the same face three times, under different dates. Every copy has the same chipped corner.',
      'The member who dug beneath the corner came back with an empty sample tin. From inside the tin, someone asked her to keep digging.',
    ],
  },
  {
    title: 'The keeper',
    paragraphs: [
      'The keeper used to press a thumb into each completed measure. It was how the Order could tell a person had done the work. One morning the keeper woke with smooth skin and found his print in every ring.',
      'There is a rubbing of his last print here. Near its centre the whorls run out to the edge of the page and continue into yours.',
    ],
  },
  {
    title: 'The empty line',
    paragraphs: [
      'At the end of the book is the first receipt. It gives the weight of a hand, down to the dust under the nails. The return address is the stone beneath your wrist.',
      'The Order left the witness line empty on purpose. Someone had to be able to come along and put a hand there.',
    ],
  },
];

const finds = [
  [
    'Carbon copy',
    'A second receipt has come up beneath the first. Its ink is dry. Its paper is wet on the side that faced the stone.',
  ],
  [
    'Return address',
    'A surveyor gave the Pyramid a return address. Someone has been maintaining the mailbox, far out in the Scablands, without a road.',
  ],
  [
    'Borrowed weight',
    'The Order weighed this dust against an empty boot. Both scales came down. There is a fresh heel print on the ceiling of the weigh room.',
  ],
  [
    'One copy held',
    'A keeper heard a page turn in the sealed records room. In the morning the door was still locked. The book was one page longer.',
  ],
  [
    'Witness mark',
    'The dust in the outermost ring contains a row of tiny dents. A member has drawn each one at full size. They are the teeth of a key.',
  ],
  [
    'Field correction',
    'Two records disagree about which way the wind blew. Each has sand caught beneath its fold, on the side the other record says was sheltered.',
  ],
  [
    'Unclaimed',
    'A member tied a tag to something in the dust that kept moving after the wells stopped. In the accession book she has drawn the knot, twice.',
  ],
];

const hands = [
  'Beside it, a later hand has drawn the brush mark you made at the start of this offering.',
  'A note on the back asks the next keeper to leave one line free for the person who brought it in.',
  'The grease from the reverse of the paper has already transferred to your thumb.',
  'The catalogue gives a date half a cycle away. The ink on both copies is still warm.',
  'Under the last line is a small drawing of the rings you are about to see.',
  'Someone has put a clean cloth and a fresh ledger beside the stone. One corner of the cloth is worn through.',
  'The previous keeper has written your next entry number on the back. You can feel it through the paper.',
];

export function recordFor(chapter, nextOffering) {
  if (records[chapter]) return records[chapter];
  const random = seededRandom(nextOffering.seed);
  const [title, text] = finds[Math.floor(random() * finds.length)];
  return {
    title,
    paragraphs: [text, hands[Math.floor(random() * hands.length)]],
  };
}
