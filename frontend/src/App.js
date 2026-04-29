import { useState, useEffect, createContext, useContext } from "react";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import axios from "axios";
import { Toaster } from "@/components/ui/sonner";
import { 
  LayoutDashboard, 
  Receipt, 
  PiggyBank, 
  TrendingUp,
  Menu,
  X
} from "lucide-react";

import DashboardPage from "./pages/DashboardPage";
import TransactionsPage from "./pages/TransactionsPage";
import BudgetsPage from "./pages/BudgetsPage";
import AnalyticsPage from "./pages/AnalyticsPage";

export const API = process.env.REACT_APP_BACKEND_URL || "";

// Categories context
const CategoriesContext = createContext(null);

export const useCategories = () => useContext(CategoriesContext);

function Navigation() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const navItems = [
    { path: "/", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/transactions", icon: Receipt, label: "Transactions" },
    { path: "/budgets", icon: PiggyBank, label: "Budgets" },
    { path: "/analytics", icon: TrendingUp, label: "Analytics" },
  ];
  
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-[#0f0f0f] border-r border-gray-800 min-h-screen fixed left-0 top-0">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="text-3xl">💰</span>
            <span>BudgetPro</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">Personal Finance Tracker</p>
        </div>
        
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      isActive 
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                        : "text-gray-400 hover:bg-gray-800 hover:text-white"
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        
        <div className="p-4 border-t border-gray-800">
          <div className="bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-lg p-4 border border-emerald-500/30">
            <p className="text-sm text-gray-300">Track smarter, save better</p>
            <p className="text-xs text-gray-500 mt-1">Your finances, simplified</p>
          </div>
        </div>
      </aside>
      
      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#0f0f0f] border-b border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">💰</span>
            <span>BudgetPro</span>
          </h1>
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-gray-400 hover:text-white p-2"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="absolute top-full left-0 right-0 bg-[#0f0f0f] border-b border-gray-800 p-4">
            <ul className="space-y-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                        isActive 
                          ? "bg-emerald-500/20 text-emerald-400" 
                          : "text-gray-400 hover:bg-gray-800 hover:text-white"
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}
      </header>
    </>
  );
}

function App() {
  const [categories, setCategories] = useState({ income: [], expense: [], all: [] });
  
  useEffect(() => {
    // Fetch categories on app load
    axios.get(`${API}/api/categories`)
      .then(res => setCategories(res.data))
      .catch(err => console.error("Failed to load categories:", err));
  }, []);
  
  return (
    <CategoriesContext.Provider value={categories}>
      <BrowserRouter>
        <div className="min-h-screen bg-[#0a0a0a] text-white">
          <Navigation />
          
          {/* Main Content */}
          <main className="md:ml-64 min-h-screen pt-16 md:pt-0">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/transactions" element={<TransactionsPage />} />
              <Route path="/budgets" element={<BudgetsPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
            </Routes>
          </main>
          
          <Toaster position="top-right" theme="dark" />
        </div>
      </BrowserRouter>
    </CategoriesContext.Provider>
  );
}

export default App;
