// import { createNextApiHandler } from "@trpc/server/adapters/next";

// import { env } from "~/env.mjs";
// import { appRouter } from "~/server/api/root";
// import { createTRPCContext } from "~/server/api/trpc";

// // export API handler
// export default createNextApiHandler({
//   router: appRouter,
//   createContext: createTRPCContext,
//   onError:
//     env.NODE_ENV === "development"
//       ? ({ path, error }) => {
//           console.error(
//             `❌ tRPC failed on ${path ?? "<no-path>"}: ${error.message}`
//           );
//         }
//       : undefined,
// });

import { createNextApiHandler } from "@trpc/server/adapters/next";

import { env } from "~/env.mjs";
import { appRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";

import type { NextApiRequest, NextApiResponse } from "next";

const tRPCHandler = createNextApiHandler({
  router: appRouter,
  createContext: createTRPCContext,
  onError:
    env.NODE_ENV === "development"
      ? ({ path, error }) => {
          console.error(
            `❌ tRPC failed on ${path ?? "<no-path>"}: ${error.message}`,
          );
        }
      : undefined,
});

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,HEAD,PUT,PATCH,POST,DELETE",
  );
  res.setHeader("Content-Type", "application/json");

  // Forward the request to the tRPC handler
  return tRPCHandler(req, res);
}
