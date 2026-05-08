import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface User {
  email: string;
  plan: "free" | "premium";
  recipesCreated: number;
  subscriptionStatus: "active" | "grace_period" | "expired" | null;
  subscriptionStartDate: string | null;
  subscriptionEndDate: string | null;
  paymentFailedDate: string | null;
  gracePeriodEndsDate: string | null;
  lastRetryAttemptDate: string | null;
  retryAttemptCount: number;
}

interface PaymentRecord {
  id: string;
  email: string;
  timestamp: string;
  amount: number;
  currency: string;
  status: "success" | "failed" | "retry";
  paymentMethod: string;
  transactionId: string;
  failureReason?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  signup: (email: string, password: string) => boolean;
  logout: () => void;
  upgradePlan: () => void;
  canCreateRecipe: () => boolean;
  subscriptionStatus: "active" | "grace_period" | "expired" | null;
  isAccessBlocked: boolean;
  daysUntilExpiry: number | null;
  processPayment: (mockCardNumber: string, cardholderName: string) => Promise<boolean>;
  retryFailedPayment: () => Promise<boolean>;
  cancelSubscription: () => void;
  simulatePaymentFailure: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<"active" | "grace_period" | "expired" | null>(null);
  const [isAccessBlocked, setIsAccessBlocked] = useState(false);
  const [daysUntilExpiry, setDaysUntilExpiry] = useState<number | null>(null);

  // Migration helper to add new fields to existing users
  const migrateUser = (userData: any): User => {
    return {
      email: userData.email,
      plan: userData.plan || "free",
      recipesCreated: userData.recipesCreated || 0,
      subscriptionStatus: userData.subscriptionStatus || null,
      subscriptionStartDate: userData.subscriptionStartDate || null,
      subscriptionEndDate: userData.subscriptionEndDate || null,
      paymentFailedDate: userData.paymentFailedDate || null,
      gracePeriodEndsDate: userData.gracePeriodEndsDate || null,
      lastRetryAttemptDate: userData.lastRetryAttemptDate || null,
      retryAttemptCount: userData.retryAttemptCount || 0,
    };
  };

  // Check subscription status and grace period
  const checkSubscriptionStatus = (currentUser: User) => {
    if (currentUser.plan === "free") {
      setSubscriptionStatus(null);
      setIsAccessBlocked(false);
      setDaysUntilExpiry(null);
      return;
    }

    // Check if subscription is active
    if (currentUser.subscriptionStatus === "active") {
      setSubscriptionStatus("active");
      setIsAccessBlocked(false);
      setDaysUntilExpiry(null);
      return;
    }

    // Check if in grace period
    if (currentUser.subscriptionStatus === "grace_period" && currentUser.gracePeriodEndsDate) {
      const now = new Date();
      const expiryDate = new Date(currentUser.gracePeriodEndsDate);
      const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (now > expiryDate) {
        // Grace period expired - block access
        setSubscriptionStatus("expired");
        setIsAccessBlocked(true);
        setDaysUntilExpiry(0);

        // Update user to expired status
        const updatedUser = {
          ...currentUser,
          subscriptionStatus: "expired" as const,
          plan: "free" as const,
        };
        setUser(updatedUser);
        localStorage.setItem("profit-calc-current-user", JSON.stringify(updatedUser));

        const users = JSON.parse(localStorage.getItem("profit-calc-users") || "{}");
        if (users[currentUser.email]) {
          users[currentUser.email] = { ...users[currentUser.email], ...updatedUser };
          localStorage.setItem("profit-calc-users", JSON.stringify(users));
        }
      } else {
        setSubscriptionStatus("grace_period");
        setIsAccessBlocked(false);
        setDaysUntilExpiry(daysLeft);
      }
      return;
    }

    // Check if expired
    if (currentUser.subscriptionStatus === "expired") {
      setSubscriptionStatus("expired");
      setIsAccessBlocked(true);
      setDaysUntilExpiry(0);
      return;
    }
  };

