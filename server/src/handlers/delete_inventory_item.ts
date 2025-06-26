
import { db } from '../db';
import { inventoryItemsTable } from '../db/schema';
import { type InventoryItem } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteInventoryItem = async (id: number): Promise<InventoryItem | null> => {
  try {
    // Delete the inventory item by ID
    const result = await db.delete(inventoryItemsTable)
      .where(eq(inventoryItemsTable.id, id))
      .returning()
      .execute();

    // If a record was deleted, it will be in the result array
    if (result.length > 0) {
      // The result of a delete returning operation directly matches the schema type
      return result[0];
    } else {
      // No item found with the given ID
      return null;
    }
  } catch (error) {
    console.error(`Error deleting inventory item with ID ${id}:`, error);
    throw error; // Re-throw the error for upstream handling
  }
};
