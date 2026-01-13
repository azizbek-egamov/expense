"use client"

import React, { useState, useEffect } from "react"
import { apiCall } from "@/lib/auth"
import { getErrorMessage } from "@/lib/error-utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Modal } from "@/components/modal"
import {
    Tags,
    Plus,
    Pencil,
    Trash2,
    Package,
    Users,
    Truck,
    Wrench,
    MoreHorizontal,
    GripVertical
} from "lucide-react"

interface ExpenseCategory {
    id: number
    name: string
    slug: string
    icon: string
    color: string
    order: number
    is_active: boolean
}

// Available icons for selection
const availableIcons = [
    { name: "Package", icon: Package },
    { name: "Users", icon: Users },
    { name: "Truck", icon: Truck },
    { name: "Wrench", icon: Wrench },
    { name: "MoreHorizontal", icon: MoreHorizontal },
    { name: "Tags", icon: Tags },
]

// Available color presets
const colorPresets = [
    { name: "Sariq", value: "text-amber-400 bg-amber-500/20 border-amber-500/30" },
    { name: "Ko'k", value: "text-blue-400 bg-blue-500/20 border-blue-500/30" },
    { name: "Binafsha", value: "text-purple-400 bg-purple-500/20 border-purple-500/30" },
    { name: "Yashil", value: "text-emerald-400 bg-emerald-500/20 border-emerald-500/30" },
    { name: "Kulrang", value: "text-slate-400 bg-slate-500/20 border-slate-500/30" },
    { name: "Qizil", value: "text-red-400 bg-red-500/20 border-red-500/30" },
    { name: "Pushti", value: "text-pink-400 bg-pink-500/20 border-pink-500/30" },
    { name: "Moviy", value: "text-cyan-400 bg-cyan-500/20 border-cyan-500/30" },
]

// Icon mapping
const iconMap: Record<string, any> = {
    Package,
    Users,
    Truck,
    Wrench,
    MoreHorizontal,
    Tags,
}

