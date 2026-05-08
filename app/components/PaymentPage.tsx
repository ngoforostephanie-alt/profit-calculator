import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { CreditCard, ArrowLeft, CheckCircle, Loader } from "lucide-react";
import { useAuth } from "./AuthContext";
import { ErrorBoundary } from "./ErrorBoundary";

export function PaymentPage() {
  const navigate = useNavigate();
  const { user, processPayment, simulatePaymentFailure } = useAuth();

  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [error, setError] = useState("");
  const [simulateFailure, setSimulateFailure] = useState(false);

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, "");
    const groups = cleaned.match(/.{1,4}/g) || [];
    return groups.join(" ");
  };

  const formatExpiryDate = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + "/" + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    const cleanedCardNumber = cardNumber.replace(/\s/g, "");
    if (cleanedCardNumber.length !== 16) {
      setError("Please enter a valid 16-digit card number");
      return;
    }

    if (!expiryDate.match(/^\d{2}\/\d{2}$/)) {
      setError("Please enter a valid expiry date (MM/YY)");
      return;
    }

    if (cvv.length !== 3) {
      setError("Please enter a valid 3-digit CVV");
      return;
    }

    if (!cardholderName.trim()) {
      setError("Please enter the cardholder name");
      return;
    }

    // Check if simulating failure
    if (simulateFailure) {
      setIsProcessing(true);
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsProcessing(false);
      simulatePaymentFailure();
      alert("Payment failure simulated! Check your subscription status.");
      navigate("/");
      return;
    }

    // Process payment
    setIsProcessing(true);
    try {
      const success = await processPayment(cleanedCardNumber, cardholderName);
      if (success) {
        setPaymentSuccess(true);
        setTimeout(() => {
          navigate("/");
        }, 2000);
      } else {
        setError("Payment processing failed. Please try again.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (paymentSuccess) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-8">
          <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-md w-full text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full mb-6 animate-bounce">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Welcome to Premium!
            </h2>
            <p className="text-lg text-gray-600 mb-2">
              Your subscription is now active
            </p>
            <p className="text-sm text-gray-500 mb-6">
              You can now create up to 20 products
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
              <Loader className="w-4 h-4 animate-spin" />
              <span>Taking you to your workspace...</span>
            </div>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto p-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 mb-8 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Order Summary */}
            <div className="lg:order-2">
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-2xl p-8 text-white sticky top-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold mb-2">Premium Plan</h2>
                  <p className="text-blue-100">
                    Everything you need to scale your business
                  </p>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-300" />
                    <span>Up to 20 products</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-300" />
                    <span>Unlimited materials</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-300" />
                    <span>Advanced profit analytics</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-300" />
                    <span>Priority support</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-300" />
                    <span>3-day grace period</span>
                  </div>
                </div>

                <div className="border-t border-white/20 pt-6">
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-blue-100">Monthly subscription</span>
                    <div>
                      <span className="text-3xl font-bold">£10</span>
                      <span className="text-blue-100">/mo</span>
                    </div>
                  </div>
                  <p className="text-sm text-blue-100">
                    Auto-renews monthly • Cancel anytime
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Form */}
            <div className="lg:order-1">
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">
                    Payment details
                  </h1>
                  <p className="text-gray-600 text-sm">
                    Complete your upgrade to Premium
                  </p>
                </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Card Number
                </label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => {
                    const formatted = formatCardNumber(e.target.value.replace(/\s/g, "").slice(0, 16));
                    setCardNumber(formatted);
                  }}
                  placeholder="1234 5678 9012 3456"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isProcessing}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                    placeholder="MM/YY"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isProcessing}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CVV
                  </label>
                  <input
                    type="text"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 3))}
                    placeholder="123"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isProcessing}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                  placeholder="JOHN DOE"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                  disabled={isProcessing}
                />
              </div>

              <div className="pt-4 border-t">
                <label className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                  <input
                    type="checkbox"
                    checked={simulateFailure}
                    onChange={(e) => setSimulateFailure(e.target.checked)}
                    className="rounded"
                    disabled={isProcessing}
                  />
                  <span>Simulate payment failure (for testing grace period)</span>
                </label>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      Pay £10 / month
                    </>
                  )}
                </button>
              </div>
            </form>

                <p className="text-xs text-gray-500 text-center mt-6">
                  This is a demo payment form. No real charges will be made.
                  <br />
                  Enter any 16-digit card number to proceed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
