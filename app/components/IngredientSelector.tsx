import { useState } from "react";
import { Check } from "lucide-react";

interface StoredIngredient {
  id: string;
  name: string;
  cost: number;
  currency: string;
  amount: number;
  unit: string;
  costPerUnit: number;
}

interface Props {
  ingredients: StoredIngredient[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export function IngredientSelector({ ingredients, selectedIds, onSelectionChange }: Props) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredIngredients = ingredients.filter((ing) =>
    ing.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleIngredient = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((selectedId) => selectedId !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search materials..."
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />

      <div className="max-h-64 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-3">
        {filteredIngredients.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            No materials found
          </p>
        ) : (
          filteredIngredients.map((ingredient) => {
            const isSelected = selectedIds.includes(ingredient.id);
            const cost = Number(ingredient.cost) || 0;
            const amount = Number(ingredient.amount) || 0;
            const costPerUnit = Number(ingredient.costPerUnit) || (amount > 0 ? cost / amount : 0);

            return (
              <label
                key={ingredient.id}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  isSelected
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleIngredient(ingredient.id)}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  {isSelected && (
                    <Check className="w-4 h-4 text-blue-600 absolute pointer-events-none" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{ingredient.name}</p>
                  <p className="text-sm text-gray-600">
                    {ingredient.currency}{costPerUnit.toFixed(4)}/{ingredient.unit}
                  </p>
                </div>
              </label>
            );
          })
        )}
      </div>

      <p className="text-sm text-gray-600">
        {selectedIds.length} material{selectedIds.length !== 1 ? "s" : ""} selected
      </p>
    </div>
  );
}
