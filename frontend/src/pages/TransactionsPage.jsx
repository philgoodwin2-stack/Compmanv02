import { useState, useEffect } from "react";
import axios from "axios";
import { API, useCategories } from "@/App";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Edit2,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

export default function TransactionsPage() {
  const categories = useCategories();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  
  // Form state
  const [formData, setFormData] = useState({
    amount: "",
    category_id: "",
    description: "",
    date: new Date().toISOString().split('T')[0],
    type: "expense"
  });

  useEffect(() => {
    fetchTransactions();
  }, [currentMonth, filterType]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      let url = `${API}/api/transactions?month=${currentMonth}`;
      if (filterType !== "all") {
        url += `&type=${filterType}`;
      }
      const res = await axios.get(url);
      setTransactions(res.data);
    } catch (error) {
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.category_id) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount)
      };

      if (editingTransaction) {
        await axios.put(`${API}/api/transactions/${editingTransaction.id}`, payload);
        toast.success("Transaction updated");
      } else {
        await axios.post(`${API}/api/transactions`, payload);
        toast.success("Transaction added");
      }

      setShowAddDialog(false);
      setEditingTransaction(null);
      resetForm();
      fetchTransactions();
    } catch (error) {
      toast.error("Failed to save transaction");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this transaction?")) return;
    
    try {
      await axios.delete(`${API}/api/transactions/${id}`);
      toast.success("Transaction deleted");
      fetchTransactions();
    } catch (error) {
      toast.error("Failed to delete transaction");
    }
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      amount: transaction.amount.toString(),
      category_id: transaction.category_id,
      description: transaction.description || "",
      date: transaction.date,
      type: transaction.type
    });
    setShowAddDialog(true);
  };

  const resetForm = () => {
    setFormData({
      amount: "",
      category_id: "",
      description: "",
      date: new Date().toISOString().split('T')[0],
      type: "expense"
    });
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

  const currentCategories = formData.type === "income" ? categories.income : categories.expense;

  // Group transactions by date
  const groupedTransactions = transactions.reduce((groups, transaction) => {
    const date = transaction.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(transaction);
    return groups;
  }, {});

  const sortedDates = Object.keys(groupedTransactions).sort((a, b) => new Date(b) - new Date(a));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Transactions</h1>
          <p className="text-gray-400 mt-1">Track your income and expenses</p>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={(open) => {
          setShowAddDialog(open);
          if (!open) {
            setEditingTransaction(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-500 hover:bg-emerald-600">
              <Plus className="w-4 h-4 mr-2" />
              Add Transaction
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-800 text-white">
            <DialogHeader>
              <DialogTitle>{editingTransaction ? "Edit Transaction" : "Add Transaction"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {/* Type Toggle */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={formData.type === "expense" ? "default" : "outline"}
                  className={formData.type === "expense" 
                    ? "flex-1 bg-red-500 hover:bg-red-600" 
                    : "flex-1 border-gray-700 text-gray-400"
                  }
                  onClick={() => {
                    setFormData({ ...formData, type: "expense", category_id: "" });
                  }}
                >
                  Expense
                </Button>
                <Button
                  type="button"
                  variant={formData.type === "income" ? "default" : "outline"}
                  className={formData.type === "income" 
                    ? "flex-1 bg-emerald-500 hover:bg-emerald-600" 
                    : "flex-1 border-gray-700 text-gray-400"
                  }
                  onClick={() => {
                    setFormData({ ...formData, type: "income", category_id: "" });
                  }}
                >
                  Income
                </Button>
              </div>

              {/* Amount */}
              <div>
                <Label className="text-gray-300">Amount *</Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">£</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="pl-7 bg-gray-800 border-gray-700 text-white text-lg"
                    required
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <Label className="text-gray-300">Category *</Label>
                <Select 
                  value={formData.category_id} 
                  onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                >
                  <SelectTrigger className="mt-1 bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {currentCategories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id} className="text-white hover:bg-gray-700">
                        <span className="flex items-center gap-2">
                          <span>{cat.icon}</span>
                          <span>{cat.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date */}
              <div>
                <Label className="text-gray-300">Date</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="mt-1 bg-gray-800 border-gray-700 text-white"
                />
              </div>

              {/* Description */}
              <div>
                <Label className="text-gray-300">Description (optional)</Label>
                <Input
                  type="text"
                  placeholder="e.g., Weekly groceries"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <Button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600">
                {editingTransaction ? "Update" : "Add"} Transaction
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
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

        {/* Type Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <div className="flex bg-gray-900 rounded-lg p-1">
            {["all", "income", "expense"].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filterType === type
                    ? type === "income" 
                      ? "bg-emerald-500 text-white"
                      : type === "expense"
                      ? "bg-red-500 text-white"
                      : "bg-gray-700 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="text-lg">No transactions found</p>
              <p className="text-sm mt-1">Start tracking by adding your first transaction</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {sortedDates.map((date) => (
                <div key={date}>
                  {/* Date Header */}
                  <div className="px-4 py-2 bg-gray-800/50 text-gray-400 text-sm font-medium">
                    {new Date(date).toLocaleDateString('en-GB', { 
                      weekday: 'long',
                      day: 'numeric', 
                      month: 'long',
                      year: 'numeric'
                    })}
                  </div>
                  
                  {/* Transactions for this date */}
                  {groupedTransactions[date].map((transaction) => {
                    const catInfo = getCategoryInfo(transaction.category_id);
                    const isIncome = transaction.type === 'income';
                    
                    return (
                      <div 
                        key={transaction.id}
                        className="flex items-center justify-between p-4 hover:bg-gray-800/30 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div 
                            className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
                            style={{ backgroundColor: `${catInfo.color}20` }}
                          >
                            {catInfo.icon}
                          </div>
                          <div>
                            <p className="font-medium text-white">
                              {transaction.description || catInfo.name}
                            </p>
                            <p className="text-sm text-gray-500">{catInfo.name}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className={`flex items-center gap-1 font-bold text-lg ${isIncome ? 'text-emerald-400' : 'text-red-400'}`}>
                            {isIncome ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                            {formatCurrency(transaction.amount)}
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(transaction)}
                              className="text-gray-400 hover:text-white hover:bg-gray-800"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(transaction.id)}
                              className="text-gray-400 hover:text-red-400 hover:bg-gray-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Add Button (Mobile) */}
      <Button
        onClick={() => setShowAddDialog(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 shadow-lg md:hidden"
      >
        <Plus className="w-6 h-6" />
      </Button>
    </div>
  );
}
