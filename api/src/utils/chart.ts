import { HAND_KEYS, type Action, type HandMap } from "~/types/chart";

export type DefaultHandMapParams = {
  action?: Action;
  percentage?: number;
  numBigBlinds?: number;
};

export const defaultHandMap = ({
  action = "Fold",
  percentage = 1.0,
  numBigBlinds = 0.0,
}: DefaultHandMapParams = {}): HandMap =>
  HAND_KEYS.reduce((acc, hand) => {
    acc[hand] = [{ action, percentage, numBigBlinds }];
    return acc;
  }, {} as HandMap);

// Create a default hand map with action set to "Fold."
const DEFAULT_HAND_MAP: HandMap = defaultHandMap();

export type EasyHandMapParams = {
  hands: (keyof HandMap)[][];
  actions: Action[];
  percentages?: number[] | number[][];
  numBigBlinds: number[] | number[][];
  defaultHandMap?: HandMap;
};

export const easyHandMap = ({
  hands,
  actions,
  percentages = Array<number>(actions.length).fill(1.0),
  numBigBlinds,
  defaultHandMap = DEFAULT_HAND_MAP,
}: EasyHandMapParams): HandMap => {
  return {
    ...defaultHandMap,
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
                numBigBlinds: !Array.isArray(numBigBlinds[index])
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
