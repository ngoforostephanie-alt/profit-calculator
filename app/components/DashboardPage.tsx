import { useState, useEffect } from "react";
import { Link } from "react-router";
import { TrendingUp, TrendingDown, DollarSign, AlertCircle } from "lucide-react";
import { ErrorBoundary } from "./ErrorBoundary";
import { useAuth } from "./AuthContext";
import { UpgradePrompt } from "./UpgradePrompt";

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
}

interface Recipe {
  id: string;
  name: string;
  createdAt: string;
}

interface RecipeAnalysis {
  id: string;
  name: string;
  totalCost: number;
  costPerUnit: number;
  sellingPrice: number;
  profitPerUnit: number;
  profitMargin: number;
  currency: string;
  yieldUnit: string;
}

export function DashboardPage() {
  const [analysis, setAnalysis] = useState<RecipeAnalysis[]>([]);
  const [sortBy, setSortBy] = useState<"margin" | "profit" | "name">("margin");
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const recipes: Recipe[] = JSON.parse(
      localStorage.getItem(`profit-calc-products-${user.email}`) || "[]"
    );
    const ingredients: StoredIngredient[] = JSON.parse(
      localStorage.getItem(`profit-calc-materials-${user.email}`) || "[]"
    );

    const analysisData: RecipeAnalysis[] = recipes.map((recipe) => {
      const recipeData: RecipeData = JSON.parse(
        localStorage.getItem(`profit-calc-product-${user.email}-${recipe.id}`) || "{}"
      );

      const totalCost = recipeData.ingredients?.reduce((sum, recipeIng) => {
        const ingredient = ingredients.find((i) => i.id === recipeIng.ingredientId);
        if (!ingredient) return sum;
        const cost = Number(ingredient.cost) || 0;
        const amount = Number(ingredient.amount) || 0;
        const costPerUnit = Number(ingredient.costPerUnit) || (amount > 0 ? cost / amount : 0);
        return sum + costPerUnit * Number(recipeIng.quantity || 0);
      }, 0) || 0;

      const costPerUnit =
        Number(recipeData.yieldAmount) > 0 ? totalCost / Number(recipeData.yieldAmount) : 0;
      const profitPerUnit = Number(recipeData.sellingPrice || 0) - costPerUnit;
      const profitMargin =
        Number(recipeData.sellingPrice) > 0
          ? (profitPerUnit / Number(recipeData.sellingPrice)) * 100
          : 0;

      return {
        id: recipe.id,
        name: recipe.name,
        totalCost,
        costPerUnit,
        sellingPrice: recipeData.sellingPrice || 0,
        profitPerUnit,
        profitMargin,
        currency: recipeData.currency || "$",
        yieldUnit: recipeData.yieldUnit || "unit",
      };
    });

    setAnalysis(analysisData);
  }, [user]);

  const sortedAnalysis = [...analysis].sort((a, b) => {
    if (sortBy === "margin") return b.profitMargin - a.profitMargin;
    if (sortBy === "profit") return b.profitPerUnit - a.profitPerUnit;
    return a.name.localeCompare(b.name);
  });

  const avgMargin =
    analysis.length > 0
      ? analysis.reduce((sum, item) => sum + item.profitMargin, 0) /
        analysis.length
      : 0;

  const profitableCount = analysis.filter((item) => item.profitMargin > 0).length;
  const lowMarginCount = analysis.filter(
    (item) => item.profitMargin > 0 && item.profitMargin < 20
  ).length;
  const negativeMarginCount = analysis.filter(
    (item) => item.profitMargin < 0
  ).length;

  return (
    <ErrorBoundary>
      <div className="max-w-6xl mx-auto p-8">
      <div className="bg-white rounded-lg shadow-xl p-4 md:p-6">
        <div className="mb-4">
          <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
            Profit Command Center
          </h2>
          <p className="text-gray-600 mt-0.5 text-sm">
            Your winners, losers, and opportunities — at a glance
          </p>
        </div>

        {analysis.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-xl mb-4">
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Turn Guesswork Into Strategy
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto text-sm px-4">
              Track costs, build products, unlock insights. See the profit margins others are guessing at.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link
                to="/ingredients"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors font-medium"
              >
                Track Costs
              </Link>
              <Link
                to="/recipe/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                Build Your First Product
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Upgrade Prompt (only show for free users after first product) */}
            {user && user.plan === "free" && (
              <UpgradePrompt productsCreated={analysis.length} limit={3} />
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div className="bg-blue-50 p-3 md:p-4 rounded-lg border border-blue-200">
                <p className="text-xs md:text-sm text-blue-700 mb-1 font-medium">Total</p>
                <p className="text-2xl md:text-3xl font-semibold text-blue-900">
                  {analysis.length}
                </p>
              </div>
              <div className="bg-green-50 p-3 md:p-4 rounded-lg border border-green-200">
                <p className="text-xs md:text-sm text-green-700 mb-1 font-medium">Profitable</p>
                <p className="text-2xl md:text-3xl font-semibold text-green-900">
                  {profitableCount}
                </p>
              </div>
              <div className="bg-amber-50 p-3 md:p-4 rounded-lg border border-amber-200">
                <p className="text-xs md:text-sm text-amber-700 mb-1 font-medium">Low &lt;20%</p>
                <p className="text-2xl md:text-3xl font-semibold text-amber-900">
                  {lowMarginCount}
                </p>
              </div>
              <div className="bg-blue-50 p-3 md:p-4 rounded-lg border border-blue-200">
                <p className="text-xs md:text-sm text-blue-700 mb-1 font-medium">Avg Margin</p>
                <p className="text-2xl md:text-3xl font-semibold text-blue-900">
                  {avgMargin.toFixed(1)}%
                </p>
              </div>
            </div>

            {negativeMarginCount > 0 && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-red-800">
                    <strong>Urgent:</strong> {negativeMarginCount} product
                    {negativeMarginCount > 1 ? "s are" : " is"} losing money.
                    Fix pricing now or stop selling.
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                All Products
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(e.target.value as "margin" | "profit" | "name")
                  }
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="margin">Best margin</option>
                  <option value="profit">Most profit</option>
                  <option value="name">A-Z</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Product Name
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                      Cost/Unit
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                      Selling Price
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                      Profit/Unit
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                      Margin
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sortedAnalysis.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">
                          {item.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          per {item.yieldUnit}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">
                        {item.currency}
                        {item.costPerUnit.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">
                        {item.currency}
                        {item.sellingPrice.toFixed(2)}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-medium ${
                          item.profitPerUnit >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {item.currency}
                        {item.profitPerUnit.toFixed(2)}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-bold text-lg ${
                          item.profitMargin >= 20
                            ? "text-green-600"
                            : item.profitMargin >= 0
                            ? "text-yellow-600"
                            : "text-red-600"
                        }`}
                      >
                        {item.profitMargin.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-center">
                        {item.profitMargin >= 20 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            <TrendingUp className="w-3 h-3" />
                            Healthy
                          </span>
                        ) : item.profitMargin >= 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                            Low
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                            <TrendingDown className="w-3 h-3" />
                            Loss
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          to={`/recipe/${item.id}`}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
    </ErrorBoundary>
  );
}
