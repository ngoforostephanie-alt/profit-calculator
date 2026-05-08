import { createBrowserRouter } from "react-router";
import { Root } from "./components/Root";
import { IngredientsPage } from "./components/IngredientsPage";
import { RecipesPage } from "./components/RecipesPage";
import { RecipeCalculator } from "./components/RecipeCalculator";
import { DashboardPage } from "./components/DashboardPage";
import { ErrorPage } from "./components/ErrorPage";
import { LoginPage } from "./components/LoginPage";
import { PricingPage } from "./components/PricingPage";
import { PaymentPage } from "./components/PaymentPage";
import { SubscriptionManagePage } from "./components/SubscriptionManagePage";
import { WelcomePage } from "./components/WelcomePage";
import { AuthProvider } from "./components/AuthContext";

function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

export const router = createBrowserRouter([
  {
    path: "/login",
    element: (
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    ),
    errorElement: <ErrorPage />
  },
  {
    path: "/pricing",
    element: (
      <AuthProvider>
        <PricingPage />
      </AuthProvider>
    ),
    errorElement: <ErrorPage />
  },
  {
    path: "/payment",
    element: (
      <AuthProvider>
        <PaymentPage />
      </AuthProvider>
    ),
    errorElement: <ErrorPage />
  },
  {
    path: "/subscription",
    element: (
      <AuthProvider>
        <SubscriptionManagePage />
      </AuthProvider>
    ),
    errorElement: <ErrorPage />
  },
  {
    path: "/welcome",
    element: (
      <AuthProvider>
        <WelcomePage />
      </AuthProvider>
    ),
    errorElement: <ErrorPage />
  },
  {
    path: "/",
    element: (
      <AuthProvider>
        <Root />
      </AuthProvider>
    ),
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <RecipesPage />,
        errorElement: <ErrorPage />
      },
      {
        path: "dashboard",
        element: <DashboardPage />,
        errorElement: <ErrorPage />
      },
      {
        path: "ingredients",
        element: <IngredientsPage />,
        errorElement: <ErrorPage />
      },
      {
        path: "recipe/:id",
        element: <RecipeCalculator />,
        errorElement: <ErrorPage />
      },
      {
        path: "recipe/new",
        element: <RecipeCalculator />,
        errorElement: <ErrorPage />
      },
      {
        path: "*",
        errorElement: <ErrorPage />
      }
    ],
  },
]);
