
import React, { useState, useEffect, createContext, useContext } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
  useNavigate,
} from "react-router-dom";
import { UserProfile, UserRole, Product, SellerStatus, Message } from "./types";
import { account, databases } from "./lib/appwrite";
import { Query, ID } from "appwrite";

// --- Components ---
import Header from "./components/Header";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CreateProduct from "./pages/CreateProduct";
import ProductDetails from "./pages/ProductDetails";
import SellerDetails from "./pages/SellerDetails";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import Messaging from "./pages/Messaging";
import Checkout from "./pages/Checkout";
import Requests from "./pages/Requests";
import Transactions from "./pages/Transactions";
import Dispute from "./pages/Dispute";
import PublicProfile from "./pages/PublicProfile";

// --- Contexts ---
interface AuthContextType {
  user: UserProfile | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (data: Partial<UserProfile> & { password: string }) => Promise<any>;
  refreshUser: () => void;
  loading: boolean;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  unreadCount: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(
    () => localStorage.getItem("theme") === "dark",
  );
  const [unreadCount, setUnreadCount] = useState(0);

  const createUserProfile = async (profileData: Partial<UserProfile>) => {
    try {
      const profile = await databases.createDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        "profiles",
        profileData.userId || ID.unique(),
        profileData,
      );
      setUser(profile as unknown as UserProfile);
      localStorage.setItem("current_user", JSON.stringify(profile));
      return profile;
    } catch (error) {
      console.error("Error creating user profile:", error);
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      const userAccount = await account.get();
      let profile;
      try {
        profile = await databases.getDocument(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          "profiles",
          userAccount.$id,
        );
      } catch (docError: any) {
        if (docError.code === 404) {
          profile = await createUserProfile({
            userId: userAccount.$id,
            name: userAccount.name,
            email: userAccount.email,
            matricNumber: "UPDATE_REQUIRED",
            department: "Computer Science",
            level: "100",
            role: UserRole.STUDENT,
            sellerStatus: SellerStatus.UNVERIFIED,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        } else {
          throw docError;
        }
      }
      setUser(profile as unknown as UserProfile);
      localStorage.setItem("current_user", JSON.stringify(profile));
    } catch (error: any) {
      if (error.code !== 401) {
        console.error("Error refreshing user:", error);
      }
      setUser(null);
      localStorage.removeItem("current_user");
    }
  };

  const calculateUnread = async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    try {
      const messages = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        "messages",
        [Query.equal("receiverId", user.userId), Query.equal("isRead", false)],
      );
      const filteredCount = messages.documents.filter(
        (m: any) => !user.blockedUserIds?.includes(m.senderId),
      ).length;
      setUnreadCount(filteredCount);
    } catch (error) {
      console.error("Error calculating unread messages:", error);
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      // Always attempt to synchronize with an existing browser session
      await refreshUser();
      setLoading(false);
    };
    initAuth();
  }, []);

  useEffect(() => {
    calculateUnread();
    const interval = setInterval(calculateUnread, 3000); 
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  const login = async (email: string, password: string) => {
    try {
      try {
        await account.deleteSession("current");
      } catch (deleteError: any) {
        if (deleteError.code !== 401) {
          console.error("Error clearing current session:", deleteError);
        }
      }

      try {
        await account.createEmailPasswordSession(email, password);
      } catch (loginError: any) {
        // Handle "session already exists" correctly
        const isSessionActive = loginError.message?.includes("session is active") || loginError.code === 409;
        if (!isSessionActive) {
          throw loginError;
        }
        // If session exists, we proceed without error
      }

      const userAccount = await account.get();
      let profile;
      try {
        profile = await databases.getDocument(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          "profiles",
          userAccount.$id,
        );
      } catch (docError: any) {
        if (docError.code === 404) {
          profile = await createUserProfile({
            userId: userAccount.$id,
            name: userAccount.name,
            email: userAccount.email,
            matricNumber: "UPDATE_REQUIRED",
            department: "Hub Associate",
            level: "100",
            role: UserRole.STUDENT,
            sellerStatus: SellerStatus.UNVERIFIED,
            blockedUserIds: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        } else {
          throw docError;
        }
      }
      setUser(profile as unknown as UserProfile);
      localStorage.setItem("current_user", JSON.stringify(profile));
    } catch (error: any) {
      console.error("Login error:", error);
      const missingAccountScope = error.message?.includes('missing scopes') && error.message?.includes('account');
      if (
        error.code === 401 ||
        error.message?.includes("Invalid credentials") ||
        error.message?.includes("missing scopes")
      ) {
        if (missingAccountScope) {
          throw new Error("Login session was not created. Check your Appwrite platform URL, clear browser storage, and try again.");
        }
        throw new Error("Invalid email or password.");
      }
      throw error;
    }
  };

  const register = async (
    data: any, // Using any for flexible sanitation
  ) => {
    try {
      // 1. Establish Scholarly Account
      const userAccount = await account.create(
        ID.unique(),
        data.email,
        data.password,
        data.name,
      );

      // 2. Sanitize Scholarly Profile (Remove ephemeral attributes)
      const { password, confirmPassword, adminCode, ...profileData } = data;

      const userProfile = await createUserProfile({
        ...profileData,
        userId: userAccount.$id,
        role: data.role || UserRole.STUDENT,
        sellerStatus: data.sellerStatus || SellerStatus.UNVERIFIED,
        blockedUserIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // 3. Auto-Login Synchronizer
      await login(data.email, data.password);

      return userProfile;
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await account.deleteSession("current");
    } catch (error: any) {
      if (error.code !== 401) {
        console.error("Logout error:", error);
      }
    } finally {
      setUser(null);
      localStorage.removeItem("current_user");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        register,
        refreshUser,
        loading,
        isDarkMode,
        toggleDarkMode,
        unreadCount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  adminOnly = false,
}) => {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#14b8a6] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-bold text-[#003366] uppercase tracking-widest">Loading Hub...</span>
        </div>
      </div>
    );
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user.role !== UserRole.ADMIN) return <Navigate to="/" />;
  return <>{children}</>;
};

import CallManager from "./components/CallManager";

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <CallManager />
        <div className="min-h-screen flex flex-col bg-transparent dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-teal-100 transition-colors duration-300 overflow-x-hidden">
          <Header />
          <main className="grow container mx-auto px-4 py-8 relative mt-16">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/product/:id" element={<ProductDetails />} />
              <Route path="/seller/:id" element={<SellerDetails />} />
              
              <Route
                path="/checkout/:id"
                element={
                  <ProtectedRoute>
                    <Checkout />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/transactions"
                element={
                  <ProtectedRoute>
                    <Transactions />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/requests"
                element={
                  <ProtectedRoute>
                    <Requests />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/dispute/:id"
                element={
                  <ProtectedRoute>
                    <Dispute />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/sell"
                element={
                  <ProtectedRoute>
                    <CreateProduct />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/edit-product/:id"
                element={
                  <ProtectedRoute>
                    <CreateProduct />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/user/:id"
                element={
                  <ProtectedRoute>
                    <PublicProfile />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/messages"
                element={
                  <ProtectedRoute>
                    <Messaging />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>

          <footer className="bg-slate-950 border-t border-slate-900 py-20 mt-32 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-[#14b8a6] to-transparent opacity-30"></div>
            
            <div className="container mx-auto px-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-white rounded-[24px] flex items-center justify-center shadow-2xl">
                      <img src="/logo.png" className="h-8" alt="Logo" />
                    </div>
                    <div>
                      <p className="text-2xl font-black text-white leading-none uppercase tracking-tighter">
                        UI DLC <span className="text-[#14b8a6]">Hub.</span>
                      </p>
                      <p className="text-[#14b8a6] text-[10px] font-black uppercase tracking-[0.2em] mt-2">Certified Student Marketplace</p>
                    </div>
                  </div>
                </div>

                <div className="text-left md:text-right space-y-4">
                  <p className="text-slate-400 text-xs font-bold leading-relaxed max-w-sm ml-auto">
                    A dedicated platform for University of Ibadan Distance Learning Centre students to buy, sell, and sync securely.
                  </p>
                  <div className="pt-4 border-t border-slate-900 flex flex-col md:flex-row justify-end items-center gap-6">
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
                      © {new Date().getFullYear()} UI DLC Community Platform
                    </p>
                    <div className="flex gap-4 text-slate-400">
                       <i className="fa-brands fa-whatsapp hover:text-[#14b8a6] cursor-pointer transition-colors"></i>
                       <i className="fa-brands fa-instagram hover:text-[#14b8a6] cursor-pointer transition-colors"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
