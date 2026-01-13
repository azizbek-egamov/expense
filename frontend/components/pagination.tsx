"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface PaginationProps {
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
    if (totalPages <= 1) return null

    const getPageNumbers = () => {
        const pages = []

        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i)
            }
        } else {
            // 1-sahifa doim bor
            pages.push(1)

            if (currentPage > 3) {
                pages.push("...")
            }

            // Joriy sahifa atrofidagi sahifalar
            const start = Math.max(2, currentPage - 1)
            const end = Math.min(totalPages - 1, currentPage + 1)

            for (let i = start; i <= end; i++) {
                pages.push(i)
            }

            if (currentPage < totalPages - 2) {
                pages.push("...")
            }

            // Oxirgi sahifa doim bor
            pages.push(totalPages)
        }

        return pages
    }

    return (
        <div className="flex items-center justify-center gap-2 mt-6">
            <Button
                variant="outline"
                size="icon-sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-9 w-9"
            >
                <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex gap-1">
                {getPageNumbers().map((page, index) => (
                    typeof page === "number" ? (
                        <Button
                            key={index}
                            variant={currentPage === page ? "default" : "outline"}
                            size="icon-sm"
                            onClick={() => onPageChange(page)}
                            className={`h-9 w-9 ${currentPage === page ? "bg-emerald-600 hover:bg-emerald-500 border-emerald-500" : ""}`}
                        >
                            {page}
                        </Button>
                    ) : (
                        <span key={index} className="flex items-center justify-center w-9 h-9 text-slate-500">
                            ...
                        </span>
                    )
                ))}
            </div>

            <Button
                variant="outline"
                size="icon-sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="h-9 w-9"
            >
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
    )
}
