
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import Zod schemas
import {
  createInventoryItemInputSchema,
  updateInventoryItemInputSchema,
} from './schema';

// Import handlers
import { createInventoryItem } from './handlers/create_inventory_item';
import { getInventoryItems } from './handlers/get_inventory_items';
import { getInventoryItemById } from './handlers/get_inventory_item_by_id';
import { updateInventoryItem } from './handlers/update_inventory_item';
import { deleteInventoryItem } from './handlers/delete_inventory_item';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Inventory Item Handlers
  createInventoryItem: publicProcedure
    .input(createInventoryItemInputSchema)
    .mutation(({ input }) => createInventoryItem(input)),

  getInventoryItems: publicProcedure
    .query(() => getInventoryItems()),

  getInventoryItemById: publicProcedure
    .input(z.number())
    .query(({ input }) => getInventoryItemById(input)),

  updateInventoryItem: publicProcedure
    .input(updateInventoryItemInputSchema)
    .mutation(({ input }) => updateInventoryItem(input)),

  deleteInventoryItem: publicProcedure
    .input(z.number())
    .mutation(({ input }) => deleteInventoryItem(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
