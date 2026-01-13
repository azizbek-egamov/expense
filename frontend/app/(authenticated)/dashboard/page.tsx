"use client"

import { useEffect, useState } from "react"
import { apiCall } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Building2, Wallet, TrendingUp, DollarSign, PieChart as PieChartIcon } from "lucide-react"
import { BarChart } from "@/components/charts/bar-chart"
import { DoughnutChart } from "@/components/charts/doughnut-chart"
import { chartColors } from "@/components/charts/config"
import { formatCurrency } from "@/lib/format-utils"

interface DashboardStats {
  total_buildings: number
  total_budget: number
  total_spent: number
  total_expenses: number
  remaining_budget: number
  buildings_by_status: Record<string, number>
  top_buildings_by_expenses: Array<{
    id: number
    name: string
    budget: number
    spent_amount: number
    expenses_total: number
  }>
  recent_expenses: Array<{
    id: number
    building__name: string
    amount: number
    category: string
    description: string
    date: string
  }>
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [expenseStats, setExpenseStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [dashboardRes, expenseRes] = await Promise.all([
          apiCall("/api/statistics/dashboard/"),
          apiCall("/api/expenses/statistics/")
        ])

        if (dashboardRes.ok) {
          setStats(await dashboardRes.json())
        }
        if (expenseRes.ok) {
          setExpenseStats(await expenseRes.json())
        }
      } catch (err) {
        console.error("[Dashboard] Error:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  // Kategoriya bo'yicha Chart Data (API kategoriya nomlarini qaytaradi)
  const pieChartData = expenseStats?.expenses_by_category ? {
    labels: Object.keys(expenseStats.expenses_by_category),
    datasets: [{
      data: Object.values(expenseStats.expenses_by_category) as number[],
      backgroundColor: [
        chartColors.emerald,
        chartColors.amber,
        chartColors.blue,
        chartColors.purple,
        chartColors.rose,
        chartColors.cyan,
      ],
      borderWidth: 0,
    }]
  } : null

  // Top binolar Chart Data
  const barChartData = stats?.top_buildings_by_expenses ? {
    labels: stats.top_buildings_by_expenses.slice(0, 5).map(b => b.name),
    datasets: [{
      label: "Xarajatlar",
      data: stats.top_buildings_by_expenses.slice(0, 5).map(b => b.expenses_total || 0),
      backgroundColor: chartColors.blue,
      borderRadius: 4,
    }]
  } : null



  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Bosh sahifa</h1>
        <p className="text-slate-400 mt-2">Qurilish chiqimlarining umumiy ko'rinishi</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 bg-slate-800/50 rounded-xl" />
          ))}
        </div>
      ) : stats ? (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-slate-700/60 bg-slate-800/60 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-indigo-500/10">
                    <Building2 className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Jami Binolar</p>
                    <p className="text-3xl font-bold text-white mt-1">{stats.total_buildings}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-700/60 bg-slate-800/60 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-emerald-500/10">
                    <DollarSign className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Jami Budget</p>
                    <p className="text-2xl font-bold text-emerald-400 mt-1">
                      {formatCurrency(stats.total_budget)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-700/60 bg-slate-800/60 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-amber-500/10">
                    <Wallet className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Sarflangan</p>
                    <p className="text-2xl font-bold text-amber-400 mt-1">
                      {formatCurrency(stats.total_spent)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-700/60 bg-slate-800/60 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-cyan-500/10">
                    <TrendingUp className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Qolgan</p>
                    <p className="text-2xl font-bold text-cyan-400 mt-1">
                      {formatCurrency(stats.remaining_budget)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <Card className="border-slate-700/60 bg-slate-800/60 backdrop-blur-sm p-4">
              <div className="flex items-center gap-2 mb-4">
                <PieChartIcon className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-semibold text-white">Kategoriya bo'yicha chiqimlar</h3>
              </div>
              <div className="h-[300px]">
                {pieChartData ? (
                  <DoughnutChart data={pieChartData} />
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500">
                    Ma'lumot yo'q
                  </div>
                )}
              </div>
            </Card>

            {/* Bar Chart */}
            <Card className="border-slate-700/60 bg-slate-800/60 backdrop-blur-sm p-4">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">Top binolar (xarajat)</h3>
              </div>
              <div className="h-[300px]">
                {barChartData ? (
                  <BarChart data={barChartData} />
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500">
                    Ma'lumot yo'q
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Recent Expenses & Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-slate-700/60 bg-slate-800/60 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-white">
                  <Wallet className="w-5 h-5 text-amber-400" />
                  So'nggi Chiqimlar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.recent_expenses && stats.recent_expenses.length > 0 ? (
                    stats.recent_expenses.map((expense) => (
                      <div key={expense.id} className="flex justify-between items-center py-3 border-b border-slate-700/50 last:border-0">
                        <div>
                          <p className="text-sm font-medium text-white">{expense.description}</p>
                          <p className="text-xs text-slate-400">{expense.building__name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-emerald-400">{formatCurrency(expense.amount)}</p>
                          <p className="text-xs text-slate-500">{expense.category}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500 text-center py-4">Chiqimlar yo'q</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-700/60 bg-slate-800/60 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-white">
                  <Building2 className="w-5 h-5 text-blue-400" />
                  Binolar holati
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.buildings_by_status && Object.entries(stats.buildings_by_status).map(([status, count]) => (
                    <div key={status} className="flex justify-between items-center py-3 border-b border-slate-700/50 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${status === 'Yangi' ? 'bg-blue-500' :
                          status === 'Qurilish boshlangan' ? 'bg-amber-500' : 'bg-emerald-500'
                          }`} />
                        <span className="text-sm text-slate-300">{status}</span>
                      </div>
                      <span className="text-lg font-bold text-white">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <div className="text-center py-12 text-slate-500">
          Ma'lumot yuklanmadi
        </div>
      )}
    </div>
  )
}
