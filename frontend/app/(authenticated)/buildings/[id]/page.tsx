"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { apiCall } from "@/lib/auth"
import { formatCurrency, formatFullCurrency } from "@/lib/format-utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BarChart } from "@/components/charts/bar-chart"
import { DoughnutChart } from "@/components/charts/doughnut-chart"
import { LineChart } from "@/components/charts/line-chart"
import { chartColors } from "@/components/charts/config"
import {
    Building2,
    ArrowLeft,
    Calendar,
    DollarSign,
    TrendingUp,
    TrendingDown,
    Receipt,
    PieChart,
    BarChart3,
    Package,
    Users,
    Truck,
    Wrench,
    MoreHorizontal,
    Plus,
    Filter,
    X,
    RefreshCw,
    Hash,
    ArrowUpRight
} from "lucide-react"

interface BuildingStats {
    building_name: string
    building_status: string
    building_description: string
    start_date: string | null
    budget: number
    spent_amount: number
    remaining_budget: number
    total_expenses: number
    expenses_count: number
    average_expense: number
    max_expense: number
    expenses_by_category: Record<string, number>
    top_users: Array<{ created_by__username: string; created_by_id: number; total: number; count: number }>
    daily_expenses: Array<{ date: string; total: number; count: number }>
    monthly_expenses: Array<{ month: string; month_name: string; total: number }>
    recent_expenses: Array<{
        id: number
        description: string
        amount: number
        date: string
        category: string
        category_icon: string
        category_color: string
        created_by: string
    }>
}

interface User {
    id: number
    username: string
}

interface Category {
    id: number
    name: string
}

const iconMap: Record<string, any> = {
    Package,
    Users,
    Truck,
    Wrench,
    MoreHorizontal,
}

