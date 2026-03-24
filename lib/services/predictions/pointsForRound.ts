/**
 * Points awarded for correctly predicting a match winner.
 * Points double each round: R1=1, R2=2, R3=4, R4=8, etc.
 */
export function pointsForRound(round: number): number {
  return Math.pow(2, round - 1);
}