  // Attempt daily retry during grace period
  const attemptDailyRetry = async (currentUser: User) => {
    if (currentUser.subscriptionStatus !== "grace_period") return;

    const today = new Date().toISOString().split('T')[0];
    if (currentUser.lastRetryAttemptDate === today) return;

    // Simulate retry (70% success rate for demo)
    await new Promise(resolve => setTimeout(resolve, 1000));
    const success = Math.random() > 0.3;

    if (success) {
      // Payment succeeded
      const nextBillingDate = new Date();
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

      const updatedUser = {
        ...currentUser,
        subscriptionStatus: "active" as const,
        subscriptionEndDate: nextBillingDate.toISOString(),
        paymentFailedDate: null,
        gracePeriodEndsDate: null,
        retryAttemptCount: 0,
        lastRetryAttemptDate: null,
      };

      setUser(updatedUser);
      localStorage.setItem("profit-calc-current-user", JSON.stringify(updatedUser));

      const users = JSON.parse(localStorage.getItem("profit-calc-users") || "{}");
      if (users[currentUser.email]) {
        users[currentUser.email] = { ...users[currentUser.email], ...updatedUser };
        localStorage.setItem("profit-calc-users", JSON.stringify(users));
      }

      // Log successful retry
      addPaymentRecord({
        id: Date.now().toString(),
        email: currentUser.email,
        timestamp: new Date().toISOString(),
        amount: 10,
        currency: "£",
        status: "success",
        paymentMethod: "Auto-retry",
        transactionId: `TXN-RETRY-${Date.now()}`,
      });

      checkSubscriptionStatus(updatedUser);
    } else {
      // Retry failed
      const updatedUser = {
        ...currentUser,
        retryAttemptCount: currentUser.retryAttemptCount + 1,
        lastRetryAttemptDate: today,
      };

      setUser(updatedUser);
      localStorage.setItem("profit-calc-current-user", JSON.stringify(updatedUser));

      const users = JSON.parse(localStorage.getItem("profit-calc-users") || "{}");
      if (users[currentUser.email]) {
        users[currentUser.email] = { ...users[currentUser.email], ...updatedUser };
        localStorage.setItem("profit-calc-users", JSON.stringify(users));
      }

      // Log failed retry
      addPaymentRecord({
        id: Date.now().toString(),
        email: currentUser.email,
        timestamp: new Date().toISOString(),
        amount: 10,
        currency: "£",
        status: "retry",
        paymentMethod: "Auto-retry",
        transactionId: `TXN-RETRY-FAIL-${Date.now()}`,
        failureReason: "Card declined (retry)",
      });
    }
  };

  // Add payment record to history
  const addPaymentRecord = (record: PaymentRecord) => {
    const history = JSON.parse(localStorage.getItem(`profit-calc-payment-history-${record.email}`) || "[]");
    history.unshift(record);
    localStorage.setItem(`profit-calc-payment-history-${record.email}`, JSON.stringify(history));
  };

  // Load user on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("profit-calc-current-user");
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      const users = JSON.parse(localStorage.getItem("profit-calc-users") || "{}");
      const userData = users[parsedUser.email];

