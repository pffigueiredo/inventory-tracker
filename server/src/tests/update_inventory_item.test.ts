
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { inventoryItemsTable } from '../db/schema';
import { type CreateInventoryItemInput, type UpdateInventoryItemInput } from '../schema';
import { updateInventoryItem } from '../handlers/update_inventory_item';
import { eq } from 'drizzle-orm';

// Initial data for creating a test item
const initialItemInput: CreateInventoryItemInput = {
  name: 'Original Widget',
  description: 'A widget for initial testing.',
  quantity: 50,
  location: 'Warehouse A',
};

describe('updateInventoryItem', () => {
  // Setup and teardown for each test
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update all fields of an existing inventory item', async () => {
    // Arrange: Create an item to be updated
    const [createdItem] = await db.insert(inventoryItemsTable).values(initialItemInput).returning().execute();
    expect(createdItem).toBeDefined();

    // Define the update input with new values for all fields
    const updateInput: UpdateInventoryItemInput = {
      id: createdItem.id,
      name: 'Updated Gadget',
      description: 'A gadget with updated details.',
      quantity: 150,
      location: 'Warehouse B',
    };

    // Act: Call the handler to update the item
    const updatedItem = await updateInventoryItem(updateInput);

    // Assert: Verify the returned item
    expect(updatedItem).toBeDefined(); // Ensure it's not null or undefined
    expect(updatedItem!.id).toEqual(createdItem.id);
    expect(updatedItem!.name).toEqual(updateInput.name!); // Use ! as name is optional in updateInput, but expected to be defined here
    expect(updatedItem!.description).toEqual(updateInput.description!); // Add ! as it's explicitly set and not undefined in this test
    expect(updatedItem!.quantity).toEqual(updateInput.quantity!); // Use ! as quantity is optional in updateInput
    expect(updatedItem!.location).toEqual(updateInput.location!); // Use ! as location is optional in updateInput
    expect(updatedItem!.created_at).toEqual(createdItem.created_at); // created_at should remain unchanged
    expect(updatedItem!.updated_at).toBeInstanceOf(Date);
    // Ensure updated_at is newer than created_at
    expect(updatedItem!.updated_at!.getTime()).toBeGreaterThan(createdItem.created_at.getTime());

    // Assert: Verify the database state by querying it directly
    const [dbItem] = await db.select().from(inventoryItemsTable).where(eq(inventoryItemsTable.id, createdItem.id)).execute();
    expect(dbItem).toBeDefined();
    expect(dbItem.name).toEqual(updateInput.name!);
    expect(dbItem.description).toEqual(updateInput.description!); // Add ! here too
    expect(dbItem.quantity).toEqual(updateInput.quantity!);
    expect(dbItem.location).toEqual(updateInput.location!);
    expect(dbItem.created_at).toEqual(createdItem.created_at);
    expect(dbItem.updated_at).toBeInstanceOf(Date);
    // Allow for slight time differences when comparing database timestamp
    expect(dbItem.updated_at!.getTime()).toBeGreaterThanOrEqual(updatedItem!.updated_at!.getTime() - 100);
  });

  it('should update only specified fields (partial update)', async () => {
    // Arrange: Create an item
    const [createdItem] = await db.insert(inventoryItemsTable).values(initialItemInput).returning().execute();
    expect(createdItem).toBeDefined();

    // Define update input with only a subset of fields
    const updateInput: UpdateInventoryItemInput = {
      id: createdItem.id,
      quantity: 75,
      location: 'Warehouse C',
    };

    // Act
    const updatedItem = await updateInventoryItem(updateInput);

    // Assert: Verify the returned item. Unspecified fields should retain their original values.
    expect(updatedItem).toBeDefined();
    expect(updatedItem!.id).toEqual(createdItem.id);
    expect(updatedItem!.name).toEqual(createdItem.name); // Should be unchanged
    expect(updatedItem!.description).toEqual(createdItem.description); // Should be unchanged
    expect(updatedItem!.quantity).toEqual(updateInput.quantity!); // Use ! as quantity is optional in updateInput
    expect(updatedItem!.location).toEqual(updateInput.location!); // Use ! as location is optional in updateInput
    expect(updatedItem!.created_at).toEqual(createdItem.created_at);
    expect(updatedItem!.updated_at).toBeInstanceOf(Date);
    expect(updatedItem!.updated_at!.getTime()).toBeGreaterThan(createdItem.created_at.getTime());

    // Assert: Verify the database state
    const [dbItem] = await db.select().from(inventoryItemsTable).where(eq(inventoryItemsTable.id, createdItem.id)).execute();
    expect(dbItem).toBeDefined();
    expect(dbItem.name).toEqual(createdItem.name);
    expect(dbItem.description).toEqual(createdItem.description);
    expect(dbItem.quantity).toEqual(updateInput.quantity!);
    expect(dbItem.location).toEqual(updateInput.location!);
    expect(dbItem.created_at).toEqual(createdItem.created_at);
    expect(dbItem.updated_at).toBeInstanceOf(Date);
  });

  it('should return null if the item is not found', async () => {
    // Act: Try to update an item with a non-existent ID
    const updateInput: UpdateInventoryItemInput = {
      id: 9999, // A fictional ID
      name: 'Non-existent Item',
      quantity: 10,
      location: 'Nowhere',
    };
    const updatedItem = await updateInventoryItem(updateInput);

    // Assert: The handler should return null
    expect(updatedItem).toBeNull();

    // Verify no items exist in the database (since we didn't create any first)
    const items = await db.select().from(inventoryItemsTable).execute();
    expect(items).toHaveLength(0);
  });

  it('should allow updating description to null', async () => {
    // Arrange: Create an item with an initial description
    const [createdItem] = await db.insert(inventoryItemsTable).values({
      ...initialItemInput,
      description: 'Initial description to be nullified',
    }).returning().execute();
    expect(createdItem).toBeDefined();
    expect(createdItem.description).toBe('Initial description to be nullified');

    // Define update input to set description to null
    const updateInput: UpdateInventoryItemInput = {
      id: createdItem.id,
      description: null,
    };

    // Act
    const updatedItem = await updateInventoryItem(updateInput);

    // Assert: Verify the returned item has a null description
    expect(updatedItem).toBeDefined();
    expect(updatedItem!.id).toEqual(createdItem.id);
    expect(updatedItem!.description).toBeNull();
    expect(updatedItem!.created_at).toEqual(createdItem.created_at);
    expect(updatedItem!.updated_at).toBeInstanceOf(Date);

    // Assert: Verify the database state
    const [dbItem] = await db.select().from(inventoryItemsTable).where(eq(inventoryItemsTable.id, createdItem.id)).execute();
    expect(dbItem).toBeDefined();
    expect(dbItem.description).toBeNull();
  });

  it('should allow updating quantity to zero', async () => {
    // Arrange: Create an item with a positive quantity
    const [createdItem] = await db.insert(inventoryItemsTable).values(initialItemInput).returning().execute();
    expect(createdItem).toBeDefined();
    expect(createdItem.quantity).toBeGreaterThan(0);

    // Define update input to set quantity to 0
    const updateInput: UpdateInventoryItemInput = {
      id: createdItem.id,
      quantity: 0,
    };

    // Act
    const updatedItem = await updateInventoryItem(updateInput);

    // Assert: Verify the returned item has quantity 0
    expect(updatedItem).toBeDefined();
    expect(updatedItem!.id).toEqual(createdItem.id);
    expect(updatedItem!.quantity).toEqual(0);
    expect(updatedItem!.created_at).toEqual(createdItem.created_at);
    expect(updatedItem!.updated_at).toBeInstanceOf(Date);

    // Assert: Verify the database state
    const [dbItem] = await db.select().from(inventoryItemsTable).where(eq(inventoryItemsTable.id, createdItem.id)).execute();
    expect(dbItem).toBeDefined();
    expect(dbItem.quantity).toEqual(0);
  });

  it('should not update created_at timestamp', async () => {
    // Arrange: Create an item
    const [createdItem] = await db.insert(inventoryItemsTable).values(initialItemInput).returning().execute();
    expect(createdItem).toBeDefined();
    const originalCreatedAt = createdItem.created_at;

    // Define update input
    const updateInput: UpdateInventoryItemInput = {
      id: createdItem.id,
      name: 'New Name',
    };

    // Act
    const updatedItem = await updateInventoryItem(updateInput);

    // Assert: created_at should remain the same
    expect(updatedItem!.created_at).toEqual(originalCreatedAt);

    // Assert: updated_at should have changed
    expect(updatedItem!.updated_at).toBeInstanceOf(Date);
    expect(updatedItem!.updated_at!.getTime()).toBeGreaterThan(originalCreatedAt.getTime());

    // Verify in database
    const [dbItem] = await db.select().from(inventoryItemsTable).where(eq(inventoryItemsTable.id, createdItem.id)).execute();
    expect(dbItem.created_at).toEqual(originalCreatedAt);
  });
});
