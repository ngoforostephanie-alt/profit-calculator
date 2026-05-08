import { useState } from "react";
import { useNavigate } from "react-router";
import { Calculator, Mail, Lock, Shield, ArrowLeft } from "lucide-react";
import { useAuth } from "./AuthContext";
import { ErrorBoundary } from "./ErrorBoundary";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(true);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"credentials" | "verify-2fa">("credentials");
  const [verificationCode, setVerificationCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const navigate = useNavigate();
  const { login, signup } = useAuth();

  const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const sendVerificationEmail = (email: string, code: string) => {
    // In a real app, this would send an email via backend API
    console.log(`
======================================
VERIFICATION CODE FOR: ${email}
CODE: ${code}
This code expires in 10 minutes.
======================================
    `);

    // Show alert to simulate email sent
    alert(`Verification code sent to ${email}\n\nFor demo purposes, your code is: ${code}\n\n(In production, this would be sent via email)`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    // Generate and send verification code
    const code = generateVerificationCode();
    setGeneratedCode(code);
    sendVerificationEmail(email, code);
    setStep("verify-2fa");
  };

  const handleVerify2FA = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (verificationCode !== generatedCode) {
      setError("Invalid verification code");
      return;
    }

    // Code is correct, proceed with login/signup
    if (isSignup) {
      const success = signup(email, password);
      if (success) {
        navigate("/");
      } else {
        setError("An account with this email already exists");
        setStep("credentials");
      }
    } else {
      const success = login(email, password);
      if (success) {
        navigate("/");
      } else {
        setError("Invalid email or password");
        setStep("credentials");
      }
    }
  };

  const handleBack = () => {
    setStep("credentials");
    setVerificationCode("");
    setGeneratedCode("");
    setError("");
  };

  const resendCode = () => {
    const code = generateVerificationCode();
    setGeneratedCode(code);
    sendVerificationEmail(email, code);
    setVerificationCode("");
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="bg-white rounded-lg shadow-lg p-10 w-full max-w-md border border-gray-200">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Calculator className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Profit Calculator
            </h1>
          </div>

          <p className="text-center text-gray-600 mb-8 text-sm">
            Know your true costs. Price with confidence.
          </p>

          {step === "credentials" ? (
            <>
              {isSignup ? (
                <>
                  <div className="mb-6 text-center">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                      Start Tracking Profitability
                    </h2>
                    <p className="text-sm text-gray-600">
                      Join businesses making smarter pricing decisions
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
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="your@business.com"
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                    >
                      Continue
                    </button>
                  </form>

                  <div className="mt-6 text-center">
                    <button
                      onClick={() => {
                        setIsSignup(false);
                        setError("");
                      }}
                      className="text-sm text-gray-600 hover:text-gray-900"
                    >
                      Already have an account?{" "}
                      <span className="text-blue-600 hover:text-blue-700 font-medium">
                        Sign in
                      </span>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                    Welcome Back
                  </h2>

                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="your@business.com"
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                    >
                      Continue
                    </button>
                  </form>

                  <div className="mt-6 text-center">
                    <button
                      onClick={() => {
                        setIsSignup(true);
                        setError("");
                      }}
                      className="text-sm text-gray-600 hover:text-gray-900"
                    >
                      Don't have an account?{" "}
                      <span className="text-blue-600 hover:text-blue-700 font-medium">
                        Create account
                      </span>
                    </button>
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              <div className="mb-6 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-lg mb-4">
                  <Shield className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Verify Your Email
                </h2>
                <p className="text-sm text-gray-600">
                  We sent a 6-digit code to<br />
                  <span className="font-medium text-gray-900">{email}</span>
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <form onSubmit={handleVerify2FA} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-2xl tracking-widest font-semibold"
                    maxLength={6}
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={verificationCode.length !== 6}
                  className="w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Verify & {isSignup ? "Sign Up" : "Sign In"}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={resendCode}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Resend code
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
