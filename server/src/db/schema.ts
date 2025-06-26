
import { serial, text, pgTable, timestamp, integer } from 'drizzle-orm/pg-core';

export const inventoryItemsTable = pgTable('inventory_items', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'), // Nullable by default
  quantity: integer('quantity').notNull(), // Use integer for whole numbers
  location: text('location').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').$onUpdate(() => new Date()), // Automatically updates on record change, can be null initially
});

// TypeScript type for the table schema
export type InventoryItem = typeof inventoryItemsTable.$inferSelect; // For SELECT operations
export type NewInventoryItem = typeof inventoryItemsTable.$inferInsert; // For INSERT operations

// Important: Export all tables and relations for proper query building
export const tables = { inventoryItems: inventoryItemsTable };
