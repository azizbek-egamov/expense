"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { isAuthenticated, isCeoAdmin } from "@/lib/auth"

export function ProtectedRoute({
  children,
  requireCeoAdmin = false,
}: {
  children: React.ReactNode
  requireCeoAdmin?: boolean
}) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = () => {
      if (!isAuthenticated()) {
        router.push("/login")
        return
      }

      if (requireCeoAdmin && !isCeoAdmin()) {
        router.push("/dashboard")
        return
      }

      setIsLoading(false)
    }

    checkAuth()
  }, [router, requireCeoAdmin])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block">
            <div className="w-12 h-12 rounded-full border-2 border-border border-t-primary animate-spin" />
          </div>
          <p className="mt-4 text-muted-foreground">Yuklanmoqda...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
