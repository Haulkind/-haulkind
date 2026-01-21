import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { serviceAreasRouter } from "./routers/serviceAreas";
import { pricingRouter } from "./routers/pricing";
import { jobsRouter } from "./routers/jobs";
import { mediaRouter } from "./routers/media";
import { driversRouter } from "./routers/drivers";
import { dispatchRouter } from "./routers/dispatch";
import { ledgerRouter } from "./routers/ledger";
import { itemsRouter } from "./routers/items";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Feature routers
  serviceAreas: serviceAreasRouter,
  pricing: pricingRouter,
  jobs: jobsRouter,
  media: mediaRouter,
  drivers: driversRouter,
  dispatch: dispatchRouter,
  ledger: ledgerRouter,
  items: itemsRouter,
});

export type AppRouter = typeof appRouter;
