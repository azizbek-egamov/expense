"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Lock, User, ArrowRight, Building2, AlertCircle, Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    // Faqat ceoadmin kirishi mumkin
    if (username !== "ceoadmin") {
      setError("Siz uchun tizimga kirish cheklangan!")
      setLoading(false)
      return
    }

    try {
      const response = await fetch("http://localhost:8000/api/token/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      if (!response.ok) {
        throw new Error("Login muvaffaqiyatsiz. Parolni tekshiring.")
      }

      const data = await response.json()

      // Save tokens and username to localStorage
      localStorage.setItem("access_token", data.access)
      localStorage.setItem("refresh_token", data.refresh)
      localStorage.setItem("user_role", username) // ceoadmin sifatida saqlash

      // Redirect to dashboard
      router.push("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xatolik yuz berdi")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative bg-slate-950 px-4">
      {/* Subtle Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950" />

      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent opacity-50" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent opacity-50" />

      <div className="w-full max-w-sm relative z-10">
        <div className="mb-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl mb-6">
            <Building2 className="w-8 h-8 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Chiqimlar</h1>
          <p className="text-slate-400 text-sm">Boshqaruv Tizimi</p>
        </div>

        <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-md shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
          <CardHeader className="space-y-1 pb-2 pt-6 px-6">
            <h2 className="text-lg font-semibold text-center text-white">Xush kelibsiz</h2>
            <p className="text-center text-xs text-slate-500">
              Tizimga kirish uchun ma'lumotlaringizni kiriting
            </p>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-4 space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                  <Input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={loading}
                    className="h-10 pl-9 bg-slate-950/50 border-slate-800 focus:border-emerald-500/50 focus:ring-emerald-500/20 text-sm transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Parol"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="h-10 pl-9 pr-9 bg-slate-950/50 border-slate-800 focus:border-emerald-500/50 focus:ring-emerald-500/20 text-sm transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                  <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  <p className="text-xs text-red-500 font-medium">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 transition-all duration-300 text-sm font-medium"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Kirish...</span>
                  </div>
                ) : (
                  <span className="flex items-center gap-2">
                    Kirish <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center mt-6 text-xs text-slate-600">
          Ishlab chiquvchi <a href="https://ardentsoft.uz" target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:text-emerald-600 transition-colors">ardentsoft.uz</a>
        </p>
      </div>
    </div>
  )
}
