import type { BestAction, Hand, Position, RfiPosition } from "~/types/chart";
import { charts as charts_6max_100bb } from "~/utils/preflop-charts/6max_100bb";

export type GetBestPreflopActionsParams = {
  hand: Hand;
  position: Position;
  rfiPosition?: RfiPosition;
};

export type GetBestPreflopActionsResult = {
  bestActions: BestAction[];
};

export const getBestPreflopAction_6max_100bb = ({
  hand,
  position,
  rfiPosition,
}: GetBestPreflopActionsParams): GetBestPreflopActionsResult => {
  return {
    bestActions:
      (rfiPosition
        ? // TODO: Check if position = "BB" AND "SB" player limped to use the "BB-vs-SB-Limp" chart
          position === "BB" && rfiPosition === "SB"
          ? charts_6max_100bb[`BB-vs-SB-Raise`]?.handMap[hand]
          : charts_6max_100bb[`${position}-vs-${rfiPosition}-RFI`]?.handMap[
              hand
            ]
        : // TODO: Check if position = "SB" AND all players folded to SB to use the "SB-vs-BB-Only" chart
          charts_6max_100bb[`RFI-${position}`]?.handMap[hand]) ?? [],
  };
};
