"use client"

import React, { Suspense } from "react"
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { useSearchParams } from "next/navigation"
import { apiCall } from "@/lib/auth"
import { getErrorMessage } from "@/lib/error-utils"
import { MoneyInput, DateInput } from "@/components/formatted-inputs"
import { formatCurrency, dmyToYmd, ymdToDmy } from "@/lib/format-utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Modal } from "@/components/modal"
import { Pagination } from "@/components/pagination"
import {
  Wallet,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  Building2,
  Filter,
  Package,
  Users,
  Truck,
  Wrench,
  MoreHorizontal,
  Image as ImageIcon,
  X,
  Maximize2
} from "lucide-react"

interface Building {
  id: number
  name: string
}

interface User {
  id: number
  username: string
}

interface ExpenseCategory {
  id: number
  name: string
  slug: string
  icon: string
  color: string
  order: number
  is_active: boolean
}

interface Expense {
  id: number
  building: number
  building_name?: string
  amount: number
  category: number
  category_slug?: string
  category_display?: string
  category_icon?: string
  category_color?: string
  date: string
  description: string
  image?: string | null
  created_by_name?: string
}

// Icon mapping for dynamic categories
const iconMap: Record<string, any> = {
  Package: Package,
  Users: Users,
  Truck: Truck,
  Wrench: Wrench,
  MoreHorizontal: MoreHorizontal,
}

export default function ExpensesPage() {
  return (
    <Suspense fallback={<div className="p-4 text-center">Yuklanmoqda...</div>}>
      <ExpensesContent />
    </Suspense>
  )
}

