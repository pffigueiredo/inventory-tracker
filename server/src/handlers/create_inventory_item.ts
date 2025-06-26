
import { type CreateInventoryItemInput, type InventoryItem } from '../schema';
import { db } from '../db';
import { inventoryItemsTable } from '../db/schema';

export const createInventoryItem = async (input: CreateInventoryItemInput): Promise<InventoryItem> => {
  try {
    // Insert inventory item record
    const result = await db.insert(inventoryItemsTable)
      .values({
        name: input.name,
        description: input.description, // Drizzle handles optional/nullable fields correctly (undefined becomes NULL)
        quantity: input.quantity,
        location: input.location,
        updated_at: null // Explicitly set to null on creation to match schema expectation
      })
      .returning()
      .execute();

    // The result[0] will be the inserted InventoryItem.
    // Drizzle's $inferSelect type already ensures correct types (e.g., Dates for timestamps).
    // No explicit numeric conversions are needed for 'quantity' as it's an integer column.
    const item = result[0];
    return {
      ...item,
      // Ensure description is explicitly null if it was stored as DB NULL, as per InventoryItem type
      description: item.description ?? null
    };
  } catch (error) {
    console.error('Inventory item creation failed:', error);
    throw error;
  }
};
