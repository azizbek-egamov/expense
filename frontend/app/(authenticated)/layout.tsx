"use client"

import type React from "react"
import { Sidebar } from "@/components/sidebar"
import { ProtectedRoute } from "@/components/protected-route"
import { PageLoader } from "@/components/page-loader"
import { MobileNav } from "@/components/mobile-nav"
import { SidebarProvider } from "@/components/sidebar-provider"
import { LayoutContent } from "@/components/layout-content"

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <ProtectedRoute>
        <PageLoader />
        <Sidebar />
        <MobileNav />
        <LayoutContent>
          {children}
        </LayoutContent>
      </ProtectedRoute>
    </SidebarProvider>
  )
}