function ExpensesContent() {
  const searchParams = useSearchParams()
  const initialBuilding = searchParams.get("building") || ""

  const [expenses, setExpenses] = useState<Expense[]>([])
  const [buildings, setBuildings] = useState<Building[]>([])
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [filterBuilding, setFilterBuilding] = useState(initialBuilding)
  const [filterCategory, setFilterCategory] = useState("")
  const [filterUser, setFilterUser] = useState("")
  const [users, setUsers] = useState<User[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [editingId, setEditingId] = useState<number | null>(null)

  // Image preview state
  const [imageModalOpen, setImageModalOpen] = useState(false)
  const [previewImage, setPreviewImage] = useState("")

  const [formData, setFormData] = useState({
    building: "",
    amount: "",
    category: "", // Category ID as string
    description: "",
    date: ymdToDmy(new Date().toISOString().split("T")[0]),
    image: "", // Base64 string for new upload
  })

  // Filterlar o'zgarganda sahifani 1-ga qaytarish
  useEffect(() => {
    setCurrentPage(1)
  }, [filterBuilding, filterCategory, filterUser])

  useEffect(() => {
    fetchData()
  }, [filterBuilding, filterCategory, filterUser, currentPage])

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterBuilding) params.append("building", filterBuilding)
      if (filterCategory) params.append("category", filterCategory)
      if (filterUser) params.append("created_by", filterUser)
      params.append("page", currentPage.toString())

      const [expensesRes, buildingsRes, categoriesRes, usersRes] = await Promise.all([
        apiCall(`/api/expenses/?${params.toString()}`),
        apiCall("/api/buildings/"),
        apiCall("/api/expense-categories/"),
        apiCall("/api/users/"),
      ])

      if (!expensesRes.ok || !buildingsRes.ok || !categoriesRes.ok) throw new Error("Ma'lumot yuklanmadi")

      const expensesData = await expensesRes.json()
      const buildingsData = await buildingsRes.json()
      const categoriesData = await categoriesRes.json()
      const usersData = usersRes.ok ? await usersRes.json() : []

      setExpenses(expensesData.results || [])
      setTotalCount(expensesData.count || 0)
      setBuildings(Array.isArray(buildingsData) ? buildingsData : buildingsData.results || [])
      setCategories(Array.isArray(categoriesData) ? categoriesData : categoriesData.results || [])
      setUsers(Array.isArray(usersData) ? usersData : usersData.results || [])
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
        building: Number(formData.building),
        amount: Number(formData.amount) || 0,
        category: formData.category,
        description: formData.description,
        date: dmyToYmd(formData.date),
        ...(formData.image ? { image: formData.image } : {}),
      }

      const finalPayload = {
        building: Number(formData.building),
        amount: Number(formData.amount) || 0,
        category: Number(formData.category),
        description: formData.description,
        date: dmyToYmd(formData.date),
        ...(formData.image ? { image: formData.image } : {}),
      }

      const response = await apiCall(editingId ? `/api/expenses/${editingId}/` : "/api/expenses/", {
        method: editingId ? "PATCH" : "POST", // Use PATCH for updates to allow partial image update safety
        body: JSON.stringify(finalPayload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(getErrorMessage(errorData))
      }
      resetForm()
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xatolik yuz berdi")
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("O'chirib tashlamoqchisiz?")) return

    try {
      const response = await apiCall(`/api/expenses/${id}/`, { method: "DELETE" })
      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(getErrorMessage(errorData))
      }
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xatolik yuz berdi")
    }
  }

  const handleEdit = (expense: Expense) => {
    setFormData({
      building: expense.building.toString(),
      amount: String(expense.amount),
      category: expense.category.toString(),
      description: expense.description,
      date: ymdToDmy(expense.date),
      image: "", // Don't pre-fill with URL, only use for new uploads
    })
    setEditingId(expense.id)
    setDialogOpen(true)
  }

  const resetForm = () => {
    const defaultCategoryId = categories.length > 0 ? categories[0].id.toString() : ""
    setFormData({ building: "", amount: "", category: defaultCategoryId, description: "", date: ymdToDmy(new Date().toISOString().split("T")[0]), image: "" })
    setEditingId(null)
    setDialogOpen(false)
  }

  // Helper function to get category config from expense
  const getCategoryConfig = (expense: Expense) => {
    const IconComponent = expense.category_icon ? (iconMap[expense.category_icon] || MoreHorizontal) : MoreHorizontal
    return {
      icon: IconComponent,
      label: expense.category_display || "Boshqa",
      color: expense.category_color || "text-slate-400 bg-slate-500/20 border-slate-500/30"
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 20 * 1024 * 1024) { // 20MB limit
        alert("Rasm hajmi 20MB dan oshmasligi kerak")
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

  const openImagePreview = (url: string) => {
    setPreviewImage(url)
    setImageModalOpen(true)
  }

  // Jami summa faqat joriy page uchun emas, balki umumiy bo'lishi kerak edi.
  // Lekin pagination bo'lganda frontendda jami summani hisoblash qiyin.
  // Shuning uchun bu yerda faqat ko'rinib turgan xarajatlar summasi ko'rsatiladi
  // Yoki backenddan jami summa so'rash kerak. Hozircha faqat ko'rinib turganlar.
  const pageTotalAmount = expenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0)

  const showEditWarning = editingId && formData.image && expenses.find(e => e.id === editingId)?.image;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20">
              <Wallet className="w-6 h-6 text-amber-400" />
            </div>
            Chiqimlar
          </h1>
          <p className="text-slate-400 mt-1">Barcha xarajatlarni boshqarish</p>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="md:w-auto w-10 px-0 md:px-4">
          <Plus className="w-5 h-5 md:mr-2" />
          <span className="hidden md:inline">Yangi chiqim</span>
        </Button>
      </div>

      {/* Stats Card */}
      <div className="p-6 rounded-xl bg-slate-800/60 border border-slate-700/60">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">Joriy sahifa jami</p>
            <p className="text-3xl font-bold text-white mt-1">{formatCurrency(pageTotalAmount)}</p>
          </div>
          <div className="p-4 rounded-xl bg-amber-500/20">
            <Wallet className="w-8 h-8 text-amber-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
        <div className="flex items-center gap-2 text-slate-400">
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">Filtrlar:</span>
        </div>
        <select
          value={filterBuilding}
          onChange={(e) => setFilterBuilding(e.target.value)}
          className="flex-1 min-w-[200px]"
        >
          <option value="">Barcha binolar</option>
          {buildings.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="flex-1 min-w-[200px]"
        >
          <option value="">Barcha kategoriyalar</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        {users.length > 0 && (
          <select
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            className="flex-1 min-w-[180px]"
          >
            <option value="">Barcha foydalanuvchilar</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>{user.username}</option>
            ))}
          </select>
        )}
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
            <div key={i} className="h-24 rounded-xl bg-slate-800/50 animate-pulse" />
          ))}
        </div>
      ) : expenses.length === 0 ? (
        <div className="text-center py-16 rounded-xl bg-slate-800/30 border border-slate-700/50">
          <Wallet className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-lg">Chiqim topilmadi</p>
          <p className="text-slate-500 text-sm mt-1">Yangi chiqim qo'shing yoki filtrlarni o'zgartiring</p>
        </div>
      ) : (
        <>
          <div className="grid gap-3">
            {expenses.map((expense) => {
              const config = getCategoryConfig(expense)
              const Icon = config.icon
              const buildingName = buildings.find(b => b.id === expense.building)?.name || "Noma'lum"

              return (
                <div
                  key={expense.id}
                  className="flex flex-col md:flex-row items-start md:items-center gap-4 p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-slate-600 transition-all duration-200"
                >
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className={`p-3 rounded-xl border ${config.color} shrink-0`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="md:hidden flex-1 min-w-0">
                      <h3 className="font-medium text-white truncate">{expense.description || "Tavsif yo'q"}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium border ${config.color}`}>
                          {config.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 w-full">
                    <div className="hidden md:flex items-center gap-2">
                      <h3 className="font-medium text-white truncate">{expense.description || "Tavsif yo'q"}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium border ${config.color}`}>
                        {config.label}
                      </span>
                      {expense.image && (
                        <button
                          onClick={() => openImagePreview(expense.image!)}
                          className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                        >
                          <ImageIcon className="w-3 h-3" />
                          Rasm
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 md:mt-1 text-sm text-slate-400">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {buildingName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(expense.date).toLocaleDateString("uz-UZ")}
                      </span>
                      {expense.created_by_name && (
                        <span className="flex items-center gap-1 text-slate-500">
                          <Users className="w-3 h-3" />
                          {expense.created_by_name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between w-full md:w-auto gap-4 mt-2 md:mt-0 pl-14 md:pl-0 border-t md:border-t-0 border-slate-700/50 pt-3 md:pt-0">
                    <div className="text-left md:text-right">
                      <p className="text-lg font-bold text-amber-400">{formatCurrency(expense.amount)}</p>
                      <p className="text-xs text-slate-500">so'm</p>
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={() => handleEdit(expense)} size="icon-sm" variant="ghost">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button onClick={() => handleDelete(expense.id)} size="icon-sm" variant="ghost" className="text-red-400 hover:text-red-300">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination */}
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
        title={editingId ? "Chiqimni tahrirlash" : "Yangi chiqim"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Bino</label>
            <select
              value={formData.building}
              onChange={(e) => setFormData({ ...formData, building: e.target.value })}
              required
            >
              <option value="">Tanlang...</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Kategoriya</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
            >
              <option value="">Tanlang...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Summa</label>
            <MoneyInput
              value={formData.amount}
              onChange={(value) => setFormData({ ...formData, amount: value })}
              placeholder="1 000 000"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Sana</label>
            <DateInput
              value={formData.date}
              onChange={(value) => setFormData({ ...formData, date: value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Tavsif</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Chiqim haqida..."
              rows={3}
              className="w-full min-h-20 rounded-lg px-4 py-3 text-sm bg-slate-800/80 border border-slate-600 text-slate-100 placeholder:text-slate-500 hover:border-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 outline-none resize-none"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Rasm (ixtiyoriy)</label>
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-600 border-dashed rounded-lg cursor-pointer bg-slate-800/50 hover:bg-slate-700/50 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <ImageIcon className="w-8 h-8 mb-3 text-slate-400" />
                    <p className="mb-2 text-sm text-slate-400"><span className="font-semibold">Rasm yuklash</span></p>
                    <p className="text-xs text-slate-500">PNG, JPG or WebP (MAX. 5MB)</p>
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                </label>
              </div>
              {(formData.image || (editingId && expenses.find(e => e.id === editingId)?.image)) && (
                <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-slate-600 bg-slate-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={formData.image || expenses.find(e => e.id === editingId)?.image || ""}
                    alt="Preview"
                    className="w-full h-full object-cover cursor-zoom-in hover:opacity-90 transition-opacity"
                    onClick={() => openImagePreview(formData.image || expenses.find(e => e.id === editingId)?.image || "")}
                  />
                  {formData.image && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, image: "" })}
                      className="absolute top-1 right-1 p-1 bg-red-500 rounded-full text-white hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
            {/* Warning for image replacement */}
            {showEditWarning && (
              <div className="mt-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm flex items-start gap-2">
                <ImageIcon className="w-4 h-4 mt-0.5 shrink-0" />
                <span>Diqqat! Yangi rasm yuklasangiz, avvalgi rasm o'chib ketadi.</span>
              </div>
            )}
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

      {/* Image Preview Modal with Portal */}
      {imageModalOpen && (
        <Portal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 md:p-8" onClick={() => setImageModalOpen(false)}>
            <button
              className="fixed top-4 right-4 z-[10000] p-3 text-white bg-black/50 rounded-full hover:bg-black/70 backdrop-blur-md transition-all shadow-lg border border-white/10"
              onClick={(e) => { e.stopPropagation(); setImageModalOpen(false); }}
              aria-label="Yopish"
            >
              <X className="w-6 h-6 md:w-8 md:h-8" />
            </button>

            <div className="relative w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewImage}
                alt="Full preview"
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              />
            </div>
          </div>
        </Portal>
      )}
    </div>
  )
}

function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  return mounted ? createPortal(children, document.body) : null
}
