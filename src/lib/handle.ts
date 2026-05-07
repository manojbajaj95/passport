const ADVERBS = [
  'boldly', 'bravely', 'calmly', 'cleverly', 'deeply',
  'fiercely', 'freely', 'gently', 'gladly', 'keenly',
  'kindly', 'nimbly', 'proudly', 'purely', 'quietly',
  'sharply', 'silently', 'softly', 'swiftly', 'truly',
  'warmly', 'wisely',
]

const ADJECTIVES = [
  'amber', 'azure', 'bold', 'brave', 'bright',
  'calm', 'clever', 'crimson', 'emerald', 'fierce',
  'gentle', 'golden', 'jade', 'keen', 'nimble',
  'noble', 'quiet', 'sapphire', 'sharp', 'silent',
  'silver', 'swift', 'warm', 'wild', 'wise',
]

const NOUNS = [
  'bear', 'crane', 'deer', 'dove', 'eagle',
  'falcon', 'finch', 'fox', 'hawk', 'heron',
  'kite', 'lark', 'lion', 'lynx', 'martin',
  'otter', 'owl', 'raven', 'stag', 'swan',
  'tiger', 'wolf', 'wren',
]

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function generateHandle(): string {
  return `${pick(ADVERBS)}-${pick(ADJECTIVES)}-${pick(NOUNS)}`
}

export function isValidHandle(handle: string): boolean {
  return /^[a-z]+-[a-z]+-[a-z]+$/.test(handle)
}
