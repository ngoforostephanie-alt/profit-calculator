import { Link } from "react-router";
import { ArrowLeft, CreditCard, Calendar, CheckCircle, AlertCircle } from "lucide-react";
import { useAuth } from "./AuthContext";
import { ErrorBoundary } from "./ErrorBoundary";
import { useState } from "react";

interface PaymentRecord {
  id: string;
  timestamp: string;
  amount: number;
  currency: string;
  status: "success" | "failed" | "retry";
  paymentMethod: string;
  transactionId: string;
  failureReason?: string;
}

export function SubscriptionManagePage() {
  const { user, cancelSubscription, subscriptionStatus } = useAuth();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  if (!user || user.plan === "free") {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-50 p-8">
          <div className="max-w-2xl mx-auto">
            <Link
              to="/"
              className="inline-flex items-center gap-2 mb-6 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <p className="text-gray-600">You don't have an active subscription.</p>
              <Link
                to="/pricing"
                className="inline-block mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Plans
              </Link>
            </div>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  // Load payment history
  const paymentHistory: PaymentRecord[] = JSON.parse(
    localStorage.getItem(`profit-calc-payment-history-${user.email}`) || "[]"
  );

  const handleCancelSubscription = () => {
    if (window.confirm("Are you sure you want to cancel your subscription? You'll be downgraded to the Free plan immediately.")) {
      cancelSubscription();
      setShowCancelConfirm(false);
      alert("Subscription cancelled. You've been moved to the Free plan.");
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-50 p-8">
        <div className="max-w-4xl mx-auto">
          <Link
            to="/"
            className="inline-flex items-center gap-2 mb-6 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to App
          </Link>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              Subscription Management
            </h1>

            {/* Current Subscription Status */}
            <div className="mb-6 p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Premium Plan</h2>
                  <p className="text-sm text-gray-600">£10/month</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  subscriptionStatus === "active"
                    ? "bg-green-100 text-green-700"
                    : subscriptionStatus === "grace_period"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700"
                }`}>
                  {subscriptionStatus === "active" && "Active"}
                  {subscriptionStatus === "grace_period" && "Grace Period"}
                  {subscriptionStatus === "expired" && "Expired"}
                </div>
              </div>

              {user.subscriptionEndDate && subscriptionStatus === "active" && (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Next billing date:{" "}
                    {new Date(user.subscriptionEndDate).toLocaleDateString()}
                  </span>
                </div>
              )}

              {subscriptionStatus === "grace_period" && user.gracePeriodEndsDate && (
                <div className="flex items-center gap-2 text-sm text-yellow-700 mt-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>
                    Grace period ends:{" "}
                    {new Date(user.gracePeriodEndsDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="mb-6 p-6 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Payment Method</h3>
                  <p className="text-sm text-gray-600"><p className="text-sm text-gray-600">Managed securely through Square</p></p>
                </div>
                <button
                  onClick={() => window.location.href = "https://square.link/u/2en8GRSe"}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Update
                </button>
              </div>
            </div>

            {/* Payment History */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Payment History</h3>
              {paymentHistory.length === 0 ? (
                <p className="text-sm text-gray-500">No payment history yet.</p>
              ) : (
                <div className="space-y-2">
                  {paymentHistory.slice(0, 10).map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {record.status === "success" ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-600" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {record.currency}{record.amount.toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(record.timestamp).toLocaleString()} •{" "}
                            {record.paymentMethod}
                          </p>
                          {record.failureReason && (
                            <p className="text-xs text-red-600 mt-1">
                              {record.failureReason}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        record.status === "success"
                          ? "bg-green-100 text-green-700"
                          : record.status === "retry"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}>
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cancel Subscription */}
            <div className="pt-6 border-t">
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Cancel Subscription
              </button>

              {showCancelConfirm && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800 mb-3">
                    Are you sure? You'll lose access to premium features immediately and be downgraded to the Free plan (3 products max).
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancelSubscription}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                    >
                      Yes, Cancel
                    </button>
                    <button
                      onClick={() => setShowCancelConfirm(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                    >
                      No, Keep Subscription
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
