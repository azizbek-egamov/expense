"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { apiCall, isCeoAdmin } from "@/lib/auth"
import { getErrorMessage } from "@/lib/error-utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Modal } from "@/components/modal"
import { Pagination } from "@/components/pagination"
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Mail,
  Shield,
  ShieldAlert,
  ShieldCheck,
  User,
  Lock
} from "lucide-react"

interface UserData {
  id: number
  username: string
  role: string
  email: string
  first_name?: string
  last_name?: string
}

const roleConfig: Record<string, { icon: any; label: string; color: string }> = {
  ceoadmin: { icon: ShieldAlert, label: "CEO Admin", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  Admin: { icon: Shield, label: "Admin", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  admin: { icon: Shield, label: "Admin", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  Accountant: { icon: ShieldCheck, label: "Buxgalter", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  accountant: { icon: ShieldCheck, label: "Buxgalter", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  Viewer: { icon: User, label: "Ko'ruvchi", color: "bg-slate-500/20 text-slate-400 border-slate-500/30" },
  viewer: { icon: User, label: "Ko'ruvchi", color: "bg-slate-500/20 text-slate-400 border-slate-500/30" },
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    password_confirm: "",
    first_name: "",
    last_name: "",
    role: "Viewer",
  })

  const isCeo = isCeoAdmin()

  useEffect(() => {
    if (isCeo) fetchUsers()
    else setLoading(false)
  }, [isCeo, currentPage])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await apiCall(`/api/users/?page=${currentPage}`)
      if (!response.ok) throw new Error("Foydalanuvchilar yuklanmadi")
      const data = await response.json()
      setUsers(data.results || [])
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

    if (!editingId && formData.password !== formData.password_confirm) {
      setError("Parollar mos kelmaydi!")
      return
    }

    try {
      const payload: any = {
        username: formData.username,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: formData.role,
      }

      if (formData.password || !editingId) {
        payload.password = formData.password
        payload.password_confirm = formData.password_confirm
      }

      const response = await apiCall(editingId ? `/api/users/${editingId}/` : "/api/users/", {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(getErrorMessage(errorData))
      }

      resetForm()
      fetchUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xatolik yuz berdi")
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Haqiqatan ham o'chirib tashlamoqchisiz?")) return

    try {
      const response = await apiCall(`/api/users/${id}/`, { method: "DELETE" })
      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(getErrorMessage(errorData))
      }
      fetchUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xatolik yuz berdi")
    }
  }

  const handleEdit = (user: UserData) => {
    setFormData({
      username: user.username,
      email: user.email,
      password: "",
      password_confirm: "",
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      role: user.role,
    })
    setEditingId(user.id)
    setDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({ username: "", email: "", password: "", password_confirm: "", first_name: "", last_name: "", role: "Viewer" })
    setEditingId(null)
    setDialogOpen(false)
  }

  if (!isCeo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="p-6 rounded-full bg-red-500/10 mb-6">
          <Lock className="w-16 h-16 text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Ruxsat yo'q</h1>
        <p className="text-slate-400 max-w-md">
          Foydalanuvchilarni boshqarish faqat CEO Admin uchun ruxsat etilgan.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Users className="w-6 h-6 text-purple-400" />
            </div>
            Foydalanuvchilar
          </h1>
          <p className="text-slate-400 mt-1">Tizim foydalanuvchilarini boshqarish</p>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="md:w-auto w-10 px-0 md:px-4">
          <Plus className="w-5 h-5 md:mr-2" />
          <span className="hidden md:inline">Yangi foydalanuvchi</span>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
          <p className="text-sm text-slate-400">Jami</p>
          <p className="text-2xl font-bold text-white mt-1">{totalCount}</p>
        </div>
        {/* Note: Filtering roles on client side with paginated data is not accurate for total stats 
            unless backend provides stats. For now we just show total count from backend paginator.
            We can keep role cards but maybe remove counts if we can't get accurate numbers without fetching all.
            Or we can accept that it only counts visible users if we use 'users.filter'.
            Actually 'users' only contains current page results. So stats will be wrong.
            Better to remove specific role counts or fetch stats separately.
            Let's keep total count and placeholder or remove other stats for now to avoid confusion.
            Or just show total count.
        */}
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
            <div key={i} className="h-20 rounded-xl bg-slate-800/50 animate-pulse" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 rounded-xl bg-slate-800/30 border border-slate-700/50">
          <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-lg">Hali foydalanuvchi yo'q</p>
        </div>
      ) : (
        <>
          <div className="grid gap-3">
            {users.map((user) => {
              const config = roleConfig[user.role] || roleConfig.viewer || roleConfig.Viewer
              const Icon = config?.icon || User

              return (
                <div
                  key={user.id}
                  className="flex flex-col md:flex-row items-start md:items-center gap-4 p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-slate-600 transition-all duration-200"
                >
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="w-12 h-12 shrink-0 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-lg">
                      {user.username.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate">{user.username}</h3>
                      <div className="flex items-center gap-2 mt-1 text-sm text-slate-400 truncate">
                        <Mail className="w-3 h-3 shrink-0" />
                        <span className="truncate">{user.email}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between w-full md:w-auto md:flex-1 md:justify-end gap-4 pl-16 md:pl-0">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${config?.color}`}>
                      <Icon className="w-3 h-3" />
                      {config?.label || user.role}
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={() => handleEdit(user)} size="icon-sm" variant="ghost">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button onClick={() => handleDelete(user.id)} size="icon-sm" variant="ghost" className="text-red-400 hover:text-red-300">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
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
        title={editingId ? "Foydalanuvchini tahrirlash" : "Yangi foydalanuvchi"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Ism</label>
              <Input
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                placeholder="Ism"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Familiya</label>
              <Input
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                placeholder="Familiya"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Username</label>
            <Input
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="username"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Rol</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="Viewer">Ko'ruvchi</option>
              <option value="Accountant">Buxgalter</option>
              <option value="Admin">Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Parol {editingId && "(bo'sh qoldirsangiz o'zgarmaydi)"}
            </label>
            <Input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              required={!editingId}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Parolni tasdiqlash</label>
            <Input
              type="password"
              value={formData.password_confirm}
              onChange={(e) => setFormData({ ...formData, password_confirm: e.target.value })}
              placeholder="••••••••"
              required={!editingId}
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
