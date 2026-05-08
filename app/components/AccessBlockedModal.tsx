import { Lock, CreditCard } from "lucide-react";
import { Link } from "react-router";
import { useAuth } from "./AuthContext";

export function AccessBlockedModal() {
  const { user } = useAuth();

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-95 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
        <div className="inline-flex items-center justify-center p-4 bg-red-100 rounded-full mb-4">
          <Lock className="w-8 h-8 text-red-600" />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Subscription Expired
        </h2>

        <p className="text-gray-600 mb-6">
          Your premium subscription has expired after the 3-day grace period. Please update your payment method to restore access to your account.
        </p>

        {user?.paymentFailedDate && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg text-left">
            <p className="text-sm text-gray-700">
              <strong>Payment first failed:</strong>{" "}
              {new Date(user.paymentFailedDate).toLocaleDateString()}
            </p>
            <p className="text-sm text-gray-700 mt-1">
              <strong>Grace period ended:</strong>{" "}
              {user.gracePeriodEndsDate ? new Date(user.gracePeriodEndsDate).toLocaleDateString() : "N/A"}
            </p>
          </div>
        )}

        <Link
          to="/payment"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium w-full justify-center"
        >
          <CreditCard className="w-5 h-5" />
          Update Payment Method
        </Link>

        <p className="text-xs text-gray-500 mt-4">
          Need help? Contact support@profitcalculator.com
        </p>
      </div>
    </div>
  );
}