      if (userData) {
        const migratedUser = migrateUser({ ...userData, email: parsedUser.email });
        setUser(migratedUser);
        localStorage.setItem("profit-calc-current-user", JSON.stringify(migratedUser));
        checkSubscriptionStatus(migratedUser);

        // Attempt daily retry if in grace period
        attemptDailyRetry(migratedUser);
      } else {
        const migratedUser = migrateUser(parsedUser);
        setUser(migratedUser);
        checkSubscriptionStatus(migratedUser);
      }
    }
  }, []);

  // Recheck subscription status when user changes
  useEffect(() => {
    if (user) {
      checkSubscriptionStatus(user);
    }
  }, [user]);

  const login = (email: string, password: string): boolean => {
    const users = JSON.parse(localStorage.getItem("profit-calc-users") || "{}");
    const userData = users[email];

    if (userData && userData.password === password) {
      const loggedInUser = migrateUser({ ...userData, email });
      setUser(loggedInUser);
      localStorage.setItem("profit-calc-current-user", JSON.stringify(loggedInUser));
      checkSubscriptionStatus(loggedInUser);
      attemptDailyRetry(loggedInUser);
      return true;
    }
    return false;
  };

  const signup = (email: string, password: string): boolean => {
    const users = JSON.parse(localStorage.getItem("profit-calc-users") || "{}");

    if (users[email]) {
      return false;
    }

    const newUserData = {
      password,
      plan: "free",
      recipesCreated: 0,
      subscriptionStatus: null,
      subscriptionStartDate: null,
      subscriptionEndDate: null,
      paymentFailedDate: null,
      gracePeriodEndsDate: null,
      lastRetryAttemptDate: null,
      retryAttemptCount: 0,
    };

    users[email] = newUserData;
    localStorage.setItem("profit-calc-users", JSON.stringify(users));

    const newUser: User = {
      email,
      ...newUserData,
    };
    setUser(newUser);
    localStorage.setItem("profit-calc-current-user", JSON.stringify(newUser));
    return true;
  };

  const logout = () => {
    setUser(null);
    setSubscriptionStatus(null);
    setIsAccessBlocked(false);
    setDaysUntilExpiry(null);
    localStorage.removeItem("profit-calc-current-user");
  };

  const upgradePlan = () => {
    if (user) {
      const now = new Date();
      const nextBillingDate = new Date();
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

      const updatedUser = {
        ...user,
        plan: "premium" as const,
        subscriptionStatus: "active" as const,
        subscriptionStartDate: now.toISOString(),
        subscriptionEndDate: nextBillingDate.toISOString(),
      };
      setUser(updatedUser);
      localStorage.setItem("profit-calc-current-user", JSON.stringify(updatedUser));

      const users = JSON.parse(localStorage.getItem("profit-calc-users") || "{}");
      if (users[user.email]) {
        users[user.email] = { ...users[user.email], ...updatedUser };
        localStorage.setItem("profit-calc-users", JSON.stringify(users));
      }
    }
  };

  const processPayment = async (mockCardNumber: string, cardholderName: string): Promise<boolean> => {
    if (!user) return false;

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock validation
    if (mockCardNumber.length !== 16) {
      throw new Error("Invalid card number");
    }

    // Generate mock transaction ID
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Calculate next billing date (30 days from now)
    const nextBillingDate = new Date();
    nextBillingDate.setDate(nextBillingDate.getDate() + 30);

    // Update user subscription
    const updatedUser = {
      ...user,
      plan: "premium" as const,
      subscriptionStatus: "active" as const,
      subscriptionStartDate: new Date().toISOString(),
      subscriptionEndDate: nextBillingDate.toISOString(),
      paymentFailedDate: null,
      gracePeriodEndsDate: null,
      retryAttemptCount: 0,
      lastRetryAttemptDate: null,
    };

    setUser(updatedUser);
    localStorage.setItem("profit-calc-current-user", JSON.stringify(updatedUser));

    const users = JSON.parse(localStorage.getItem("profit-calc-users") || "{}");
    if (users[user.email]) {
      users[user.email] = { ...users[user.email], ...updatedUser };
      localStorage.setItem("profit-calc-users", JSON.stringify(users));
    }

    // Log payment
    addPaymentRecord({
      id: Date.now().toString(),
      email: user.email,
      timestamp: new Date().toISOString(),
      amount: 10,
      currency: "£",
      status: "success",
      paymentMethod: `Mock Card ****${mockCardNumber.slice(-4)}`,
      transactionId,
    });

    checkSubscriptionStatus(updatedUser);
    return true;
  };

  const retryFailedPayment = async (): Promise<boolean> => {
    if (!user) return false;
    return processPayment("1234567812345678", "Retry Payment");
  };

  const cancelSubscription = () => {
    if (user) {
      const updatedUser = {
        ...user,
        plan: "free" as const,
        subscriptionStatus: null,
        subscriptionStartDate: null,
        subscriptionEndDate: null,
        paymentFailedDate: null,
        gracePeriodEndsDate: null,
        retryAttemptCount: 0,
        lastRetryAttemptDate: null,
      };
      setUser(updatedUser);
      localStorage.setItem("profit-calc-current-user", JSON.stringify(updatedUser));

      const users = JSON.parse(localStorage.getItem("profit-calc-users") || "{}");
      if (users[user.email]) {
        users[user.email] = { ...users[user.email], ...updatedUser };
        localStorage.setItem("profit-calc-users", JSON.stringify(users));
      }
    }
  };

  const simulatePaymentFailure = () => {
    if (!user) return;

    const now = new Date();
    const gracePeriodEnd = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days

    const updatedUser = {
      ...user,
      subscriptionStatus: "grace_period" as const,
      paymentFailedDate: now.toISOString(),
      gracePeriodEndsDate: gracePeriodEnd.toISOString(),
      retryAttemptCount: 0,
      lastRetryAttemptDate: null,
    };

    setUser(updatedUser);
    localStorage.setItem("profit-calc-current-user", JSON.stringify(updatedUser));

    const users = JSON.parse(localStorage.getItem("profit-calc-users") || "{}");
    if (users[user.email]) {
      users[user.email] = { ...users[user.email], ...updatedUser };
      localStorage.setItem("profit-calc-users", JSON.stringify(users));
    }

    // Log payment failure
    addPaymentRecord({
      id: Date.now().toString(),
      email: user.email,
      timestamp: now.toISOString(),
      amount: 10,
      currency: "£",
      status: "failed",
      paymentMethod: "Mock Card ****1234",
      transactionId: `TXN-FAIL-${Date.now()}`,
      failureReason: "Card declined (simulated)",
    });

    checkSubscriptionStatus(updatedUser);
  };

  const canCreateRecipe = (): boolean => {
    if (!user) return false;
    const recipes = JSON.parse(localStorage.getItem(`profit-calc-products-${user.email}`) || "[]");
    const finalizedRecipes = recipes.filter((r: any) => !r.isDraft);
    const recipeCount = finalizedRecipes.length;

    if (user.plan === "premium") {
      return recipeCount < 20;
    }
    return recipeCount < 3;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signup,
        logout,
        upgradePlan,
        canCreateRecipe,
        subscriptionStatus,
        isAccessBlocked,
        daysUntilExpiry,
        processPayment,
        retryFailedPayment,
        cancelSubscription,
        simulatePaymentFailure,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
