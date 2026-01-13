"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Menu, X, LogOut, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { menuItems } from "@/components/sidebar"

export function MobileNav() {
    const [isOpen, setIsOpen] = useState(false)
    const pathname = usePathname()
    const router = useRouter()

    const handleLogout = () => {
        localStorage.removeItem("access_token")
        localStorage.removeItem("refresh_token")
        localStorage.removeItem("user_role")
        router.push("/login")
    }

    const toggle = () => setIsOpen(!isOpen)

    return (
        <div className="md:hidden">
            {/* Top Bar */}
            <div className="fixed top-0 left-0 right-0 h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 z-40 bg-opacity-80 backdrop-blur-md">
                <Link href="/dashboard" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-white text-lg">Chiqimlar</span>
                </Link>
                <Button variant="ghost" size="icon" onClick={toggle} className="text-white hover:bg-slate-800">
                    {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </Button>
            </div>

            {/* Spacer for Top Bar */}
            <div className="h-16" />

            {/* Drawer */}
            <div
                className={`fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                    }`}
                onClick={toggle}
            />

            <div
                className={`fixed inset-y-0 right-0 z-50 w-full max-w-xs bg-slate-900 border-l border-slate-800 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? "translate-x-0" : "translate-x-full"
                    }`}
            >
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                    <span className="font-bold text-white text-lg">Menu</span>
                    <Button variant="ghost" size="icon" onClick={toggle} className="text-slate-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {menuItems.map((item) => {
                        const isActive = pathname.startsWith(item.href)
                        const Icon = item.icon
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium ${isActive
                                        ? "bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-400 border border-emerald-500/30"
                                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                    }`}
                            >
                                <Icon className={`w-5 h-5 ${isActive ? "text-emerald-400" : ""}`} />
                                {item.label}
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <Button
                        onClick={handleLogout}
                        variant="outline"
                        className="w-full justify-center text-red-400 hover:text-red-300 hover:bg-red-950/30 border-red-900/50"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Chiqish
                    </Button>
                </div>
            </div>
        </div>
    )
}
