import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Check, X, Copy, Folder } from "lucide-react";
import { ErrorBoundary } from "./ErrorBoundary";
import { useAuth } from "./AuthContext";
import { SearchBar } from "./SearchBar";
import { CategoryManager, getCategoryColor } from "./CategoryManager";

interface Category {
  id: string;
  name: string;
  color: string;
}

interface Ingredient {
  id: string;
  name: string;
  type: "material" | "labor" | "service" | "license" | "overhead";
  cost: number;
  currency: string;
  amount: number;
  unit: string;
  costPerUnit: number;
  categoryId?: string;
  createdAt?: string;
  modifiedAt?: string;
}

const MATERIAL_TYPES = [
  { value: "material", label: "Material", prompt: "Track physical materials and components" },
  { value: "labor", label: "Labor", prompt: "Track employee or contractor time" },
  { value: "service", label: "Service", prompt: "Track external services and subscriptions" },
  { value: "license", label: "License", prompt: "Track software and IP licenses" },
  { value: "overhead", label: "Overhead", prompt: "Track fixed costs and overhead" },
];

const UNITS_BY_TYPE: Record<string, string[]> = {
  material: ["g", "kg", "lb", "oz", "ml", "L", "unit", "piece", "box", "m", "ft", "sq m", "sq ft"],
  labor: ["hour", "day", "week", "month"],
  service: ["hour", "day", "month", "year", "unit"],
  license: ["user", "seat", "unit", "month", "year"],
  overhead: ["month", "year", "unit"],
};

const CURRENCIES = ["$", "€", "£", "¥", "₹", "₱"];

function getUnitLabel(type: string): string {
  const labels: Record<string, string> = {
    material: "Quantity",
    labor: "Time Period",
    service: "Duration",
    license: "Count",
    overhead: "Period",
  };
  return labels[type] || "Amount";
}

function getCostLabel(type: string): string {
  const labels: Record<string, string> = {
    material: "Purchase Cost",
    labor: "Total Cost",
    service: "Service Fee",
    license: "License Cost",
    overhead: "Cost",
  };
  return labels[type] || "Cost";
}

