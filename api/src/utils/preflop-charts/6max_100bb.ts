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

// [Raise First In (RFI)]:
// ~LJ (RFI)
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

// ~HJ (RFI)
charts["RFI-HJ"] = {
  name: "RFI",
  position: "HJ",
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
      "A2s",

      // Row 2
      "AKo",
      "KK",
      "KQs",
      "KJs",
      "KTs",
      "K9s",
      "K8s",
      "K7s",
      "K6s",

      // Row 3
      "AQo",
      "KQo",
      "QQ",
      "QJs",
      "QTs",
      "Q9s",
      "Q8s",

      // Row 4
      "AJo",
      "KJo",
      "QJo",
      "JJ",
      "JTs",
      "J9s",

      // Row 5
      "ATo",
      "KTo",
      "QTo",
      // ...
      "TT",
      "T9s",

      // Row 6
      "99",
      "98s",

      // Row 7
      "88",
      "87s",

      // Row 8
      "77",
      "76s",

      // Row 9
      "66",

      // Row 10
      "55",
    ],
    action: "Raise",
    numBigBlinds: 2.5,
  }),
};

// ~CO (RFI)
charts["RFI-CO"] = {
  name: "RFI",
  position: "CO",
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
      "A2s",

      // Row 2
      "AKo",
      "KK",
      "KQs",
      "KJs",
      "KTs",
      "K9s",
      "K8s",
      "K7s",
      "K6s",
      "K5s",
      "K4s",
      "K3s",

      // Row 3
      "AQo",
      "KQo",
      "QQ",
      "QJs",
      "QTs",
      "Q9s",
      "Q8s",
      "Q7s",
      "Q6s",

      // Row 4
      "AJo",
      "KJo",
      "QJo",
      "JJ",
      "JTs",
      "J9s",
      "J8s",

      // Row 5
      "ATo",
      "KTo",
      "QTo",
      "JTo",
      "TT",
      "T9s",
      "T8s",
      "T7s",

      // Row 6
      "A9o",
      // ...
      "99",
      "98s",
      "97s",

      // Row 7
      "A8o",
      // ...
      "88",
      "87s",

      // Row 8
      "77",
      "76s",

      // Row 9
      "66",

      // Row 10
      "55",

      // Row 11
      "44",

      // Row 12
      "33",
    ],
    action: "Raise",
    numBigBlinds: 2.5,
  }),
};

// ~BTN (RFI)
charts["RFI-BTN"] = {
  name: "RFI",
  position: "BTN",
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
      "A2s",

      // Row 2
      "AKo",
      "KK",
      "KQs",
      "KJs",
      "KTs",
      "K9s",
      "K8s",
      "K7s",
      "K6s",
      "K5s",
      "K4s",
      "K3s",
      "K2s",

      // Row 3
      "AQo",
      "KQo",
      "QQ",
      "QJs",
      "QTs",
      "Q9s",
      "Q8s",
      "Q7s",
      "Q6s",
      "Q5s",
      "Q4s",
      "Q3s",

      // Row 4
      "AJo",
      "KJo",
      "QJo",
      "JJ",
      "JTs",
      "J9s",
      "J8s",
      "J7s",
      "J6s",
      "J5s",
      "J4s",

      // Row 5
      "ATo",
      "KTo",
      "QTo",
      "JTo",
      "TT",
      "T9s",
      "T8s",
      "T7s",
      "T6s",

      // Row 6
      "A9o",
      "K9o",
      "Q9o",
      "J9o",
      "T9o",
      "99",
      "98s",
      "97s",
      "96s",

      // Row 7
      "A8o",
      "K8o",
      // ...
      "T8o",
      "98o",
      "88",
      "87s",
      "86s",
      "85s",

      // Row 8
      "A7o",
      // ...
      "77",
      "76s",
      "75s",

      // Row 9
      "A6o",
      // ...
      "66",
      "65s",
      "64s",

      // Row 10
      "A5o",
      // ...
      "55",
      "54s",
      "53s",

      // Row 11
      "A4o",
      // ...
      "44",

      // Row 12
      "33",

      // Row 13
      "22",
    ],
    action: "Raise",
    numBigBlinds: 2.5,
  }),
};

// [Facing RFI: In Position]:

// [Facing RFI: Out of Position]:

// [Blind vs Blind]:
