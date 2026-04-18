// Full pool of course pairs for interest calibration.
// Used by onboarding (10 pairs) and recurring interest pulse (2-3 pairs).
// Each pair compares two different domains.

export const COURSE_PAIRS = [
  // ── Set 1: Onboarding pairs ───────────────────────────
  [
    { domain: 'history',      title: 'The Last Day of Constantinople',          desc: 'How a thousand-year empire fell in a single afternoon — and why it still matters.' },
    { domain: 'science',      title: 'What Darwin Actually Said',               desc: 'The full story of evolution: what the theory gets right, what it took decades to prove, and what it still can\'t explain.' }
  ],
  [
    { domain: 'literature',   title: 'The Brothers Karamazov and the God Problem', desc: 'Dostoevsky\'s greatest novel as a sustained argument about faith, doubt, and what holds a life together.' },
    { domain: 'math',         title: 'The Secret Life of Prime Numbers',        desc: 'Why mathematicians have spent two thousand years obsessed with numbers that refuse to divide — and what that obsession unlocked.' }
  ],
  [
    { domain: 'philosophy',   title: 'How to Disagree: From Socrates to Now',  desc: 'The history of argument as a discipline — what it means to change your mind, and why most debates go nowhere.' },
    { domain: 'music',        title: 'What Jazz Invented',                     desc: 'Improvisation, freedom, and the American sound: how a musical form became a way of thinking.' }
  ],
  [
    { domain: 'anthropology', title: 'Why Humans Bury Their Dead',              desc: 'What ritual reveals about the human mind — and why every culture on earth has developed ceremonies for the same moments.' },
    { domain: 'economics',    title: 'Why Prices Lie',                         desc: 'The invisible architecture of markets: how prices form, what they conceal, and when they break down entirely.' }
  ],
  [
    { domain: 'geography',    title: 'The Politics of the Map',                 desc: 'How cartographers have always made arguments — and why the borders we think of as natural are anything but.' },
    { domain: 'art',          title: 'Learning to See: How to Read a Painting', desc: 'The techniques painters use to control what you notice, what you feel, and what you remember.' }
  ],
  [
    { domain: 'psychology',   title: 'The Unreliable Mind',                    desc: 'Memory, bias, and the uncomfortable gap between what we experience and what we think we experienced.' },
    { domain: 'history',      title: '1789: The Year the World Changed',       desc: 'The French Revolution not as a sequence of events but as a rupture — the moment modern politics was born.' }
  ],
  [
    { domain: 'science',      title: 'The Physics of Time',                    desc: 'Why the past feels different from the future, why time seems to flow, and what physics actually says about both.' },
    { domain: 'philosophy',   title: 'What We Owe Each Other',                 desc: 'An introduction to moral philosophy through the question that won\'t go away: what are we obligated to do for other people?' }
  ],
  [
    { domain: 'music',        title: 'The Architecture of a Symphony',         desc: 'How a piece of music is constructed, what a composer is actually deciding, and how to listen rather than just hear.' },
    { domain: 'literature',   title: 'Why We Still Read Kafka',                desc: 'Bureaucracy, alienation, and the modern condition — what makes Kafka\'s strange fictions feel more accurate every decade.' }
  ],
  [
    { domain: 'economics',    title: 'The History of Money',                   desc: 'From cowrie shells to cryptocurrency: what money actually is, why it works, and what happens when it stops.' },
    { domain: 'anthropology', title: 'Food, Identity, and the Table',          desc: 'Why what we eat is never just about nutrition — and what cuisine reveals about culture, migration, and belonging.' }
  ],
  [
    { domain: 'art',          title: 'Why Buildings Feel the Way They Do',     desc: 'The psychology of architecture: how space, light, and proportion shape experience in ways we rarely notice.' },
    { domain: 'psychology',   title: 'The Psychology of Belief',               desc: 'How people come to hold convictions — and why evidence so rarely changes minds that are already made up.' }
  ],

  // ── Set 2: Pulse pairs ────────────────────────────────
  [
    { domain: 'history',      title: 'The Mongol Century',                     desc: 'How a nomadic confederation from the steppe built the largest contiguous empire in history — and then disappeared.' },
    { domain: 'math',         title: 'The Unreasonable Usefulness of Mathematics', desc: 'Why equations written to solve abstract puzzles keep turning out to describe the physical world with eerie precision.' }
  ],
  [
    { domain: 'literature',   title: 'What Chekhov Knew About Endings',        desc: 'The short story as a form — and why Chekhov\'s particular approach to closure changed how fiction works.' },
    { domain: 'science',      title: 'The Inner Life of Cells',                desc: 'Mitochondria, ribosomes, and the machinery of life: what actually happens inside the unit of all living things.' }
  ],
  [
    { domain: 'philosophy',   title: 'The Problem of Other Minds',             desc: 'How do you know anyone else is conscious? The question sounds absurd — but no one has answered it convincingly.' },
    { domain: 'geography',    title: 'Why Rivers Make Civilisations',          desc: 'The Nile, the Tigris, the Yangtze: why every early civilisation grew up around water and what that constraint produced.' }
  ],
  [
    { domain: 'music',        title: 'The Blues and Its Children',             desc: 'How a musical form born in the Mississippi Delta became the root structure of almost all popular music.' },
    { domain: 'economics',    title: 'What the Great Depression Actually Was', desc: 'Not just a crash but a policy failure — and what it taught economists about how money and governments interact.' }
  ],
  [
    { domain: 'anthropology', title: 'How Language Shapes Thought',            desc: 'Whether the language you speak changes what you can think — and what the debate reveals about the nature of mind.' },
    { domain: 'art',          title: 'The Invention of Perspective',           desc: 'How Renaissance painters developed a mathematical system for representing three dimensions on a flat surface — and what it changed.' }
  ],
  [
    { domain: 'psychology',   title: 'The Milgram Experiments and What They Mean', desc: 'Obedience, authority, and what laboratory experiments from the 1960s still say about human behaviour under pressure.' },
    { domain: 'history',      title: 'The Cold War as a State of Mind',        desc: 'Less about missiles than about how two competing ideas of the future organised the entire second half of the twentieth century.' }
  ],
  [
    { domain: 'science',      title: 'What Quantum Mechanics Actually Says',   desc: 'Past the popular-science version: what the equations actually describe, what they leave open, and why physicists still argue.' },
    { domain: 'literature',   title: 'The Epic and Its Descendants',           desc: 'From Homer to Milton to Morrison: how the longest literary form keeps reinventing itself around the question of heroism.' }
  ],
  [
    { domain: 'math',         title: 'Gödel\'s Incompleteness and Why It Matters', desc: 'The theorem that proved mathematics can\'t prove everything about itself — and the strange consequences that followed.' },
    { domain: 'music',        title: 'Bach and the Architecture of Counterpoint', desc: 'How Johann Sebastian Bach constructed musical arguments — and why his solutions to formal problems still sound like inevitability.' }
  ],
  [
    { domain: 'geography',    title: 'The Geopolitics of Oil',                 desc: 'How the distribution of fossil fuels under the earth\'s surface shaped twentieth-century politics almost entirely.' },
    { domain: 'philosophy',   title: 'Free Will: What\'s Actually at Stake',   desc: 'Whether the question is even coherent, why it matters for how we treat each other, and what neuroscience has and hasn\'t settled.' }
  ],
  [
    { domain: 'economics',    title: 'The Logic of Inequality',                desc: 'Why wealth concentrates, what mechanisms drive it, and what history suggests about whether it\'s reversible.' },
    { domain: 'anthropology', title: 'The Invention of Childhood',             desc: 'How the concept of childhood as a distinct stage of life is historically recent — and what came before it.' }
  ],

  // ── Set 3: Extended pulse pairs ───────────────────────
  [
    { domain: 'history',      title: 'The Islamic Golden Age',                 desc: 'How Baghdad in the ninth century became the centre of world learning — and what was preserved and transmitted to Europe.' },
    { domain: 'psychology',   title: 'How Habits Form and Break',              desc: 'The neuroscience of routine — why behaviour becomes automatic, and what it actually takes to change it.' }
  ],
  [
    { domain: 'literature',   title: 'Reading Between the Lines: Subtext in Fiction', desc: 'What characters don\'t say, what narrators conceal, and how the space between words carries meaning.' },
    { domain: 'science',      title: 'The Climate System: How It Works',       desc: 'Before the politics: the actual physics and chemistry of how the atmosphere regulates temperature.' }
  ],
  [
    { domain: 'art',          title: 'Modernism and the Shock of the New',     desc: 'Why artists in the early twentieth century abandoned beauty as a goal — and what they were trying to do instead.' },
    { domain: 'math',         title: 'The Map That Changed Everything: Topology', desc: 'The branch of mathematics concerned with shape, continuity, and why a coffee cup and a donut are the same thing.' }
  ],
  [
    { domain: 'music',        title: 'The Voice as Instrument',               desc: 'Opera, gospel, and the technical and emotional history of the human voice trained to its limits.' },
    { domain: 'geography',    title: 'Monsoon: The Wind That Runs Half the World', desc: 'How a seasonal wind system has organised agriculture, religion, and warfare across South and East Asia for millennia.' }
  ],
  [
    { domain: 'philosophy',   title: 'Aesthetics: Why Do Things Feel Beautiful?', desc: 'Whether beauty is in the object or the observer — and why the question has proved surprisingly difficult to settle.' },
    { domain: 'economics',    title: 'What Behavioural Economics Actually Found', desc: 'The experiments that showed humans are predictably irrational — and what that means for how markets and policies work.' }
  ],
  [
    { domain: 'anthropology', title: 'Kinship and Why It Organises Everything', desc: 'How different cultures have structured family, inheritance, and belonging — and what varies more than you\'d expect.' },
    { domain: 'history',      title: 'The Printing Press and the Reformation',  desc: 'How a technology for reproducing text accidentally fractured Western Christianity and produced the modern world.' }
  ],
  [
    { domain: 'science',      title: 'The Germ Theory Revolution',             desc: 'How the discovery that invisible organisms cause disease changed medicine, surgery, and the average length of a human life.' },
    { domain: 'literature',   title: 'The American Novel and the Problem of Race', desc: 'From Twain to Morrison: how American fiction has grappled with the contradiction at the centre of the national story.' }
  ],
  [
    { domain: 'psychology',   title: 'Attachment Theory and Its Consequences', desc: 'How the bonds formed in infancy shape adult relationships — and what the evidence for that claim actually looks like.' },
    { domain: 'art',          title: 'Photography and the Death of Painting (That Didn\'t Happen)', desc: 'What happened to visual art after a machine could capture reality — and why painters didn\'t stop.' }
  ],
  [
    { domain: 'math',         title: 'Statistics and the Art of Knowing Things', desc: 'How to reason under uncertainty — and why the tools most people use to evaluate evidence are subtly broken.' },
    { domain: 'music',        title: 'The Rhythm Section: Groove, Time, and Feel', desc: 'What the rhythm section actually does, why some music makes you move and some doesn\'t, and the physics of groove.' }
  ],
  [
    { domain: 'geography',    title: 'The Arctic and What It Reveals',         desc: 'A region changing faster than anywhere on earth — what the Arctic tells us about climate, geopolitics, and deep time.' },
    { domain: 'philosophy',   title: 'The Hard Problem of Consciousness',      desc: 'Why explaining the brain\'s physical processes still leaves open the question of why there\'s something it\'s like to be you.' }
  ],
];

// Which pairs to show during onboarding (first 10)
export const ONBOARDING_PAIR_COUNT = 10;

// How many pairs to show in a recurring pulse
export const PULSE_PAIR_COUNT = 3;

// Get pairs for onboarding (first N)
export function getOnboardingPairs() {
  return COURSE_PAIRS.slice(0, ONBOARDING_PAIR_COUNT);
}

// Get pairs for a pulse, avoiding recently seen ones
export function getPulsePairs(seenPairIndices = []) {
  const available = COURSE_PAIRS
    .map((pair, i) => ({ pair, i }))
    .filter(({ i }) => !seenPairIndices.includes(i));

  // Shuffle and take PULSE_PAIR_COUNT
  const shuffled = available.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, PULSE_PAIR_COUNT).map(({ pair, i }) => ({ pair, index: i }));
}
