import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { z } from "zod";

import { HAND_KEYS } from "~/types/chart";
import { getBestPreflopAction_6max_100bb } from "~/utils/preflop";

export const pokerCalculationsRouter = createTRPCRouter({
  getBestPreflopActions: publicProcedure
    .input(
      z.object({
        maxPlayers: z.enum(["4", "6"]),
        numBigBlinds: z.number().int().positive(),
        hand: z.enum(HAND_KEYS),
        // TODO: add const like HAND_KEYS for position and rfiPosition in ~/types/chart.ts
        position: z.enum(["LJ", "HJ", "CO", "BTN", "SB", "BB"]),
        rfiPosition: z.enum(["LJ", "HJ", "CO", "BTN", "SB"]).optional(), // "rfi" means "raise first in" (i.e. the first player to raise preflop)
      }),
    )
    .query(({ input }) => {
      // Input validation
      if (!input.maxPlayers)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Missing 'maxPlayers' (must be either '4' or '6').",
        });
      if (!input.numBigBlinds)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Missing 'numBigBlinds' (must be a positive integer).",
        });
      if (!input.hand)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Missing 'hand' (e.g. ['AKo', 'T9o']).",
        });
      if (!input.position)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Missing 'position' (must be either 'LJ', 'HJ', 'CO', 'BTN', 'SB', or 'BB').",
        });

      // Determine which preflop chart to use
      switch (input.maxPlayers) {
        case "4":
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "4-max tables are not yet supported.",
          });
        case "6":
          if (input.numBigBlinds < 100)
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Invalid 'numBigBlinds' (must be at least 100).",
            });

          return {
            status: 200,
            message: "Calculated the best preflop action(s).",
            result: {
              ...getBestPreflopAction_6max_100bb({
                hand: input.hand,
                position: input.position,
                rfiPosition: input.rfiPosition,
              }),
              input,
            },
          };
        default:
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid 'maxPlayers' (must be either '4' or '6'.",
          });
      }
    }),
});
