import { useState } from "react";
import { useNavigate } from "react-router";
import { Package, Calculator, TrendingUp, ArrowRight, Sparkles, Check } from "lucide-react";
import { useAuth } from "./AuthContext";

export function WelcomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      icon: Package,
      title: "Track Your Costs",
      description: "Add everything you pay for: materials, labor, services, licenses. We'll track the real cost of doing business.",
      action: "Add costs",
      path: "/ingredients",
      color: "blue",
    },
    {
      icon: Calculator,
      title: "Build Your Products",
      description: "Combine your costs into products or services. Instantly see what it really costs to deliver.",
      action: "Create product",
      path: "/recipe/new",
      color: "green",
    },
    {
      icon: TrendingUp,
      title: "Price for Profit",
      description: "See exactly which products make money and which don't. Make pricing decisions with confidence.",
      action: "View insights",
      path: "/dashboard",
      color: "purple",
    },
  ];

  const handleSkip = () => {
    if (user) {
      localStorage.setItem(`profit-calc-onboarding-${user.email}`, "completed");
    }
    navigate("/");
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSkip();
    }
  };

  const handleStart = (path: string) => {
    if (user) {
      localStorage.setItem(`profit-calc-onboarding-${user.email}`, "completed");
    }
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-lg mb-3">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Stop Guessing. Start Profiting.
          </h1>
          <p className="text-sm md:text-base text-gray-600">
            See your true margins in 3 simple steps
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === currentStep
                  ? "w-12 bg-blue-600"
                  : index < currentStep
                  ? "w-8 bg-blue-300"
                  : "w-8 bg-gray-200"
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-lg p-12 border border-gray-200">
          <div className="flex flex-col items-center text-center">
            {(() => {
              const IconComponent = steps[currentStep].icon;
              return (
                <div
                  className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 ${
                    steps[currentStep].color === "blue"
                      ? "bg-blue-100"
                      : steps[currentStep].color === "green"
                      ? "bg-green-100"
                      : "bg-purple-100"
                  }`}
                >
                  <IconComponent
                    className={`w-10 h-10 ${
                      steps[currentStep].color === "blue"
                        ? "text-blue-600"
                        : steps[currentStep].color === "green"
                        ? "text-green-600"
                        : "text-purple-600"
                    }`}
                  />
                </div>
              );
            })()}

            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {steps[currentStep].title}
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-md">
              {steps[currentStep].description}
            </p>

            <div className="flex gap-4">
              <button
                onClick={handleNext}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors font-medium"
              >
                {currentStep < steps.length - 1 ? "Next" : "I'll do this later"}
              </button>
              <button
                onClick={() => handleStart(steps[currentStep].path)}
                className="px-8 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
              >
                {steps[currentStep].action}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Skip */}
        <div className="text-center mt-8">
          <button
            onClick={handleSkip}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Skip tutorial and explore on my own
          </button>
        </div>

        {/* Features */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Never lose work</h3>
            <p className="text-sm text-gray-600">Everything saves automatically</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Instant insights</h3>
            <p className="text-sm text-gray-600">Know your margins in real-time</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Work globally</h3>
            <p className="text-sm text-gray-600">Any currency, any business model</p>
          </div>
        </div>
      </div>
    </div>
  );
}
