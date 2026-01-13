"use client"

import { useEffect, useState } from "react"
import { apiCall } from "@/lib/auth"
import { formatCurrency, formatFullCurrency } from "@/lib/format-utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BarChart } from "@/components/charts/bar-chart"
import { LineChart } from "@/components/charts/line-chart"
import { DoughnutChart } from "@/components/charts/doughnut-chart"
import { chartColors } from "@/components/charts/config"
import {
    PieChart,
    TrendingUp,
    BarChart as BarIcon,
    Calendar,
    Building2,
    Users,
    DollarSign,
    Hash,
    ArrowUpRight,
    ArrowDownRight,
    Filter,
    X,
    RefreshCw
} from "lucide-react"

interface StatisticsData {
    total_expenses: number
    expenses_count: number
    average_expense: number
    max_expense: number
    min_expense: number
    expenses_by_category: Record<string, number>
    expenses_by_building: Array<{ building__name: string; building_id: number; total: number; count: number }>
    top_users: Array<{ created_by__username: string; created_by_id: number; total: number; count: number }>
    daily_expenses: Array<{ date: string; total: number; count: number }>
    weekly_expenses: Array<{ week: string; total: number; count: number }>
    monthly_expenses: Array<{ month: string; total: number; count: number }>
}

interface Building {
    id: number
    name: string
}

interface User {
    id: number
    username: string
}

interface Category {
    id: number
    name: string
}

