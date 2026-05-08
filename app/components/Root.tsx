import { Outlet, Link, useLocation, useNavigate } from "react-router";
import { Package, Box, BarChart3, LogOut, User, CreditCard, Settings } from "lucide-react";
import { useAuth } from "./AuthContext";
import { useEffect, useState } from "react";
import { GracePeriodBanner } from "./GracePeriodBanner";
import { AccessBlockedModal } from "./AccessBlockedModal";

export function Root() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, subscriptionStatus, isAccessBlocked, daysUntilExpiry } = useAuth();
  const [recipeCount, setRecipeCount] = useState(0);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    // Check if user needs onboarding
    const hasCompletedOnboarding = localStorage.getItem(`profit-calc-onboarding-${user.email}`);
    const recipes = JSON.parse(localStorage.getItem(`profit-calc-products-${user.email}`) || "[]");
    const ingredients = JSON.parse(localStorage.getItem(`profit-calc-materials-${user.email}`) || "[]");

    // Show welcome page for new users with no data
    if (!hasCompletedOnboarding && recipes.length === 0 && ingredients.length === 0 && location.pathname === "/") {
      navigate("/welcome");
    }
  }, [user, navigate, location]);

  useEffect(() => {
    if (!user) return;
    const recipes = JSON.parse(localStorage.getItem(`profit-calc-products-${user.email}`) || "[]");
    const finalizedRecipes = recipes.filter((r: any) => !r.isDraft);
    setRecipeCount(finalizedRecipes.length);
  }, [user, location]);

  if (!user) {
    return null;
  }

  const recipeLimit = user.plan === "premium" ? 20 : 3;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Access Blocked Modal */}
      {isAccessBlocked && <AccessBlockedModal />}

      {/* Grace Period Banner */}
      {subscriptionStatus === "grace_period" && daysUntilExpiry !== null && (
        <GracePeriodBanner
          daysRemaining={daysUntilExpiry}
          retryAttemptCount={user?.retryAttemptCount || 0}
        />
      )}

      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 bg-blue-600 rounded-md flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-semibold text-gray-900">
                  Profit Calculator
                </h1>
                <p className="text-xs text-gray-500">
                  {recipeCount}/{recipeLimit} products
                </p>
              </div>
            </Link>
            <div className="flex items-center gap-1">
              <Link
                to="/"
                className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm font-medium ${
                  location.pathname === "/"
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Box className="w-4 h-4" />
                Products
              </Link>
              <Link
                to="/dashboard"
                className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm font-medium ${
                  location.pathname === "/dashboard"
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Dashboard
              </Link>
              <Link
                to="/ingredients"
                className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm font-medium ${
                  location.pathname === "/ingredients"
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Package className="w-4 h-4" />
                Costs
              </Link>
              <div className="ml-2 flex items-center gap-1 pl-2 border-l border-gray-200">
                {user.plan === "free" ? (
                  <Link
                    to="/pricing"
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    <CreditCard className="w-4 h-4" />
                    Upgrade
                  </Link>
                ) : (
                  <Link
                    to="/subscription"
                    className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm font-medium ${
                      location.pathname === "/subscription"
                        ? "bg-blue-600 text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Settings className="w-4 h-4" />
                  </Link>
                )}
                <button
                  onClick={logout}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>
      <Outlet />
    </div>
  );
}
