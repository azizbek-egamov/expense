"use client"

import { useEffect, useState, useTransition } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"

export function PageLoader() {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        // Sahifa yuklanganda loading to'xtatish
        setIsLoading(false)
    }, [pathname, searchParams])

    // Link bosilganda loading boshlash uchun global event listener
    useEffect(() => {
        const handleStart = () => setIsLoading(true)
        const handleComplete = () => setIsLoading(false)

        // Click eventlarni tinglash
        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement
            const link = target.closest('a')
            if (link && link.href && link.href.startsWith(window.location.origin)) {
                const targetPath = new URL(link.href).pathname
                if (targetPath !== pathname) {
                    setIsLoading(true)
                    // 500ms dan keyin avtomatik to'xtatish (sahifa yuklanganda useEffect to'xtatadi)
                    setTimeout(() => setIsLoading(false), 500)
                }
            }
        }

        document.addEventListener('click', handleClick)
        return () => document.removeEventListener('click', handleClick)
    }, [pathname])

    if (!isLoading) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
                <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-slate-700 border-t-indigo-500 animate-spin" />
                    <Loader2 className="absolute inset-0 m-auto w-8 h-8 text-indigo-400 animate-pulse" />
                </div>
                <p className="text-slate-400 text-sm font-medium animate-pulse">Yuklanmoqda...</p>
            </div>
        </div>
    )
}