export default function StatisticsPage() {
    const [data, setData] = useState<StatisticsData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    // Filter states
    const [buildings, setBuildings] = useState<Building[]>([])
    const [users, setUsers] = useState<User[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [filterBuilding, setFilterBuilding] = useState("")
    const [filterUser, setFilterUser] = useState("")
    const [filterCategory, setFilterCategory] = useState("")
    const [filterDateFrom, setFilterDateFrom] = useState("")
    const [filterDateTo, setFilterDateTo] = useState("")
    const [showFilters, setShowFilters] = useState(false)

    useEffect(() => {
        fetchReferenceData()
    }, [])

    useEffect(() => {
        fetchStatistics()
    }, [filterBuilding, filterUser, filterCategory, filterDateFrom, filterDateTo])

    const fetchReferenceData = async () => {
        try {
            const [buildingsRes, usersRes, categoriesRes] = await Promise.all([
                apiCall("/api/buildings/"),
                apiCall("/api/users/"),
                apiCall("/api/expense-categories/"),
            ])

            if (buildingsRes.ok) {
                const data = await buildingsRes.json()
                setBuildings(Array.isArray(data) ? data : data.results || [])
            }
            if (usersRes.ok) {
                const data = await usersRes.json()
                setUsers(Array.isArray(data) ? data : data.results || [])
            }
            if (categoriesRes.ok) {
                const data = await categoriesRes.json()
                setCategories(Array.isArray(data) ? data : data.results || [])
            }
        } catch (err) {
            console.error("Reference data error:", err)
        }
    }

    const fetchStatistics = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (filterBuilding) params.append("building", filterBuilding)
            if (filterUser) params.append("created_by", filterUser)
            if (filterCategory) params.append("category", filterCategory)
            if (filterDateFrom) params.append("date_from", filterDateFrom)
            if (filterDateTo) params.append("date_to", filterDateTo)

            const response = await apiCall(`/api/expenses/statistics/?${params.toString()}`)
            if (!response.ok) throw new Error("Statistika yuklanmadi")
            const result = await response.json()
            setData(result)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Xatolik yuz berdi")
        } finally {
            setLoading(false)
        }
    }

    const clearFilters = () => {
        setFilterBuilding("")
        setFilterUser("")
        setFilterCategory("")
        setFilterDateFrom("")
        setFilterDateTo("")
    }

    const hasActiveFilters = filterBuilding || filterUser || filterCategory || filterDateFrom || filterDateTo

    if (loading && !data) {
        return (
            <div className="space-y-6">
                <div className="h-16 bg-slate-800/50 rounded-xl animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-28 bg-slate-800/50 rounded-xl animate-pulse" />
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-80 bg-slate-800/50 rounded-xl animate-pulse" />
                    ))}
                </div>
            </div>
        )
    }

    if (error && !data) {
        return (
            <div className="p-6 text-center rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
                Statistika yuklanishda xatolik: {error}
            </div>
        )
    }

    // Chart Data Preparation
    const categoryLabels = data ? Object.keys(data.expenses_by_category) : []
    const categoryValues = data ? Object.values(data.expenses_by_category) : []
    const categoryData = {
        labels: categoryLabels,
        datasets: [{
            data: categoryValues,
            backgroundColor: [
                chartColors.emerald, chartColors.amber, chartColors.blue,
                chartColors.rose, chartColors.purple, chartColors.cyan,
            ],
            borderWidth: 0,
        }]
    }

    const buildingData = data ? {
        labels: data.expenses_by_building.map(b => b.building__name),
        datasets: [{
            label: "Xarajatlar",
            data: data.expenses_by_building.map(b => b.total),
            backgroundColor: chartColors.blue,
            borderRadius: 4,
        }]
    } : null

    const userChartData = data && data.top_users.length > 0 ? {
        labels: data.top_users.map(u => u.created_by__username),
        datasets: [{
            label: "Xarajatlar",
            data: data.top_users.map(u => u.total),
            backgroundColor: chartColors.purple,
            borderRadius: 4,
        }]
    } : null

    const dailyData = data ? {
        labels: data.daily_expenses.map(d => new Date(d.date).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' })),
        datasets: [{
            label: "Kunlik chiqimlar",
            data: data.daily_expenses.map(d => d.total),
            borderColor: chartColors.cyan,
            backgroundColor: chartColors.cyan + '20',
            fill: true,
            tension: 0.4,
        }]
    } : null

    const weeklyData = data ? {
        labels: data.weekly_expenses.map(w => new Date(w.week).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' })),
        datasets: [{
            label: "Haftalik chiqimlar",
            data: data.weekly_expenses.map(w => w.total),
            borderColor: chartColors.emerald,
            backgroundColor: chartColors.emerald + '20',
            fill: true,
            tension: 0.4,
        }]
    } : null

    const monthlyData = data ? {
        labels: data.monthly_expenses.map(m => new Date(m.month).toLocaleDateString('uz-UZ', { month: 'short', year: '2-digit' })),
        datasets: [{
            label: "Oylik chiqimlar",
            data: data.monthly_expenses.map(m => m.total),
            borderColor: chartColors.purple,
            backgroundColor: chartColors.purple + '20',
            fill: true,
            tension: 0.4,
        }]
    } : null

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-teal-500/20">
                            <PieChart className="w-6 h-6 text-teal-400" />
                        </div>
                        Statistika
                    </h1>
                    <p className="text-slate-400 mt-1">Batafsil tahlil va hisobotlar</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={() => setShowFilters(!showFilters)}
                        variant={showFilters ? "default" : "outline"}
                        size="sm"
                    >
                        <Filter className="w-4 h-4 mr-2" />
                        Filterlar
                        {hasActiveFilters && <span className="ml-2 px-1.5 py-0.5 text-xs bg-emerald-500 rounded-full">{[filterBuilding, filterUser, filterCategory, filterDateFrom, filterDateTo].filter(Boolean).length}</span>}
                    </Button>
                    <Button onClick={fetchStatistics} variant="ghost" size="icon" disabled={loading}>
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-slate-300">Filterlar</h3>
                        {hasActiveFilters && (
                            <Button onClick={clearFilters} variant="ghost" size="sm" className="text-slate-400 h-7">
                                <X className="w-3 h-3 mr-1" />
                                Tozalash
                            </Button>
                        )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Sanadan</label>
                            <Input
                                type="date"
                                value={filterDateFrom}
                                onChange={(e) => setFilterDateFrom(e.target.value)}
                                className="h-9"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Sanagacha</label>
                            <Input
                                type="date"
                                value={filterDateTo}
                                onChange={(e) => setFilterDateTo(e.target.value)}
                                className="h-9"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Bino</label>
                            <select
                                value={filterBuilding}
                                onChange={(e) => setFilterBuilding(e.target.value)}
                                className="w-full h-9 rounded-lg px-3 text-sm bg-slate-800/80 border border-slate-600 text-slate-100"
                            >
                                <option value="">Barchasi</option>
                                {buildings.map((b) => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Kategoriya</label>
                            <select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                className="w-full h-9 rounded-lg px-3 text-sm bg-slate-800/80 border border-slate-600 text-slate-100"
                            >
                                <option value="">Barchasi</option>
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        {users.length > 0 && (
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">Foydalanuvchi</label>
                                <select
                                    value={filterUser}
                                    onChange={(e) => setFilterUser(e.target.value)}
                                    className="w-full h-9 rounded-lg px-3 text-sm bg-slate-800/80 border border-slate-600 text-slate-100"
                                >
                                    <option value="">Barchasi</option>
                                    {users.map((u) => (
                                        <option key={u.id} value={u.id}>{u.username}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Summary Cards */}
            {data && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
                        <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                            <DollarSign className="w-4 h-4" />
                            Jami chiqimlar
                        </div>
                        <p className="text-xl font-bold text-white">{formatCurrency(data.total_expenses)}</p>
                        <p className="text-xs text-slate-500 mt-1">{formatFullCurrency(data.total_expenses)}</p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
                        <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                            <Hash className="w-4 h-4" />
                            Chiqimlar soni
                        </div>
                        <p className="text-xl font-bold text-white">{data.expenses_count.toLocaleString()}</p>
                        <p className="text-xs text-slate-500 mt-1">dona</p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
                        <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                            <TrendingUp className="w-4 h-4" />
                            O'rtacha chiqim
                        </div>
                        <p className="text-xl font-bold text-emerald-400">{formatCurrency(data.average_expense)}</p>
                        <p className="text-xs text-slate-500 mt-1">bir chiqimga</p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
                        <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                            <ArrowUpRight className="w-4 h-4" />
                            Eng katta chiqim
                        </div>
                        <p className="text-xl font-bold text-amber-400">{formatCurrency(data.max_expense)}</p>
                        <p className="text-xs text-slate-500 mt-1">maksimal</p>
                    </div>
                </div>
            )}

            {/* Charts Grid */}
            {data && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Category Chart */}
                    <div className="p-6 rounded-xl bg-slate-800/60 border border-slate-700/60">
                        <div className="flex items-center gap-2 mb-6">
                            <PieChart className="w-5 h-5 text-emerald-400" />
                            <h2 className="text-lg font-semibold text-white">Kategoriyalar bo'yicha</h2>
                        </div>
                        {categoryValues.some(v => v > 0) ? (
                            <div className="h-[300px]">
                                <DoughnutChart data={categoryData} />
                            </div>
                        ) : (
                            <div className="h-[300px] flex items-center justify-center text-slate-500">
                                Ma'lumot mavjud emas
                            </div>
                        )}
                    </div>

                    {/* Building Chart */}
                    {buildingData && (
                        <div className="p-6 rounded-xl bg-slate-800/60 border border-slate-700/60">
                            <div className="flex items-center gap-2 mb-6">
                                <Building2 className="w-5 h-5 text-blue-400" />
                                <h2 className="text-lg font-semibold text-white">Binolar bo'yicha (Top 10)</h2>
                            </div>
                            <div className="h-[300px]">
                                <BarChart data={buildingData} horizontal />
                            </div>
                        </div>
                    )}

                    {/* Users Chart (Admin only) */}
                    {userChartData && (
                        <div className="p-6 rounded-xl bg-slate-800/60 border border-slate-700/60">
                            <div className="flex items-center gap-2 mb-6">
                                <Users className="w-5 h-5 text-purple-400" />
                                <h2 className="text-lg font-semibold text-white">Foydalanuvchilar bo'yicha</h2>
                            </div>
                            <div className="h-[300px]">
                                <BarChart data={userChartData} horizontal />
                            </div>
                        </div>
                    )}

                    {/* Daily Trend */}
                    {dailyData && data.daily_expenses.length > 0 && (
                        <div className="p-6 rounded-xl bg-slate-800/60 border border-slate-700/60">
                            <div className="flex items-center gap-2 mb-6">
                                <Calendar className="w-5 h-5 text-cyan-400" />
                                <h2 className="text-lg font-semibold text-white">Kunlik Dinamika (30 kun)</h2>
                            </div>
                            <div className="h-[300px]">
                                <LineChart data={dailyData} />
                            </div>
                        </div>
                    )}

                    {/* Weekly Trend */}
                    {weeklyData && data.weekly_expenses.length > 0 && (
                        <div className="p-6 rounded-xl bg-slate-800/60 border border-slate-700/60">
                            <div className="flex items-center gap-2 mb-6">
                                <TrendingUp className="w-5 h-5 text-emerald-400" />
                                <h2 className="text-lg font-semibold text-white">Haftalik Dinamika</h2>
                            </div>
                            <div className="h-[300px]">
                                <LineChart data={weeklyData} />
                            </div>
                        </div>
                    )}

                    {/* Monthly Trend */}
                    {monthlyData && data.monthly_expenses.length > 0 && (
                        <div className="p-6 rounded-xl bg-slate-800/60 border border-slate-700/60">
                            <div className="flex items-center gap-2 mb-6">
                                <BarIcon className="w-5 h-5 text-purple-400" />
                                <h2 className="text-lg font-semibold text-white">Oylik Dinamika</h2>
                            </div>
                            <div className="h-[300px]">
                                <LineChart data={monthlyData} />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
