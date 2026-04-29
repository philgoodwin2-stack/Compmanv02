import { useState, useEffect } from "react";
import axios from "axios";
import { API, useCategories } from "@/App";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function DashboardPage() {
  const navigate = useNavigate();
  const categories = useCategories();
  const [summary, setSummary] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [currentMonth]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [summaryRes, transactionsRes] = await Promise.all([
        axios.get(`${API}/api/summary?month=${currentMonth}`),
        axios.get(`${API}/api/transactions?month=${currentMonth}&limit=5`)
      ]);
      setSummary(summaryRes.data);
      setRecentTransactions(transactionsRes.data);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  const formatMonth = (monthStr) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(year, parseInt(month) - 1);
    return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  };

  const navigateMonth = (direction) => {
    const [year, month] = currentMonth.split('-').map(Number);
    const date = new Date(year, month - 1 + direction);
    setCurrentMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  const getCategoryInfo = (categoryId) => {
    return categories.all?.find(c => c.id === categoryId) || { name: categoryId, icon: "📦", color: "#64748b" };
  };

  if (loading && !summary) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-1">Your financial overview</p>
        </div>
        
        {/* Month Navigator */}
        <div className="flex items-center gap-2 bg-gray-900 rounded-lg p-1">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigateMonth(-1)}
            className="text-gray-400 hover:text-white hover:bg-gray-800"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <span className="px-4 py-2 text-white font-medium min-w-[160px] text-center">
            {formatMonth(currentMonth)}
          </span>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigateMonth(1)}
            className="text-gray-400 hover:text-white hover:bg-gray-800"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Balance Card */}
        <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Net Balance</p>
                <p className={`text-3xl font-bold mt-2 ${(summary?.balance || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatCurrency(summary?.balance || 0)}
                </p>
              </div>
              <div className={`p-3 rounded-full ${(summary?.balance || 0) >= 0 ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                <Wallet className={`w-6 h-6 ${(summary?.balance || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Income Card */}
        <Card className="bg-gradient-to-br from-emerald-900/50 to-gray-900 border-emerald-700/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Income</p>
                <p className="text-3xl font-bold mt-2 text-emerald-400">
                  {formatCurrency(summary?.total_income || 0)}
                </p>
              </div>
              <div className="p-3 rounded-full bg-emerald-500/20">
                <TrendingUp className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expenses Card */}
        <Card className="bg-gradient-to-br from-red-900/50 to-gray-900 border-red-700/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Expenses</p>
                <p className="text-3xl font-bold mt-2 text-red-400">
                  {formatCurrency(summary?.total_expenses || 0)}
                </p>
              </div>
              <div className="p-3 rounded-full bg-red-500/20">
                <TrendingDown className="w-6 h-6 text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Progress & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget Progress */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold text-white">Budget Progress</CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/budgets')}
              className="text-emerald-400 hover:text-emerald-300"
            >
              View All
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {summary?.budget_progress?.length > 0 ? (
              summary.budget_progress.slice(0, 4).map((budget) => {
                const catInfo = getCategoryInfo(budget.category_id);
                const isOverBudget = budget.percentage > 100;
                
                return (
                  <div key={budget.category_id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{catInfo.icon}</span>
                        <span className="text-sm text-gray-300">{catInfo.name}</span>
                      </div>
                      <span className={`text-sm font-medium ${isOverBudget ? 'text-red-400' : 'text-gray-400'}`}>
                        {formatCurrency(budget.spent)} / {formatCurrency(budget.budgeted)}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${isOverBudget ? 'bg-red-500' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No budgets set for this month</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2 border-gray-700 text-gray-400 hover:text-white"
                  onClick={() => navigate('/budgets')}
                >
                  Set Budgets
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold text-white">Recent Transactions</CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/transactions')}
              className="text-emerald-400 hover:text-emerald-300"
            >
              View All
            </Button>
          </CardHeader>
          <CardContent>
            {recentTransactions.length > 0 ? (
              <div className="space-y-3">
                {recentTransactions.map((transaction) => {
                  const catInfo = getCategoryInfo(transaction.category_id);
                  const isIncome = transaction.type === 'income';
                  
                  return (
                    <div 
                      key={transaction.id}
                      className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                          style={{ backgroundColor: `${catInfo.color}20` }}
                        >
                          {catInfo.icon}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">
                            {transaction.description || catInfo.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(transaction.date).toLocaleDateString('en-GB', { 
                              day: 'numeric', 
                              month: 'short' 
                            })}
                          </p>
                        </div>
                      </div>
                      <div className={`flex items-center gap-1 font-semibold ${isIncome ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isIncome ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        {formatCurrency(transaction.amount)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No transactions this month</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2 border-gray-700 text-gray-400 hover:text-white"
                  onClick={() => navigate('/transactions')}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Transaction
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Add Button (Mobile) */}
      <Button
        onClick={() => navigate('/transactions')}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 shadow-lg md:hidden"
      >
        <Plus className="w-6 h-6" />
      </Button>
    </div>
  );
}
