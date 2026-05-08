import { useNavigate } from "react-router";
import { Check, Crown, ArrowLeft } from "lucide-react";
import { useAuth } from "./AuthContext";
import { ErrorBoundary } from "./ErrorBoundary";

export function PricingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 mb-6 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Products
          </button>

          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-2">
              Grow Without Limits
            </h1>
            <p className="text-gray-600 text-sm md:text-base">
              Start free. Scale as you grow. No surprises.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Starter</h2>
              <div className="mb-4">
                <span className="text-4xl font-semibold text-gray-900">£0</span>
                <span className="text-gray-600 text-sm">/month</span>
              </div>
              <p className="text-gray-600 text-sm mb-5">Perfect for testing and small catalogs</p>

              <ul className="space-y-2.5 mb-6">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 text-sm">Track up to 3 products</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 text-sm">Unlimited cost items</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 text-sm">Real-time profit margins</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 text-sm">Multi-currency support</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 text-sm">Dashboard insights</span>
                </li>
              </ul>

              <button
                disabled
                className="w-full py-2.5 bg-gray-200 text-gray-500 rounded-md font-medium cursor-not-allowed text-sm"
              >
                {user?.plan === "free" ? "Current Plan" : "Downgrade"}
              </button>
            </div>

            {/* Premium Plan */}
            <div className="bg-blue-600 rounded-lg shadow-xl p-6 border border-blue-700 relative">
              <div className="absolute -top-2.5 left-1/2 transform -translate-x-1/2">
                <span className="bg-amber-400 text-gray-900 px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1">
                  <Crown className="w-3 h-3" />
                  MOST POPULAR
                </span>
              </div>

              <h2 className="text-xl font-semibold text-white mb-2">Professional</h2>
              <div className="mb-4">
                <span className="text-4xl font-semibold text-white">£10</span>
                <span className="text-blue-100 text-sm">/month</span>
              </div>
              <p className="text-blue-100 text-sm mb-5">For growing product catalogs</p>

              <ul className="space-y-2.5 mb-6">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-white mt-0.5 flex-shrink-0" />
                  <span className="text-white text-sm"><strong>Track up to 20 products</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-white mt-0.5 flex-shrink-0" />
                  <span className="text-white text-sm">Batch edit products & costs</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-white mt-0.5 flex-shrink-0" />
                  <span className="text-white text-sm">Category organization</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-white mt-0.5 flex-shrink-0" />
                  <span className="text-white text-sm">Compare products by category</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-white mt-0.5 flex-shrink-0" />
                  <span className="text-white text-sm">Everything in Starter</span>
                </li>
              </ul>

              {user?.plan === "premium" ? (
                <div className="space-y-2">
                  <button
                    disabled
                    className="w-full py-2.5 bg-white/20 text-white rounded-md font-medium cursor-not-allowed text-sm"
                  >
                    Current Plan
                  </button>
                  <button
                    onClick={() => navigate("/subscription")}
                    className="w-full py-2 bg-white/10 text-white rounded-md text-sm hover:bg-white/20 transition-colors"
                  >
                    Manage Subscription
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => window.location.href = "https://square.link/u/2en8GRSe"}
                  className="w-full py-2.5 bg-white text-blue-600 rounded-md font-medium hover:bg-blue-50 transition-colors text-sm"
                >
                  Start Professional Trial
                </button>
              )}
            </div>
          </div>

          <div className="mt-8 text-center space-y-2">
            <p className="text-gray-600 text-sm">
              All plans include automatic saving, unlimited cost items, and multi-currency support
            </p>
            <p className="text-xs text-gray-500">
              Cancel anytime. No contracts. Your data exports with you.
            </p>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
