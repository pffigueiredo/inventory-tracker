
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import type { InventoryItem } from '../../../server/src/schema';

interface InventoryItemListProps {
  items: InventoryItem[];
  onEdit: (item: InventoryItem) => void;
  onDelete: (id: number) => Promise<void>;
}

export function InventoryItemList({ items, onEdit, onDelete }: InventoryItemListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item: InventoryItem) => (
        <Card key={item.id} className="shadow-md hover:shadow-lg transition-shadow duration-200 ease-in-out border border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl font-semibold text-gray-800 flex justify-between items-center">
              {item.name}
              <span className="text-sm font-normal text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{item.location}</span>
            </CardTitle>
            {item.description && (
              <CardDescription className="text-gray-600 mt-1">
                {item.description}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-lg font-bold text-gray-700">Quantity: <span className="text-green-600">{item.quantity}</span></p>
            <p className="text-sm text-gray-500">
              Created: {item.created_at.toLocaleDateString()}
              {item.updated_at && ` | Updated: ${item.updated_at.toLocaleDateString()}`}
            </p>
          </CardContent>
          <CardFooter className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(item)}
              className="text-blue-600 border-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-colors"
            >
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(item.id)}
              className="bg-red-500 hover:bg-red-600 text-white transition-colors"
            >
              Delete
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
