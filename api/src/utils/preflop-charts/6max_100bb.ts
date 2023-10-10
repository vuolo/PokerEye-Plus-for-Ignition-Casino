// Note: When calculating the "best" preflop move, we assume the player is:
//  1. Playing on a 6-max cash game table
//  2. Playing with a 100bb stack
//  3. Playing online
// The preflop charts with these conditions can be found online at https://poker-coaching.s3.amazonaws.com/tools/preflop-charts/online-6max-gto-charts.pdf (Source: Jonathan Little's Poker Coaching)
//  • The charts are also mirrored locally, which can be found at http://localhost:3000/resources/preflop-charts/online-6max-gto-charts.pdf
//
// [Bet Sizing]:
// The RFI ranges assume a 2.5bb raise from every position except for the small blind. The small blind RFI assumes a 3bb raise size.
// When 3-betting from in position a 3.5x raise size is used. When 3-betting from out of position a 4x raise sizing is used. When in the big blind, facing a
// small blind limp, a 3.5x raise size is used. When 4-betting from out of position a 2.5x raise size is used. When 4-betting from in position a 2.3x raise size is used.

import type { Charts } from "~/types/chart";
import { easyHandMap } from "~/utils/chart";

export const charts: Charts = {};

// Raise First In (RFI):
charts["RFI-LJ"] = {
  name: "RFI",
  position: "LJ",
  handMap: easyHandMap({
    hands: [
      // Row 1
      "AA",
      "AKs",
      "AQs",
      "AJs",
      "ATs",
      "A9s",
      "A8s",
      "A7s",
      "A6s",
      "A5s",
      "A4s",
      "A3s",

      // Row 2
      "AKo",
      "KK",
      "KQs",
      "KJs",
      "KTs",
      "K9s",
      "K8s",

      // Row 3
      "AQo",
      "KQo",
      "QQ",
      "QJs",
      "QTs",
      "Q9s",

      // Row 4
      "AJo",
      "KJo",
      "JJ",
      "JTs",
      "J9s",

      // Row 5
      "ATo",
      // ...
      "TT",
      "T9s",

      // Row 6
      "99",

      // Row 7
      "88",

      // Row 8
      "77",

      // Row 9
      "66",
    ],
    action: "Raise",
    numBigBlinds: 2.5,
  }),
};

// Facing RFI: In Position:

// Facing RFI: Out of Position:

// Blind vs Blind:
