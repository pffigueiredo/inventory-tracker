
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { InventoryItemForm } from '@/components/InventoryItemForm';
import { InventoryItemList } from '@/components/InventoryItemList';
import { Button } from '@/components/ui/button';

// Using type-only import for better TypeScript compliance
import type {
  InventoryItem,
  CreateInventoryItemInput,
  UpdateInventoryItemInput
} from '../../server/src/schema';

function App() {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark' ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme: 'light' | 'dark') => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const loadInventoryItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await trpc.getInventoryItems.query();
      // Ensure created_at and updated_at are Date objects from superjson
      const itemsWithDateObjects: InventoryItem[] = result.map((item: InventoryItem) => ({
        ...item,
        created_at: new Date(item.created_at),
        updated_at: item.updated_at ? new Date(item.updated_at) : null,
      }));
      setInventoryItems(itemsWithDateObjects);
    } catch (error) {
      console.error('Failed to load inventory items:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInventoryItems();
  }, [loadInventoryItems]);

  const handleCreateInventoryItem = async (data: CreateInventoryItemInput | UpdateInventoryItemInput) => {
    // This function is intended for creation, so 'data' should conform to CreateInventoryItemInput.
    // If 'id' is present, it indicates an unexpected call for a create operation.
    if ('id' in data) {
      console.error('Attempted to create item with an ID. This should not happen.');
      return;
    }

    const createInput: CreateInventoryItemInput = {
      name: (data as CreateInventoryItemInput).name,
      description: (data as CreateInventoryItemInput).description,
      quantity: (data as CreateInventoryItemInput).quantity,
      location: (data as CreateInventoryItemInput).location,
    };

    setIsLoading(true);
    try {
      const response = await trpc.createInventoryItem.mutate(createInput);
      if (!response) {
        console.error('Create item mutation returned null.');
        return;
      }
      // Explicitly construct newItem to match InventoryItem type
      const newItem: InventoryItem = {
        id: response.id,
        name: response.name,
        description: response.description,
        quantity: response.quantity,
        location: response.location,
        created_at: new Date(response.created_at),
        updated_at: response.updated_at ? new Date(response.updated_at) : null,
      };
      setInventoryItems((prev: InventoryItem[]) => [...prev, newItem]);
    } catch (error) {
      console.error('Failed to create inventory item:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateInventoryItem = async (data: CreateInventoryItemInput | UpdateInventoryItemInput) => {
    // This function is intended for updates, so 'data' should conform to UpdateInventoryItemInput.
    if (!editingItem || !('id' in data) || typeof data.id !== 'number') {
      console.error("Cannot update item without a valid ID or if not in editing mode.");
      return;
    }

    const updateInput: UpdateInventoryItemInput = {
      id: data.id,
      name: data.name,
      description: data.description,
      quantity: data.quantity,
      location: data.location,
    };

    setIsLoading(true);
    try {
      const response = await trpc.updateInventoryItem.mutate(updateInput);
      if (!response) {
        console.error('Update item mutation returned null.');
        return;
      }
      // Explicitly construct updatedItem to match InventoryItem type
      const updatedItem: InventoryItem = {
        id: response.id,
        name: response.name,
        description: response.description,
        quantity: response.quantity,
        location: response.location,
        created_at: new Date(response.created_at),
        updated_at: response.updated_at ? new Date(response.updated_at) : null,
      };
      setInventoryItems((prev: InventoryItem[]) =>
        prev.map((item: InventoryItem) =>
          item.id === updatedItem.id ? updatedItem : item
        )
      );
      setEditingItem(null); // Exit edit mode
    } catch (error) {
      console.error('Failed to update inventory item:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteInventoryItem = async (id: number) => {
    setIsLoading(true);
    try {
      await trpc.deleteInventoryItem.mutate(id);
      setInventoryItems((prev: InventoryItem[]) =>
        prev.filter((item: InventoryItem) => item.id !== id)
      );
    } catch (error) {
      console.error('Failed to delete inventory item:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 min-h-screen">
      <div className="flex justify-end mb-4">
        <Button onClick={toggleTheme} className="px-4 py-2 rounded-md">
          {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
        </Button>
      </div>
      <h1 className="text-4xl font-extrabold text-gray-800 dark:text-gray-200 mb-8 text-center drop-shadow-sm">
        📦 Inventory Tracker 🚀
      </h1>

      <div className="bg-card text-card-foreground p-8 rounded-xl shadow-lg mb-10">
        <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-6">
          {editingItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}
        </h2>
        <InventoryItemForm
          onSubmit={editingItem ? handleUpdateInventoryItem : handleCreateInventoryItem}
          isLoading={isLoading}
          initialData={editingItem}
          onCancelEdit={() => setEditingItem(null)}
        />
      </div>

      <div className="bg-card text-card-foreground p-8 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-6">
          Current Inventory
        </h2>
        {isLoading && inventoryItems.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Loading inventory...</p>
        ) : inventoryItems.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No items in inventory. Add one above!
          </p>
        ) : (
          <InventoryItemList
            items={inventoryItems}
            onEdit={setEditingItem}
            onDelete={handleDeleteInventoryItem}
          />
        )}
      </div>
    </div>
  );
}

export default App;
