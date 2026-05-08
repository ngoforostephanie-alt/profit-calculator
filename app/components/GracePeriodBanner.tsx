import { AlertCircle, X } from "lucide-react";
import { Link } from "react-router";

interface Props {
  daysRemaining: number;
  retryAttemptCount: number;
}

export function GracePeriodBanner({ daysRemaining, retryAttemptCount }: Props) {
  return (
    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-b border-yellow-200">
      <div className="max-w-6xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                Payment Failed - {daysRemaining} {daysRemaining === 1 ? "day" : "days"} remaining to update payment
              </p>
              <p className="text-xs text-gray-600 mt-0.5">
                We'll retry daily. Attempts so far: {retryAttemptCount}
              </p>
            </div>
          </div>
          <Link
            to="/payment"
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium flex-shrink-0"
          >
            Update Payment
          </Link>
        </div>
      </div>
    </div>
  );
}
