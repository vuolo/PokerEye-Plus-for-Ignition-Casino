export type Hand = [string, string];
export type Position = "LJ" | "HJ" | "CO" | "BTN" | "SB" | "BB";
export type RfiPosition = "LJ" | "HJ" | "CO" | "BTN" | "SB";
export type Action = "Limp" | "Raise" | "Fold";

export type GetBestPreflopActionsParams = {
  hand: Hand;
  position: Position;
  rfiPosition?: RfiPosition;
};

export type GetBestPreflopActionsResult = {
  bestActions: {
    name: Action;
    percentage: number; // e.g. 0.5 = 50%
    numBigBlinds: number; // e.g. 2.5 = 2.5bb, 3 = 3bb, 3.5 = 3.5bb
  }[];
};

// Note: When calculating the "best" preflop move, we assume the player is:
//  1. Playing on a 6-max cash game table
//  2. Playing with a 100bb stack
//  3. Playing online
// The preflop charts with these conditions can be found at https://poker-coaching.s3.amazonaws.com/tools/preflop-charts/online-6max-gto-charts.pdf (Source: Jonathan Little's Poker Coaching)
//  • The charts can also be found at http://localhost:3000/resources/preflop-charts/online-6max-gto-charts.pdf
export const getBestPreflopAction_6max_100bb = ({
  hand,
  position,
  rfiPosition,
}: GetBestPreflopActionsParams): GetBestPreflopActionsResult => {
  // [Bet Sizing]:
  // The RFI ranges assume a 2.5bb raise from every position except for the small blind. The small blind RFI assumes a 3bb raise size.
  // When 3-betting from in position a 3.5x raise size is used. When 3-betting from out of position a 4x raise sizing is used. When in the big blind, facing a
  // small blind limp, a 3.5x raise size is used. When 4-betting from out of position a 2.5x raise size is used. When 4-betting from in position a 2.3x raise size is used.
  return {
    bestActions: [],
  };
};
