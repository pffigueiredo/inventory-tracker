
import { type InventoryItem } from '../schema';
import { db } from '../db';
import { inventoryItemsTable } from '../db/schema';

export const getInventoryItems = async (): Promise<InventoryItem[]> => {
  try {
    const items = await db.select().from(inventoryItemsTable).execute();
    return items.map(item => ({
      ...item,
      // No numeric conversions needed as 'quantity' is an integer, not numeric()
      // 'created_at' and 'updated_at' are Date objects handled by Zod's coerce.date()
      // or directly returned by Drizzle as Date objects from timestamp columns.
    }));
  } catch (error) {
    console.error('Failed to retrieve inventory items:', error);
    throw error;
  }
};
