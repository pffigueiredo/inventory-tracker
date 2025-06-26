
import { z } from 'zod';

// Schema for an Inventory Item
export const inventoryItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(), // Nullable field
  quantity: z.number().int().nonnegative(), // Must be a non-negative integer
  location: z.string(),
  created_at: z.coerce.date(), // Converts string timestamps to Date objects
  updated_at: z.coerce.date().nullable() // Nullable as it might not be updated yet
});

export type InventoryItem = z.infer<typeof inventoryItemSchema>;

// Input schema for creating a new Inventory Item
export const createInventoryItemInputSchema = z.object({
  name: z.string().min(1, "Name is required."),
  description: z.string().nullable().optional(), // Can be null or omitted
  quantity: z.number().int().nonnegative("Quantity must be a non-negative integer."),
  location: z.string().min(1, "Location is required.")
});

export type CreateInventoryItemInput = z.infer<typeof createInventoryItemInputSchema>;

// Input schema for updating an existing Inventory Item
export const updateInventoryItemInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1, "Name is required.").optional(), // Optional, can be omitted for updates
  description: z.string().nullable().optional(), // Can be null or undefined
  quantity: z.number().int().nonnegative("Quantity must be a non-negative integer.").optional(),
  location: z.string().min(1, "Location is required.").optional()
});

export type UpdateInventoryItemInput = z.infer<typeof updateInventoryItemInputSchema>;
