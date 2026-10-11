/**
 * Generates standard tournament seed order for power-of-2 bracket sizes.
 * Pairs top seeds with bottom seeds so top seeds do not meet until later rounds.
 */
export function getStandardSeedPairs(bracketSize: number): Array<[number, number]> {
  if (bracketSize < 2 || (bracketSize & (bracketSize - 1)) !== 0) {
    throw new Error('Bracket size must be a power of 2');
  }

  let rounds = [1, 2];

  while (rounds.length < bracketSize) {
    const nextRounds: number[] = [];
    const sum = rounds.length * 2 + 1;
    for (let i = 0; i < rounds.length; i++) {
      nextRounds.push(rounds[i]);
      nextRounds.push(sum - rounds[i]);
    }
    rounds = nextRounds;
  }

  const pairs: Array<[number, number]> = [];
  for (let i = 0; i < rounds.length; i += 2) {
    pairs.push([rounds[i], rounds[i + 1]]);
  }

  return pairs;
}

/**
 * Calculates next power of 2 >= n, with default minimum size of 2.
 */
export function getNextPowerOfTwo(n: number, minSize = 2): number {
  let size = Math.max(minSize, 2);
  while (size < n) {
    size *= 2;
  }
  return size;
}

/**
 * Gets standard round name based on bracket size and round index.
 */
export function getRoundName(bracketType: 'single' | 'winners' | 'losers' | 'grand_final', roundNumber: number, totalRounds: number): string {
  if (bracketType === 'grand_final') return 'Grand Final';

  if (bracketType === 'losers') {
    if (roundNumber === totalRounds) return 'Final';
    if (roundNumber === totalRounds - 1) return 'Semifinals';
    return `Round ${roundNumber}`;
  }

  // Single elimination or Winners Bracket
  const roundsFromEnd = totalRounds - roundNumber;
  if (roundsFromEnd === 0) return bracketType === 'winners' ? 'Final' : 'Championship Final';
  if (roundsFromEnd === 1) return 'Semifinals';
  if (roundsFromEnd === 2) return 'Quarterfinals';
  if (roundsFromEnd === 3) return 'Round of 16';
  if (roundsFromEnd === 4) return 'Round of 32';
  if (roundsFromEnd === 5) return 'Round of 64';
  return `Round ${roundNumber}`;
}
