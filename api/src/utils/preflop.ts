import type { BestAction, Hand, Position, RfiPosition } from "~/types/chart";
import { charts as charts_6max_100bb } from "~/utils/preflop-charts/6max_100bb";

const USE_SIMILAR_CHARTS_IF_NOT_FOUND = true;

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
        ? position === "BB" && rfiPosition === "SB"
          ? charts_6max_100bb[`BB-vs-SB-Raise`]?.handMap[hand]
          : charts_6max_100bb[`${position}-vs-${rfiPosition}-RFI`]?.handMap[
              hand
            ]
        : // TODO: Check if position = "SB" AND all players folded to SB to use the "SB-vs-BB-Only" chart
        position === "BB"
        ? charts_6max_100bb[`BB-vs-SB-Limp`]?.handMap[hand]
        : charts_6max_100bb[`RFI-${position}`]?.handMap[hand]) ??
      // Default to similar charts if the chart doesn't exist
      (USE_SIMILAR_CHARTS_IF_NOT_FOUND
        ? charts_6max_100bb[`${position}-vs-LJ-RFI`]?.handMap[hand] ??
          charts_6max_100bb[`RFI-${position}`]?.handMap[hand]
        : []) ??
      [],
  };
};
