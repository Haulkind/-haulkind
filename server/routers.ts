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
import { customerAuthRouter } from "./routers/customerAuth";

export const appRouter = router({
  // Core system routes
  system: systemRouter,

  // Auth routes
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
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
  customerAuth: customerAuthRouter,
});

export type AppRouter = typeof appRouter;
