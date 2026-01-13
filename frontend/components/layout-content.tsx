"use client"

import { useSidebar } from "@/components/sidebar-provider"

export function LayoutContent({ children }: { children: React.ReactNode }) {
    const { collapsed } = useSidebar()

    return (
        <main
            className={`transition-all duration-300 min-h-screen bg-slate-950 ${collapsed ? "md:ml-20" : "md:ml-64"
                }`}
        >
            <div className="p-4 md:p-8 animate-in fade-in duration-300">
                {children}
            </div>
        </main>
    )
}
