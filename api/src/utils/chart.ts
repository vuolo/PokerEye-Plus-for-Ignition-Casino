import { HAND_KEYS, type Action, type HandMap } from "~/types/chart";

// Create a default hand map with action set to "Fold."
const DEFAULT_HAND_MAP: HandMap = HAND_KEYS.reduce((acc, hand) => {
  acc[hand] = [{ action: "Fold", percentage: 1.0, numBigBlinds: 0.0 }];
  return acc;
}, {} as HandMap);

export type EasyHandMapParams = {
  hands: (keyof HandMap)[][];
  actions: Action[];
  percentages?: number[];
  numBigBlinds: number[];
};

export const easyHandMap = ({
  hands,
  actions,
  percentages = Array<number>(actions.length).fill(1.0),
  numBigBlinds,
}: EasyHandMapParams): HandMap => {
  return {
    ...DEFAULT_HAND_MAP,
    ...Object.fromEntries(
      hands.flatMap((handGroup, index) => {
        return handGroup.map((hand) => {
          return [
            hand,
            [
              {
                action: actions[index],
                percentage: percentages[index],
                numBigBlinds: numBigBlinds[index],
              },
            ],
          ];
        });
      }),
    ),
  } as HandMap;
};