export default function CategoriesPage() {
    const [categories, setCategories] = useState<ExpenseCategory[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingId, setEditingId] = useState<number | null>(null)

    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        icon: "Package",
        color: colorPresets[0].value,
        order: 0,
        is_active: true,
    })

    useEffect(() => {
        fetchCategories()
    }, [])

    const fetchCategories = async () => {
        setLoading(true)
        try {
            const response = await apiCall("/api/expense-categories/")
            if (!response.ok) throw new Error("Ma'lumot yuklanmadi")
            const data = await response.json()
            setCategories(Array.isArray(data) ? data : data.results || [])
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
                order: Number(formData.order),
            }

            const response = await apiCall(
                editingId ? `/api/expense-categories/${editingId}/` : "/api/expense-categories/",
                {
                    method: editingId ? "PUT" : "POST",
                    body: JSON.stringify(payload),
                }
            )

            if (!response.ok) {
                const errorData = await response.json().catch(() => null)
                throw new Error(getErrorMessage(errorData))
            }

            resetForm()
            fetchCategories()
        } catch (err) {
            setError(err instanceof Error ? err.message : "Xatolik yuz berdi")
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm("Bu kategoriyani o'chirib tashlamoqchisiz?")) return

        try {
            const response = await apiCall(`/api/expense-categories/${id}/`, { method: "DELETE" })
            if (!response.ok) {
                const errorData = await response.json().catch(() => null)
                throw new Error(getErrorMessage(errorData))
            }
            fetchCategories()
        } catch (err) {
            setError(err instanceof Error ? err.message : "Xatolik yuz berdi")
        }
    }

    const handleEdit = (category: ExpenseCategory) => {
        setFormData({
            name: category.name,
            slug: category.slug,
            icon: category.icon,
            color: category.color,
            order: category.order,
            is_active: category.is_active,
        })
        setEditingId(category.id)
        setDialogOpen(true)
    }

    const resetForm = () => {
        setFormData({
            name: "",
            slug: "",
            icon: "Package",
            color: colorPresets[0].value,
            order: categories.length,
            is_active: true,
        })
        setEditingId(null)
        setDialogOpen(false)
    }

    // Auto-generate slug from name
    const handleNameChange = (name: string) => {
        const slug = name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .trim()
        setFormData({ ...formData, name, slug })
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-500/20">
                            <Tags className="w-6 h-6 text-purple-400" />
                        </div>
                        Kategoriyalar
                    </h1>
                    <p className="text-slate-400 mt-1">Chiqim kategoriyalarini boshqarish</p>
                </div>
                <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="md:w-auto w-10 px-0 md:px-4">
                    <Plus className="w-5 h-5 md:mr-2" />
                    <span className="hidden md:inline">Yangi kategoriya</span>
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
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-32 rounded-xl bg-slate-800/50 animate-pulse" />
                    ))}
                </div>
            ) : categories.length === 0 ? (
                <div className="text-center py-16 rounded-xl bg-slate-800/30 border border-slate-700/50">
                    <Tags className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400 text-lg">Kategoriya topilmadi</p>
                    <p className="text-slate-500 text-sm mt-1">Yangi kategoriya qo'shing</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {categories.map((category) => {
                        const IconComponent = iconMap[category.icon] || MoreHorizontal
                        return (
                            <div
                                key={category.id}
                                className={`relative p-5 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-slate-600 transition-all duration-200 ${!category.is_active ? "opacity-60" : ""
                                    }`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-xl border ${category.color} shrink-0`}>
                                        <IconComponent className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-white truncate">{category.name}</h3>
                                            {!category.is_active && (
                                                <span className="px-2 py-0.5 text-xs rounded-full bg-slate-700 text-slate-400">
                                                    Nofaol
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-500 mt-1">slug: {category.slug}</p>
                                        <p className="text-xs text-slate-600 mt-0.5">Tartib: {category.order}</p>
                                    </div>
                                </div>

                                <div className="absolute top-3 right-3 flex gap-1">
                                    <Button onClick={() => handleEdit(category)} size="icon-sm" variant="ghost">
                                        <Pencil className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        onClick={() => handleDelete(category.id)}
                                        size="icon-sm"
                                        variant="ghost"
                                        className="text-red-400 hover:text-red-300"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Modal */}
            <Modal
                isOpen={dialogOpen}
                onClose={resetForm}
                title={editingId ? "Kategoriyani tahrirlash" : "Yangi kategoriya"}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Nomi</label>
                        <Input
                            value={formData.name}
                            onChange={(e) => handleNameChange(e.target.value)}
                            placeholder="Kategoriya nomi"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Slug</label>
                        <Input
                            value={formData.slug}
                            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                            placeholder="kategoriya-slug"
                            required
                        />
                        <p className="text-xs text-slate-500 mt-1">Avtomatik yaratiladi, kerak bo'lsa o'zgartiring</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Icon</label>
                        <div className="flex flex-wrap gap-2">
                            {availableIcons.map((item) => {
                                const Icon = item.icon
                                return (
                                    <button
                                        key={item.name}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, icon: item.name })}
                                        className={`p-3 rounded-lg border transition-all ${formData.icon === item.name
                                                ? "border-emerald-500 bg-emerald-500/20 text-emerald-400"
                                                : "border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600"
                                            }`}
                                    >
                                        <Icon className="w-5 h-5" />
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Rang</label>
                        <div className="flex flex-wrap gap-2">
                            {colorPresets.map((preset) => (
                                <button
                                    key={preset.value}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, color: preset.value })}
                                    className={`px-3 py-2 rounded-lg border text-sm transition-all ${preset.value} ${formData.color === preset.value
                                            ? "ring-2 ring-emerald-500 ring-offset-2 ring-offset-slate-900"
                                            : ""
                                        }`}
                                >
                                    {preset.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Tartib raqami</label>
                        <Input
                            type="number"
                            value={formData.order}
                            onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                            min={0}
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="is_active"
                            checked={formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500/30"
                        />
                        <label htmlFor="is_active" className="text-sm text-slate-300">
                            Kategoriya faol (tanlash uchun ko'rinadi)
                        </label>
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