const statusLabels: Record<string, { label: string; color: string }> = {
    new: { label: "Yangi", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
    started: { label: "Jarayonda", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
    finished: { label: "Tugallangan", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
}

export default function BuildingDetailPage() {
    const params = useParams()
    const router = useRouter()
    const buildingId = params.id as string

    const [stats, setStats] = useState<BuildingStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    // Filter states
    const [users, setUsers] = useState<User[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [filterUser, setFilterUser] = useState("")
    const [filterCategory, setFilterCategory] = useState("")
    const [filterDateFrom, setFilterDateFrom] = useState("")
    const [filterDateTo, setFilterDateTo] = useState("")
    const [showFilters, setShowFilters] = useState(false)

    useEffect(() => {
        fetchReferenceData()
    }, [])

    useEffect(() => {
        if (buildingId) {
            fetchBuildingStats()
        }
    }, [buildingId, filterUser, filterCategory, filterDateFrom, filterDateTo])

    const fetchReferenceData = async () => {
        try {
            const [usersRes, categoriesRes] = await Promise.all([
                apiCall("/api/users/"),
                apiCall("/api/expense-categories/"),
            ])
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

    const fetchBuildingStats = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (filterUser) params.append("created_by", filterUser)
            if (filterCategory) params.append("category", filterCategory)
            if (filterDateFrom) params.append("date_from", filterDateFrom)
            if (filterDateTo) params.append("date_to", filterDateTo)

            const response = await apiCall(`/api/buildings/${buildingId}/statistics/?${params.toString()}`)
            if (!response.ok) throw new Error("Ma'lumot yuklanmadi")
            const data = await response.json()
            setStats(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Xatolik yuz berdi")
        } finally {
            setLoading(false)
        }
    }

    const clearFilters = () => {
        setFilterUser("")
        setFilterCategory("")
        setFilterDateFrom("")
        setFilterDateTo("")
    }

    const hasActiveFilters = filterUser || filterCategory || filterDateFrom || filterDateTo

    if (loading && !stats) {
        return (
            <div className="space-y-6">
                <div className="h-12 w-64 bg-slate-800/50 rounded-lg animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-28 bg-slate-800/50 rounded-xl animate-pulse" />
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="h-80 bg-slate-800/50 rounded-xl animate-pulse" />
                    <div className="h-80 bg-slate-800/50 rounded-xl animate-pulse" />
                </div>
            </div>
        )
    }

    if (error && !stats) {
        return (
            <div className="space-y-6">
                <Button onClick={() => router.back()} variant="ghost" className="text-slate-400">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Orqaga
                </Button>
                <div className="p-6 text-center rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
                    {error}
                </div>
            </div>
        )
    }

    if (!stats) return null

    const progress = stats.budget > 0 ? (stats.spent_amount / stats.budget) * 100 : 0
    const clampedProgress = Math.min(progress, 100)
    const statusInfo = statusLabels[stats.building_status] || statusLabels.new

    // Charts
    const categoryLabels = Object.keys(stats.expenses_by_category)
    const categoryValues = Object.values(stats.expenses_by_category)
    const categoryData = {
        labels: categoryLabels,
        datasets: [{
            data: categoryValues,
            backgroundColor: [
                chartColors.emerald, chartColors.amber, chartColors.blue,
                chartColors.purple, chartColors.rose, chartColors.cyan,
            ],
            borderWidth: 0,
        }]
    }

    const monthlyBarData = {
        labels: stats.monthly_expenses.map(m => {
            const date = new Date(m.month + '-01')
            return date.toLocaleDateString('uz-UZ', { month: 'short' })
        }),
        datasets: [{
            label: "Chiqimlar",
            data: stats.monthly_expenses.map(m => m.total),
            backgroundColor: chartColors.blue,
            borderRadius: 4,
        }]
    }

    const dailyData = stats.daily_expenses.length > 0 ? {
        labels: stats.daily_expenses.map(d => new Date(d.date).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' })),
        datasets: [{
            label: "Kunlik chiqimlar",
            data: stats.daily_expenses.map(d => d.total),
            borderColor: chartColors.cyan,
            backgroundColor: chartColors.cyan + '20',
            fill: true,
            tension: 0.4,
        }]
    } : null

    const userChartData = stats.top_users && stats.top_users.length > 0 ? {
        labels: stats.top_users.map(u => u.created_by__username),
        datasets: [{
            label: "Xarajatlar",
            data: stats.top_users.map(u => u.total),
            backgroundColor: chartColors.purple,
            borderRadius: 4,
        }]
    } : null

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button onClick={() => router.back()} variant="ghost" size="icon" className="text-slate-400 shrink-0">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-500/20">
                                <Building2 className="w-6 h-6 text-emerald-400" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">{stats.building_name}</h1>
                                <p className="text-sm text-slate-400">{stats.building_description || "Tavsif mavjud emas"}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusInfo.color}`}>
                        {statusInfo.label}
                    </span>
                    <Button onClick={() => setShowFilters(!showFilters)} variant={showFilters ? "default" : "outline"} size="sm">
                        <Filter className="w-4 h-4 mr-2" />
                        Filterlar
                        {hasActiveFilters && <span className="ml-2 px-1.5 py-0.5 text-xs bg-emerald-500 rounded-full">{[filterUser, filterCategory, filterDateFrom, filterDateTo].filter(Boolean).length}</span>}
                    </Button>
                    <Button onClick={fetchBuildingStats} variant="ghost" size="icon" disabled={loading}>
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Link href={`/expenses?building=${buildingId}`}>
                        <Button size="sm">
                            <Plus className="w-4 h-4 mr-2" />
                            Chiqim
                        </Button>
                    </Link>
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                        <DollarSign className="w-3 h-3" />
                        Byudjet
                    </div>
                    <p className="text-lg font-bold text-white">{formatCurrency(stats.budget)}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                        <TrendingUp className="w-3 h-3" />
                        Sarflangan
                    </div>
                    <p className="text-lg font-bold text-amber-400">{formatCurrency(stats.spent_amount)}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                        <TrendingDown className="w-3 h-3" />
                        Qoldiq
                    </div>
                    <p className={`text-lg font-bold ${stats.remaining_budget >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {formatCurrency(stats.remaining_budget)}
                    </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                        <Hash className="w-3 h-3" />
                        Chiqimlar
                    </div>
                    <p className="text-lg font-bold text-white">{stats.expenses_count}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                        <TrendingUp className="w-3 h-3" />
                        O'rtacha
                    </div>
                    <p className="text-lg font-bold text-emerald-400">{formatCurrency(stats.average_expense)}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                        <ArrowUpRight className="w-3 h-3" />
                        Maksimal
                    </div>
                    <p className="text-lg font-bold text-amber-400">{formatCurrency(stats.max_expense)}</p>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <div className="flex justify-between text-sm text-slate-400 mb-2">
                    <span>Byudjet ishlatilishi</span>
                    <span className="font-medium">{progress.toFixed(1)}%</span>
                </div>
                <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${progress > 90 ? 'bg-red-500' : progress > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${clampedProgress}%` }}
                    />
                </div>
                <div className="flex justify-between text-xs text-slate-500 mt-2">
                    <span>0 so'm</span>
                    <span>{formatCurrency(stats.budget)}</span>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Category Doughnut */}
                <div className="p-6 rounded-xl bg-slate-800/60 border border-slate-700/60">
                    <div className="flex items-center gap-2 mb-6">
                        <PieChart className="w-5 h-5 text-emerald-400" />
                        <h2 className="text-lg font-semibold text-white">Kategoriyalar</h2>
                    </div>
                    {categoryValues.some(v => v > 0) ? (
                        <div className="h-[280px]">
                            <DoughnutChart data={categoryData} />
                        </div>
                    ) : (
                        <div className="h-[280px] flex items-center justify-center text-slate-500">
                            Ma'lumot mavjud emas
                        </div>
                    )}
                </div>

                {/* Monthly Bar */}
                <div className="p-6 rounded-xl bg-slate-800/60 border border-slate-700/60">
                    <div className="flex items-center gap-2 mb-6">
                        <BarChart3 className="w-5 h-5 text-blue-400" />
                        <h2 className="text-lg font-semibold text-white">Oylik chiqimlar</h2>
                    </div>
                    {stats.monthly_expenses.length > 0 ? (
                        <div className="h-[280px]">
                            <BarChart data={monthlyBarData} />
                        </div>
                    ) : (
                        <div className="h-[280px] flex items-center justify-center text-slate-500">
                            Ma'lumot mavjud emas
                        </div>
                    )}
                </div>

                {/* Daily Line */}
                {dailyData && (
                    <div className="p-6 rounded-xl bg-slate-800/60 border border-slate-700/60">
                        <div className="flex items-center gap-2 mb-6">
                            <Calendar className="w-5 h-5 text-cyan-400" />
                            <h2 className="text-lg font-semibold text-white">Kunlik dinamika (30 kun)</h2>
                        </div>
                        <div className="h-[280px]">
                            <LineChart data={dailyData} />
                        </div>
                    </div>
                )}

                {/* Users Bar (Admin only) */}
                {userChartData && (
                    <div className="p-6 rounded-xl bg-slate-800/60 border border-slate-700/60">
                        <div className="flex items-center gap-2 mb-6">
                            <Users className="w-5 h-5 text-purple-400" />
                            <h2 className="text-lg font-semibold text-white">Foydalanuvchilar</h2>
                        </div>
                        <div className="h-[280px]">
                            <BarChart data={userChartData} horizontal />
                        </div>
                    </div>
                )}
            </div>

            {/* Recent Expenses */}
            <div className="p-6 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <Receipt className="w-5 h-5 text-amber-400" />
                        <h2 className="text-lg font-semibold text-white">So'nggi chiqimlar</h2>
                    </div>
                    <Link href={`/expenses?building=${buildingId}`}>
                        <Button variant="ghost" size="sm" className="text-slate-400">
                            Barchasini ko'rish
                        </Button>
                    </Link>
                </div>

                {stats.recent_expenses.length > 0 ? (
                    <div className="space-y-2">
                        {stats.recent_expenses.map((expense) => {
                            const IconComponent = iconMap[expense.category_icon] || MoreHorizontal
                            return (
                                <div
                                    key={expense.id}
                                    className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/50 hover:bg-slate-900/70 transition-colors"
                                >
                                    <div className={`p-2 rounded-lg border ${expense.category_color}`}>
                                        <IconComponent className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-white truncate">{expense.description}</p>
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <span>{expense.category}</span>
                                            <span>•</span>
                                            <span>{new Date(expense.date).toLocaleDateString('uz-UZ')}</span>
                                            <span>•</span>
                                            <span>{expense.created_by}</span>
                                        </div>
                                    </div>
                                    <p className="text-sm font-bold text-amber-400 shrink-0">
                                        {formatCurrency(expense.amount)}
                                    </p>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="text-center py-8 text-slate-500">
                        Chiqimlar mavjud emas
                    </div>
                )}
            </div>
        </div>
    )
}
