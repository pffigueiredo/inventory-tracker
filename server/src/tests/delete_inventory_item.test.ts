
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { inventoryItemsTable } from '../db/schema';
import { type CreateInventoryItemInput } from '../schema';
import { deleteInventoryItem } from '../handlers/delete_inventory_item';
import { eq } from 'drizzle-orm';

describe('deleteInventoryItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  const testInput: CreateInventoryItemInput = {
    name: 'Laptop',
    description: 'High-performance laptop',
    quantity: 50,
    location: 'Warehouse A'
  };

  it('should delete an existing inventory item and return it', async () => {
    // 1. Create an item to delete
    const [createdItem] = await db.insert(inventoryItemsTable)
      .values(testInput)
      .returning()
      .execute();

    expect(createdItem).toBeDefined();
    expect(createdItem.id).toBeDefined();

    // 2. Call the handler to delete the item
    const deletedItem = await deleteInventoryItem(createdItem.id);

    // 3. Assert the returned item matches the original
    expect(deletedItem).toBeDefined();
    expect(deletedItem!.id).toEqual(createdItem.id);
    expect(deletedItem!.name).toEqual(createdItem.name);
    expect(deletedItem!.quantity).toEqual(createdItem.quantity);
    expect(deletedItem!.location).toEqual(createdItem.location);
    expect(deletedItem!.created_at).toEqual(createdItem.created_at);

    // 4. Verify the item no longer exists in the database
    const itemsInDb = await db.select()
      .from(inventoryItemsTable)
      .where(eq(inventoryItemsTable.id, createdItem.id))
      .execute();

    expect(itemsInDb).toHaveLength(0);
  });

  it('should return null if the item to delete does not exist', async () => {
    const nonExistentId = 9999; // An ID that surely does not exist

    // Ensure database is empty before attempting to delete
    const initialItems = await db.select().from(inventoryItemsTable).execute();
    expect(initialItems).toHaveLength(0);

    // Attempt to delete a non-existent item
    const deletedItem = await deleteInventoryItem(nonExistentId);

    // Assert that null is returned
    expect(deletedItem).toBeNull();

    // Verify that the database remains unchanged (still empty)
    const itemsAfterAttempt = await db.select().from(inventoryItemsTable).execute();
    expect(itemsAfterAttempt).toHaveLength(0);
  });

  it('should not delete other items when a specific item is targeted', async () => {
    // Create multiple items
    const item1 = await db.insert(inventoryItemsTable).values({ ...testInput, name: 'Item One', location: 'Loc A' }).returning().execute();
    const item2 = await db.insert(inventoryItemsTable).values({ ...testInput, name: 'Item Two', location: 'Loc B' }).returning().execute();
    const item3 = await db.insert(inventoryItemsTable).values({ ...testInput, name: 'Item Three', location: 'Loc C' }).returning().execute();

    expect(item1[0]).toBeDefined();
    expect(item2[0]).toBeDefined();
    expect(item3[0]).toBeDefined();
    expect(await db.select().from(inventoryItemsTable).execute()).toHaveLength(3);

    // Delete item2
    const deletedItem = await deleteInventoryItem(item2[0].id);

    // Assert item2 was returned
    expect(deletedItem).toBeDefined();
    expect(deletedItem!.id).toEqual(item2[0].id);

    // Verify item2 is gone from DB
    const itemsAfterDelete = await db.select().from(inventoryItemsTable).orderBy(inventoryItemsTable.id).execute();
    expect(itemsAfterDelete).toHaveLength(2);

    // Verify item1 and item3 are still present
    expect(itemsAfterDelete[0].id).toEqual(item1[0].id);
    expect(itemsAfterDelete[0].name).toEqual(item1[0].name);
    expect(itemsAfterDelete[1].id).toEqual(item3[0].id);
    expect(itemsAfterDelete[1].name).toEqual(item3[0].name);
  });
});
