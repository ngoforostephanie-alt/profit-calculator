import { useState, useEffect } from "react";
import { Plus, Trash2, Package, Copy, Folder, Edit2 } from "lucide-react";
import { Link, useLocation } from "react-router";
import { ErrorBoundary } from "./ErrorBoundary";
import { useAuth } from "./AuthContext";
import { SearchBar } from "./SearchBar";
import { CategoryManager, getCategoryColor } from "./CategoryManager";
import { UpgradePrompt } from "./UpgradePrompt";

interface Category {
  id: string;
  name: string;
  color: string;
}

interface Recipe {
  id: string;
  name: string;
  createdAt: string;
  modifiedAt?: string;
  isDraft?: boolean;
  categoryId?: string;
}

export function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"createdAt" | "modifiedAt" | "name">("modifiedAt");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBatchEdit, setShowBatchEdit] = useState(false);
  const [batchEditData, setBatchEditData] = useState<{ categoryId?: string }>({});
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Load recipes
    const loadRecipes = () => {
      const saved = localStorage.getItem(`profit-calc-products-${user.email}`);
      if (saved) {
        const loadedRecipes = JSON.parse(saved);
        const migratedRecipes = loadedRecipes.map((r: Recipe) => ({
          ...r,
          modifiedAt: r.modifiedAt || r.createdAt,
          categoryId: r.categoryId || undefined,
        }));
        setRecipes(migratedRecipes);
      } else {
        setRecipes([]);
      }
    };
    loadRecipes();

    // Load categories
    const savedCategories = localStorage.getItem(`profit-calc-product-categories-${user.email}`);
    if (savedCategories) {
      setCategories(JSON.parse(savedCategories));
    }
  }, [location, user]);

  useEffect(() => {
    if (!user || recipes.length === 0) return;
    localStorage.setItem(`profit-calc-products-${user.email}`, JSON.stringify(recipes));
  }, [recipes, user]);

  useEffect(() => {
    if (!user) return;
    localStorage.setItem(`profit-calc-product-categories-${user.email}`, JSON.stringify(categories));
  }, [categories, user]);

  const deleteRecipe = (id: string) => {
    if (!user) return;
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    const updatedRecipes = recipes.filter((r) => r.id !== id);
    setRecipes(updatedRecipes);
    localStorage.setItem(`profit-calc-products-${user.email}`, JSON.stringify(updatedRecipes));
    localStorage.removeItem(`profit-calc-product-${user.email}-${id}`);
  };

  const duplicateRecipe = (recipe: Recipe) => {
    if (!user) return;

    const newId = Date.now().toString();
    const newRecipe: Recipe = {
      ...recipe,
      id: newId,
      name: `${recipe.name} (Copy)`,
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
      isDraft: true,
    };

    const recipeData = localStorage.getItem(`profit-calc-product-${user.email}-${recipe.id}`);
    if (recipeData) {
      localStorage.setItem(`profit-calc-product-${user.email}-${newId}`, recipeData);
    }

    setRecipes([...recipes, newRecipe]);
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
    if (selectedIds.size === filteredRecipes.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRecipes.map(r => r.id)));
    }
  };

  const applyBatchEdit = () => {
    const now = new Date().toISOString();
    setRecipes(recipes.map(recipe => {
      if (selectedIds.has(recipe.id)) {
        const updates: any = { modifiedAt: now };

        // Handle category: undefined = no change, "" = remove, else = set to value
        if (batchEditData.categoryId !== undefined) {
          if (batchEditData.categoryId === "") {
            updates.categoryId = undefined;
          } else {
            updates.categoryId = batchEditData.categoryId;
          }
        }

        return { ...recipe, ...updates };
      }
      return recipe;
    }));
    setSelectedIds(new Set());
    setShowBatchEdit(false);
    setBatchEditData({});
  };

  const deleteBatch = () => {
    if (!user) return;
    if (!window.confirm(`Delete ${selectedIds.size} products?`)) return;

    const updatedRecipes = recipes.filter(r => !selectedIds.has(r.id));
    setRecipes(updatedRecipes);
    selectedIds.forEach(id => {
      localStorage.removeItem(`profit-calc-product-${user.email}-${id}`);
    });
    setSelectedIds(new Set());
  };

  // Category management
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
    if (!window.confirm("Delete this category? Products won't be deleted.")) return;
    setCategories(categories.filter(cat => cat.id !== id));
    setRecipes(recipes.map(recipe =>
      recipe.categoryId === id ? { ...recipe, categoryId: undefined } : recipe
    ));
  };

  // Filter recipes
  const filteredRecipes = recipes.filter((recipe) => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" ||
                           (selectedCategory === "uncategorized" && !recipe.categoryId) ||
                           recipe.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Sort recipes
  const sortedRecipes = [...filteredRecipes].sort((a, b) => {
    if (sortBy === "name") {
      return a.name.localeCompare(b.name);
    } else if (sortBy === "createdAt") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sortBy === "modifiedAt") {
      const aModified = a.modifiedAt || a.createdAt;
      const bModified = b.modifiedAt || b.createdAt;
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
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedCategory === "all"
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  All Products
                </button>
                <button
                  onClick={() => setSelectedCategory("uncategorized")}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedCategory === "uncategorized"
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Uncategorized
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                      selectedCategory === category.id
                        ? "bg-blue-50 text-blue-700 font-medium"
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
          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 border border-gray-200">
            {/* Mobile Category Filter */}
            <div className="lg:hidden mb-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="all">All Products</option>
                <option value="uncategorized">Uncategorized</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-xl md:text-2xl font-semibold text-gray-900">Your Products</h2>
                <p className="text-gray-600 mt-0.5 text-sm">
                  Every product. Every cost. Every margin.
                </p>
              </div>
              <Link
                to="/recipe/new"
                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium whitespace-nowrap text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>New Product</span>
              </Link>
            </div>

            {recipes.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-xl mb-4">
                  <Package className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Build Your First Profitable Product
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto text-sm px-4">
                  Combine your costs and discover your true margins. Know if you're pricing right — or leaving money on the table.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                  <Link
                    to="/ingredients"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors font-medium"
                  >
                    <Package className="w-4 h-4" />
                    Add Costs First
                  </Link>
                  <Link
                    to="/recipe/new"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Build My First Product
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {/* Upgrade Prompt (only show for free users after first product) */}
                {user.plan === "free" && (
                  <UpgradePrompt productsCreated={recipes.length} limit={3} />
                )}

                {/* Batch Actions */}
                {selectedIds.size > 0 && (
                  <div className="mb-3 px-3 py-2 bg-blue-50 border border-blue-200 rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-sm font-medium text-blue-900">
                      {selectedIds.size} selected
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setShowBatchEdit(true)}
                        className="flex-1 sm:flex-none px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={deleteBatch}
                        className="flex-1 sm:flex-none px-3 py-1.5 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700 transition-colors"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setSelectedIds(new Set())}
                        className="px-3 py-1.5 text-gray-700 hover:bg-gray-100 rounded text-xs font-medium transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}

                {/* Batch Edit Modal */}
                {showBatchEdit && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-5 max-w-sm w-full shadow-2xl">
                      <h3 className="font-semibold text-gray-900 mb-4">
                        Edit {selectedIds.size} {selectedIds.size === 1 ? 'item' : 'items'}
                      </h3>

                      <div className="mb-5">
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

                {/* Search and Sort */}
                <div className="flex items-center gap-4 mb-6">
                  <SearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search products..."
                  />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="modifiedAt">Latest</option>
                    <option value="createdAt">Newest</option>
                    <option value="name">A-Z</option>
                  </select>
                </div>

                {/* Results */}
                {filteredRecipes.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">
                      {searchQuery || selectedCategory !== "all"
                        ? "No products match your filters"
                        : "No products yet"}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sortedRecipes.map((recipe) => (
                      <div
                        key={recipe.id}
                        className={`border rounded-lg p-5 transition-all bg-white ${
                          selectedIds.has(recipe.id)
                            ? "border-blue-500 shadow-md"
                            : "border-gray-200 hover:shadow-md hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(recipe.id)}
                            onChange={() => toggleSelection(recipe.id)}
                            className="mt-1 rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h3 className="font-semibold text-gray-900 text-lg truncate">
                                {recipe.name}
                              </h3>
                              {recipe.isDraft && (
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded">
                                  Draft
                                </span>
                              )}
                            </div>
                            {recipe.categoryId && (() => {
                              const cat = categories.find(c => c.id === recipe.categoryId);
                              return cat ? (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs mb-2 ${getCategoryColor(cat.color)}`}>
                                  <Folder className="w-3 h-3" />
                                  {cat.name}
                                </span>
                              ) : null;
                            })()}
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => duplicateRecipe(recipe)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Duplicate product"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteRecipe(recipe.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 mb-3 space-y-1">
                          <p>Created: {new Date(recipe.createdAt).toLocaleDateString()}</p>
                          {recipe.modifiedAt && recipe.modifiedAt !== recipe.createdAt && (
                            <p>Modified: {new Date(recipe.modifiedAt).toLocaleDateString()}</p>
                          )}
                        </div>
                        <Link
                          to={`/recipe/${recipe.id}`}
                          className="inline-block w-full text-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
                        >
                          {recipe.isDraft ? "Continue Editing" : "View Details"}
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
