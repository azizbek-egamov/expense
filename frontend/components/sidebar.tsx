"use client"

import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useSidebar } from "@/components/sidebar-provider"
import {
  LayoutDashboard,
  Building2,
  Wallet,
  Users,
  PieChart,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Tags
} from "lucide-react"

export const menuItems = [
  { href: "/dashboard", label: "Bosh sahifa", icon: LayoutDashboard },
  { href: "/buildings", label: "Binolar", icon: Building2 },
  { href: "/expenses", label: "Chiqimlar", icon: Wallet },
  { href: "/categories", label: "Kategoriyalar", icon: Tags },
  { href: "/statistics", label: "Statistika", icon: PieChart },
  { href: "/users", label: "Foydalanuvchilar", icon: Users },
]

export function Sidebar() {
  const { collapsed, setCollapsed } = useSidebar()
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    localStorage.removeItem("user_role")
    router.push("/login")
  }

  return (
    <div
      className={`${collapsed ? "w-20" : "w-64"} bg-sidebar border-r border-sidebar-border h-screen fixed left-0 top-0 hidden md:flex flex-col transition-all duration-300 z-40 shadow-2xl`}
    >
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border/50 flex items-center justify-between group">
        {!collapsed && (
          <Link
            href="/dashboard"
            className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 shadow-lg group-hover:shadow-primary/50 transition-all duration-300">
              <Building2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-sidebar-foreground truncate">Chiqimlar</h1>
              <p className="text-xs text-sidebar-accent truncate">Boshqaruv Paneli</p>
            </div>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 hover:bg-sidebar-accent/20 rounded-lg transition-all duration-300 text-sidebar-foreground hover:text-primary flex-shrink-0 ml-auto"
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 text-sm font-medium relative group ${isActive
                ? "bg-gradient-to-r from-primary/20 to-accent/20 text-primary border border-primary/30 shadow-lg shadow-primary/20"
                : "text-sidebar-foreground hover:bg-sidebar-accent/10 hover:text-primary"
                }`}
              title={item.label}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-primary' : ''}`} />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {isActive && !collapsed && (
                <div className="absolute right-0 w-1 h-6 bg-primary rounded-l-full animate-pulse" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border/50 space-y-2">
        <Button
          onClick={handleLogout}
          variant="outline"
          className={`w-full justify-center text-sm transition-all duration-300 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 ${collapsed ? "px-2" : ""}`}
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && <span className="ml-2">Chiqish</span>}
        </Button>
      </div>
    </div>
  )
}
