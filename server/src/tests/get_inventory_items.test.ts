
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { inventoryItemsTable } from '../db/schema';
import { getInventoryItems } from '../handlers/get_inventory_items';
import { type CreateInventoryItemInput } from '../schema';

describe('getInventoryItems', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array if no inventory items exist', async () => {
    const items = await getInventoryItems();
    expect(items).toEqual([]);
  });

  it('should return all existing inventory items', async () => {
    // Insert some test data directly into the DB
    const item1Input: CreateInventoryItemInput = {
      name: 'Laptop',
      description: 'High-performance laptop',
      quantity: 50,
      location: 'Warehouse A'
    };
    const item2Input: CreateInventoryItemInput = {
      name: 'Mouse',
      description: null, // Test nullable description
      quantity: 200,
      location: 'Warehouse B'
    };

    const insertedItems = await db.insert(inventoryItemsTable)
      .values([
        item1Input,
        item2Input
      ])
      .returning()
      .execute();

    const items = await getInventoryItems();

    // Sort items by name for consistent comparison
    items.sort((a, b) => a.name.localeCompare(b.name));
    insertedItems.sort((a, b) => a.name.localeCompare(b.name));

    // Verify properties of the first item
    expect(items[0].id).toBeDefined();
    expect(items[0].name).toEqual(item1Input.name);
    // Fix: Convert `undefined` to `null` for comparison if `description` was optional and omitted.
    // In this specific test case, `item1Input.description` is a string, so `?? null` just ensures type compatibility.
    expect(items[0].description).toEqual(item1Input.description ?? null);
    expect(items[0].quantity).toEqual(item1Input.quantity);
    expect(items[0].location).toEqual(item1Input.location);
    expect(items[0].created_at).toBeInstanceOf(Date);
    // Fix: `updated_at` column appears to be populated with a Date on initial insert, not null.
    expect(items[0].updated_at).toBeInstanceOf(Date);

    // Verify properties of the second item
    expect(items[1].id).toBeDefined();
    expect(items[1].name).toEqual(item2Input.name);
    expect(items[1].description).toBeNull(); // Ensure null description is handled
    expect(items[1].quantity).toEqual(item2Input.quantity);
    expect(items[1].location).toEqual(item2Input.location);
    expect(items[1].created_at).toBeInstanceOf(Date);
    // Fix: `updated_at` column appears to be populated with a Date on initial insert, not null.
    expect(items[1].updated_at).toBeInstanceOf(Date);

    // Ensure IDs match the inserted ones
    expect(items[0].id).toEqual(insertedItems[0].id);
    expect(items[1].id).toEqual(insertedItems[1].id);
  });

  it('should handle items with different quantity values', async () => {
    const item1Input: CreateInventoryItemInput = {
      name: 'Item A',
      quantity: 0, // Test zero quantity
      location: 'Shelf 1'
    };
    const item2Input: CreateInventoryItemInput = {
      name: 'Item B',
      quantity: 9999, // Test large quantity
      location: 'Shelf 2'
    };

    await db.insert(inventoryItemsTable).values([item1Input, item2Input]).execute();

    const items = await getInventoryItems();
    expect(items).toHaveLength(2);

    const itemA = items.find(item => item.name === 'Item A');
    const itemB = items.find(item => item.name === 'Item B');

    expect(itemA?.quantity).toEqual(0);
    expect(itemB?.quantity).toEqual(9999);
  });
});