export function IngredientsPage() {
  const { user } = useAuth();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Ingredient | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"createdAt" | "modifiedAt" | "name">("modifiedAt");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBatchEdit, setShowBatchEdit] = useState(false);
  const [batchEditData, setBatchEditData] = useState<{ categoryId?: string; currency?: string }>({});

  useEffect(() => {
    if (!user) return;

    const saved = localStorage.getItem(`profit-calc-materials-${user.email}`);
    if (saved) {
      const loadedIngredients = JSON.parse(saved);
      const migratedIngredients = loadedIngredients.map((ing: Ingredient) => ({
        ...ing,
        type: ing.type || "material",
        createdAt: ing.createdAt || new Date().toISOString(),
        modifiedAt: ing.modifiedAt || ing.createdAt || new Date().toISOString(),
        categoryId: ing.categoryId || undefined,
      }));
      setIngredients(migratedIngredients);
    }

    const savedCategories = localStorage.getItem(`profit-calc-material-categories-${user.email}`);
    if (savedCategories) {
      setCategories(JSON.parse(savedCategories));
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    localStorage.setItem(`profit-calc-materials-${user.email}`, JSON.stringify(ingredients));
  }, [ingredients, user]);

  useEffect(() => {
    if (!user) return;
    localStorage.setItem(`profit-calc-material-categories-${user.email}`, JSON.stringify(categories));
  }, [categories, user]);

  const addIngredient = () => {
    const defaultCurrency = ingredients.length > 0 ? ingredients[0].currency : "$";
    const now = new Date().toISOString();
    const newIngredient: Ingredient = {
      id: Date.now().toString(),
      name: "",
      type: "material",
      cost: "" as any,
      currency: defaultCurrency,
      amount: "" as any,
      unit: "unit",
      costPerUnit: 0,
      createdAt: now,
      modifiedAt: now,
    };
    setIngredients([...ingredients, newIngredient]);
    setEditingId(newIngredient.id);
    setEditForm(newIngredient);
  };

  const startEdit = (ingredient: Ingredient) => {
    setEditingId(ingredient.id);
    setEditForm({ ...ingredient });
  };

  const cancelEdit = () => {
    if (editForm && !editForm.name) {
      setIngredients(ingredients.filter((ing) => ing.id !== editForm.id));
    }
    setEditingId(null);
    setEditForm(null);
  };

  const saveEdit = () => {
    if (editForm) {
      const costPerUnit = editForm.amount > 0 ? editForm.cost / editForm.amount : 0;
      const updatedIngredient = {
        ...editForm,
        costPerUnit,
        modifiedAt: new Date().toISOString(),
      };
      setIngredients(
        ingredients.map((ing) => (ing.id === editForm.id ? updatedIngredient : ing))
      );
      setEditingId(null);
      setEditForm(null);
    }
  };

  const deleteIngredient = (id: string) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    setIngredients(ingredients.filter((ing) => ing.id !== id));
  };

  const duplicateIngredient = (ingredient: Ingredient) => {
    const now = new Date().toISOString();
    const newIngredient: Ingredient = {
      ...ingredient,
      id: Date.now().toString(),
      name: `${ingredient.name} (Copy)`,
      createdAt: now,
      modifiedAt: now,
    };
    setIngredients([...ingredients, newIngredient]);
  };

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedIds(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredIngredients.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredIngredients.map(i => i.id)));
    }
  };

  const applyBatchEdit = () => {
    const now = new Date().toISOString();
    setIngredients(ingredients.map(ing => {
      if (selectedIds.has(ing.id)) {
        const updates: any = { modifiedAt: now };

        // Handle category: undefined = no change, "" = remove, else = set to value
        if (batchEditData.categoryId !== undefined) {
          if (batchEditData.categoryId === "") {
            updates.categoryId = undefined;
          } else {
            updates.categoryId = batchEditData.categoryId;
          }
        }

        // Handle currency
        if (batchEditData.currency) {
          updates.currency = batchEditData.currency;
        }

        return { ...ing, ...updates };
      }
      return ing;
    }));
    setSelectedIds(new Set());
    setShowBatchEdit(false);
    setBatchEditData({});
  };

  const deleteBatch = () => {
    if (!window.confirm(`Delete ${selectedIds.size} items?`)) return;
    setIngredients(ingredients.filter(ing => !selectedIds.has(ing.id)));
    setSelectedIds(new Set());
  };

  const addCategory = (name: string, color: string) => {
    const newCategory: Category = {
      id: Date.now().toString(),
      name,
      color,
    };
    setCategories([...categories, newCategory]);
  };

  const editCategory = (id: string, name: string, color: string) => {
    setCategories(categories.map(cat =>
      cat.id === id ? { ...cat, name, color } : cat
    ));
  };

  const deleteCategory = (id: string) => {
    if (!window.confirm("Delete this category? Items won't be deleted.")) return;
    setCategories(categories.filter(cat => cat.id !== id));
    setIngredients(ingredients.map(ing =>
      ing.categoryId === id ? { ...ing, categoryId: undefined } : ing
    ));
  };

  const filteredIngredients = ingredients.filter((ingredient) => {
    const matchesSearch = ingredient.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" ||
                           (selectedCategory === "uncategorized" && !ingredient.categoryId) ||
                           ingredient.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedIngredients = [...filteredIngredients].sort((a, b) => {
    if (sortBy === "name") {
      return a.name.localeCompare(b.name);
    } else if (sortBy === "createdAt") {
      const aCreated = a.createdAt || "";
      const bCreated = b.createdAt || "";
      return new Date(bCreated).getTime() - new Date(aCreated).getTime();
    } else if (sortBy === "modifiedAt") {
      const aModified = a.modifiedAt || a.createdAt || "";
      const bModified = b.modifiedAt || b.createdAt || "";
      return new Date(bModified).getTime() - new Date(aModified).getTime();
    }
    return 0;
  });

  return (
    <ErrorBoundary>
      <div className="max-w-7xl mx-auto p-8">
        <div className="grid grid-cols-[250px_1fr] gap-6">
          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
              <CategoryManager
                categories={categories}
                onAdd={addCategory}
                onEdit={editCategory}
                onDelete={deleteCategory}
              />
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Filter by Category</h3>
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    selectedCategory === "all"
                      ? "bg-blue-600 text-white font-medium"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  All Items
                </button>
                <button
                  onClick={() => setSelectedCategory("uncategorized")}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    selectedCategory === "uncategorized"
                      ? "bg-blue-600 text-white font-medium"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Uncategorized
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2 ${
                      selectedCategory === category.id
                        ? "bg-blue-600 text-white font-medium"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Folder className="w-3.5 h-3.5" />
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  Cost Library
                </h2>
                <p className="text-gray-600 mt-1 text-sm">
                  Every dollar you spend to deliver your product or service
                </p>
              </div>
              <button
                onClick={addIngredient}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                <Plus className="w-4 h-4" />
                Add Cost Item
              </button>
            </div>

            {ingredients.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-xl mb-4">
                  <Plus className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Know what things really cost
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto text-sm px-4">
                  Add everything you pay for: raw materials, employee time, contractor fees, software subscriptions, shipping — anything that goes into delivering value.
                </p>
                <button
                  onClick={addIngredient}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium w-full sm:w-auto max-w-xs text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Start Tracking Costs
                </button>
              </div>
            ) : (
              <>
                {selectedIds.size > 0 && (
                  <div className="mb-3 px-3 py-2 bg-blue-50 border border-blue-200 rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-sm font-medium text-blue-900">
                      {selectedIds.size} selected
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowBatchEdit(true)}
                        className="flex-1 sm:flex-none px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={deleteBatch}
                        className="flex-1 sm:flex-none px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium transition-colors"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setSelectedIds(new Set())}
                        className="px-3 py-1.5 text-gray-700 hover:bg-gray-100 rounded-md text-sm font-medium transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}

                {showBatchEdit && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-5 max-w-sm w-full shadow-xl">
                      <h3 className="font-semibold text-gray-900 mb-4">
                        Edit {selectedIds.size} {selectedIds.size === 1 ? 'item' : 'items'}
                      </h3>

                      <div className="space-y-3 mb-5">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Set category
                          </label>
                          <select
                            value={batchEditData.categoryId === undefined ? "no-change" : (batchEditData.categoryId || "remove")}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === "no-change") {
                                setBatchEditData({ ...batchEditData, categoryId: undefined });
                              } else if (val === "remove") {
                                setBatchEditData({ ...batchEditData, categoryId: "" });
                              } else {
                                setBatchEditData({ ...batchEditData, categoryId: val });
                              }
                            }}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="no-change">— Keep unchanged —</option>
                            <option value="remove">✕ No category</option>
                            {categories.map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Set currency
                          </label>
                          <select
                            value={batchEditData.currency || "no-change"}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === "no-change") {
                                const { currency, ...rest } = batchEditData;
                                setBatchEditData(rest);
                              } else {
                                setBatchEditData({ ...batchEditData, currency: val });
                              }
                            }}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="no-change">— Keep unchanged —</option>
                            {CURRENCIES.map((curr) => (
                              <option key={curr} value={curr}>
                                {curr}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setShowBatchEdit(false);
                            setBatchEditData({});
                          }}
                          className="flex-1 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md text-sm font-medium transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={applyBatchEdit}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium transition-colors"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4 mb-6">
                  <SearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search items..."
                  />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="modifiedAt">Latest</option>
                    <option value="createdAt">Newest</option>
                    <option value="name">A-Z</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <div className="grid grid-cols-[40px_2fr_1fr_1fr_1fr_1fr_1fr_auto] gap-3 px-4 py-2 text-xs font-semibold text-gray-600 border-b uppercase tracking-wide">
                    <div>
                      <input
                        type="checkbox"
                        checked={selectedIds.size === filteredIngredients.length && filteredIngredients.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded"
                      />
                    </div>
                    <div>Name</div>
                    <div>Type</div>
                    <div>Category</div>
                    <div>Cost</div>
                    <div>Amount</div>
                    <div>Rate</div>
                    <div>Actions</div>
                  </div>

                  {filteredIngredients.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-500 text-sm">
                        {searchQuery || selectedCategory !== "all"
                          ? "No items match your filters"
                          : "No items yet"}
                      </p>
                    </div>
                  ) : (
                    sortedIngredients.map((ingredient) => (
                      <div
                        key={ingredient.id}
                        className={`grid grid-cols-[40px_2fr_1fr_1fr_1fr_1fr_1fr_auto] gap-3 items-center px-4 py-3 rounded-md transition-colors ${
                          selectedIds.has(ingredient.id) ? "bg-blue-50" : "hover:bg-gray-50"
                        }`}
                      >
                        {editingId === ingredient.id && editForm ? (
                          <>
                            <div></div>
                            <input
                              type="text"
                              value={editForm.name}
                              onChange={(e) =>
                                setEditForm({ ...editForm, name: e.target.value })
                              }
                              placeholder="Item name"
                              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                              autoFocus
                            />
                            <select
                              value={editForm.type}
                              onChange={(e) => {
                                const newType = e.target.value as Ingredient["type"];
                                const defaultUnit = UNITS_BY_TYPE[newType]?.[0] || "unit";
                                setEditForm({ ...editForm, type: newType, unit: defaultUnit });
                              }}
                              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            >
                              {MATERIAL_TYPES.map((type) => (
                                <option key={type.value} value={type.value}>
                                  {type.label}
                                </option>
                              ))}
                            </select>
                            <select
                              value={editForm.categoryId || ""}
                              onChange={(e) =>
                                setEditForm({ ...editForm, categoryId: e.target.value || undefined })
                              }
                              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            >
                              <option value="">None</option>
                              {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                  {cat.name}
                                </option>
                              ))}
                            </select>
                            <div className="flex items-center gap-1">
                              <select
                                value={editForm.currency}
                                onChange={(e) =>
                                  setEditForm({ ...editForm, currency: e.target.value })
                                }
                                className="w-16 px-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                              >
                                {CURRENCIES.map((currency) => (
                                  <option key={currency} value={currency}>
                                    {currency}
                                  </option>
                                ))}
                              </select>
                              <input
                                type="number"
                                value={editForm.cost}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    cost: e.target.value === "" ? "" as any : Number(e.target.value),
                                  })
                                }
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                              />
                            </div>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                value={editForm.amount}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    amount: e.target.value === "" ? "" as any : Number(e.target.value),
                                  })
                                }
                                min="0"
                                step="0.01"
                                placeholder="1"
                                className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                              />
                              <select
                                value={editForm.unit}
                                onChange={(e) =>
                                  setEditForm({ ...editForm, unit: e.target.value })
                                }
                                className="flex-1 px-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                              >
                                {UNITS_BY_TYPE[editForm.type]?.map((unit) => (
                                  <option key={unit} value={unit}>
                                    {unit}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="text-sm text-gray-500">—</div>
                            <div className="flex gap-1">
                              <button
                                onClick={saveEdit}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div>
                              <input
                                type="checkbox"
                                checked={selectedIds.has(ingredient.id)}
                                onChange={() => toggleSelection(ingredient.id)}
                                className="rounded"
                              />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 text-sm">
                                {ingredient.name || "(unnamed)"}
                              </div>
                              {ingredient.modifiedAt && (
                                <div className="text-xs text-gray-500">
                                  {new Date(ingredient.modifiedAt).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                            <div>
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                                {MATERIAL_TYPES.find(t => t.value === ingredient.type)?.label || ingredient.type}
                              </span>
                            </div>
                            <div>
                              {ingredient.categoryId && (() => {
                                const cat = categories.find(c => c.id === ingredient.categoryId);
                                return cat ? (
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${getCategoryColor(cat.color)}`}>
                                    <Folder className="w-3 h-3" />
                                    {cat.name}
                                  </span>
                                ) : null;
                              })()}
                            </div>
                            <div className="text-gray-700 text-sm font-medium">
                              {ingredient.currency}{Number(ingredient.cost || 0).toFixed(2)}
                            </div>
                            <div className="text-gray-700 text-sm">
                              {ingredient.amount || 0} {ingredient.unit}
                            </div>
                            <div className="text-gray-900 font-semibold text-sm">
                              {ingredient.currency}{Number(ingredient.costPerUnit || 0).toFixed(2)}/{ingredient.unit}
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => duplicateIngredient(ingredient)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                title="Duplicate"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => startEdit(ingredient)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteIngredient(ingredient.id)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
