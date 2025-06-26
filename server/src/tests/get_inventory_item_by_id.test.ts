
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { inventoryItemsTable } from '../db/schema';
import { type CreateInventoryItemInput, type InventoryItem } from '../schema';
import { getInventoryItemById } from '../handlers/get_inventory_item_by_id';

// Test input for creating a basic inventory item
const testInput: CreateInventoryItemInput = {
  name: 'Laptop Charger',
  description: 'Original Dell 65W AC Adapter',
  quantity: 50,
  location: 'Warehouse A, Shelf B1'
};

const testInputNoDesc: CreateInventoryItemInput = {
  name: 'HDMI Cable',
  quantity: 200,
  location: 'Warehouse C, Aisle 5'
};

describe('getInventoryItemById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an inventory item if found', async () => {
    // Insert an item directly into the database to ensure it exists
    const [insertedItem] = await db.insert(inventoryItemsTable).values(testInput).returning();

    expect(insertedItem).toBeDefined();

    const retrievedItem = await getInventoryItemById(insertedItem.id);

    expect(retrievedItem).toBeDefined();
    // Assert retrievedItem is not null for TypeScript
    const item = retrievedItem as InventoryItem;

    // Basic field validation
    expect(item.id).toEqual(insertedItem.id);
    expect(item.name).toEqual(testInput.name);
    // Use nullish coalescing to ensure testInput.description is string | null for comparison,
    // as it can be undefined in CreateInventoryItemInput but will be null in DB.
    expect(item.description).toEqual(testInput.description ?? null);
    expect(item.quantity).toEqual(testInput.quantity);
    expect(item.location).toEqual(testInput.location);
    expect(item.created_at).toBeInstanceOf(Date);
    // updated_at might be null initially as per schema, so check its type defensively
    expect(item.updated_at === null || item.updated_at instanceof Date).toBeTrue();
  });

  it('should return null if the inventory item is not found', async () => {
    const nonExistentId = 9999; // An ID that is highly unlikely to exist
    const retrievedItem = await getInventoryItemById(nonExistentId);

    expect(retrievedItem).toBeNull();
  });

  it('should handle null description correctly when description is explicitly null', async () => {
    const testInputWithExplicitNullDesc: CreateInventoryItemInput = {
      name: 'Whiteboard Marker',
      description: null, // Explicitly null
      quantity: 75,
      location: 'Storage Room'
    };
    const [insertedItem] = await db.insert(inventoryItemsTable).values(testInputWithExplicitNullDesc).returning();
    const retrievedItem = await getInventoryItemById(insertedItem.id);

    expect(retrievedItem).toBeDefined();
    const item = retrievedItem as InventoryItem;
    expect(item.description).toBeNull();
  });

  it('should handle null description correctly when description is omitted from input', async () => {
    // This uses testInputNoDesc where description is omitted, meaning its value is 'undefined'
    const [insertedItem] = await db.insert(inventoryItemsTable).values(testInputNoDesc).returning();

    expect(insertedItem).toBeDefined();
    const retrievedItem = await getInventoryItemById(insertedItem.id);

    expect(retrievedItem).toBeDefined();
    const item = retrievedItem as InventoryItem;
    expect(item.description).toBeNull(); // It should be null in the DB if omitted from input
    expect(item.id).toEqual(insertedItem.id);
    expect(item.name).toEqual(testInputNoDesc.name);
    expect(item.quantity).toEqual(testInputNoDesc.quantity);
    expect(item.location).toEqual(testInputNoDesc.location);
  });

  it('should correctly retrieve an item with minimal required fields', async () => {
    const minimalInput: CreateInventoryItemInput = {
      name: 'Pens',
      quantity: 500,
      location: 'Office Supplies'
    };
    const [insertedItem] = await db.insert(inventoryItemsTable).values(minimalInput).returning();
    const retrievedItem = await getInventoryItemById(insertedItem.id);

    expect(retrievedItem).toBeDefined();
    const item = retrievedItem as InventoryItem;
    expect(item.id).toBe(insertedItem.id);
    expect(item.name).toBe('Pens');
    expect(item.description).toBeNull(); // description is optional, defaults to null in DB if not provided
    expect(item.quantity).toBe(500);
    expect(item.location).toBe('Office Supplies');
    expect(item.created_at).toBeInstanceOf(Date);
  });
});
