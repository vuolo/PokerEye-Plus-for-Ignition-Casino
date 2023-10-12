import { HAND_KEYS, type Action, type HandMap } from "~/types/chart";

// Create a default hand map with action set to "Fold."
const DEFAULT_HAND_MAP: HandMap = HAND_KEYS.reduce((acc, hand) => {
  acc[hand] = [{ action: "Fold", percentage: 1.0, numBigBlinds: 0.0 }];
  return acc;
}, {} as HandMap);

export type EasyHandMapParams = {
  hands: (keyof HandMap)[][];
  actions: Action[];
  percentages?: number[] | number[][];
  numBigBlinds: number[] | number[][];
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
            (actions[index] ?? "...").split("/")?.map((action, actionIdx) => {
              return {
                action,
                // Check for !number[][] type (i.e. number[]) for percentages and numBigBlinds
                percentage: !Array.isArray(percentages[index])
                  ? (percentages[index] as number)
                  : (percentages as number[][])[index]?.[actionIdx],
                numBigBlinds: !Array.isArray(numBigBlinds)
                  ? (numBigBlinds[index] as number)
                  : (numBigBlinds as number[][])[index]?.[actionIdx],
              };
            }),
          ];
        });
      }),
    ),
  } as HandMap;
};
