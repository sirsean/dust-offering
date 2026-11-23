import { seededRandom } from '../simulation/random.js';

// Pyramid Order recruitment records for Dust Offering.
const records = [
  {
    paragraphs: [
      'Wind pushes the sand, all around this world. Around every world with air to breathe, it blows the sand. In the center of the universe there is a pyramid, and in the void who will push the sand?',
    ],
  },
  {
    paragraphs: [
      'We have always kept two columns for this reach of the Scablands. In one, the names of the people who had returned. In the other, what those people had left behind.',
      'Someone has drawn a line through the word “boots” and scrawled a description of her gait instead.',
    ],
  },
  {
    paragraphs: [
      'Sit with your back to the door. People will walk past, some you know and some you’ve never met. Raise a finger when you recognize someone. We’ll ask what you heard.',
      'One evening a woman knew her brother from his first step. She asked him to walk past again. Soon he was walking differently because he knew she was listening.',
    ],
    title: 'By ear',
  },
  {
    paragraphs: [
      'The keeper asks you to choose a ring and move a little sand into it. Afterwards she asks when you chose. If you remember having the thought “there,” show her what your finger was doing at the time. She will watch your hand as many times as you care to try.',
    ],
    title: 'The keeper',
  },
  {
    paragraphs: [
      'Our first teachers drew the Black Pyramid in the margins beside questions they couldn’t settle about their own minds. It turns up most often next to things any child can do, like deciding which hand to open.',
    ],
    title: 'The invitation',
  },
];

const finds = [
  [
    'A room remembered',
    'Try counting the doors in the room where you slept as a child. One of our members has to walk through it in her head. She says she misses the window more on the days she tries the exercise.',
  ],
  [
    'A familiar step',
    'Some of us came to the Order because we could still hear a familiar tread years after the hall went quiet. We started out asking what a mind can keep. We are still arguing about what it can give back.',
  ],
  [
    'The end of the fire',
    'Watch a fire go out with someone else. In the morning ask each other when it got dark. One of you will remember watching the coals. The other might remember having to find the door.',
  ],
  [
    'What your hands know',
    'On a second visit we ask you to describe a gesture in enough detail for someone else to copy it. Most people choose something they learned as children. We have spent whole evenings on where to put the thumb.',
  ],
  [
    'Out of earshot',
    'Four of us can meet around an ordinary table. By the third meeting you’ll have heard someone describe a thing you’d assumed only happened to you. We ask you to give that person the same patience next time.',
  ],
  [
    'After the shift',
    'A longhauler told us she could describe each motion of her hands at the end of a shift and could remember choosing almost none of them. We asked her to come back when she was off watch. It took her a year.',
  ],
  [
    'The last thing you heard',
    'A member spent half a cycle trying to remember the last sound she heard each night. By the end she was telling us what she had been hoping to hear. She brought that account to every meeting for a while. It was the first one she trusted.',
  ],
];

const hands = [
  'Take your time with the account. We can wait.',
  'If you used both hands, try to remember which one you were paying attention to.',
  'Some of our best accounts begin with “I thought I was waiting.”',
  'If there is a word you always use to tell this story, try telling it without that word.',
  'If you come back, you can ask to sit with the same keeper.',
  'Keep one question to yourself until your next visit.',
  'Tell us where you lost track. One of us will have been there too.',
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
