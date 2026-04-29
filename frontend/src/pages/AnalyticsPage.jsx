import { useState, useEffect } from "react";
import axios from "axios";
import { API, useCategories } from "@/App";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  TrendingUp, 
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";

export default function AnalyticsPage() {
  const categories = useCategories();
  const [trends, setTrends] = useState([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [breakdownType, setBreakdownType] = useState("expense");
  const [loading, setLoading] = useState(true);
  const [currentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    fetchData();
  }, [breakdownType]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [trendsRes, breakdownRes] = await Promise.all([
        axios.get(`${API}/api/analytics/trends?months=6`),
        axios.get(`${API}/api/analytics/by-category?month=${currentMonth}&type=${breakdownType}`)
      ]);
      setTrends(trendsRes.data);
      setCategoryBreakdown(breakdownRes.data);
    } catch (error) {
      console.error("Failed to load analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Calculate max values for chart scaling
  const maxTrendValue = Math.max(
    ...trends.flatMap(t => [t.income, t.expenses]),
    1
  );

  // Calculate totals
  const totalTrendIncome = trends.reduce((sum, t) => sum + t.income, 0);
  const totalTrendExpenses = trends.reduce((sum, t) => sum + t.expenses, 0);
  const totalTrendSavings = totalTrendIncome - totalTrendExpenses;
  const avgMonthlySavings = trends.length > 0 ? totalTrendSavings / trends.length : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Analytics</h1>
        <p className="text-gray-400 mt-1">Understand your spending patterns</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <p className="text-gray-400 text-xs uppercase tracking-wider">6 Month Income</p>
            <p className="text-xl font-bold text-emerald-400 mt-1">
              {formatCurrency(totalTrendIncome)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <p className="text-gray-400 text-xs uppercase tracking-wider">6 Month Expenses</p>
            <p className="text-xl font-bold text-red-400 mt-1">
              {formatCurrency(totalTrendExpenses)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <p className="text-gray-400 text-xs uppercase tracking-wider">Total Savings</p>
            <p className={`text-xl font-bold mt-1 ${totalTrendSavings >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {formatCurrency(totalTrendSavings)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <p className="text-gray-400 text-xs uppercase tracking-wider">Avg Monthly Savings</p>
            <p className={`text-xl font-bold mt-1 ${avgMonthlySavings >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {formatCurrency(avgMonthlySavings)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Trends Chart */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            Income vs Expenses Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-64 flex items-center justify-center text-gray-500">Loading...</div>
          ) : trends.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <p>No data available. Start adding transactions to see trends.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Bar Chart */}
              <div className="flex items-end justify-between gap-2 h-48">
                {trends.map((month, index) => (
                  <div key={month.month} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex gap-1 items-end h-40">
                      {/* Income Bar */}
                      <div className="flex-1 flex flex-col items-center justify-end">
                        <div 
                          className="w-full bg-emerald-500 rounded-t transition-all hover:bg-emerald-400"
                          style={{ height: `${(month.income / maxTrendValue) * 100}%`, minHeight: month.income > 0 ? '4px' : '0' }}
                          title={`Income: ${formatCurrency(month.income)}`}
                        />
                      </div>
                      {/* Expense Bar */}
                      <div className="flex-1 flex flex-col items-center justify-end">
                        <div 
                          className="w-full bg-red-500 rounded-t transition-all hover:bg-red-400"
                          style={{ height: `${(month.expenses / maxTrendValue) * 100}%`, minHeight: month.expenses > 0 ? '4px' : '0' }}
                          title={`Expenses: ${formatCurrency(month.expenses)}`}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 mt-2">{month.month_label}</span>
                  </div>
                ))}
              </div>
              
              {/* Legend */}
              <div className="flex justify-center gap-6 pt-4 border-t border-gray-800">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-emerald-500 rounded" />
                  <span className="text-sm text-gray-400">Income</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded" />
                  <span className="text-sm text-gray-400">Expenses</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold text-white">
            Category Breakdown (This Month)
          </CardTitle>
          <Select value={breakdownType} onValueChange={setBreakdownType}>
            <SelectTrigger className="w-[140px] bg-gray-800 border-gray-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="expense" className="text-white">Expenses</SelectItem>
              <SelectItem value="income" className="text-white">Income</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-48 flex items-center justify-center text-gray-500">Loading...</div>
          ) : categoryBreakdown.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-500">
              <p>No {breakdownType} data for this month</p>
            </div>
          ) : (
            <div className="space-y-4">
              {categoryBreakdown.map((cat, index) => (
                <div key={cat.category_id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${cat.color}20` }}
                      >
                        {cat.icon}
                      </div>
                      <span className="text-white font-medium">{cat.category_name}</span>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${breakdownType === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {formatCurrency(cat.amount)}
                      </p>
                      <p className="text-xs text-gray-500">{cat.percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all"
                      style={{ 
                        width: `${cat.percentage}%`,
                        backgroundColor: cat.color
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Comparison Table */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white">Monthly Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Month</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">Income</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">Expenses</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">Savings</th>
                </tr>
              </thead>
              <tbody>
                {trends.map((month) => (
                  <tr key={month.month} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="py-3 px-4 text-white font-medium">{month.month_label}</td>
                    <td className="py-3 px-4 text-right">
                      <span className="flex items-center justify-end gap-1 text-emerald-400">
                        <ArrowUpRight className="w-4 h-4" />
                        {formatCurrency(month.income)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="flex items-center justify-end gap-1 text-red-400">
                        <ArrowDownRight className="w-4 h-4" />
                        {formatCurrency(month.expenses)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`font-bold ${month.savings >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {formatCurrency(month.savings)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
