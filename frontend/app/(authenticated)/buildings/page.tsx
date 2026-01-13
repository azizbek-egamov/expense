"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { apiCall } from "@/lib/auth"
import { getErrorMessage } from "@/lib/error-utils"
import { MoneyInput, DateInput } from "@/components/formatted-inputs"
import { formatCurrency, dmyToYmd, ymdToDmy } from "@/lib/format-utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Modal } from "@/components/modal"
import { Pagination } from "@/components/pagination"
import Link from "next/link"
import {
  Building2,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  DollarSign,
  TrendingUp,
  Receipt
} from "lucide-react"

interface Building {
  id: number
  name: string
  status: "new" | "started" | "finished"
  budget: number
  spent_amount: number
  start_date: string
  end_date: string | null
  description: string
}

export default function BuildingsPage() {
  const [buildings, setBuildings] = useState<Building[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const [formData, setFormData] = useState({
    name: "",
    status: "new",
    budget: "",
    description: "",
    start_date: ymdToDmy(new Date().toISOString().split("T")[0]),
  })

  useEffect(() => {
    fetchBuildings()
  }, [currentPage])

  const fetchBuildings = async () => {
    setLoading(true)
    try {
      const response = await apiCall(`/api/buildings/?page=${currentPage}`)
      if (!response.ok) throw new Error("Binolar yuklanmadi")

      const data = await response.json()
      setBuildings(data.results || [])
      setTotalCount(data.count || 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xatolik yuz berdi")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    try {
      const payload = {
        ...formData,
        budget: Number(formData.budget) || 0,
        start_date: dmyToYmd(formData.start_date),
      }

      const response = await apiCall(editingId ? `/api/buildings/${editingId}/` : "/api/buildings/", {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(getErrorMessage(errorData))
      }

      resetForm()
      fetchBuildings()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xatolik yuz berdi")
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Haqiqatan ham o'chirib tashlamoqchisiz?")) return

    try {
      const response = await apiCall(`/api/buildings/${id}/`, { method: "DELETE" })
      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(getErrorMessage(errorData))
      }
      fetchBuildings()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xatolik yuz berdi")
    }
  }

  const handleEdit = (building: Building) => {
    setFormData({
      name: building.name,
      status: building.status,
      budget: String(building.budget),
      description: building.description,
      start_date: ymdToDmy(building.start_date),
    })
    setEditingId(building.id)
    setDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({ name: "", status: "new", budget: "", description: "", start_date: ymdToDmy(new Date().toISOString().split("T")[0]) })
    setEditingId(null)
    setDialogOpen(false)
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      new: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
      started: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
      finished: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
    }
    const labels: Record<string, string> = {
      new: "Yangi",
      started: "Jarayonda",
      finished: "Tugallangan",
    }
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status] || styles.new}`}>
        {labels[status] || status}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20">
              <Building2 className="w-6 h-6 text-emerald-400" />
            </div>
            Binolar
          </h1>
          <p className="text-slate-400 mt-1">Qurilish loyihalarini boshqarish</p>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="md:w-auto w-10 px-0 md:px-4">
          <Plus className="w-5 h-5 md:mr-2" />
          <span className="hidden md:inline">Yangi bino</span>
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 rounded-xl bg-slate-800/50 animate-pulse" />
          ))}
        </div>
      ) : buildings.length === 0 ? (
        <div className="text-center py-16 rounded-xl bg-slate-800/30 border border-slate-700/50">
          <Building2 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-lg">Hali bino qo'shilmagan</p>
          <p className="text-slate-500 text-sm mt-1">Yangi bino qo'shish uchun yuqoridagi tugmani bosing</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            {buildings.map((building, index) => {
              const budget = Number(building.budget)
              const spent = Number(building.spent_amount)
              const remaining = budget - spent
              const progress = budget > 0 ? (spent / budget) * 100 : 0
              const clampedProgress = Math.min(progress, 100)

              return (
                <div
                  key={building.id}
                  className="rounded-xl bg-slate-800/60 border border-slate-700/60 p-4 hover:border-slate-600 transition-all duration-200"
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between mb-3">
                    <Link href={`/buildings/${building.id}`} className="flex items-center gap-3 group min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/30 transition-colors">
                        <Building2 className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base font-semibold text-white truncate group-hover:text-emerald-400 transition-colors">{building.name}</h3>
                        <p className="text-xs text-slate-500 truncate">{building.description || "Tavsif yo'q"}</p>
                      </div>
                    </Link>
                    {getStatusBadge(building.status)}
                  </div>

                  {/* Stats - Inline */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="p-2 bg-slate-900/50 rounded-lg">
                      <p className="text-xs text-slate-500 mb-0.5 flex items-center gap-1">
                        <DollarSign className="w-3 h-3" /> Budget
                      </p>
                      <p className="text-sm font-bold text-white">{formatCurrency(budget)}</p>
                    </div>
                    <div className="p-2 bg-slate-900/50 rounded-lg">
                      <p className="text-xs text-slate-500 mb-0.5 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> Sarflangan
                      </p>
                      <p className="text-sm font-bold text-amber-400">{formatCurrency(spent)}</p>
                    </div>
                    <div className="p-2 bg-slate-900/50 rounded-lg">
                      <p className="text-xs text-slate-500 mb-0.5">Qoldiq</p>
                      <p className={`text-sm font-bold ${remaining >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatCurrency(remaining)}</p>
                    </div>
                  </div>

                  {/* Start Date - Compact */}
                  <div className="p-2 rounded-lg bg-slate-900/50 mb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-slate-500 text-xs">
                        <Calendar className="w-3 h-3" />
                        Boshlangan
                      </div>
                      <p className="text-white text-sm font-medium">{new Date(building.start_date).toLocaleDateString("uz-UZ")}</p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Byudjet ishlatilishi</span>
                      <span>{progress.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${progress > 90 ? 'bg-red-500' : progress > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                        style={{ width: `${clampedProgress}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 justify-end pt-3 border-t border-slate-700/50">
                    <Link href={`/expenses?building=${building.id}`}>
                      <Button size="sm" variant="secondary" className="bg-slate-700/50 hover:bg-slate-700 h-8 text-xs">
                        <Receipt className="w-3 h-3 mr-1" />
                        Chiqimlar
                      </Button>
                    </Link>
                    <Button onClick={() => handleEdit(building)} size="sm" variant="outline" className="h-8 text-xs">
                      <Pencil className="w-3 h-3 mr-1" />
                      Tahrirlash
                    </Button>
                    <Button onClick={() => handleDelete(building.id)} size="sm" variant="destructive" className="h-8 text-xs">
                      <Trash2 className="w-3 h-3 mr-1" />
                      O'chirish
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(totalCount / 20)}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      {/* Modal */}
      <Modal
        isOpen={dialogOpen}
        onClose={resetForm}
        title={editingId ? "Binoni tahrirlash" : "Yangi bino qo'shish"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Bino nomi</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Masalan: Toshkent City Mall"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Holati</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="new">Yangi</option>
              <option value="started">Jarayonda</option>
              <option value="finished">Tugallangan</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Byudjet</label>
            <MoneyInput
              value={formData.budget}
              onChange={(value) => setFormData({ ...formData, budget: value })}
              placeholder="1 000 000 000"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Boshlanish sanasi</label>
            <DateInput
              value={formData.start_date}
              onChange={(value) => setFormData({ ...formData, start_date: value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Tavsif</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Bino haqida qisqacha ma'lumot..."
              rows={3}
              className="w-full min-h-20 rounded-lg px-4 py-3 text-sm bg-slate-800/80 border border-slate-600 text-slate-100 placeholder:text-slate-500 hover:border-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 outline-none resize-none"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
              Bekor qilish
            </Button>
            <Button type="submit" className="flex-1">
              {editingId ? "Saqlash" : "Qo'shish"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
