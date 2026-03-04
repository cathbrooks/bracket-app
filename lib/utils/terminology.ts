/**
 * Terminology for teams vs individual players throughout the app.
 */

import type { ParticipantType } from '@/lib/constants';

export type { ParticipantType };

export interface ParticipantLabels {
  singular: string;
  plural: string;
  /** e.g. "team's" or "player's" */
  possessive: string;
  /** e.g. "Team 1" or "Player 1" */
  placeholder: (index: number) => string;
}

export function getParticipantLabels(type: ParticipantType): ParticipantLabels {
  if (type === 'players') {
    return {
      singular: 'Player',
      plural: 'Players',
      possessive: "player's",
      placeholder: (i) => `Player ${i + 1}`,
    };
  }
  return {
    singular: 'Team',
    plural: 'Teams',
    possessive: "team's",
    placeholder: (i) => `Team ${i + 1}`,
  };
}
