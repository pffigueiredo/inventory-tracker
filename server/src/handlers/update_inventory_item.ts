
import { db } from '../db';
import { inventoryItemsTable } from '../db/schema';
import { type UpdateInventoryItemInput, type InventoryItem } from '../schema';
import { eq } from 'drizzle-orm';

export const updateInventoryItem = async (input: UpdateInventoryItemInput): Promise<InventoryItem | null> => {
  try {
    // Extract the ID and the fields to be updated.
    // Zod's `UpdateInventoryItemInput` already makes other fields optional,
    // so `fieldsToUpdate` will correctly contain only the provided ones (or `undefined`).
    const { id, ...fieldsToUpdate } = input;

    // Drizzle's `set` method automatically handles `undefined` values by omitting
    // the corresponding column from the SQL UPDATE statement.
    // It handles `null` values by setting the column to `NULL`.
    // The `updated_at` column is managed by the `$onUpdate` property in the schema,
    // so we do not need to explicitly set it here; the database will update it.
    const result = await db.update(inventoryItemsTable)
      .set(fieldsToUpdate)
      .where(eq(inventoryItemsTable.id, id))
      .returning() // Return the updated record
      .execute();

    // If the `result` array is empty, it means no record with the given ID was found.
    if (result.length === 0) {
      return null;
    }

    // Return the first (and only) updated record.
    return result[0];
  } catch (error) {
    console.error(`Error updating inventory item with ID ${input.id}:`, error);
    throw error; // Re-throw the error to be handled by the caller
  }
};
