
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { inventoryItemsTable } from '../db/schema';
import { type CreateInventoryItemInput } from '../schema';
import { createInventoryItem } from '../handlers/create_inventory_item';
import { eq } from 'drizzle-orm';

// Simple test input with all required fields
const baseTestInput: CreateInventoryItemInput = {
  name: 'Test Widget',
  quantity: 50,
  location: 'Warehouse A'
};

describe('createInventoryItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an inventory item with all fields provided', async () => {
    const inputWithDescription: CreateInventoryItemInput = {
      ...baseTestInput,
      description: 'A shiny new widget for testing purposes'
    };

    const result = await createInventoryItem(inputWithDescription);

    // Basic field validation
    expect(result.name).toEqual(inputWithDescription.name);
    // Explicitly assert against the known string value, not inputWithDescription.description (which could be undefined by type)
    expect(result.description).toEqual('A shiny new widget for testing purposes');
    expect(result.quantity).toEqual(inputWithDescription.quantity);
    expect(result.location).toEqual(inputWithDescription.location);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeNull(); // Should be null on initial creation
  });

  it('should create an inventory item with optional description as null', async () => {
    // Input without description explicitly provided (it will be undefined)
    const inputWithoutDescription: CreateInventoryItemInput = {
      ...baseTestInput
    };

    const result = await createInventoryItem(inputWithoutDescription);

    expect(result.name).toEqual(inputWithoutDescription.name);
    expect(result.description).toBeNull(); // Should be null if not provided
    expect(result.quantity).toEqual(inputWithoutDescription.quantity);
    expect(result.location).toEqual(inputWithoutDescription.location);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeNull();
  });

  it('should save the inventory item to the database', async () => {
    const input: CreateInventoryItemInput = {
      name: 'Database Item',
      description: 'An item directly checked in DB',
      quantity: 75,
      location: 'Shelf B'
    };

    const result = await createInventoryItem(input);

    // Query the database to verify the item was saved
    const itemsInDb = await db.select()
      .from(inventoryItemsTable)
      .where(eq(inventoryItemsTable.id, result.id))
      .execute();

    expect(itemsInDb).toHaveLength(1);
    const dbItem = itemsInDb[0];

    expect(dbItem.id).toEqual(result.id);
    expect(dbItem.name).toEqual(input.name);
    // Explicitly assert against the known string value, not input.description (which could be undefined by type)
    expect(dbItem.description).toEqual('An item directly checked in DB');
    expect(dbItem.quantity).toEqual(input.quantity);
    expect(dbItem.location).toEqual(input.location);
    expect(dbItem.created_at).toBeInstanceOf(Date);
    expect(dbItem.updated_at).toBeNull();
    // Ensure the date from DB is close to current time (within a reasonable margin)
    expect(dbItem.created_at.getTime()).toBeCloseTo(Date.now(), -1000); // 1 second tolerance
  });

  it('should retrieve a null description correctly from the database', async () => {
    const input: CreateInventoryItemInput = {
      name: 'Item with Null Desc',
      quantity: 10,
      location: 'Zone C'
    };

    const result = await createInventoryItem(input);

    // Query the database to verify description is null
    const itemsInDb = await db.select()
      .from(inventoryItemsTable)
      .where(eq(inventoryItemsTable.id, result.id))
      .execute();

    expect(itemsInDb).toHaveLength(1);
    expect(itemsInDb[0].description).toBeNull();
  });

  it('should create multiple inventory items', async () => {
    const item1Input: CreateInventoryItemInput = { name: 'Pencil', quantity: 100, location: 'Office Supply' };
    const item2Input: CreateInventoryItemInput = { name: 'Notebook', quantity: 50, location: 'Office Supply' };

    const item1 = await createInventoryItem(item1Input);
    const item2 = await createInventoryItem(item2Input);

    expect(item1.id).toBeDefined();
    expect(item2.id).toBeDefined();
    expect(item1.id).not.toEqual(item2.id); // Ensure unique IDs

    const allItems = await db.select().from(inventoryItemsTable).execute();
    expect(allItems).toHaveLength(2);

    const foundItem1 = allItems.find(item => item.id === item1.id);
    expect(foundItem1?.name).toEqual('Pencil');
    expect(foundItem1?.quantity).toEqual(100);

    const foundItem2 = allItems.find(item => item.id === item2.id);
    expect(foundItem2?.name).toEqual('Notebook');
    expect(foundItem2?.quantity).toEqual(50);
  });
});
