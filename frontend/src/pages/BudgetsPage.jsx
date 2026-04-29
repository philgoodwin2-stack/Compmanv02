import { useState, useEffect } from "react";
import axios from "axios";
import { API, useCategories } from "@/App";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  Plus, 
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle
} from "lucide-react";

export default function BudgetsPage() {
  const categories = useCategories();
  const [budgets, setBudgets] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [budgetAmount, setBudgetAmount] = useState("");
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    fetchData();
  }, [currentMonth]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [budgetsRes, summaryRes] = await Promise.all([
        axios.get(`${API}/api/budgets?month=${currentMonth}`),
        axios.get(`${API}/api/summary?month=${currentMonth}`)
      ]);
      setBudgets(budgetsRes.data);
      setSummary(summaryRes.data);
    } catch (error) {
      toast.error("Failed to load budgets");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBudget = async () => {
    if (!selectedCategory || !budgetAmount) {
      toast.error("Please select a category and enter an amount");
      return;
    }

    try {
      await axios.post(`${API}/api/budgets`, {
        category_id: selectedCategory,
        amount: parseFloat(budgetAmount),
        month: currentMonth
      });
      toast.success("Budget saved");
      setShowAddDialog(false);
      setSelectedCategory(null);
      setBudgetAmount("");
      fetchData();
    } catch (error) {
      toast.error("Failed to save budget");
    }
  };

  const handleDeleteBudget = async (budgetId) => {
    if (!confirm("Remove this budget?")) return;

    try {
      await axios.delete(`${API}/api/budgets/${budgetId}`);
      toast.success("Budget removed");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete budget");
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
    return categories.expense?.find(c => c.id === categoryId) || { name: categoryId, icon: "📦", color: "#64748b" };
  };

  // Get spending for each category
  const getCategorySpending = (categoryId) => {
    return summary?.category_totals?.[categoryId]?.expense || 0;
  };

  // Categories without budgets
  const categoriesWithoutBudgets = categories.expense?.filter(
    cat => !budgets.some(b => b.category_id === cat.id)
  ) || [];

  // Calculate totals
  const totalBudgeted = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + getCategorySpending(b.category_id), 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Budgets</h1>
          <p className="text-gray-400 mt-1">Set and track your spending limits</p>
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
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <p className="text-gray-400 text-sm">Total Budgeted</p>
            <p className="text-2xl font-bold text-white mt-2">
              {formatCurrency(totalBudgeted)}
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <p className="text-gray-400 text-sm">Total Spent</p>
            <p className={`text-2xl font-bold mt-2 ${totalSpent > totalBudgeted ? 'text-red-400' : 'text-white'}`}>
              {formatCurrency(totalSpent)}
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <p className="text-gray-400 text-sm">Remaining</p>
            <p className={`text-2xl font-bold mt-2 ${totalBudgeted - totalSpent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {formatCurrency(totalBudgeted - totalSpent)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budget List */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold text-white">Budget Categories</CardTitle>
          
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-500 hover:bg-emerald-600" disabled={categoriesWithoutBudgets.length === 0}>
                <Plus className="w-4 h-4 mr-2" />
                Add Budget
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-gray-800 text-white">
              <DialogHeader>
                <DialogTitle>Set Budget</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                {/* Category Selection */}
                <div>
                  <Label className="text-gray-300">Category</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2 max-h-[200px] overflow-y-auto">
                    {categoriesWithoutBudgets.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`p-3 rounded-lg text-left transition-all ${
                          selectedCategory === cat.id
                            ? 'bg-emerald-500/20 border border-emerald-500'
                            : 'bg-gray-800 border border-gray-700 hover:border-gray-600'
                        }`}
                      >
                        <span className="text-lg">{cat.icon}</span>
                        <p className="text-sm text-white mt-1">{cat.name}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <Label className="text-gray-300">Monthly Budget Amount</Label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">£</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={budgetAmount}
                      onChange={(e) => setBudgetAmount(e.target.value)}
                      className="pl-7 bg-gray-800 border-gray-700 text-white text-lg"
                    />
                  </div>
                </div>

                <Button onClick={handleSaveBudget} className="w-full bg-emerald-500 hover:bg-emerald-600">
                  Save Budget
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : budgets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg">No budgets set for this month</p>
              <p className="text-sm mt-1">Click "Add Budget" to start tracking your spending</p>
            </div>
          ) : (
            budgets.map((budget) => {
              const catInfo = getCategoryInfo(budget.category_id);
              const spent = getCategorySpending(budget.category_id);
              const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
              const isOverBudget = percentage > 100;
              const isNearLimit = percentage >= 80 && percentage <= 100;
              
              return (
                <div key={budget.id} className="p-4 bg-gray-800/50 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                        style={{ backgroundColor: `${catInfo.color}20` }}
                      >
                        {catInfo.icon}
                      </div>
                      <div>
                        <p className="font-medium text-white">{catInfo.name}</p>
                        <p className="text-sm text-gray-500">
                          {formatCurrency(spent)} of {formatCurrency(budget.amount)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {isOverBudget && (
                        <span className="flex items-center gap-1 text-red-400 text-sm">
                          <AlertTriangle className="w-4 h-4" />
                          Over budget
                        </span>
                      )}
                      {isNearLimit && (
                        <span className="flex items-center gap-1 text-yellow-400 text-sm">
                          <AlertTriangle className="w-4 h-4" />
                          Near limit
                        </span>
                      )}
                      {!isOverBudget && !isNearLimit && percentage > 0 && (
                        <span className="flex items-center gap-1 text-emerald-400 text-sm">
                          <CheckCircle className="w-4 h-4" />
                          On track
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteBudget(budget.id)}
                        className="text-gray-400 hover:text-red-400 hover:bg-gray-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          isOverBudget ? 'bg-red-500' : isNearLimit ? 'bg-yellow-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{percentage.toFixed(0)}% used</span>
                      <span>{formatCurrency(budget.amount - spent)} remaining</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
