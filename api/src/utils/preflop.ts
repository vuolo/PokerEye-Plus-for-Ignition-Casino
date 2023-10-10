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
    bestActions: rfiPosition
      ? []
      : charts_6max_100bb[`RFI-${position}`]?.handMap[hand] ?? [],
  };
};
