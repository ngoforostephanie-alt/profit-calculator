import { Link } from "react-router";
import { Crown, X } from "lucide-react";
import { useState } from "react";

interface Props {
  productsCreated: number;
  limit: number;
}

export function UpgradePrompt({ productsCreated, limit }: Props) {
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem("upgrade-prompt-dismissed") === "true";
  });

  const handleDismiss = () => {
    localStorage.setItem("upgrade-prompt-dismissed", "true");
    setDismissed(true);
  };

  // Don't show if:
  // - User hasn't created their first product yet
  // - User has dismissed it
  // - User hasn't reached 50% of limit
  if (productsCreated === 0 || dismissed || productsCreated < limit * 0.5) {
    return null;
  }

  const isNearLimit = productsCreated >= limit * 0.8;

  return (
    <div className={`mb-6 p-4 rounded-lg border flex items-start gap-3 ${
      isNearLimit
        ? "bg-amber-50 border-amber-200"
        : "bg-blue-50 border-blue-200"
    }`}>
      <Crown className={`w-5 h-5 mt-0.5 ${
        isNearLimit ? "text-amber-600" : "text-blue-600"
      }`} />
      <div className="flex-1">
        <p className={`text-sm font-medium mb-1 ${
          isNearLimit ? "text-amber-900" : "text-blue-900"
        }`}>
          {isNearLimit
            ? `You've hit ${productsCreated} of ${limit} products`
            : `Scale beyond ${limit} products`}
        </p>
        <p className={`text-sm ${
          isNearLimit ? "text-amber-700" : "text-blue-700"
        }`}>
          {isNearLimit
            ? "Upgrade to Professional for 20 products, batch operations, and insights that help you price smarter. Just £10/month."
            : "Get 20 products, batch editing, category insights, and powerful tools to manage profitability at scale. £10/month."}
        </p>
        <Link
          to="/pricing"
          className={`inline-block mt-2 text-sm font-medium ${
            isNearLimit
              ? "text-amber-700 hover:text-amber-800"
              : "text-blue-700 hover:text-blue-800"
          }`}
        >
          {isNearLimit ? "Upgrade now →" : "See what's included →"}
        </Link>
      </div>
      <button
        onClick={handleDismiss}
        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
