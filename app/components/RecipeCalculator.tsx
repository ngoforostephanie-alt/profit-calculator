import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { Plus, Trash2, TrendingUp, ArrowLeft, Save, Clock } from "lucide-react";
import { ErrorBoundary } from "./ErrorBoundary";
import { useAuth } from "./AuthContext";
import { IngredientSelector } from "./IngredientSelector";

interface StoredIngredient {
  id: string;
  name: string;
  cost: number;
  currency: string;
  amount: number;
  unit: string;
  costPerUnit: number;
}

interface RecipeIngredient {
  id: string;
  ingredientId: string;
  quantity: number;
  unit: string;
}

interface RecipeData {
  name: string;
  ingredients: RecipeIngredient[];
  yieldAmount: number;
  yieldUnit: string;
  sellingPrice: number;
  currency: string;
  isDraft?: boolean;
}

const COMMON_UNITS = [
  "ml",
  "L",
  "g",
  "kg",
  "oz",
  "lb",
  "cup",
  "tbsp",
  "tsp",
  "unit",
];

const CURRENCIES = ["$", "€", "£", "¥", "₹", "₱"];

export function RecipeCalculator() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === "new";
  const { user, canCreateRecipe } = useAuth();

  const [currentRecipeId, setCurrentRecipeId] = useState<string>("");
  const [lastSaved, setLastSaved] = useState<string>("");
  const [isDraft, setIsDraft] = useState<boolean>(true);
  const autosaveTimer = useRef<NodeJS.Timeout | null>(null);

  const [availableIngredients, setAvailableIngredients] = useState<
    StoredIngredient[]
  >([]);
  const [recipeData, setRecipeData] = useState<RecipeData>({
    name: "",
    ingredients: [],
    yieldAmount: "" as any,
    yieldUnit: "unit",
    sellingPrice: "" as any,
    currency: "$",
  });

  useEffect(() => {
    if (!user) return;
    const saved = localStorage.getItem(`profit-calc-materials-${user.email}`);
    if (saved) {
      setAvailableIngredients(JSON.parse(saved));
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    if (!isNew && id) {
      setCurrentRecipeId(id);
      const saved = localStorage.getItem(`profit-calc-product-${user.email}-${id}`);
      if (saved) {
        const parsedData = JSON.parse(saved);
        setRecipeData(parsedData);
        setIsDraft(parsedData.isDraft !== false);
      }
    } else if (isNew) {
      if (!canCreateRecipe()) {
        alert(`You've reached the limit for your ${user.plan} plan. Upgrade to create more products!`);
        navigate("/");
        return;
      }
      const newId = Date.now().toString();
      setCurrentRecipeId(newId);
      setIsDraft(true);
    }
  }, [id, isNew, user, canCreateRecipe, navigate]);

  useEffect(() => {
    if (!currentRecipeId || !user) return;

    if (autosaveTimer.current) {
      clearTimeout(autosaveTimer.current);
    }

    autosaveTimer.current = setTimeout(() => {
      const dataToSave = { ...recipeData, isDraft };
      localStorage.setItem(`profit-calc-product-${user.email}-${currentRecipeId}`, JSON.stringify(dataToSave));

      const recipes = JSON.parse(localStorage.getItem(`profit-calc-products-${user.email}`) || "[]");
      const existingIndex = recipes.findIndex((r: any) => r.id === currentRecipeId);
      const now = new Date().toISOString();

      if (existingIndex === -1) {
        recipes.push({
          id: currentRecipeId,
          name: recipeData.name || "Untitled Product",
          createdAt: now,
          modifiedAt: now,
          isDraft: true,
        });
        localStorage.setItem(`profit-calc-products-${user.email}`, JSON.stringify(recipes));
      } else {
        recipes[existingIndex] = {
          ...recipes[existingIndex],
          name: recipeData.name || "Untitled Product",
          modifiedAt: now,
          isDraft,
        };
        localStorage.setItem(`profit-calc-products-${user.email}`, JSON.stringify(recipes));
      }

      const currentTime = new Date();
      setLastSaved(currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 1000);

    return () => {
      if (autosaveTimer.current) {
        clearTimeout(autosaveTimer.current);
      }
    };
  }, [recipeData, currentRecipeId, isDraft, user]);

  const handleIngredientSelection = (selectedIds: string[]) => {
    const newIngredients = selectedIds.map(id => {
      const existing = recipeData.ingredients.find(ing => ing.ingredientId === id);
      if (existing) return existing;

      const ingredient = availableIngredients.find(i => i.id === id);
      return {
        id: `${id}-${Date.now()}`,
        ingredientId: id,
        quantity: "" as any,
        unit: ingredient?.unit || "g",
      };
    });

    setRecipeData({
      ...recipeData,
      ingredients: newIngredients,
    });
  };

  const removeIngredient = (id: string) => {
    setRecipeData({
      ...recipeData,
      ingredients: recipeData.ingredients.filter((ing) => ing.id !== id),
    });
  };

  const updateIngredient = (
    id: string,
    field: keyof RecipeIngredient,
    value: string | number
  ) => {
    setRecipeData({
      ...recipeData,
      ingredients: recipeData.ingredients.map((ing) => {
        if (ing.id === id) {
          if (field === "ingredientId" && typeof value === "string") {
            const selectedIng = availableIngredients.find(
              (i) => i.id === value
            );
            return {
              ...ing,
              ingredientId: value,
              unit: selectedIng?.unit || ing.unit,
            };
          }
          return { ...ing, [field]: value };
        }
        return ing;
      }),
    });
  };

  const calculateIngredientCost = (recipeIng: RecipeIngredient): number => {
    const ingredient = availableIngredients.find(
      (i) => i.id === recipeIng.ingredientId
    );
    if (!ingredient) return 0;
    const cost = Number(ingredient.cost) || 0;
    const amount = Number(ingredient.amount) || 0;
    const costPerUnit = Number(ingredient.costPerUnit) || (amount > 0 ? cost / amount : 0);
    return costPerUnit * Number(recipeIng.quantity || 0);
  };

  const totalCost = recipeData.ingredients.reduce(
    (sum, ing) => sum + calculateIngredientCost(ing),
    0
  );
  const costPerUnit =
    Number(recipeData.yieldAmount) > 0 ? totalCost / Number(recipeData.yieldAmount) : 0;
  const profitPerUnit = Number(recipeData.sellingPrice) - costPerUnit;
  const profitMargin =
    Number(recipeData.sellingPrice) > 0
      ? (profitPerUnit / Number(recipeData.sellingPrice)) * 100
      : 0;

  const saveRecipe = () => {
    if (!user) return;

    if (!recipeData.name) {
      alert("Please enter a product name");
      return;
    }

    setIsDraft(false);
    const dataToSave = { ...recipeData, isDraft: false };
    localStorage.setItem(`profit-calc-product-${user.email}-${currentRecipeId}`, JSON.stringify(dataToSave));

    const recipes = JSON.parse(
      localStorage.getItem(`profit-calc-products-${user.email}`) || "[]"
    );
    const existingIndex = recipes.findIndex((r: any) => r.id === currentRecipeId);
    const now = new Date().toISOString();

    if (existingIndex === -1) {
      recipes.push({
        id: currentRecipeId,
        name: recipeData.name,
        createdAt: now,
        modifiedAt: now,
        isDraft: false,
      });

    } else {
      recipes[existingIndex] = {
        ...recipes[existingIndex],
        name: recipeData.name,
        modifiedAt: now,
        isDraft: false,
      };
    }
    localStorage.setItem(`profit-calc-products-${user.email}`, JSON.stringify(recipes));

    navigate("/");
  };

  return (
    <ErrorBoundary>
      <div className="max-w-5xl mx-auto p-8">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-center gap-4 mb-6">
          <Link
            to="/"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-semibold text-gray-900">
                {isNew ? "Build Your Product" : "Edit Product"}
              </h2>
              {isDraft && (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded">
                  Draft
                </span>
              )}
            </div>
            {lastSaved && (
              <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                <Clock className="w-3 h-3" />
                Last saved at {lastSaved}
              </div>
            )}
          </div>
          <button
            onClick={saveRecipe}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            <Save className="w-4 h-4" />
            Save Product
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Name
            </label>
            <input
              type="text"
              value={recipeData.name}
              onChange={(e) =>
                setRecipeData({ ...recipeData, name: e.target.value })
              }
              placeholder="e.g., Custom Widget, Premium Service"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              1. What costs go into this?
            </h3>

            {availableIngredients.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-600 mb-3">
                  You haven't added any costs yet.
                </p>
                <Link
                  to="/ingredients"
                  className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                >
                  Add Your First Cost
                </Link>
              </div>
            ) : (
              <IngredientSelector
                ingredients={availableIngredients}
                selectedIds={recipeData.ingredients.map(ing => ing.ingredientId)}
                onSelectionChange={handleIngredientSelection}
              />
            )}
          </div>

          {recipeData.ingredients.length > 0 && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                2. How much of each?
              </h3>
              <div className="space-y-3">
                {recipeData.ingredients.map((recipeIng) => {
                  const ingredient = availableIngredients.find(
                    (i) => i.id === recipeIng.ingredientId
                  );
                  const cost = calculateIngredientCost(recipeIng);
                  return (
                    <div
                      key={recipeIng.id}
                      className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-3 items-center p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{ingredient?.name}</p>
                        <p className="text-sm text-gray-600">
                          {ingredient?.currency}{(ingredient?.costPerUnit || 0).toFixed(4)}/{ingredient?.unit}
                        </p>
                      </div>
                      <input
                        type="number"
                        value={recipeIng.quantity}
                        onChange={(e) =>
                          updateIngredient(
                            recipeIng.id,
                            "quantity",
                            e.target.value === "" ? "" as any : Number(e.target.value)
                          )
                        }
                        min="0"
                        step="0.01"
                        placeholder="Quantity"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <select
                        value={recipeIng.unit}
                        onChange={(e) =>
                          updateIngredient(recipeIng.id, "unit", e.target.value)
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {COMMON_UNITS.map((unit) => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </select>
                      <div className="text-sm font-medium text-gray-700">
                        Cost: {ingredient?.currency}
                        {cost.toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              3. What's your output and price?
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Units Produced
                </label>
                <input
                  type="number"
                  value={recipeData.yieldAmount}
                  onChange={(e) =>
                    setRecipeData({
                      ...recipeData,
                      yieldAmount: e.target.value === "" ? "" as any : Number(e.target.value),
                    })
                  }
                  min="1"
                  placeholder="e.g., 12"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit Type
                </label>
                <select
                  value={recipeData.yieldUnit}
                  onChange={(e) =>
                    setRecipeData({ ...recipeData, yieldUnit: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="unit">units</option>
                  <option value="piece">pieces</option>
                  <option value="item">items</option>
                  <option value="batch">batches</option>
                  <option value="set">sets</option>
                  <option value="package">packages</option>
                  <option value="service">services</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selling Price (per {recipeData.yieldUnit})
                </label>
                <div className="flex gap-2">
                  <select
                    value={recipeData.currency}
                    onChange={(e) =>
                      setRecipeData({ ...recipeData, currency: e.target.value })
                    }
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {CURRENCIES.map((curr) => (
                      <option key={curr} value={curr}>
                        {curr}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={recipeData.sellingPrice}
                    onChange={(e) =>
                      setRecipeData({
                        ...recipeData,
                        sellingPrice: e.target.value === "" ? "" as any : Number(e.target.value),
                      })
                    }
                    min="0"
                    step="0.01"
                    placeholder="e.g., 2.50"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Your Profitability
              </h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Product Cost</p>
                <p className="text-2xl font-bold text-gray-900">
                  {recipeData.currency}
                  {totalCost.toFixed(2)}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">
                  Cost Per {recipeData.yieldUnit}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {recipeData.currency}
                  {costPerUnit.toFixed(2)}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">
                  Profit Per {recipeData.yieldUnit}
                </p>
                <p
                  className={`text-2xl font-bold ${
                    profitPerUnit >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {recipeData.currency}
                  {profitPerUnit.toFixed(2)}
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Profit Margin</p>
                <p
                  className={`text-2xl font-bold ${
                    profitMargin >= 0 ? "text-blue-600" : "text-red-600"
                  }`}
                >
                  {profitMargin.toFixed(1)}%
                </p>
              </div>
            </div>

            {profitMargin < 0 && recipeData.sellingPrice > 0 && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  <strong>You're losing money.</strong> This price doesn't cover your costs.
                  You need at least {recipeData.currency}{costPerUnit.toFixed(2)} to break even.
                </p>
              </div>
            )}

            {profitMargin > 0 && profitMargin < 20 && recipeData.sellingPrice > 0 && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  <strong>Thin margins.</strong> Most healthy businesses target 20-40% margins.
                  Consider raising prices or reducing costs.
                </p>
              </div>
            )}

            {profitMargin >= 20 && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Healthy margin.</strong> You're making good profit on this product.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </ErrorBoundary>
  );
}
