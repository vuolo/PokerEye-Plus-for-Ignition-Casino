import { HAND_KEYS, type Action, type HandMap } from "~/types/chart";

// Create a default hand map with action set to "Fold."
const DEFAULT_HAND_MAP: HandMap = HAND_KEYS.reduce((acc, hand) => {
  acc[hand] = [{ action: "Fold", percentage: 1.0, numBigBlinds: 0.0 }];
  return acc;
}, {} as HandMap);

export type EasyHandMapParams = {
  hands: (keyof HandMap)[];
  action: Action;
  percentage?: number;
  numBigBlinds: number;
};

export const easyHandMap = ({
  hands,
  action,
  percentage = 1.0,
  numBigBlinds,
}: EasyHandMapParams): HandMap => {
  return {
    ...DEFAULT_HAND_MAP,
    ...Object.fromEntries(
      hands.map((hand) => [hand, [{ action, percentage, numBigBlinds }]]),
    ),
  } as HandMap;
};

export type EasyHandMapWithMultipleActionsForDifferentHandsParams = {
  hands: (keyof HandMap)[][];
  actions: Action[];
  percentages?: number[];
  numBigBlinds: number[];
};

// TODO: rework because T4s says "Raise" but should say "Limp" (for SB)
export const easyHandMapWithMultipleActionsForDifferentHands = ({
  hands,
  actions,
  percentages = Array<number>(actions.length).fill(1.0),
  numBigBlinds,
}: EasyHandMapWithMultipleActionsForDifferentHandsParams): HandMap => {
  return {
    ...DEFAULT_HAND_MAP,
    ...Object.fromEntries(
      hands.flat().map((hand, i) => [
        hand,
        [
          {
            action: actions[i % actions.length],
            percentage: percentages[i % percentages.length],
            numBigBlinds: numBigBlinds[i % numBigBlinds.length],
          },
        ],
      ]),
    ),
  } as HandMap;
};
