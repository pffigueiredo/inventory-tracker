
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useState, useEffect } from 'react';
import type { CreateInventoryItemInput, UpdateInventoryItemInput, InventoryItem } from '../../../server/src/schema';

interface InventoryItemFormProps {
  onSubmit: (data: CreateInventoryItemInput | UpdateInventoryItemInput) => Promise<void>;
  isLoading?: boolean;
  initialData?: InventoryItem | null;
  onCancelEdit?: () => void;
}

export function InventoryItemForm({ onSubmit, isLoading = false, initialData = null, onCancelEdit }: InventoryItemFormProps) {
  const [formData, setFormData] = useState<CreateInventoryItemInput | UpdateInventoryItemInput>(
    initialData
      ? {
          id: initialData.id,
          name: initialData.name,
          description: initialData.description || null,
          quantity: initialData.quantity,
          location: initialData.location,
        }
      : {
          name: '',
          description: null,
          quantity: 0,
          location: '',
        }
  );

  useEffect(() => {
    if (initialData) {
      setFormData({
        id: initialData.id,
        name: initialData.name,
        description: initialData.description || null,
        quantity: initialData.quantity,
        location: initialData.location,
      });
    } else {
      setFormData({
        name: '',
        description: null,
        quantity: 0,
        location: '',
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    // Reset form after successful submission if not in edit mode
    if (!initialData) {
      setFormData({
        name: '',
        description: null,
        quantity: 0,
        location: '',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="name" className="mb-2 block text-gray-700 font-medium">Item Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: CreateInventoryItemInput | UpdateInventoryItemInput) => ({ ...prev, name: e.target.value }))
          }
          placeholder="e.g., Laptop, Keyboard, Monitor"
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <Label htmlFor="description" className="mb-2 block text-gray-700 font-medium">Description (Optional)</Label>
        <Textarea
          id="description"
          value={formData.description || ''} // Fallback for null
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setFormData((prev: CreateInventoryItemInput | UpdateInventoryItemInput) => ({
              ...prev,
              description: e.target.value || null // Convert empty string back to null
            }))
          }
          placeholder="e.g., 15-inch, i7 processor, 16GB RAM"
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <Label htmlFor="quantity" className="mb-2 block text-gray-700 font-medium">Quantity</Label>
        <Input
          id="quantity"
          type="number"
          value={formData.quantity}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: CreateInventoryItemInput | UpdateInventoryItemInput) => ({
              ...prev,
              quantity: parseInt(e.target.value) || 0
            }))
          }
          min="0"
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <Label htmlFor="location" className="mb-2 block text-gray-700 font-medium">Location</Label>
        <Input
          id="location"
          value={formData.location}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: CreateInventoryItemInput | UpdateInventoryItemInput) => ({ ...prev, location: e.target.value }))
          }
          placeholder="e.g., Warehouse A, Shelf 3, Office 201"
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="flex gap-4">
        <Button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-200 ease-in-out disabled:opacity-50"
        >
          {isLoading ? (initialData ? 'Updating...' : 'Adding...') : (initialData ? 'Update Item' : 'Add Item')}
        </Button>
        {initialData && onCancelEdit && (
          <Button
            type="button"
            onClick={onCancelEdit}
            disabled={isLoading}
            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg shadow-md transition duration-200 ease-in-out disabled:opacity-50"
          >
            Cancel Edit
          </Button>
        )}
      </div>
    </form>
  );
}
