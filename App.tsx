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
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import Messaging from "./pages/Messaging";

// --- Contexts ---
interface AuthContextType {
  user: UserProfile | null;
  login: (email: string) => Promise<void>;
  logout: () => void;
  register: (data: Partial<UserProfile>) => Promise<void>;
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
          console.warn("Profile missing on refresh. Recreating...");
          profile = await createUserProfile({
            userId: userAccount.$id,
            name: userAccount.name,
            email: userAccount.email,
            matricNumber: "UPDATE_REQUIRED", // Placeholder to satisfy schema
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
    } catch (error) {
      console.error("Error refreshing user:", error);
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
      await refreshUser();
      setLoading(false);
    };
    initAuth();
  }, []);

  useEffect(() => {
    calculateUnread();
    const interval = setInterval(calculateUnread, 3000); // Polling for unread messages
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
      // Ensure no active session exists before creating a new one
      try {
        await account.deleteSession('current');
      } catch (e) {
        // Ignore error if no session exists or network error on delete
      }

      await account.createEmailPasswordSession(email, password);
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
          console.warn("Profile missing for existing account. recreating...");
          // Fallback: Create a profile if it doesn't exist (Self-healing)
          profile = await createUserProfile({
            userId: userAccount.$id,
            name: userAccount.name,
            email: userAccount.email,
            matricNumber: "UPDATE_REQUIRED", // Placeholder to satisfy schema
            department: "Computer Science",
            level: "100",
            role: UserRole.STUDENT, // Default role
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
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const register = async (
    data: Partial<UserProfile> & { password: string },
  ) => {
    try {
      const { password, ...profileData } = data;
      const userAccount = await account.create(
        ID.unique(),
        data.email!,
        password,
        data.name,
      );
      const userProfile = await createUserProfile({
        ...profileData,
        userId: userAccount.$id,
        role: data.role || UserRole.STUDENT,
        sellerStatus: data.sellerStatus || SellerStatus.UNVERIFIED,
        blockedUserIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return userProfile;
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("current_user");
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
      <div className="flex items-center justify-center min-h-screen font-black text-slate-300 uppercase tracking-widest">
        Initialising...
      </div>
    );
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user.role !== UserRole.ADMIN) return <Navigate to="/" />;
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-100 selection:text-blue-900 transition-colors duration-300">
          <Header />
          <main className="flex-grow container mx-auto px-4 py-8 relative">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/product/:id" element={<ProductDetails />} />

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



          <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-10 mt-12 transition-colors">
            <div className="container mx-auto px-4">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-700 text-white rounded-xl flex items-center justify-center font-black">
                    U
                  </div>
                  <div>
                    <p className="font-black text-slate-900 dark:text-white leading-none">
                      UI DLC Marketplace
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest">
                      Student Peer-to-Peer Hub
                    </p>
                  </div>
                </div>
                <div className="text-center md:text-right">
                  <p className="text-slate-500 text-sm font-medium">
                    © {new Date().getFullYear()} University of Ibadan Distance
                    Learning Centre.
                  </p>
                  <p className="text-slate-400 text-[10px] font-bold mt-1 uppercase tracking-tighter">
                    Designed for Campus Safety & Trust
                  </p>
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
