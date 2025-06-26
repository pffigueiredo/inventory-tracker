
import { db } from '../db';
import { inventoryItemsTable } from '../db/schema';
import { type InventoryItem } from '../schema';
import { eq } from 'drizzle-orm';

export const getInventoryItemById = async (id: number): Promise<InventoryItem | null> => {
    try {
        const result = await db.select()
            .from(inventoryItemsTable)
            .where(eq(inventoryItemsTable.id, id))
            .limit(1) // Limit to 1 result as we're looking for a single item by primary key
            .execute();

        if (result.length === 0) {
            return null;
        }

        // Drizzle ORM automatically handles the conversion of timestamp to Date objects
        // and integer to number, so no explicit conversion is needed here for quantity.
        return result[0];
    } catch (error) {
        console.error(`Failed to fetch inventory item with ID ${id}:`, error);
        throw error;
    }
};
